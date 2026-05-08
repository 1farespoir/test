"""
One-time script to create a frozen Starter-plan test account for sharing with friends.
Run:  python scripts/create_test_user.py "<MONGO_URL>"
"""
import sys, uuid, secrets, string
from datetime import datetime, timezone

if len(sys.argv) < 2:
    print("Usage: python scripts/create_test_user.py '<MONGO_URL>'")
    sys.exit(1)

try:
    from pymongo import MongoClient
    import bcrypt
except ImportError:
    print("pip install pymongo bcrypt")
    sys.exit(1)

MONGO_URL = sys.argv[1]
TEST_EMAIL = "demo@scorebar.bar"
TEST_PASSWORD = "ScorebarDemo2026!"   # easy to type, hard to brute-force

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=8000)
db = client.get_default_database()
print(f"→ Using DB: {db.name}")

existing = db.users.find_one({"email": TEST_EMAIL})
if existing:
    # Reset the test user to known good state
    db.users.update_one(
        {"email": TEST_EMAIL},
        {"$set": {
            "password_hash": bcrypt.hashpw(TEST_PASSWORD.encode(), bcrypt.gensalt()).decode(),
            "plan": "starter",
            "interviews_used": 0,
            "interviews_quota": 20,
            "team_member_limit": 2,
            "approved": True,
            "frozen": True,
            "role": "hr",
        }}
    )
    print("✓ Reset existing test user")
else:
    db.users.insert_one({
        "user_id": f"user_demo_{uuid.uuid4().hex[:8]}",
        "email": TEST_EMAIL,
        "username": "demo",
        "name": "Scorebar Demo",
        "password_hash": bcrypt.hashpw(TEST_PASSWORD.encode(), bcrypt.gensalt()).decode(),
        "role": "hr",
        "plan": "starter",
        "billing_cycle": "monthly",
        "interviews_used": 0,
        "interviews_quota": 20,
        "team_member_limit": 2,
        "approved": True,
        "frozen": True,             # blocks plan upgrade, role change, team invite
        "company_name": "Scorebar Demo Co.",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    print("✓ Created test user")

# Wipe any leftover sessions for this user (force re-login)
res = db.user_sessions.delete_many({"user_id": {"$regex": "^user_demo_"}})
print(f"✓ Cleared {res.deleted_count} old sessions")

print("\n" + "="*50)
print("TEST ACCOUNT CREDENTIALS")
print("="*50)
print(f"  Email:    {TEST_EMAIL}")
print(f"  Password: {TEST_PASSWORD}")
print(f"  Plan:     Starter (20 interviews/mo, 2 team seats)")
print(f"  Frozen:   YES (cannot upgrade plan, change role, invite team)")
print("="*50)
