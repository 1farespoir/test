"""
Quick Atlas connection tester.
Run:    python scripts/test_atlas.py "mongodb+srv://scorebar_app:PASS@.../scorebar_db?..."
"""
import sys, ssl
from datetime import datetime, timezone

if len(sys.argv) < 2:
    print("Usage: python scripts/test_atlas.py '<MONGO_URL>'")
    sys.exit(1)

uri = sys.argv[1]
try:
    from pymongo import MongoClient
except ImportError:
    print("pip install pymongo first"); sys.exit(1)

print("→ Connecting to Atlas...")
client = MongoClient(uri, serverSelectionTimeoutMS=8000)
try:
    info = client.admin.command("ping")
    print(f"  ✓ ping ok: {info}")
except Exception as e:
    print(f"  ✗ FAILED: {e}")
    print("  Common fixes: check password, IP whitelist (0.0.0.0/0), cluster running")
    sys.exit(1)

# Confirm we can write
db = client.get_default_database() or client["scorebar_db"]
print(f"→ Using database: {db.name}")
print("→ Writing test doc...")
res = db.connection_test.insert_one({"ok": True, "ts": datetime.now(timezone.utc)})
print(f"  ✓ inserted _id={res.inserted_id}")
print("→ Reading it back...")
doc = db.connection_test.find_one({"_id": res.inserted_id})
print(f"  ✓ read: {doc}")
db.connection_test.delete_one({"_id": res.inserted_id})
print("  ✓ cleaned up")

print("\n✅ Atlas is working. Connection string is good to use.")
