"""
Test that verification fields on qualifying standards survive the API:
POST /api/standards/bulk with verificationScore/verificationConfidence must
persist them (regression: pydantic was stripping the extra fields).
"""
import os

os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "swimqualify_test_standards_verify"
os.environ["REACT_APP_BACKEND_URL"] = "http://testserver"

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import mongomock
from fastapi.testclient import TestClient

import server

client = TestClient(server.app)


def setup_module():
    server.client = mongomock.MongoClient()
    server.db = server.client[os.environ["DB_NAME"]]


def teardown_module():
    server.db.client.drop_database(server.db.name)


def register(name=None):
    name = name or "Verify Tester"
    r = client.post(
        "/api/auth/register",
        json={
            "name": name,
            "email": f"vt-{name.lower().replace(' ', '')}-{os.getpid()}-{server.db.users.count_documents({})}@swim.test",
            "password": "pass1234",
            "role": "admin",
        },
    )
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    return r.json()


def session(user):
    return {"X-User-Session": json.dumps(user)}


class TestStandardsVerificationFields:
    def test_bulk_upsert_preserves_verification_fields(self):
        user = register()
        h = session(user)

        # Get an event id to attach the standard to
        events = client.get("/api/events", headers=h).json()
        assert len(events) > 0
        event_id = events[0]["id"]

        payload = {
            "standards": [
                {
                    "eventId": event_id,
                    "region": "Regional",
                    "ageGroup": "11-12",
                    "gender": "M",
                    "course": "SCY",
                    "cutTimeSeconds": 33.09,
                    "season": "2025-2026",
                    "verificationScore": "1/1",
                    "verificationConfidence": "high",
                }
            ]
        }
        r = client.post("/api/standards/bulk", json=payload, headers=h)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created[0]["verificationScore"] == "1/1"
        assert created[0]["verificationConfidence"] == "high"

        # Read back through GET /api/standards
        stds = client.get("/api/standards", headers=h).json()
        row = next(s for s in stds if s["eventId"] == event_id and s["region"] == "Regional")
        assert row["verificationScore"] == "1/1", "verificationScore must persist"
        assert row["verificationConfidence"] == "high", "verificationConfidence must persist"

    def test_bulk_upsert_replaces_and_keeps_fields(self):
        """Re-upsert of the same key replaces the row but keeps declared fields."""
        user = register()
        h = session(user)
        events = client.get("/api/events", headers=h).json()
        event_id = events[0]["id"]

        base = {
            "eventId": event_id,
            "region": "State",
            "ageGroup": "10U",
            "gender": "F",
            "course": "LCM",
            "cutTimeSeconds": 100.0,
            "season": "2025-2026",
        }
        client.post("/api/standards/bulk", json={"standards": [{**base, "verificationConfidence": "low"}]}, headers=h)
        r = client.post(
            "/api/standards/bulk",
            json={"standards": [{**base, "cutTimeSeconds": 99.5, "verificationScore": "2/2", "verificationConfidence": "high"}]},
            headers=h,
        )
        assert r.status_code == 200
        stds = client.get("/api/standards", headers=h).json()
        matching = [s for s in stds if s["eventId"] == event_id and s["region"] == "State"]
        assert len(matching) == 1, "upsert must not duplicate rows"
        assert matching[0]["cutTimeSeconds"] == 99.5
        assert matching[0]["verificationConfidence"] == "high"
