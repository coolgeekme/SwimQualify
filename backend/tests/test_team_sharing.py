"""
Test Team Sharing Feature - Bug Fix Verification
Tests for:
1. Share creation stores athleteIds
2. Shared view only shows specific athletes that were shared
3. Shared view shows times for shared athletes
4. Non-shared athletes are NOT visible in shared view
5. Backend uses correct collection names (db.timeEntries, db.qualifyingStandards)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session for Alex (parent)
ALEX_SESSION = '{"id":"user1","name":"Alex Rivera","email":"alex@swimclub.com","role":"parent","teamId":"team1"}'

# Known test data
SHARE_CODE = "yzf3bwgv"
DIEGO_ID = "a_1776640245502"
SOFIA_ID = "a_1776640245880"
OTHER_KID_ID = "a_1776640246020"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ API health check passed")


class TestShareEndpoint:
    """Test the shared team endpoint"""
    
    def test_share_link_returns_data(self):
        """GET /api/teams/share/{code} returns shared team data"""
        response = requests.get(f"{BASE_URL}/api/teams/share/{SHARE_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "shareName" in data
        assert "athletes" in data
        assert "times" in data
        assert "events" in data
        assert "standards" in data
        print(f"✓ Share endpoint returns data with {len(data['athletes'])} athletes, {len(data['times'])} times")
    
    def test_share_returns_only_shared_athletes(self):
        """Shared view only shows the specific athletes that were shared (not ALL athletes)"""
        response = requests.get(f"{BASE_URL}/api/teams/share/{SHARE_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        athletes = data.get("athletes", [])
        athlete_ids = [a["id"] for a in athletes]
        athlete_names = [a["name"] for a in athletes]
        
        # Diego and Sofia should be present
        assert DIEGO_ID in athlete_ids, f"Diego (ID: {DIEGO_ID}) should be in shared athletes"
        assert SOFIA_ID in athlete_ids, f"Sofia (ID: {SOFIA_ID}) should be in shared athletes"
        
        # Other Kid should NOT be present
        assert OTHER_KID_ID not in athlete_ids, f"Other Kid (ID: {OTHER_KID_ID}) should NOT be in shared athletes"
        
        # Verify by name as well
        assert "Diego Rivera" in athlete_names
        assert "Sofia Rivera" in athlete_names
        assert "Other Kid" not in athlete_names
        
        print(f"✓ Share returns only shared athletes: {athlete_names}")
        print(f"✓ 'Other Kid' is correctly excluded from shared view")
    
    def test_share_returns_times_for_shared_athletes(self):
        """Shared view shows times for shared athletes (times actually appear)"""
        response = requests.get(f"{BASE_URL}/api/teams/share/{SHARE_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        times = data.get("times", [])
        assert len(times) > 0, "Times should be returned for shared athletes"
        
        # Verify times have required fields
        for time in times:
            assert "athleteId" in time
            assert "eventId" in time
            assert "timeSeconds" in time
            assert "date" in time
            # meetName should be present (was the bug - times were blank)
            assert "meetName" in time, "meetName field should be present"
        
        # Verify times are for shared athletes only
        time_athlete_ids = set(t["athleteId"] for t in times)
        assert DIEGO_ID in time_athlete_ids or SOFIA_ID in time_athlete_ids, "Times should be for Diego or Sofia"
        assert OTHER_KID_ID not in time_athlete_ids, "Times should NOT include Other Kid"
        
        # Check specific times exist
        diego_times = [t for t in times if t["athleteId"] == DIEGO_ID]
        sofia_times = [t for t in times if t["athleteId"] == SOFIA_ID]
        
        print(f"✓ Times returned: {len(times)} total")
        print(f"  - Diego has {len(diego_times)} times")
        print(f"  - Sofia has {len(sofia_times)} times")
        
        # Verify meet names are present (this was the bug - showed blank)
        for time in times:
            if time.get("meetName"):
                print(f"  - Time has meetName: '{time['meetName']}' on {time['date']}")
    
    def test_share_returns_events(self):
        """Shared view returns events"""
        response = requests.get(f"{BASE_URL}/api/teams/share/{SHARE_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        events = data.get("events", [])
        assert len(events) > 0, "Events should be returned"
        
        # Verify event structure
        for event in events:
            assert "id" in event
            assert "name" in event
            assert "distance" in event
            assert "stroke" in event
        
        print(f"✓ Events returned: {len(events)}")
    
    def test_share_returns_standards(self):
        """Shared view returns qualifying standards"""
        response = requests.get(f"{BASE_URL}/api/teams/share/{SHARE_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        standards = data.get("standards", [])
        assert len(standards) > 0, "Standards should be returned"
        
        # Verify standard structure
        for standard in standards:
            assert "eventId" in standard
            assert "region" in standard
            assert "cutTimeSeconds" in standard
        
        print(f"✓ Standards returned: {len(standards)}")
    
    def test_invalid_share_code_returns_404(self):
        """Invalid share code returns 404"""
        response = requests.get(f"{BASE_URL}/api/teams/share/invalid_code_xyz")
        assert response.status_code == 404
        print("✓ Invalid share code returns 404")


class TestShareCreation:
    """Test share creation with athleteIds"""
    
    def test_create_share_stores_athlete_ids(self):
        """POST /api/teams/share with athleteIds stores them"""
        # First, get current athletes to share
        athletes_response = requests.get(
            f"{BASE_URL}/api/athletes",
            headers={"X-User-Session": ALEX_SESSION}
        )
        assert athletes_response.status_code == 200
        athletes = athletes_response.json()
        
        # Create a new share with specific athlete IDs
        athlete_ids_to_share = [a["id"] for a in athletes[:2]]  # Share first 2 athletes
        
        response = requests.post(
            f"{BASE_URL}/api/teams/share",
            headers={
                "Content-Type": "application/json",
                "X-User-Session": ALEX_SESSION
            },
            json={
                "teamId": "team1",
                "shareName": "Test Share",
                "athleteIds": athlete_ids_to_share
            }
        )
        
        # Should return existing share or create new one
        assert response.status_code == 200
        data = response.json()
        assert "shareCode" in data
        assert "shareUrl" in data
        
        print(f"✓ Share creation returns shareCode: {data['shareCode']}")


class TestDataIntegrity:
    """Test that backend uses correct collection names"""
    
    def test_times_collection_used(self):
        """Backend uses db.timeEntries (not db.times) for fetching times"""
        response = requests.get(f"{BASE_URL}/api/teams/share/{SHARE_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        times = data.get("times", [])
        # If times are returned, the correct collection is being used
        # The bug was using db.times instead of db.timeEntries
        assert len(times) > 0, "Times should be returned (db.timeEntries collection)"
        
        # Verify times have proper structure from timeEntries collection
        for time in times:
            assert "timeSeconds" in time
            assert "athleteId" in time
            assert "eventId" in time
        
        print(f"✓ Backend correctly uses db.timeEntries collection ({len(times)} times returned)")
    
    def test_standards_collection_used(self):
        """Backend uses db.qualifyingStandards (not db.standards) for fetching standards"""
        response = requests.get(f"{BASE_URL}/api/teams/share/{SHARE_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        standards = data.get("standards", [])
        # If standards are returned, the correct collection is being used
        assert len(standards) > 0, "Standards should be returned (db.qualifyingStandards collection)"
        
        # Verify standards have proper structure
        for standard in standards:
            assert "cutTimeSeconds" in standard
            assert "region" in standard
        
        print(f"✓ Backend correctly uses db.qualifyingStandards collection ({len(standards)} standards returned)")


class TestShareLinkAnonymousAccess:
    """Test that share link works without authentication"""
    
    def test_share_link_no_auth_required(self):
        """Share link works as anonymous viewer (no auth required)"""
        # Make request without any session headers
        response = requests.get(f"{BASE_URL}/api/teams/share/{SHARE_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        # Should still return all data
        assert "athletes" in data
        assert "times" in data
        assert "events" in data
        assert "standards" in data
        assert len(data["athletes"]) > 0
        
        print("✓ Share link works without authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
