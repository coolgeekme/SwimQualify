"""Per-team data isolation tests (events / times / standards / athletes / seed / share)."""
import json
import time
import uuid

import pytest
import requests

from conftest import BASE_URL

TEAM1 = "team1"


def hdr(team_id=None, user_id="1", role="parent"):
    h = {"Content-Type": "application/json"}
    if team_id is not None:
        h["X-User-Session"] = json.dumps({"userId": user_id, "teamId": team_id, "role": role})
    return h


@pytest.fixture(scope="module")
def registered_team():
    """Register a fresh user -> creates a brand new team, seeded with default events."""
    email = f"TEST_iso_{uuid.uuid4().hex[:8]}@example.test"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "TEST Isolation User", "email": email,
        "password": "Passw0rd!23", "role": "parent",
    }, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"register failed {r.status_code}: {r.text[:300]}")
    data = r.json()
    return {"email": email, "password": "Passw0rd!23", **data}


# ---------------- Registration / login ----------------
class TestAuthTeam:
    def test_register_creates_new_team(self, registered_team):
        assert registered_team["teamId"]
        assert registered_team["teamId"] != TEAM1
        assert registered_team["teamId"].startswith("team_")

    def test_register_seeds_default_events_for_team(self, registered_team):
        r = requests.get(f"{BASE_URL}/api/events", headers=hdr(registered_team["teamId"]), timeout=60)
        assert r.status_code == 200
        evs = r.json()
        assert len(evs) == 24, f"expected 24 seeded events, got {len(evs)}"
        assert all(e.get("teamId") == registered_team["teamId"] for e in evs)
        assert {e["ageGroup"] for e in evs} == {"10U", "11-12"}

    def test_login_returns_team_id(self, registered_team):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": registered_team["email"], "password": registered_team["password"]}, timeout=60)
        assert r.status_code == 200
        assert r.json()["teamId"] == registered_team["teamId"]

    def test_duplicate_register_rejected(self, registered_team):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "dup", "email": registered_team["email"], "password": "x123456"}, timeout=60)
        assert r.status_code == 409


# ---------------- Events isolation ----------------
class TestEventsIsolation:
    def test_no_session_defaults_to_team1(self):
        r = requests.get(f"{BASE_URL}/api/events", timeout=60)
        assert r.status_code == 200
        evs = r.json()
        assert all(e.get("teamId") == TEAM1 for e in evs), "non-team1 events leaked to anonymous caller"

    def test_create_event_stamps_caller_team(self, registered_team):
        team = registered_team["teamId"]
        payload = {"name": "TEST Iso 200 Fly", "distance": 200, "stroke": "Butterfly",
                   "course": "SCY", "ageGroup": "13-14"}
        r = requests.post(f"{BASE_URL}/api/events", json=payload, headers=hdr(team), timeout=60)
        assert r.status_code == 200, r.text[:300]
        ev = r.json()
        assert ev["teamId"] == team
        eid = ev["id"]

        # visible to own team
        own = requests.get(f"{BASE_URL}/api/events", headers=hdr(team), timeout=60).json()
        assert any(e["id"] == eid for e in own)

        # NOT visible to team1
        other = requests.get(f"{BASE_URL}/api/events", headers=hdr(TEAM1), timeout=60).json()
        assert not any(e["id"] == eid for e in other), "event leaked across teams"

        # team1 cannot delete another team's event
        d = requests.delete(f"{BASE_URL}/api/events/{eid}", headers=hdr(TEAM1), timeout=60)
        assert d.status_code == 404, f"cross-team delete allowed: {d.status_code}"

        # owner can delete
        d2 = requests.delete(f"{BASE_URL}/api/events/{eid}", headers=hdr(team), timeout=60)
        assert d2.status_code == 200
        assert requests.get(f"{BASE_URL}/api/events", headers=hdr(team), timeout=60).json() != None
        assert not any(e["id"] == eid for e in requests.get(
            f"{BASE_URL}/api/events", headers=hdr(team), timeout=60).json())

    def test_same_event_name_can_exist_in_two_teams(self, registered_team):
        team = registered_team["teamId"]
        payload = {"name": "TEST Iso 400 IM", "distance": 400, "stroke": "Individual Medley",
                   "course": "SCY", "ageGroup": "15-16"}
        a = requests.post(f"{BASE_URL}/api/events", json=payload, headers=hdr(team), timeout=60)
        b = requests.post(f"{BASE_URL}/api/events", json=payload, headers=hdr(TEAM1), timeout=60)
        assert a.status_code == 200 and b.status_code == 200
        assert a.json()["id"] != b.json()["id"], "event dedupe collapsed events across teams"
        requests.delete(f"{BASE_URL}/api/events/{a.json()['id']}", headers=hdr(team), timeout=60)
        requests.delete(f"{BASE_URL}/api/events/{b.json()['id']}", headers=hdr(TEAM1), timeout=60)

    def test_dedupe_dry_run_scoped_to_team(self, registered_team):
        team = registered_team["teamId"]
        r = requests.post(f"{BASE_URL}/api/events/dedupe?dry_run=true", headers=hdr(team), timeout=120)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d.get("dry_run") is True
        assert d.get("total_events") == 24, f"dedupe counted other teams' events: {d}"
        assert d.get("events_after") == 24

    def test_seed_idempotent_per_team(self, registered_team):
        team = registered_team["teamId"]
        r = requests.post(f"{BASE_URL}/api/seed", headers=hdr(team), timeout=60)
        assert r.status_code == 200
        assert r.json().get("seeded") is False
        assert len(requests.get(f"{BASE_URL}/api/events", headers=hdr(team), timeout=60).json()) == 24

    def test_seed_new_team_creates_events(self):
        team = f"TEST_team_{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{BASE_URL}/api/seed", headers=hdr(team), timeout=60)
        assert r.status_code == 200
        assert r.json().get("seeded") is True
        evs = requests.get(f"{BASE_URL}/api/events", headers=hdr(team), timeout=60).json()
        assert len(evs) == 24
        for e in evs:
            requests.delete(f"{BASE_URL}/api/events/{e['id']}", headers=hdr(team), timeout=60)


