"""
Tests for new Pricing plans, mocked payments, and team management features.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_EMAIL = "admin@scorebar.ai"
ADMIN_PW = "admin123"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def hr_user(admin_token):
    """Create a fresh signup, approve via admin, and login as that HR — plan=trial which limit=1 is treated as 'free' for our tests via /payments/verify."""
    s = requests.Session()
    email = f"TEST_hr_{uuid.uuid4().hex[:8]}@example.com"
    sr = s.post(f"{BASE_URL}/api/signup", json={
        "company_name": "TEST Co", "company_website": "", "company_socials": "",
        "hr_name": "Test HR", "work_email": email, "phone": "1234567890",
        "employees_count": "1-10", "job_roles": "", "hiring_volume": ""
    })
    assert sr.status_code == 200, sr.text
    sid = sr.json()["id"]
    # admin approve
    a = requests.Session()
    a.headers.update({"Authorization": f"Bearer {admin_token}"})
    ar = a.post(f"{BASE_URL}/api/admin/signups/{sid}/approve",
                json={"plan": "trial", "trial_days": 30, "interviews_quota": 5})
    assert ar.status_code == 200, ar.text
    creds = ar.json()
    # login as the new HR using email + returned password
    lr = requests.post(f"{BASE_URL}/api/auth/login",
                       json={"email": email, "password": creds["password"]})
    assert lr.status_code == 200, lr.text
    token = lr.json()["token"]
    return {"email": email, "password": creds["password"], "token": token,
            "user_id": lr.json()["user"]["user_id"]}


@pytest.fixture
def hr_client(hr_user):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json",
                      "Authorization": f"Bearer {hr_user['token']}"})
    return s


@pytest.fixture
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Plans ----------------
class TestPlans:
    def test_list_plans_has_four(self, anon_client):
        r = anon_client.get(f"{BASE_URL}/api/plans")
        assert r.status_code == 200
        plans = r.json()["plans"]
        ids = {p["id"] for p in plans}
        assert ids == {"free", "starter", "professional", "enterprise"}, ids

    def test_plan_pricing(self, anon_client):
        plans = {p["id"]: p for p in anon_client.get(f"{BASE_URL}/api/plans").json()["plans"]}
        free = plans["free"]
        assert free["price_usd_monthly"] == 0
        assert free["interviews"] == 5
        assert free["team_members"] == 1
        starter = plans["starter"]
        assert starter["price_usd_monthly"] == 29.99
        assert starter["price_usd_yearly"] == 299.99
        assert starter["team_members"] == 2
        assert starter["highlight"] is True
        pro = plans["professional"]
        assert pro["price_usd_monthly"] == 149.99
        assert pro["price_usd_yearly"] == 1499.99
        assert pro["team_members"] == 5
        ent = plans["enterprise"]
        assert ent["team_members"] == -1
        assert ent["price_usd_monthly"] == -1


# ---------------- Auth gating on team endpoints ----------------
class TestTeamAuth:
    def test_team_members_unauth(self, anon_client):
        r = anon_client.get(f"{BASE_URL}/api/team/members")
        assert r.status_code == 401

    def test_team_invite_unauth(self, anon_client):
        r = anon_client.post(f"{BASE_URL}/api/team/invite",
                             json={"name": "A", "email": "a@x.com"})
        assert r.status_code == 401


# ---------------- Free plan gates invite ----------------
class TestFreePlanGate:
    def test_invite_blocked_on_free(self, hr_client, hr_user):
        # Set plan to free explicitly to be safe (admin approval used 'trial')
        # We'll directly upgrade then downgrade — but /payments/verify rejects 'free'.
        # The 'trial' plan is not in PLANS list, so plan_by_id returns None and falls back to free => limit 1.
        r = hr_client.post(f"{BASE_URL}/api/team/invite",
                           json={"name": "Mate", "email": f"TEST_mate1_{uuid.uuid4().hex[:6]}@x.com"})
        assert r.status_code == 402, r.text
        assert "Starter plan" in r.json().get("detail", "")


# ---------------- Payment create-order validation ----------------
class TestPaymentsValidation:
    def test_create_order_free_invalid(self, hr_client):
        r = hr_client.post(f"{BASE_URL}/api/payments/create-order",
                           json={"plan": "free", "billing": "monthly"})
        assert r.status_code == 400

    def test_create_order_enterprise_invalid(self, hr_client):
        r = hr_client.post(f"{BASE_URL}/api/payments/create-order",
                           json={"plan": "enterprise", "billing": "monthly"})
        assert r.status_code == 400

    def test_create_order_starter_yearly(self, hr_client):
        r = hr_client.post(f"{BASE_URL}/api/payments/create-order",
                           json={"plan": "starter", "billing": "yearly"})
        assert r.status_code == 200
        d = r.json()
        assert d["mocked"] is True
        assert d["order_id"].startswith("order_mock_")
        assert d["currency"] == "INR"
        # 24990 INR yearly => amount in paise
        assert d["amount"] == 24990 * 100
        assert d["billing"] == "yearly"
        assert d["plan"]["id"] == "starter"

    def test_create_order_starter_monthly(self, hr_client):
        r = hr_client.post(f"{BASE_URL}/api/payments/create-order",
                           json={"plan": "starter", "billing": "monthly"})
        assert r.status_code == 200
        d = r.json()
        assert d["amount"] == 2499 * 100


# ---------------- Upgrade flow + invite + limit + ownership ----------------
class TestUpgradeAndTeam:
    def test_full_team_flow(self, hr_client, hr_user, anon_client):
        # 1. Verify-pay starter monthly
        v = hr_client.post(f"{BASE_URL}/api/payments/verify",
                           json={"plan": "starter", "billing": "monthly"})
        assert v.status_code == 200
        body = v.json()
        assert body["plan"] == "starter"
        # 2. /auth/me reflects starter, team_member_limit=2
        me = hr_client.get(f"{BASE_URL}/api/auth/me").json()
        assert me["plan"] == "starter"
        assert me["team_member_limit"] == 2
        assert me["billing_cycle"] == "monthly"
        # 3. /team/members shows owner only, limit=2, plan=starter
        m = hr_client.get(f"{BASE_URL}/api/team/members").json()
        assert m["limit"] == 2
        assert m["plan"] == "starter"
        assert len(m["members"]) == 1
        assert m["owner_user_id"] == hr_user["user_id"]
        # 4. Invite teammate succeeds
        mate_email = f"TEST_mate_{uuid.uuid4().hex[:6]}@x.com"
        inv = hr_client.post(f"{BASE_URL}/api/team/invite",
                             json={"name": "Mate One", "email": mate_email})
        assert inv.status_code == 200, inv.text
        invd = inv.json()
        assert invd["ok"] is True
        assert invd["member"]["owner_user_id"] == hr_user["user_id"]
        assert invd["member"]["email"] == mate_email
        mate_password = invd["password"]
        mate_user_id = invd["member"]["user_id"]
        # 5. members list now 2
        m2 = hr_client.get(f"{BASE_URL}/api/team/members").json()
        assert len(m2["members"]) == 2
        # 6. 2nd invite should hit limit 2 -> 402
        r2 = hr_client.post(f"{BASE_URL}/api/team/invite",
                            json={"name": "Mate Two", "email": f"TEST_mate2_{uuid.uuid4().hex[:6]}@x.com"})
        assert r2.status_code == 402
        assert "limit reached" in r2.json().get("detail", "").lower()
        # 7. Login as invited member; non-owner cannot invite -> 403
        ml = requests.post(f"{BASE_URL}/api/auth/login",
                           json={"email": mate_email, "password": mate_password})
        assert ml.status_code == 200
        mate_token = ml.json()["token"]
        mate_client = requests.Session()
        mate_client.headers.update({"Content-Type": "application/json",
                                     "Authorization": f"Bearer {mate_token}"})
        ri = mate_client.post(f"{BASE_URL}/api/team/invite",
                              json={"name": "X", "email": f"TEST_x_{uuid.uuid4().hex[:6]}@x.com"})
        assert ri.status_code == 403
        assert "owner" in ri.json().get("detail", "").lower()
        # 8. Owner cannot delete themselves
        rd = hr_client.delete(f"{BASE_URL}/api/team/members/{hr_user['user_id']}")
        assert rd.status_code == 400
        # 9. Owner deletes member -> 200
        rd2 = hr_client.delete(f"{BASE_URL}/api/team/members/{mate_user_id}")
        assert rd2.status_code == 200
        # 10. Verify deletion
        m3 = hr_client.get(f"{BASE_URL}/api/team/members").json()
        assert len(m3["members"]) == 1


# ---------------- Yearly verify reflects in user ----------------
class TestVerifyYearly:
    def test_verify_yearly_updates_billing_cycle(self, admin_token):
        # fresh user
        email = f"TEST_yr_{uuid.uuid4().hex[:8]}@example.com"
        sr = requests.post(f"{BASE_URL}/api/signup", json={
            "company_name": "YR Co", "company_website": "", "company_socials": "",
            "hr_name": "YR HR", "work_email": email, "phone": "1234",
            "employees_count": "1-10", "job_roles": "", "hiring_volume": ""
        })
        assert sr.status_code == 200
        sid = sr.json()["id"]
        a = requests.Session(); a.headers.update({"Authorization": f"Bearer {admin_token}"})
        ar = a.post(f"{BASE_URL}/api/admin/signups/{sid}/approve",
                    json={"plan": "trial", "trial_days": 30, "interviews_quota": 5})
        assert ar.status_code == 200
        pw = ar.json()["password"]
        lr = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw})
        token = lr.json()["token"]
        c = requests.Session(); c.headers.update({"Authorization": f"Bearer {token}"})
        # yearly verify
        v = c.post(f"{BASE_URL}/api/payments/verify",
                   json={"plan": "starter", "billing": "yearly"})
        assert v.status_code == 200
        me = c.get(f"{BASE_URL}/api/auth/me").json()
        assert me["plan"] == "starter"
        assert me["billing_cycle"] == "yearly"
        assert me["team_member_limit"] == 2
        assert me["interviews_quota"] == 20
