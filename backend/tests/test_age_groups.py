"""
Age-group lifecycle tests:
1. compute_age_group birthday-boundary math
2. create_athlete derives ageGroup from DOB (never trusts the client)
3. reconcile flips a stale ageGroup + remaps selectedEventIds to the new group's events
4. GET /api/events self-heals: creates events for the group a swimmer is in
5. update_athlete with a new DOB re-derives + remaps
"""
import os
from datetime import date

os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "swimqualify_test_age_groups"
os.environ["REACT_APP_BACKEND_URL"] = "http://testserver"

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import mongomock
from fastapi.testclient import TestClient

import server
from server import compute_age_group

client = TestClient(server.app)


def setup_module():
    server.client = mongomock.MongoClient()
    server.db = server.client[os.environ["DB_NAME"]]


def teardown_module():
    server.db.client.drop_database(server.db.name)


def register():
    r = client.post(
        "/api/auth/register",
        json={"name": "Age Tester", "email": f"age-{os.getpid()}-{server.db.users.count_documents({})}@swim.test", "password": "pass1234", "role": "parent"},
    )
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    return r.json()


def session(user):
    return {"X-User-Session": json.dumps(user)}


class TestComputeAgeGroup:
    def test_boundaries(self):
        assert compute_age_group("2020-01-01", date(2030, 1, 1)) == "10U"
        assert compute_age_group("2015-01-01", date(2026, 12, 31)) == "11-12"
        assert compute_age_group("2013-07-15", date(2026, 9, 1)) == "13-14"
        assert compute_age_group("2010-01-01", date(2026, 9, 1)) == "15-16"
        assert compute_age_group("2008-01-01", date(2026, 9, 1)) == "17-18"

    def test_birthday_not_yet_passed(self):
        # Turns 13 on 2026-09-22; on 2026-09-01 they are still 12 -> 11-12
        assert compute_age_group("2013-09-22", date(2026, 9, 1)) == "11-12"
        # On the birthday itself they are 13 -> 13-14
        assert compute_age_group("2013-09-22", date(2026, 9, 22)) == "13-14"

    def test_invalid_dob_returns_none(self):
        assert compute_age_group(None) is None
        assert compute_age_group("not-a-date") is None


class TestAgeLifecycle:
    def test_create_derives_age_group(self):
        user = register()
        h = session(user)
        r = client.post(
            "/api/athletes",
            json={"name": "Old Kid", "dob": "2013-07-15", "gender": "M", "ageGroup": "11-12"},  # client lies: 11-12
            headers=h,
        )
        assert r.status_code == 200, r.text
        a = r.json()
        assert a["ageGroup"] == "13-14", "server must derive ageGroup from DOB"
        # events for the new group must exist now
        events = client.get("/api/events", headers=h).json()
        groups = {e["ageGroup"] for e in events}
        assert "13-14" in groups, "team should have 13-14 events for the swimmer"

    def test_reconcile_flips_stale_group_and_remaps_events(self):
        user = register()
        h = session(user)
        # seed team events (register already did), pick an 11-12 event
        events = client.get("/api/events", headers=h).json()
        old_events = [e for e in events if e["ageGroup"] == "11-12"]
        assert len(old_events) > 0
        selected = [old_events[0]["id"], old_events[1]["id"]]

        # Simulate a pre-existing athlete with a STALE age group (bypasses create-time derivation)
        athlete_id = "a_stale_" + str(os.getpid())
        server.db.athletes.insert_one({
            "id": athlete_id, "name": "Stale Swimmer", "dob": "2013-07-15",
            "gender": "M", "ageGroup": "11-12", "selectedEventIds": selected,
            "teamId": user["teamId"],
        })

        # GET /api/athletes triggers reconciliation
        athletes = client.get("/api/athletes", headers=h).json()
        a = next(x for x in athletes if x["id"] == athlete_id)
        assert a["ageGroup"] == "13-14", "stale group must flip to derived group"
        assert a["previousAgeGroup"] == "11-12"
        assert "ageGroupChangedAt" in a

        # selected events must have been remapped to 13-14 twins with the same names/courses
        ev_by_id = {e["id"]: e for e in client.get("/api/events", headers=h).json()}
        remapped = [ev_by_id[eid] for eid in a["selectedEventIds"]]
        assert len(remapped) == 2
        assert all(e["ageGroup"] == "13-14" for e in remapped)
        assert {e["name"] for e in remapped} == {e["name"] for e in old_events[:2]}

    def test_update_dob_remaps(self):
        user = register()
        h = session(user)
        # Create a 10U athlete (dob 2018-01-01 -> 8yo)
        r = client.post(
            "/api/athletes",
            json={"name": "Young", "dob": "2018-01-01", "gender": "F", "ageGroup": "10U"},
            headers=h,
        )
        assert r.status_code == 200
        aid = r.json()["id"]

        events = client.get("/api/events", headers=h).json()
        tenu = [e for e in events if e["ageGroup"] == "10U"]
        selected = [tenu[0]["id"]]

        # Update with selected events
        r = client.put(f"/api/athletes/{aid}", json={
            "name": "Young", "dob": "2018-01-01", "gender": "F",
            "ageGroup": "10U", "selectedEventIds": selected,
        }, headers=h)
        assert r.status_code == 200

        # Now fix the DOB to 2013-07-15 -> 13-14; events must remap in the same response
        r = client.put(f"/api/athletes/{aid}", json={
            "name": "Young", "dob": "2013-07-15", "gender": "F",
            "ageGroup": "10U", "selectedEventIds": selected,
        }, headers=h)
        assert r.status_code == 200
        a = r.json()
        assert a["ageGroup"] == "13-14"
        ev_by_id = {e["id"]: e for e in client.get("/api/events", headers=h).json()}
        remapped = [ev_by_id[eid] for eid in a["selectedEventIds"]]
        assert all(e["ageGroup"] == "13-14" for e in remapped)