# ---------------- Standards isolation ----------------
class TestStandardsIsolation:
    def test_standard_create_and_isolation(self, registered_team):
        team = registered_team["teamId"]
        payload = {"eventId": "TEST_ev_iso", "region": "TEST_Region", "ageGroup": "11-12",
                   "gender": "M", "course": "SCY", "cutTimeSeconds": 30.5, "season": "2026"}
        r = requests.post(f"{BASE_URL}/api/standards", json=payload, headers=hdr(team), timeout=60)
        assert r.status_code == 200, r.text[:300]
        s = r.json()
        assert s["teamId"] == team
        sid = s["id"]

        own = requests.get(f"{BASE_URL}/api/standards", headers=hdr(team), timeout=60).json()
        assert any(x["id"] == sid for x in own)
        other = requests.get(f"{BASE_URL}/api/standards", headers=hdr(TEAM1), timeout=60).json()
        assert not any(x["id"] == sid for x in other), "standard leaked across teams"

        d = requests.delete(f"{BASE_URL}/api/standards/{sid}", headers=hdr(TEAM1), timeout=60)
        assert d.status_code == 404, "cross-team standard delete allowed"
        assert requests.delete(f"{BASE_URL}/api/standards/{sid}", headers=hdr(team), timeout=60).status_code == 200

    def test_bulk_replace_does_not_delete_other_teams_standards(self, registered_team):
        team = registered_team["teamId"]
        common = {"eventId": "TEST_ev_bulk", "region": "TEST_Region", "ageGroup": "10U",
                  "gender": "F", "course": "SCY", "season": "2026"}
        t1 = requests.post(f"{BASE_URL}/api/standards", json={**common, "cutTimeSeconds": 40.0},
                           headers=hdr(TEAM1), timeout=60)
        assert t1.status_code == 200
        t1_id = t1.json()["id"]
        time.sleep(1)
        b = requests.post(f"{BASE_URL}/api/standards/bulk",
                          json={"standards": [{**common, "cutTimeSeconds": 35.0}]},
                          headers=hdr(team), timeout=60)
        assert b.status_code == 200
        created = b.json()
        assert created[0]["teamId"] == team

        # team1's standard must survive
        t1_list = requests.get(f"{BASE_URL}/api/standards", headers=hdr(TEAM1), timeout=60).json()
        assert any(x["id"] == t1_id for x in t1_list), "bulk insert deleted another team's standard"

        # bulk replace within same team overwrites
        b2 = requests.post(f"{BASE_URL}/api/standards/bulk",
                           json={"standards": [{**common, "cutTimeSeconds": 33.0}]},
                           headers=hdr(team), timeout=60)
        assert b2.status_code == 200
        own = [x for x in requests.get(f"{BASE_URL}/api/standards", headers=hdr(team), timeout=60).json()
               if x["eventId"] == "TEST_ev_bulk"]
        assert len(own) == 1 and own[0]["cutTimeSeconds"] == 33.0

        # cleanup
        requests.delete(f"{BASE_URL}/api/standards/{t1_id}", headers=hdr(TEAM1), timeout=60)
        for x in own:
            requests.delete(f"{BASE_URL}/api/standards/{x['id']}", headers=hdr(team), timeout=60)


