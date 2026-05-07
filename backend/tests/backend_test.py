"""
Comprehensive backend API tests for ARIA AI Interviewer.
Covers: health, auth, plans, payments (mocked), jobs, interview flow (text), status, email log.
"""
import os
import pytest
import requests
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://interview-hub-59.preview.emergentagent.com").rstrip("/")
HR_TOKEN = "test_session_hr_001"


@pytest.fixture(scope="session")
def hr_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {HR_TOKEN}"})
    return s


@pytest.fixture(scope="session")
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def state():
    return {}


# ---------------- Health ----------------
class TestHealth:
    def test_root(self, anon_client):
        r = anon_client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------------- Plans ----------------
class TestPlans:
    def test_plans_list(self, anon_client):
        r = anon_client.get(f"{BASE_URL}/api/plans")
        assert r.status_code == 200
        plans = r.json().get("plans", [])
        ids = {p["id"] for p in plans}
        assert ids == {"starter", "pro", "business"}


# ---------------- Auth ----------------
class TestAuth:
    def test_auth_me_hr(self, hr_client):
        r = hr_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["user_id"] == "test_hr_001"
        assert data["role"] == "hr"
        assert data["email"] == "hr@test.com"

    def test_auth_me_unauth(self, anon_client):
        r = anon_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# ---------------- Payments (mocked) ----------------
class TestPayments:
    def test_create_order_pro(self, hr_client):
        r = hr_client.post(f"{BASE_URL}/api/payments/create-order", json={"plan": "pro"})
        assert r.status_code == 200
        d = r.json()
        assert d["mocked"] is True
        assert d["order_id"].startswith("order_mock_")
        assert d["amount"] == 4150 * 100

    def test_create_order_invalid(self, hr_client):
        r = hr_client.post(f"{BASE_URL}/api/payments/create-order", json={"plan": "starter"})
        assert r.status_code == 400

    def test_verify_upgrades_plan(self, hr_client):
        r = hr_client.post(f"{BASE_URL}/api/payments/verify", json={"plan": "pro"})
        assert r.status_code == 200
        assert r.json()["plan"] == "pro"
        me = hr_client.get(f"{BASE_URL}/api/auth/me").json()
        assert me["plan"] == "pro"
        # restore business
        hr_client.post(f"{BASE_URL}/api/payments/verify", json={"plan": "business"})


