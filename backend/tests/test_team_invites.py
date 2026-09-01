"""
Test team invite/join feature:
1. Owner generates an invite code for their team
2. New user can register with the invite code and lands in the owner's team
3. Existing user can join a team via POST /api/teams/join (teamId switches)
4. Invalid codes are rejected; auth is required
5. Joined users see the same team-scoped data (events)
"""
import os

os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "swimqualify_test_invites"
os.environ["REACT_APP_BACKEND_URL"] = "http://testserver"

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
import mongomock
from fastapi.testclient import TestClient

import server

# Swap the real (unreachable) Mongo for an in-memory mongomock DB
server.client = mongomock.MongoClient()
server.db = server.client[os.environ["DB_NAME"]]

client = TestClient(server.app)


def setup_module():
    server.db.client.drop_database(server.db.name)


def teardown_module():
    server.db.client.drop_database(server.db.name)


def register(name, email, password="pass1234", role="parent", invite_code=None):
    body = {"name": name, "email": email, "password": password, "role": role}
    if invite_code:
        body["inviteCode"] = invite_code
    r = client.post("/api/auth/register", json=body)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    return r.json()


def session(user):
    return {"X-User-Session": json.dumps(user)}


@pytest.fixture(scope="module")
def team():
    """Owner account + their team's invite code."""
    owner = register("Reggie Alcos", f"reggie-{os.getpid()}@swim.test")
    r = client.post("/api/teams/invite", json={}, headers=session(owner))
    assert r.status_code == 200
    return {"owner": owner, "inviteCode": r.json()["inviteCode"], "teamId": owner["teamId"]}


class TestInviteFlow:
    def test_owner_generates_invite_code(self, team):
        assert len(team["inviteCode"]) == 8
        assert team["inviteCode"].isalnum()
        # Same team -> same code (stable, reusable)
        r2 = client.post("/api/teams/invite", json={}, headers=session(team["owner"]))
        assert r2.status_code == 200
        assert r2.json()["inviteCode"] == team["inviteCode"]

    def test_register_with_invite_code_joins_team(self, team):
        member = register("Tiffany", f"tiffany-{os.getpid()}@swim.test", invite_code=team["inviteCode"])
        assert member["teamId"] == team["teamId"]

    def test_invalid_invite_code_rejected(self):
        r = client.post(
            "/api/auth/register",
            json={"name": "Bad", "email": f"bad-{os.getpid()}@swim.test", "password": "pass1234", "inviteCode": "nope1234"},
        )
        assert r.status_code == 404

    def test_join_moves_existing_user_into_team(self, team):
        outsider = register("Solema", f"solema-{os.getpid()}@swim.test")
        assert outsider["teamId"] != team["teamId"]

        r = client.post("/api/teams/join", json={"inviteCode": team["inviteCode"]}, headers=session(outsider))
        assert r.status_code == 200
        assert r.json()["teamId"] == team["teamId"]

        # Idempotent: joining again is a no-op success
        r2 = client.post("/api/teams/join", json={"inviteCode": team["inviteCode"]}, headers=session(outsider))
        assert r2.status_code == 200
        assert r2.json()["teamId"] == team["teamId"]

    def test_join_requires_auth(self):
        r = client.post("/api/teams/join", json={"inviteCode": "abcdefgh"})
        assert r.status_code == 401

    def test_join_with_userId_format_session(self, team):
        """Workspace frontends send {userId, teamId, role} — join must still work."""
        outsider = register("UserIDFormat", f"uidfmt-{os.getpid()}@swim.test")
        thin_session = session({"userId": outsider["id"], "teamId": outsider["teamId"], "role": "parent"})
        r = client.post("/api/teams/join", json={"inviteCode": team["inviteCode"]}, headers=thin_session)
        assert r.status_code == 200
        assert r.json()["teamId"] == team["teamId"]

    def test_join_with_bad_code_404(self, team):
        r = client.post("/api/teams/join", json={"inviteCode": "zzzzzzzz"}, headers=session(team["owner"]))
        assert r.status_code == 404

    def test_joined_user_sees_same_team_data(self, team):
        member = register("Member", f"member-{os.getpid()}@swim.test", invite_code=team["inviteCode"])
        owner_events = client.get("/api/events", headers=session(team["owner"])).json()
        member_events = client.get("/api/events", headers=session(member)).json()
        assert len(owner_events) > 0, "team should have seeded events"
        assert len(member_events) == len(owner_events), "joined user must see the same team events"
        assert all(e.get("teamId") == team["teamId"] for e in member_events)
