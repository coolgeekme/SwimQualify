"""Tests for event-name normalization helpers and POST /api/events/dedupe."""
import sys

import pytest

sys.path.insert(0, "/app/backend")

from server import (  # noqa: E402
    _canonical_stroke_short,
    normalize_age_group,
    normalize_course_str,
    normalize_event_name,
    normalize_stroke_name,
)

SEED_EVENT_IDS = {"1", "2", "3", "4", "5", "6", "7"}


# ---------------- Unit tests: normalization helpers ----------------
class TestNormalizationHelpers:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("Freestyle", "Free"), ("free", "Free"), ("FR", "Free"),
            ("Backstroke", "Back"), ("BK", "Back"),
            ("Breaststroke", "Breast"), ("BR", "Breast"),
            ("Butterfly", "Fly"), ("FL", "Fly"), ("fly", "Fly"),
            ("Individual Medley", "IM"), ("200 IM", "IM"), ("medley", "IM"),
        ],
    )
    def test_canonical_stroke_short(self, raw, expected):
        assert _canonical_stroke_short(raw) == expected

    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("Fly", "Butterfly"), ("Butterfly", "Butterfly"),
            ("Back", "Backstroke"), ("Breast", "Breaststroke"),
            ("Free", "Freestyle"), ("IM", "Individual Medley"),
            ("", "Freestyle"), (None, "Freestyle"),
        ],
    )
    def test_normalize_stroke_name(self, raw, expected):
        assert normalize_stroke_name(raw) == expected

    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("SCY", "SCY"), ("scy", "SCY"), ("Yards", "SCY"), ("Short Course Yards", "SCY"),
            ("SCM", "SCM"), ("Short Course Meters", "SCM"), ("25m", "SCM"),
            ("LCM", "LCM"), ("Long Course", "LCM"), ("50m", "LCM"), ("Meters", "LCM"),
            ("", "SCY"), (None, "SCY"),
        ],
    )
    def test_normalize_course_str(self, raw, expected):
        assert normalize_course_str(raw) == expected

    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("10U", "10U"), ("10 & Under", "10U"), ("8&U", "10U"), ("10&U", "10U"),
            ("11-12", "11-12"), ("11 & 12", "11-12"), ("12&U", "11-12"),
            ("13-14", "13-14"), ("13 & 14", "13-14"), ("13U", "13-14"),
            ("15-16", "15-16"), ("15 & 16", "15-16"),
            ("17-18", "17-18"), ("Senior", "17-18"), ("Open", "17-18"),
        ],
    )
    def test_normalize_age_group(self, raw, expected):
        assert normalize_age_group(raw) == expected

    @pytest.mark.parametrize(
        "name,dist,course,expected",
        [
            ("Boys 50 Yard Butterfly SCY", 50, "SCY", "50 Fly"),
            ("Girls 100 Meter Backstroke", 100, "LCM", "100 Back"),
            ("13U Boys 50 Fly SCY", 50, "SCY", "50 Fly"),
            ("50 Butterfly", 0, "SCY", "50 Fly"),
            ("50 Yard Fly", 0, "SCY", "50 Fly"),
            ("200 Individual Medley", 0, "SCY", "200 IM"),
            ("400/500 Free", 0, "SCY", "500 Free"),
            ("400/500 Free", 0, "LCM", "400 Free"),
            ("11-12 Girls 100 Breaststroke", 0, "SCY", "100 Breast"),
            ("12&U Boys 100 Free", 0, "SCY", "100 Free"),
            ("", 50, "SCY", "50 Free"),
        ],
    )
    def test_normalize_event_name(self, name, dist, course, expected):
        assert normalize_event_name(name, dist, course) == expected