# ---------------- Invite direct (text) ----------------
class TestInvite:
    def test_create_invite_text(self, hr_client, state):
        payload = {
            "role": "Backend Engineer",
            "interview_type": "text",
            "category": "coding",
            "candidate_name": "TEST Candidate",
            "candidate_email": "TEST_candidate@example.com",
            "custom_questions": ["Tell me about yourself", "Why this role?"],
            "ai_question_count": 3,
        }
        r = hr_client.post(f"{BASE_URL}/api/interviews/invite", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["code"].startswith("ARIA-")
        assert len(d["code"].split("-")) == 3
        assert d["interview_type"] == "text"
        assert len(d["questions"]) >= 2  # at least customs; AI may fallback
        assert d["questions"][0]["q"] == "Tell me about yourself"
        assert d["status"] == "invited"
        assert d["hr_status"] == "pending"
        state["interview_id"] = d["id"]
        state["interview_code"] = d["code"]
        state["question_count"] = len(d["questions"])

    def test_email_logged(self, hr_client, state):
        r = hr_client.get(f"{BASE_URL}/api/email_log")
        assert r.status_code == 200
        emails = r.json().get("emails", [])
        assert any(e["to"] == "TEST_candidate@example.com" and state["interview_code"] in e.get("body", "") for e in emails)


# ---------------- Job posting + public apply ----------------
class TestJobs:
    def test_create_job(self, hr_client, state):
        payload = {
            "role": "Frontend Developer",
            "interview_type": "text",
            "category": "coding",
            "custom_questions": ["Describe React hooks"],
            "ai_question_count": 2,
            "description": "Build UI",
        }
        r = hr_client.post(f"{BASE_URL}/api/jobs/create", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["job_code"].startswith("JOB-")
        assert d["open"] is True
        state["job_code"] = d["job_code"]

    def test_public_job_hides_questions(self, anon_client, state):
        r = anon_client.get(f"{BASE_URL}/api/jobs/public/{state['job_code']}")
        assert r.status_code == 200
        d = r.json()
        assert "custom_questions" not in d
        assert "ai_question_count" not in d
        assert d["role"] == "Frontend Developer"

    def test_apply_creates_interview(self, state):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/jobs/{state['job_code']}/apply",
                   json={"candidate_name": "TEST Applicant", "candidate_email": "TEST_apply@example.com"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["code"].startswith("ARIA-")
        assert d["interview_type"] == "text"
        assert len(d["questions"]) >= 1
        # cookie set
        assert "interview_code" in s.cookies
        state["applied_session"] = s
        state["applied_id"] = d["id"]
        state["applied_code"] = d["code"]


# ---------------- Candidate interview flow (text) ----------------
class TestCandidateFlow:
    def test_join_and_respond_complete(self, state):
        assert "interview_id" in state, "invite test must run first"
        s = requests.Session()
        # join to set cookie
        jr = s.post(f"{BASE_URL}/api/interviews/join", json={"code": state["interview_code"]})
        assert jr.status_code == 200
        assert s.cookies.get("interview_code") == state["interview_code"]

        iid = state["interview_id"]
        # Iterate respond until final
        steps = 0
        while True:
            r = s.post(f"{BASE_URL}/api/interviews/{iid}/respond", json={"answer": f"Answer {steps}"})
            assert r.status_code == 200, r.text
            d = r.json()
            steps += 1
            if d.get("is_final") or steps > 10:
                break
        assert steps >= 1

        # complete
        c = s.post(f"{BASE_URL}/api/interviews/{iid}/complete", json={})
        assert c.status_code == 200, c.text
        comp = c.json()
        assert comp["status"] == "completed"
        assert isinstance(comp["scores"], dict)
        for k in ["technical", "soft_skills", "cultural_fit", "experience", "personality"]:
            assert k in comp["scores"]
            assert 0 <= comp["scores"][k] <= 100
        assert 0 <= comp["overall"] <= 100
        assert comp["feedback"]  # JSON string

    def test_public_status(self, anon_client, state):
        r = anon_client.get(f"{BASE_URL}/api/interviews/status/{state['interview_code']}")
        assert r.status_code == 200
        d = r.json()
        assert d["code"] == state["interview_code"]
        assert d["status"] == "completed"
        assert d["hr_status"] == "pending"

    def test_public_status_invalid(self, anon_client):
        r = anon_client.get(f"{BASE_URL}/api/interviews/status/ARIA-XXXX-XXXX")
        assert r.status_code == 404


# ---------------- HR status update ----------------
class TestHRStatus:
    def test_update_status_selected(self, hr_client, anon_client, state):
        r = hr_client.post(f"{BASE_URL}/api/interviews/{state['interview_id']}/status",
                           json={"hr_status": "selected", "note": "Great fit"})
        assert r.status_code == 200
        # public status reflects
        time.sleep(0.3)
        ps = anon_client.get(f"{BASE_URL}/api/interviews/status/{state['interview_code']}").json()
        assert ps["hr_status"] == "selected"
        assert ps["hr_note"] == "Great fit"
        # email logged
        emails = hr_client.get(f"{BASE_URL}/api/email_log").json().get("emails", [])
        assert any(state["interview_code"] in e.get("body", "") and "Selected" in e.get("body", "") for e in emails)

    def test_non_owner_cannot_update(self, anon_client, state):
        r = anon_client.post(f"{BASE_URL}/api/interviews/{state['interview_id']}/status",
                             json={"hr_status": "selected", "note": ""})
        assert r.status_code == 401


# ---------------- Interview listing ----------------
class TestListing:
    def test_list_interviews_hr(self, hr_client, state):
        r = hr_client.get(f"{BASE_URL}/api/interviews")
        assert r.status_code == 200
        items = r.json().get("interviews", [])
        ids = {i["id"] for i in items}
        assert state["interview_id"] in ids
        # all belong to test_hr_001
        assert all(i["invited_by"] == "test_hr_001" for i in items)

    def test_list_requires_hr(self, anon_client):
        r = anon_client.get(f"{BASE_URL}/api/interviews")
        assert r.status_code == 401