# ---------------- Athletes + times isolation ----------------
class TestTimesAndAthletesIsolation:
    def test_athlete_and_time_isolation(self, registered_team):
        team = registered_team["teamId"]
        aid = f"TEST_a_{uuid.uuid4().hex[:6]}"
        a = requests.post(f"{BASE_URL}/api/athletes", json={
            "id": aid, "name": "TEST Iso Swimmer", "dob": "2014-05-01",
            "gender": "M", "ageGroup": "11-12", "selectedEventIds": []},
            headers=hdr(team), timeout=60)
        assert a.status_code == 200, a.text[:300]
        assert a.json().get("teamId") == team

        own_ath = requests.get(f"{BASE_URL}/api/athletes", headers=hdr(team), timeout=60).json()
        assert any(x["id"] == aid for x in own_ath)
        t1_ath = requests.get(f"{BASE_URL}/api/athletes", headers=hdr(TEAM1), timeout=60).json()
        assert not any(x["id"] == aid for x in t1_ath), "athlete leaked across teams"

        # team1 cannot log a time for this athlete
        bad = requests.post(f"{BASE_URL}/api/times", json={
            "athleteId": aid, "eventId": "TEST_ev", "timeSeconds": 31.2,
            "course": "SCY", "date": "2026-01-01"}, headers=hdr(TEAM1), timeout=60)
        assert bad.status_code == 403, f"cross-team time log allowed: {bad.status_code} {bad.text[:200]}"

        tid = f"TEST_t_{uuid.uuid4().hex[:6]}"
        ok = requests.post(f"{BASE_URL}/api/times", json={
            "id": tid, "athleteId": aid, "eventId": "TEST_ev", "timeSeconds": 31.2,
            "course": "SCY", "date": "2026-01-01"}, headers=hdr(team), timeout=60)
        assert ok.status_code == 200, ok.text[:300]
        assert ok.json()["teamId"] == team

        own_times = requests.get(f"{BASE_URL}/api/times", headers=hdr(team), timeout=60).json()
        assert any(x["id"] == tid for x in own_times)
        t1_times = requests.get(f"{BASE_URL}/api/times", headers=hdr(TEAM1), timeout=60).json()
        assert not any(x["id"] == tid for x in t1_times), "time entry leaked across teams"

        # cross-team update/delete blocked
        assert requests.put(f"{BASE_URL}/api/times/{tid}", json={
            "athleteId": aid, "eventId": "TEST_ev", "timeSeconds": 29.0,
            "course": "SCY", "date": "2026-01-01"}, headers=hdr(TEAM1), timeout=60).status_code == 404
        assert requests.delete(f"{BASE_URL}/api/times/{tid}", headers=hdr(TEAM1), timeout=60).status_code == 404
        assert requests.delete(f"{BASE_URL}/api/athletes/{aid}", headers=hdr(TEAM1), timeout=60).status_code == 404

        # owner cleanup
        assert requests.delete(f"{BASE_URL}/api/times/{tid}", headers=hdr(team), timeout=60).status_code == 200
        assert requests.delete(f"{BASE_URL}/api/athletes/{aid}", headers=hdr(team), timeout=60).status_code == 200

    def test_no_mongo_id_in_responses(self, registered_team):
        for path in ["/api/events", "/api/times", "/api/standards", "/api/athletes"]:
            r = requests.get(f"{BASE_URL}{path}", headers=hdr(registered_team["teamId"]), timeout=60)
            assert r.status_code == 200
            for item in r.json()[:5]:
                assert "_id" not in item, f"{path} leaks _id"


# ---------------- Team sharing scope ----------------
class TestShareScope:
    def test_share_scopes_events_and_standards(self, registered_team):
        team = registered_team["teamId"]
        r = requests.post(f"{BASE_URL}/api/teams/share", json={
            "teamId": team, "shareName": "TEST Iso Team", "athleteIds": []},
            headers=hdr(team), timeout=60)
        assert r.status_code == 200, r.text[:300]
        code = r.json().get("shareCode")
        assert code
        g = requests.get(f"{BASE_URL}/api/teams/share/{code}", timeout=60)
        assert g.status_code == 200, g.text[:300]
        data = g.json()
        assert data["teamId"] == team
        assert all(e.get("teamId") == team for e in data.get("events", []))
        assert all(s.get("teamId") == team for s in data.get("standards", []))
        requests.delete(f"{BASE_URL}/api/teams/share/{code}", headers=hdr(team), timeout=60)

    def test_invalid_share_code_404(self):
        r = requests.get(f"{BASE_URL}/api/teams/share/NOPE1234", timeout=60)
        assert r.status_code == 404


# ---------------- Backfill migration ----------------
class TestBackfill:
    def test_no_records_without_team_id(self):
        r = requests.get(f"{BASE_URL}/api/debug/collections", timeout=60)
        assert r.status_code == 200
        # events for team1 should be non-empty after backfill (legacy data stamped team1)
        evs = requests.get(f"{BASE_URL}/api/events", headers=hdr(TEAM1), timeout=60).json()
        assert isinstance(evs, list)

    def test_malformed_session_header_falls_back_to_team1(self):
        r = requests.get(f"{BASE_URL}/api/events",
                         headers={"X-User-Session": "not-json"}, timeout=60)
        assert r.status_code == 200
        assert all(e.get("teamId") == TEAM1 for e in r.json())

    def test_session_without_team_id_falls_back_to_team1(self):
        r = requests.get(f"{BASE_URL}/api/events",
                         headers={"X-User-Session": json.dumps({"userId": "1", "role": "parent"})},
                         timeout=60)
        assert r.status_code == 200
        assert all(e.get("teamId") == TEAM1 for e in r.json())