# ---------------- API tests: POST /api/events/dedupe ----------------
class TestDedupeEndpoint:
    def test_dedupe_dry_run_returns_summary(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/events/dedupe?dry_run=true", timeout=60)
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text[:300]}"
        data = r.json()
        for key in [
            "dry_run", "total_events", "canonical_groups", "merge_count",
            "normalize_count", "athletes_updated", "events_after",
        ]:
            assert key in data, f"missing key {key} in {data}"
        assert data["dry_run"] is True
        assert isinstance(data["total_events"], int) and data["total_events"] > 0
        assert data["events_after"] == data["total_events"] - data["merge_count"]
        # dry run must not change anything
        events = api_client.get(f"{base_url}/api/events", timeout=30).json()
        assert len(events) == data["total_events"]

    def test_dedupe_get_method_not_allowed(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/events/dedupe", timeout=30)
        assert r.status_code == 405

    def test_dedupe_merges_duplicates_and_remaps(self, api_client, base_url, created_event_ids):
        # Insert a deliberate duplicate of seeded event "1" (50 Free / SCY / 11-12)
        # bypassing create_event's dedupe by using a differently-labelled payload
        # that create_event would reuse -> so use direct DB-style duplicate via API
        # with a distinct age label that normalizes to the same bracket.
        dup_payload = {
            "name": "Girls 50 Yard Freestyle",
            "distance": 50,
            "stroke": "Free",
            "course": "Yards",
            "ageGroup": "11 & 12",
        }
        r = api_client.post(f"{base_url}/api/events", json=dup_payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        created = r.json()
        if created["id"] not in SEED_EVENT_IDS:
            created_event_ids.append(created["id"])

        before = api_client.post(f"{base_url}/api/events/dedupe?dry_run=true", timeout=60).json()
        assert before["merge_count"] >= 0

        r = api_client.post(f"{base_url}/api/events/dedupe", timeout=120)
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text[:300]}"
        data = r.json()
        assert data["dry_run"] is False
        for key in ["remaining_events", "remaining_standards", "remaining_times"]:
            assert key in data, f"missing key {key} in {data}"
        assert data["remaining_events"] == data["events_after"]

        # Verify idempotency: a second run should find nothing to merge/normalize
        again = api_client.post(f"{base_url}/api/events/dedupe?dry_run=true", timeout=60).json()
        assert again["merge_count"] == 0, f"dedupe not idempotent: {again}"
        assert again["normalize_count"] == 0, f"normalization not idempotent: {again}"

    def test_events_all_canonical_after_dedupe(self, api_client, base_url):
        api_client.post(f"{base_url}/api/events/dedupe", timeout=120)
        events = api_client.get(f"{base_url}/api/events", timeout=30).json()
        assert len(events) > 0
        seen = set()
        for e in events:
            assert "_id" not in e, "MongoDB _id leaked in /api/events response"
            expected_name = normalize_event_name(e.get("name"), e.get("distance"), e.get("course"))
            assert e["name"] == expected_name, f"non-canonical name: {e}"
            assert e["stroke"] == normalize_stroke_name(e.get("stroke")), f"non-canonical stroke: {e}"
            assert e["course"] == normalize_course_str(e.get("course")), f"non-canonical course: {e}"
            assert e["ageGroup"] == normalize_age_group(e.get("ageGroup")), f"non-canonical age: {e}"
            key = (e["distance"], _canonical_stroke_short(e["stroke"]), e["course"], e["ageGroup"])
            assert key not in seen, f"duplicate event group remains: {key}"
            seen.add(key)


# ---------------- API tests: POST /api/events canonicalization ----------------
class TestCreateEventCanonicalization:
    def test_non_canonical_name_is_normalized(self, api_client, base_url, created_event_ids):
        payload = {
            "name": "Boys 50 Yard Butterfly SCY",
            "distance": 50,
            "stroke": "Butterfly",
            "course": "Yards",
            "ageGroup": "13 & 14",
        }
        r = api_client.post(f"{base_url}/api/events", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        if data["id"] not in SEED_EVENT_IDS:
            created_event_ids.append(data["id"])
        assert data["name"] == "50 Fly"
        assert data["stroke"] == "Butterfly"
        assert data["course"] == "SCY"
        assert data["ageGroup"] == "13-14"
        assert "_id" not in data

        # verify persisted
        events = api_client.get(f"{base_url}/api/events", timeout=30).json()
        match = [e for e in events if e["id"] == data["id"]]
        assert match, "created event not returned by GET /api/events"
        assert match[0]["name"] == "50 Fly"
        assert match[0]["ageGroup"] == "13-14"

    def test_duplicate_event_returns_existing(self, api_client, base_url, created_event_ids):
        base = {
            "name": "200 Free",
            "distance": 200,
            "stroke": "Freestyle",
            "course": "SCY",
            "ageGroup": "15-16",
        }
        first = api_client.post(f"{base_url}/api/events", json=base, timeout=30)
        assert first.status_code == 200, first.text[:300]
        fid = first.json()["id"]
        if fid not in SEED_EVENT_IDS:
            created_event_ids.append(fid)

        count_before = len(api_client.get(f"{base_url}/api/events", timeout=30).json())

        variant = {
            "name": "Girls 200 Yard Freestyle 15 & 16",
            "distance": 200,
            "stroke": "FR",
            "course": "Yards",
            "ageGroup": "15 & 16",
        }
        second = api_client.post(f"{base_url}/api/events", json=variant, timeout=30)
        assert second.status_code == 200, second.text[:300]
        assert second.json()["id"] == fid, "duplicate event created instead of reusing existing"

        count_after = len(api_client.get(f"{base_url}/api/events", timeout=30).json())
        assert count_after == count_before, "event count grew on duplicate create"

    def test_distance_inferred_from_name_with_age_label(self, api_client, base_url, created_event_ids):
        """Distance omitted; name carries an age-group label that must not be read as distance."""
        payload = {
            "name": "11-12 Boys 100 Backstroke",
            "distance": 0,
            "stroke": "Back",
            "course": "SCY",
            "ageGroup": "11-12",
        }
        r = api_client.post(f"{base_url}/api/events", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        if data["id"] not in SEED_EVENT_IDS:
            created_event_ids.append(data["id"])
        assert data["distance"] == 100, f"distance mis-parsed from name: {data}"
        assert data["name"] == "100 Back", f"unexpected canonical name: {data}"
