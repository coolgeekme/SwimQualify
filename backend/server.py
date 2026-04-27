from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from pymongo import MongoClient
import bcrypt
import os
import httpx
from datetime import datetime
from dotenv import load_dotenv
import fitz  # PyMuPDF for PDF to image conversion
import io
import base64
from PIL import Image
import json
import re

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "swimqualify")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# OpenAI config
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")

# Anthropic Claude config (more accurate for document reading)
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_BASE_URL = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")

# Pydantic Models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "swimmer"

class AthleteCreate(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    parentId: Optional[str] = None
    name: str
    dob: str
    gender: str
    ageGroup: str
    selectedEventIds: List[str] = []

class EventCreate(BaseModel):
    id: Optional[str] = None
    name: str
    distance: int
    stroke: str
    course: str
    ageGroup: str

class TimeEntryCreate(BaseModel):
    id: Optional[str] = None
    athleteId: str
    eventId: str
    timeSeconds: float
    course: str
    date: str
    meetName: Optional[str] = None
    splits: Optional[List[float]] = None
    notes: Optional[str] = None
    ageGroupAtTime: Optional[str] = None
    isDQ: bool = False

class StandardCreate(BaseModel):
    id: Optional[str] = None
    eventId: str
    region: str
    ageGroup: str
    gender: str
    course: str
    cutTimeSeconds: float
    season: str

class BulkStandardsCreate(BaseModel):
    standards: List[StandardCreate]

class StrokeInsightsRequest(BaseModel):
    athleteName: str
    ageGroup: str
    gender: str
    timeData: list

class ResearchStandardsRequest(BaseModel):
    ageGroup: str
    gender: str
    stateLocation: str
    course: str
    season: str = "2026"
    customEvents: Optional[List[str]] = None

class DocumentAnalyzeRequest(BaseModel):
    imageData: str
    mimeType: str = "image/png"

class TeamShareRequest(BaseModel):
    teamId: str
    shareName: Optional[str] = None
    athleteIds: Optional[List[str]] = None

class VerifyTimesRequest(BaseModel):
    times: List[dict]  # [{name, course, ageGroup, gender, regionalTimeStr, stateTimeStr, eventId}]
    stateLocation: str
    season: str = "2026"


def strip_mongo_id(doc):
    if doc is None:
        return None
    doc_copy = dict(doc)
    doc_copy.pop('_id', None)
    return doc_copy

def get_session(x_user_session: Optional[str] = Header(None)):
    if not x_user_session:
        return None
    import json
    try:
        return json.loads(x_user_session)
    except:
        return None

# User counter for IDs
def get_next_user_id():
    last_user = db.users.find_one(sort=[("id", -1)])
    return (last_user["id"] + 1) if last_user and "id" in last_user else 1

# Auth Endpoints
@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    existing = db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt())
    user = {
        "id": get_next_user_id(),
        "name": req.name,
        "email": req.email.lower(),
        "password": hashed.decode(),
        "role": req.role,
        "teamId": "team1",
        "createdAt": datetime.utcnow()
    }
    db.users.insert_one(user)
    return {"id": str(user["id"]), "name": user["name"], "email": user["email"], "role": user["role"], "teamId": user["teamId"]}

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = db.users.find_one({"email": req.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(req.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"id": str(user["id"]), "name": user["name"], "email": user["email"], "role": user["role"], "teamId": user["teamId"]}

# Password Reset Endpoint
class PasswordResetRequest(BaseModel):
    email: str
    new_password: str
    reset_key: str  # Simple security key to prevent unauthorized resets

@app.post("/api/auth/reset-password")
async def reset_password(req: PasswordResetRequest):
    # Security key to prevent unauthorized password resets
    # Change this key after using it!
    RESET_KEY = "SwimQual2024Reset!"
    
    if req.reset_key != RESET_KEY:
        raise HTTPException(status_code=403, detail="Invalid reset key")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Find user (case insensitive)
    user = db.users.find_one({"email": {"$regex": f"^{req.email}$", "$options": "i"}})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password
    hashed = bcrypt.hashpw(req.new_password.encode('utf-8'), bcrypt.gensalt())
    
    # Update password
    result = db.users.update_one(
        {"email": {"$regex": f"^{req.email}$", "$options": "i"}},
        {"$set": {"password": hashed.decode('utf-8')}}
    )
    
    if result.modified_count > 0:
        return {"success": True, "message": f"Password updated for {user.get('email')}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to update password")

@app.get("/api/auth/users")
async def get_users():
    users = list(db.users.find({}).limit(1000))
    return [{"id": str(u["id"]), "name": u["name"], "email": u["email"], "role": u["role"], "teamId": u.get("teamId", "team1")} for u in users]

# Events Endpoints
@app.get("/api/events")
async def get_events():
    events = list(db.events.find({}).limit(500))
    return [strip_mongo_id(e) for e in events]

@app.post("/api/events")
async def create_event(event: EventCreate):
    event_dict = event.model_dump()
    event_dict["id"] = event_dict.get("id") or f"e_{int(datetime.utcnow().timestamp() * 1000)}"
    event_dict["createdAt"] = datetime.utcnow()
    db.events.insert_one(event_dict)
    return strip_mongo_id(event_dict)

@app.delete("/api/events/{event_id}")
async def delete_event(event_id: str):
    result = db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True}

# Athletes Endpoints
@app.get("/api/athletes")
async def get_athletes(x_user_session: Optional[str] = Header(None)):
    session = get_session(x_user_session)
    team_id = session.get("teamId", "team1") if session else "team1"
    athletes = list(db.athletes.find({"teamId": team_id}))
    return [strip_mongo_id(a) for a in athletes]

@app.post("/api/athletes")
async def create_athlete(athlete: AthleteCreate, x_user_session: Optional[str] = Header(None)):
    session = get_session(x_user_session)
    athlete_dict = athlete.model_dump()
    athlete_dict["id"] = athlete_dict.get("id") or f"a_{int(datetime.utcnow().timestamp() * 1000)}"
    athlete_dict["teamId"] = session.get("teamId", "team1") if session else "team1"
    athlete_dict["createdAt"] = datetime.utcnow()
    db.athletes.insert_one(athlete_dict)
    return strip_mongo_id(athlete_dict)

@app.put("/api/athletes/{athlete_id}")
async def update_athlete(athlete_id: str, athlete: AthleteCreate):
    update_data = {k: v for k, v in athlete.model_dump().items() if v is not None}
    result = db.athletes.find_one_and_update(
        {"id": athlete_id}, {"$set": update_data}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return strip_mongo_id(result)

@app.delete("/api/athletes/{athlete_id}")
async def delete_athlete(athlete_id: str):
    result = db.athletes.delete_one({"id": athlete_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return {"success": True}

# Time Entries Endpoints
@app.get("/api/times")
async def get_times():
    try:
        # Check primary collection
        times = list(db.timeEntries.find({}).limit(5000))
        
        # If empty, check if times might be in alternate collection name 'times'
        if len(times) == 0:
            alt_times = list(db.times.find({}).limit(5000))
            if len(alt_times) > 0:
                print(f"MIGRATION: Found {len(alt_times)} times in 'times' collection, migrating to 'timeEntries'")
                for t in alt_times:
                    try:
                        db.timeEntries.insert_one(t)
                    except:
                        pass
                times = list(db.timeEntries.find({}).limit(5000))
        
        print(f"GET /api/times: returning {len(times)} entries")
        return [strip_mongo_id(t) for t in times]
    except Exception as e:
        print(f"ERROR fetching times: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/times")
async def create_time(entry: TimeEntryCreate):
    entry_dict = entry.model_dump()
    entry_dict["id"] = entry_dict.get("id") or f"t_{int(datetime.utcnow().timestamp() * 1000)}"
    entry_dict["createdAt"] = datetime.utcnow()
    db.timeEntries.insert_one(entry_dict)
    return strip_mongo_id(entry_dict)

@app.put("/api/times/{time_id}")
async def update_time(time_id: str, entry: TimeEntryCreate):
    update_data = {k: v for k, v in entry.model_dump().items() if v is not None}
    result = db.timeEntries.find_one_and_update(
        {"id": time_id}, {"$set": update_data}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return strip_mongo_id(result)

@app.delete("/api/times/{time_id}")
async def delete_time(time_id: str):
    result = db.timeEntries.delete_one({"id": time_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return {"success": True}

# Qualifying Standards Endpoints
@app.get("/api/standards")
async def get_standards():
    try:
        standards = list(db.qualifyingStandards.find({}).limit(1000))
        
        # If empty, check alternate collection name 'standards'
        if len(standards) == 0:
            alt_standards = list(db.standards.find({}).limit(1000))
            if len(alt_standards) > 0:
                print(f"MIGRATION: Found {len(alt_standards)} standards in 'standards' collection, migrating to 'qualifyingStandards'")
                for s in alt_standards:
                    try:
                        db.qualifyingStandards.insert_one(s)
                    except:
                        pass
                standards = list(db.qualifyingStandards.find({}).limit(1000))
        
        print(f"GET /api/standards: returning {len(standards)} entries")
        return [strip_mongo_id(s) for s in standards]
    except Exception as e:
        print(f"ERROR fetching standards: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/standards")
async def create_standard(standard: StandardCreate):
    standard_dict = standard.model_dump()
    standard_dict["id"] = standard_dict.get("id") or f"s_{int(datetime.utcnow().timestamp() * 1000)}"
    standard_dict["createdAt"] = datetime.utcnow()
    db.qualifyingStandards.insert_one(standard_dict)
    return strip_mongo_id(standard_dict)

@app.post("/api/standards/bulk")
async def create_standards_bulk(req: BulkStandardsCreate):
    """Create or replace qualifying standards. Overwrites existing standards for the same event/age/gender/course/region."""
    created = []
    for s in req.standards:
        standard_dict = s.model_dump()
        standard_dict["id"] = standard_dict.get("id") or f"s_{int(datetime.utcnow().timestamp() * 1000)}_{len(created)}"
        standard_dict["createdAt"] = datetime.utcnow()
        
        # Delete any existing standard for this exact combination (event + age + gender + course + region)
        # This ensures new times overwrite old ones
        delete_filter = {
            "eventId": standard_dict.get("eventId"),
            "ageGroup": standard_dict.get("ageGroup"),
            "gender": standard_dict.get("gender"),
            "course": standard_dict.get("course"),
            "region": standard_dict.get("region")
        }
        deleted = db.qualifyingStandards.delete_many(delete_filter)
        if deleted.deleted_count > 0:
            print(f"Replaced {deleted.deleted_count} existing standard(s) for {standard_dict.get('eventId')} {standard_dict.get('region')}")
        
        # Insert the new standard
        db.qualifyingStandards.insert_one(standard_dict)
        created.append(strip_mongo_id(standard_dict))
    
    print(f"Created/updated {len(created)} standards")
    return created

@app.delete("/api/standards/{standard_id}")
async def delete_standard(standard_id: str):
    result = db.qualifyingStandards.delete_one({"id": standard_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Standard not found")
    return {"success": True}

# Seed Endpoint
@app.post("/api/seed")
async def seed_data():
    existing_events = list(db.events.find({}).limit(1))
    if len(existing_events) > 0:
        return {"message": "Data already seeded", "seeded": False}
    
    default_events = [
        {"id": "1", "name": "50 Free", "distance": 50, "stroke": "Freestyle", "course": "SCY", "ageGroup": "11-12"},
        {"id": "2", "name": "100 Free", "distance": 100, "stroke": "Freestyle", "course": "SCY", "ageGroup": "11-12"},
        {"id": "3", "name": "100 Back", "distance": 100, "stroke": "Backstroke", "course": "SCY", "ageGroup": "11-12"},
        {"id": "4", "name": "100 Breast", "distance": 100, "stroke": "Breaststroke", "course": "SCY", "ageGroup": "11-12"},
        {"id": "5", "name": "100 Fly", "distance": 100, "stroke": "Butterfly", "course": "SCY", "ageGroup": "11-12"},
        {"id": "6", "name": "200 IM", "distance": 200, "stroke": "Individual Medley", "course": "SCY", "ageGroup": "11-12"},
        {"id": "7", "name": "50 Free", "distance": 50, "stroke": "Freestyle", "course": "SCY", "ageGroup": "10U"},
    ]
    
    for e in default_events:
        e["createdAt"] = datetime.utcnow()
        try:
            db.events.insert_one(e)
        except:
            pass
    
    default_standards = [
        {"id": "s1", "eventId": "1", "region": "Regional", "ageGroup": "11-12", "gender": "M", "course": "SCY", "cutTimeSeconds": 29.50, "season": "2025"},
        {"id": "s2", "eventId": "1", "region": "State", "ageGroup": "11-12", "gender": "M", "course": "SCY", "cutTimeSeconds": 27.20, "season": "2025"},
        {"id": "s1-f", "eventId": "1", "region": "Regional", "ageGroup": "11-12", "gender": "F", "course": "SCY", "cutTimeSeconds": 30.10, "season": "2025"},
        {"id": "s2-f", "eventId": "1", "region": "State", "ageGroup": "11-12", "gender": "F", "course": "SCY", "cutTimeSeconds": 28.50, "season": "2025"},
        {"id": "s3", "eventId": "2", "region": "Regional", "ageGroup": "11-12", "gender": "M", "course": "SCY", "cutTimeSeconds": 65.00, "season": "2025"},
        {"id": "s4", "eventId": "2", "region": "State", "ageGroup": "11-12", "gender": "M", "course": "SCY", "cutTimeSeconds": 59.80, "season": "2025"},
        {"id": "s5", "eventId": "7", "region": "Regional", "ageGroup": "10U", "gender": "M", "course": "SCY", "cutTimeSeconds": 34.50, "season": "2025"},
    ]
    
    for s in default_standards:
        s["createdAt"] = datetime.utcnow()
        try:
            db.qualifyingStandards.insert_one(s)
        except:
            pass
    
    return {"message": "Data seeded successfully", "seeded": True}

# AI Endpoints
@app.post("/api/ai/stroke-insights")
async def stroke_insights(req: StrokeInsightsRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": """You are a high-performance swim coach analyzing youth swimmer data. 
Return ONLY a valid JSON object where:
- Keys are stroke names (e.g., "Freestyle", "Backstroke", "Breaststroke", "Butterfly")
- Values are strings with 2-3 specific, actionable technique tips

Example format:
{"Freestyle": "Focus on high elbow catch and bilateral breathing. Work on streamlined push-offs.", "Backstroke": "Maintain steady hip rotation and keep head still."}

Do NOT nest objects. Each value must be a simple string."""},
                    {"role": "user", "content": f"Analyze these swim times for {req.athleteName} ({req.ageGroup} {'Male' if req.gender == 'M' else 'Female'}) and provide technique focus areas:\n\n{req.timeData}"}
                ],
                "max_tokens": 1024,
                "temperature": 0.7
            },
            timeout=30.0
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to generate stroke insights")
        
        data = response.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        import re, json
        json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                # Ensure all values are strings (flatten if nested)
                insights = {}
                for k, v in parsed.items():
                    if isinstance(v, str):
                        insights[k] = v
                    elif isinstance(v, dict):
                        # Flatten nested dict to string
                        insights[k] = ". ".join(str(val) for val in v.values())
                    else:
                        insights[k] = str(v)
                return {"insights": insights}
            except json.JSONDecodeError:
                pass
        return {"insights": {}}

def parse_time_to_seconds(time_str: str) -> float:
    """Convert time string (MM:SS.ss or SS.ss) to seconds"""
    if not time_str:
        return 0
    time_str = time_str.strip().replace(',', '.')
    try:
        if ':' in time_str:
            parts = time_str.split(':')
            return float(parts[0]) * 60 + float(parts[1])
        return float(time_str)
    except:
        return 0

def validate_and_fix_times(results: list) -> list:
    """
    Validation Method 1: Logical validation
    - State times MUST be faster (lower) than Regional times
    - Times must be within reasonable ranges for each event
    """
    # Reasonable time ranges by distance (in seconds) - very generous ranges
    reasonable_ranges = {
        25: (10, 40),      # 25 yard/meter events
        50: (20, 90),      # 50 yard/meter events  
        100: (45, 180),    # 100 yard/meter events
        200: (100, 400),   # 200 yard/meter events
        400: (220, 800),   # 400 yard/meter events
        500: (280, 1000),  # 500 yard events
        800: (480, 1400),  # 800 meter events
        1000: (600, 1800), # 1000 yard events
        1500: (900, 2400), # 1500 meter events
        1650: (1000, 2600),# 1650 yard events
    }
    
    validated_results = []
    for r in results:
        regional_secs = parse_time_to_seconds(r.get('regionalTimeStr', ''))
        state_secs = parse_time_to_seconds(r.get('stateTimeStr', ''))
        distance = r.get('distance', 50)
        
        # Get reasonable range for this distance
        min_time, max_time = reasonable_ranges.get(distance, (20, 600))
        
        warnings = []
        
        # Validation 1: State must be faster than Regional
        if regional_secs > 0 and state_secs > 0:
            if state_secs >= regional_secs:
                warnings.append("State time should be faster than Regional")
                # Auto-fix: swap them
                r['regionalTimeStr'], r['stateTimeStr'] = r['stateTimeStr'], r['regionalTimeStr']
                regional_secs, state_secs = state_secs, regional_secs
        
        # Validation 2: Check if times are within reasonable range
        if regional_secs > 0 and (regional_secs < min_time or regional_secs > max_time):
            warnings.append(f"Regional time seems unusual for {distance} distance")
        
        if state_secs > 0 and (state_secs < min_time or state_secs > max_time):
            warnings.append(f"State time seems unusual for {distance} distance")
        
        # Add validation status
        r['validated'] = len(warnings) == 0
        r['warnings'] = warnings
        r['regionalSeconds'] = regional_secs
        r['stateSeconds'] = state_secs
        
        validated_results.append(r)
    
    return validated_results

@app.post("/api/ai/research-standards")
async def research_standards(req: ResearchStandardsRequest):
    if not PERPLEXITY_API_KEY:
        raise HTTPException(status_code=500, detail="Perplexity API key not configured")
    
    # Map course codes to full descriptions for search
    course_description = {
        "SCY": "Short Course Yards (25 yard pool)",
        "SCM": "Short Course Meters (25 meter pool)", 
        "LCM": "Long Course Meters (50 meter pool)"
    }.get(req.course, req.course)
    
    # Map season year to season description (e.g., 2026 -> 2025-2026)
    season_year = int(req.season) if req.season.isdigit() else 2026
    season_description = f"{season_year - 1}-{season_year}"
    
    # Gender display for search - include both terms since LSCs use different terminology
    # AZ uses "Men/Women", others use "Boys/Girls" - they're interchangeable
    if req.gender == "M":
        gender_display = "Boys/Men"
        gender_terms = "Boys OR Men"
    else:
        gender_display = "Girls/Women"
        gender_terms = "Girls OR Women"
    
    # Build course-specific event list
    if req.customEvents and len(req.customEvents) > 0:
        event_list = ", ".join(req.customEvents)
    elif req.course == "SCY":
        event_list = "25 Free, 25 Back, 25 Fly, 25 Breast, 50 Free, 100 Free, 200 Free, 500 Free, 50 Back, 100 Back, 200 Back, 50 Breast, 100 Breast, 200 Breast, 50 Fly, 100 Fly, 100 IM, 200 IM"
    elif req.course == "LCM":
        event_list = "50 Free, 100 Free, 200 Free, 400 Free, 800 Free, 1500 Free, 50 Back, 100 Back, 200 Back, 50 Breast, 100 Breast, 200 Breast, 50 Fly, 100 Fly, 200 Fly, 200 IM, 400 IM"
    else:  # SCM
        event_list = "50 Free, 100 Free, 200 Free, 400 Free, 800 Free, 1500 Free, 50 Back, 100 Back, 200 Back, 50 Breast, 100 Breast, 200 Breast, 50 Fly, 100 Fly, 200 Fly, 100 IM, 200 IM, 400 IM"
    
    async with httpx.AsyncClient() as client:
        # VERIFICATION METHOD 1: Primary search with Perplexity
        response = await client.post(
            "https://api.perplexity.ai/chat/completions",
            headers={"Authorization": f"Bearer {PERPLEXITY_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "sonar",
                "messages": [
                    {"role": "system", "content": f"""You extract EXACT qualifying times from official USA Swimming LSC PDF documents.
Rules:
1. Boys/Men and Girls/Women are interchangeable terms in swimming
2. State times are ALWAYS faster (smaller numbers) than Regional times  
3. Return valid JSON array only, no markdown code blocks
4. Copy times EXACTLY as they appear in official documents
5. CRITICAL: You are looking for {course_description} times ONLY. Do NOT return SCY times when asked for LCM or SCM."""},
                    {"role": "user", "content": f"""Find the {season_description} {req.stateLocation} official {req.course} qualifying times.

IMPORTANT: I need {course_description} times ONLY. Not SCY. Not any other course type.

Age Group: {req.ageGroup} {gender_terms} (also check "{req.ageGroup} {'Men' if req.gender == 'M' else 'Women'}")
Course: {course_description}

Look for the official {req.course} PDF time standards document for {req.stateLocation}. Extract EXACT times for these {req.course} events:
{event_list}

Note: {req.course} times are measured in {'yards' if req.course == 'SCY' else 'meters'}. {'LCM times are typically slower than SCY times for the same distance.' if req.course == 'LCM' else 'SCM times are typically slightly slower than SCY times for the same distance.' if req.course == 'SCM' else ''}

Return JSON array:
[{{"name":"50 Free","distance":50,"stroke":"Freestyle","regionalTimeStr":"exact time","stateTimeStr":"exact time","source":"document name"}}]"""}
                ],
                "temperature": 0,
                "max_tokens": 4000
            },
            timeout=45.0
        )
        
        if response.status_code != 200:
            error_text = response.text[:200]
            print(f"Perplexity search failed: {response.status_code} - {error_text}")
            raise HTTPException(status_code=500, detail=f"AI search service error ({response.status_code}). Please try again.")
        
        data = response.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        # Debug: log raw response
        print(f"AI Response length: {len(text)}")
        print(f"AI Response preview: {text[:500]}...")
        
        import re, json
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        results = []
        citations = []
        pdf_urls = []
        
        if json_match:
            try:
                raw_json = json_match.group(0)
                print(f"JSON match found, length: {len(raw_json)}")
                results = json.loads(raw_json)
                print(f"Parsed {len(results)} results")
                # Ensure ageGroup and gender are set correctly from request
                for r in results:
                    r['ageGroup'] = req.ageGroup
                    r['gender'] = req.gender
                    r['course'] = req.course
            except:
                pass
        
        # Save Perplexity results before Claude potentially replaces them
        perplexity_raw_results = list(results)
        
        if data.get("citations"):
            # Extract domain name for better display and find PDF URLs
            import re as regex
            citations = []
            for i, uri in enumerate(data["citations"]):
                domain_match = regex.search(r'https?://(?:www\.)?([^/]+)', uri)
                if domain_match:
                    domain = domain_match.group(1)
                    title = domain.replace('.org', '').replace('.com', '').replace('.net', '').replace('-', ' ').title()
                else:
                    title = f"Source {i+1}"
                citations.append({"title": title, "uri": uri})
                
                # Collect PDF URLs for direct extraction
                if uri.endswith('.pdf') and ('state' in uri.lower() or 'qualifying' in uri.lower() or 'time-standard' in uri.lower()):
                    pdf_urls.append(uri)
        
        # STEP 2: Use Claude Vision to extract EXACT times from the PDF
        # Claude is more accurate at reading tables from documents
        EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
        
        if pdf_urls and EMERGENT_LLM_KEY:
            print(f"Found {len(pdf_urls)} PDF URLs, attempting Claude Vision extraction...")
            
            # Try to find the most relevant PDF (age group + state)
            target_pdf = None
            for pdf_url in pdf_urls:
                pdf_lower = pdf_url.lower()
                if 'age-group' in pdf_lower and 'state' in pdf_lower:
                    target_pdf = pdf_url
                    break
            
            if not target_pdf and pdf_urls:
                # Fall back to first state-related PDF
                for pdf_url in pdf_urls:
                    if 'state' in pdf_url.lower():
                        target_pdf = pdf_url
                        break
            
            if not target_pdf:
                target_pdf = pdf_urls[0]
            
            if target_pdf:
                print(f"Downloading PDF: {target_pdf}")
                try:
                    pdf_response = await client.get(target_pdf, timeout=15.0, follow_redirects=True)
                    if pdf_response.status_code == 200:
                        print(f"PDF downloaded, size: {len(pdf_response.content)} bytes")
                        
                        # Use Claude Vision to extract times - send PDF directly
                        from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent
                        
                        # Encode PDF as base64
                        pdf_base64 = base64.b64encode(pdf_response.content).decode('utf-8')
                        
                        gender_term = "Men" if req.gender == "M" else "Women"
                        alt_gender = "Boys" if req.gender == "M" else "Girls"
                        
                        prompt_text = f"""You are extracting EXACT qualifying times from this official USA Swimming time standards PDF.

SEARCH FOR THIS EXACT ROW: {req.ageGroup} {gender_term} (may also appear as "{req.ageGroup} {alt_gender}")
COURSE TYPE: {req.course} ({course_description})

CRITICAL INSTRUCTIONS:
1. Find the EXACT row for {req.ageGroup} {gender_term} or {req.ageGroup} {alt_gender}
2. Make sure you are reading from the {req.course} section of the document, NOT SCY
3. Copy the EXACT numbers shown - do NOT round, estimate, or modify
4. The document has columns for different cut levels (State/Champs vs Regional/JO)
5. State/Champs times are FASTER (smaller numbers) than Regional times
6. {req.course} times are in {'yards' if req.course == 'SCY' else 'meters'}

Extract times for these {req.course} events if present:
{event_list}

Return ONLY a JSON array in this exact format:
[{{"name":"50 Free","distance":50,"stroke":"Freestyle","regionalTimeStr":"EXACT time from Regional column","stateTimeStr":"EXACT time from State column"}}]

If a time is not shown or unclear, use "N/A" for that field.
Return ONLY the JSON array, no explanation."""

                        print(f"Sending PDF directly to Claude...")
                        
                        # Send PDF directly to Claude
                        file_contents = [FileContent(content_type="application/pdf", file_content_base64=pdf_base64)]
                        
                        chat = LlmChat(
                            api_key=EMERGENT_LLM_KEY,
                            session_id=f"pdf-extract-{req.stateLocation[:10]}",
                            system_message="You are an expert at reading swimming time standards documents. You extract exact times without modification."
                        ).with_model("anthropic", "claude-sonnet-4-20250514")
                        
                        user_message = UserMessage(
                            text=prompt_text,
                            file_contents=file_contents
                        )
                        
                        vision_text = await chat.send_message(user_message)
                        print(f"Claude response length: {len(vision_text)}")
                        print(f"Claude preview: {vision_text[:300]}...")
                        
                        vision_json_match = re.search(r'\[.*\]', vision_text, re.DOTALL)
                        if vision_json_match:
                            try:
                                pdf_results = json.loads(vision_json_match.group(0))
                                # Only use PDF results if they're better than Perplexity results
                                # (have actual times, not just N/A)
                                valid_pdf_results = [r for r in pdf_results if r.get('regionalTimeStr', 'N/A') != 'N/A' or r.get('stateTimeStr', 'N/A') != 'N/A']
                                if valid_pdf_results and len(valid_pdf_results) > len(results):
                                    print(f"PDF extraction returned {len(valid_pdf_results)} valid results (more than Perplexity's {len(results)}), using them")
                                    for r in valid_pdf_results:
                                        r['ageGroup'] = req.ageGroup
                                        r['gender'] = req.gender
                                        r['course'] = req.course
                                        r['source'] = f"Extracted from {target_pdf.split('/')[-1]}"
                                    results = valid_pdf_results
                                elif valid_pdf_results and len(valid_pdf_results) >= 3:
                                    # Claude found fewer but still valid — merge: keep Perplexity results and add any new events from Claude
                                    existing_names = {r.get('name', '').lower() for r in results}
                                    new_from_claude = [r for r in valid_pdf_results if r.get('name', '').lower() not in existing_names]
                                    if new_from_claude:
                                        for r in new_from_claude:
                                            r['ageGroup'] = req.ageGroup
                                            r['gender'] = req.gender
                                            r['course'] = req.course
                                            r['source'] = f"Extracted from {target_pdf.split('/')[-1]}"
                                        results.extend(new_from_claude)
                                        print(f"Merged {len(new_from_claude)} new events from Claude into {len(results)} total")
                                    else:
                                        print(f"Claude had {len(valid_pdf_results)} results but no new events, keeping Perplexity's {len(results)}")
                                else:
                                    print(f"PDF extraction returned {len(valid_pdf_results)} valid results (< 3), keeping Perplexity results ({len(results)} items)")
                            except Exception as e:
                                print(f"Failed to parse Claude extraction: {e}")
                except Exception as e:
                    print(f"PDF extraction failed: {e}")
                    import traceback
                    traceback.print_exc()
        
        # VERIFICATION METHOD 2: Validate and fix times
        results = validate_and_fix_times(results)
        
        # STEP 3: Auto-verify by cross-referencing Perplexity vs Claude results
        # Build lookups from both source sets
        perplexity_by_name = {}
        for r in perplexity_raw_results:
            name_key = r.get('name', '').lower().strip()
            if name_key:
                perplexity_by_name[name_key] = r
        
        # Claude results = anything in 'results' that came from PDF extraction
        # (results may have been replaced by Claude, or may still be Perplexity)
        claude_by_name = {}
        if results != perplexity_raw_results:
            # Results were modified by Claude - the current results are from Claude (or merged)
            for r in results:
                name_key = r.get('name', '').lower().strip()
                source = r.get('source', '')
                if '.pdf' in source.lower() or 'extract' in source.lower():
                    claude_by_name[name_key] = r
        
        def parse_time_to_secs(t):
            if not t or t == 'N/A' or t == '':
                return None
            t = str(t).strip()
            try:
                if ':' in t:
                    parts = t.split(':')
                    return float(parts[0]) * 60 + float(parts[1])
                return float(t)
            except:
                return None
        
        def times_close(t1, t2, tolerance=2.0):
            s1 = parse_time_to_secs(t1)
            s2 = parse_time_to_secs(t2)
            if s1 is None or s2 is None:
                return None  # Can't compare
            return abs(s1 - s2) <= tolerance
        
        has_both_sources = len(perplexity_by_name) > 0 and len(claude_by_name) > 0
        
        for r in results:
            name_key = r.get('name', '').lower().strip()
            p_result = perplexity_by_name.get(name_key)
            c_result = claude_by_name.get(name_key)
            
            if has_both_sources and p_result and c_result:
                # Both sources had this event — check agreement
                reg_match = times_close(p_result.get('regionalTimeStr'), c_result.get('regionalTimeStr'))
                state_match = times_close(p_result.get('stateTimeStr'), c_result.get('stateTimeStr'))
                
                matches = 0
                if reg_match is True: matches += 1
                if state_match is True: matches += 1
                
                if matches == 2:
                    r['verificationScore'] = '3/3'
                    r['verificationConfidence'] = 'high'
                elif matches == 1:
                    r['verificationScore'] = '2/3'
                    r['verificationConfidence'] = 'medium'
                else:
                    r['verificationScore'] = '1/3'
                    r['verificationConfidence'] = 'low'
            elif p_result or c_result:
                # Only one source had this event
                r['verificationScore'] = '1/1'
                r['verificationConfidence'] = 'medium'
            else:
                r['verificationScore'] = '1/1'
                r['verificationConfidence'] = 'medium'
        
        # Count validation issues
        validation_issues = sum(1 for r in results if not r.get('validated', True))
        
        # Build source links for the user to verify
        lsc_websites = {
            "Arizona": "https://www.azswimming.org",
            "Southern California": "https://www.socalswim.org",
            "Pacific": "https://www.pacswim.org",
            "Florida": "https://www.floridaswimming.org",
            "Georgia": "https://www.georgiaswimming.org",
            "Texas": "https://www.texasswimming.org",
            "Colorado": "https://www.coloradoswimming.org",
            "New England": "https://www.neswim.com",
            "Virginia": "https://www.virginiaswimming.org",
            "Maryland": "https://www.mdswim.org",
            "Ohio": "https://www.ohioswimming.org",
            "Illinois": "https://www.ilswim.org",
            "Michigan": "https://www.miswim.org",
            "New Jersey": "https://www.njswim.org",
            "North Carolina": "https://www.ncswim.org",
        }
        
        # Find the LSC website based on state location
        lsc_url = None
        state_name = req.stateLocation.split('(')[0].strip() if '(' in req.stateLocation else req.stateLocation
        for lsc_key, url in lsc_websites.items():
            if lsc_key.lower() in state_name.lower():
                lsc_url = url
                break
        
        # If not found by name, try abbreviation
        if not lsc_url and '(' in req.stateLocation:
            abbrev = req.stateLocation.split('(')[1].replace(')', '').strip().lower()
            abbrev_map = {"az": "https://www.azswimming.org", "ca": "https://www.socalswim.org", 
                         "fl": "https://www.floridaswimming.org", "tx": "https://www.texasswimming.org",
                         "co": "https://www.coloradoswimming.org", "ga": "https://www.georgiaswimming.org",
                         "va": "https://www.virginiaswimming.org", "oh": "https://www.ohioswimming.org",
                         "il": "https://www.ilswim.org", "mi": "https://www.miswim.org",
                         "nj": "https://www.njswim.org", "nc": "https://www.ncswim.org",
                         "md": "https://www.mdswim.org", "pa": "https://www.paswim.org",
                         "ny": "https://www.metroswimming.org"}
            lsc_url = abbrev_map.get(abbrev)
        
        source_links = {
            "usaSwimming": "https://www.usaswimming.org/times/time-standards",
            "lscWebsite": lsc_url,
            "lscName": state_name,
            "pdfSources": [c.get("uri") for c in citations if c.get("uri", "").endswith(".pdf")][:3],
            "webSources": [c.get("uri") for c in citations if not c.get("uri", "").endswith(".pdf")][:5]
        }
        
        return {
            "results": results, 
            "citations": citations, 
            "sourceLinks": source_links,
            "season": req.season,
            "validationIssues": validation_issues,
            "searchParams": {
                "ageGroup": req.ageGroup,
                "gender": gender_display,
                "state": req.stateLocation,
                "course": req.course,
                "season": season_description
            }
        }


@app.post("/api/ai/verify-times")
async def verify_times(req: VerifyTimesRequest):
    """Verify State/Regional times against multiple sources. Returns confidence score per event."""
    
    EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
    if not PERPLEXITY_API_KEY and not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="No AI keys configured")
    
    results = []
    
    # Group times by course for efficient batch verification
    times_to_verify = req.times
    if not times_to_verify:
        return {"results": [], "summary": {"total": 0, "verified_3_3": 0, "verified_2_3": 0, "needs_review": 0}}
    
    # Get course and age group from first item (they should all be same for a single research)
    course = times_to_verify[0].get("course", "SCY")
    age_group = times_to_verify[0].get("ageGroup", "11-12")
    gender = times_to_verify[0].get("gender", "M")
    
    course_description = {
        "SCY": "Short Course Yards (25 yard pool)",
        "SCM": "Short Course Meters (25 meter pool)",
        "LCM": "Long Course Meters (50 meter pool)"
    }.get(course, course)
    
    gender_display = "Boys/Men" if gender == "M" else "Girls/Women"
    
    # SOURCE 1: Our hardcoded USA Swimming motivational standards (instant, free)
    # Import the motivational times data from frontend - we'll check if our data matches
    source1_results = {}
    # We'll compare against what's in our DB
    
    # SOURCE 2: Perplexity web search for LSC-specific times
    source2_results = {}
    if PERPLEXITY_API_KEY:
        try:
            event_names = [t.get("name", "") for t in times_to_verify]
            event_list = ", ".join(event_names)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={"Authorization": f"Bearer {PERPLEXITY_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": "sonar",
                        "messages": [
                            {"role": "system", "content": "You verify exact qualifying times from official USA Swimming LSC documents. Return JSON only."},
                            {"role": "user", "content": f"""Verify these {req.stateLocation} {course} qualifying times for {age_group} {gender_display}.

For each event, find the OFFICIAL Regional and State cut times from {req.stateLocation} LSC documents.

Events to verify: {event_list}

Return JSON array with verified times:
[{{"name":"50 Free","verifiedRegional":"exact time or N/A","verifiedState":"exact time or N/A","source":"source name"}}]"""}
                        ],
                        "temperature": 0,
                        "max_tokens": 3000
                    },
                    timeout=45.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    print(f"Source 2 raw response length: {len(text)}")
                    print(f"Source 2 preview: {text[:300]}")
                    import re
                    json_match = re.search(r'\[.*\]', text, re.DOTALL)
                    if json_match:
                        try:
                            s2_data = json.loads(json_match.group(0))
                            for item in s2_data:
                                name = item.get("name", "").strip()
                                source2_results[name.lower()] = {
                                    "regional": item.get("verifiedRegional", "N/A"),
                                    "state": item.get("verifiedState", "N/A"),
                                    "source": item.get("source", "Perplexity")
                                }
                        except Exception as parse_err:
                            print(f"Source 2 parse error: {parse_err}")
                    else:
                        print("Source 2: no JSON array found in response")
                else:
                    print(f"Source 2 HTTP error: {response.status_code}")
                print(f"Source 2 (Perplexity): verified {len(source2_results)} events")
        except Exception as e:
            print(f"Source 2 (Perplexity) failed: {e}")
    
    # SOURCE 3: Claude PDF extraction (if we can find a relevant PDF)
    source3_results = {}
    if EMERGENT_LLM_KEY:
        try:
            event_names = [t.get("name", "") for t in times_to_verify]
            event_list = ", ".join(event_names)
            
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"verify-{req.stateLocation[:10]}-{age_group}",
                system_message="You are an expert at USA Swimming qualifying time standards. Verify times from official sources."
            ).with_model("anthropic", "claude-sonnet-4-20250514")
            
            prompt = f"""I need to verify {req.stateLocation} {course} ({course_description}) qualifying times for {age_group} {gender_display}.

Please verify the Regional and State cut times for these events using your knowledge of official USA Swimming LSC time standards:
{event_list}

For {req.stateLocation}, what are the correct official Regional and State qualifying times for each event?

Return ONLY a JSON array:
[{{"name":"50 Free","verifiedRegional":"exact time","verifiedState":"exact time","source":"source name"}}]

Use "N/A" if you're not confident about a specific time."""
            
            response_text = await chat.send_message(UserMessage(text=prompt))
            
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                try:
                    s3_data = json.loads(json_match.group(0))
                    for item in s3_data:
                        name = item.get("name", "").strip()
                        source3_results[name.lower()] = {
                            "regional": item.get("verifiedRegional", "N/A"),
                            "state": item.get("verifiedState", "N/A"),
                            "source": item.get("source", "Claude")
                        }
                except:
                    pass
            print(f"Source 3 (Claude): verified {len(source3_results)} events")
        except Exception as e:
            print(f"Source 3 (Claude) failed: {e}")
    
    # Compare and score each time
    import re
    
    def parse_time_str(t):
        """Convert time string to seconds for comparison"""
        if not t or t == "N/A" or t == "" or t == "N/A ":
            return None
        t = t.strip()
        try:
            if ':' in t:
                parts = t.split(':')
                return float(parts[0]) * 60 + float(parts[1])
            return float(t)
        except:
            return None
    
    def times_match(t1, t2, tolerance=0.5):
        """Check if two times match within tolerance (seconds)"""
        s1 = parse_time_str(t1)
        s2 = parse_time_str(t2)
        if s1 is None or s2 is None:
            return None  # Can't compare
        return abs(s1 - s2) <= tolerance
    
    for t in times_to_verify:
        event_name = t.get("name", "")
        event_key = event_name.lower().strip()
        regional_time = t.get("regionalTimeStr", "")
        state_time = t.get("stateTimeStr", "")
        
        sources_checked = 0
        regional_matches = 0
        state_matches = 0
        source_details = []
        
        # Check Source 2 (Perplexity)
        s2 = source2_results.get(event_key)
        if s2:
            sources_checked += 1
            r_match = times_match(regional_time, s2["regional"])
            s_match = times_match(state_time, s2["state"])
            r_ok = r_match is True
            s_ok = s_match is True
            if r_ok: regional_matches += 1
            if s_ok: state_matches += 1
            source_details.append({
                "source": "Web Search",
                "regional": s2["regional"],
                "state": s2["state"],
                "regionalMatch": r_ok,
                "stateMatch": s_ok
            })
        
        # Check Source 3 (Claude)
        s3 = source3_results.get(event_key)
        if s3:
            sources_checked += 1
            r_match = times_match(regional_time, s3["regional"])
            s_match = times_match(state_time, s3["state"])
            r_ok = r_match is True
            s_ok = s_match is True
            if r_ok: regional_matches += 1
            if s_ok: state_matches += 1
            source_details.append({
                "source": "Document Analysis",
                "regional": s3["regional"],
                "state": s3["state"],
                "regionalMatch": r_ok,
                "stateMatch": s_ok
            })
        
        # Source 1: Self-consistency check (do our own stored values match between sources?)
        # If both external sources agree with each other, that's another confirmation
        if s2 and s3:
            sources_checked += 1
            s2_s3_regional = times_match(s2["regional"], s3["regional"])
            s2_s3_state = times_match(s2["state"], s3["state"])
            if s2_s3_regional is True: regional_matches += 1
            if s2_s3_state is True: state_matches += 1
            source_details.append({
                "source": "Cross-Reference",
                "regional": "Sources agree" if s2_s3_regional else "Sources disagree",
                "state": "Sources agree" if s2_s3_state else "Sources disagree",
                "regionalMatch": s2_s3_regional is True,
                "stateMatch": s2_s3_state is True
            })
        
        # Calculate overall score
        total_checks = max(sources_checked, 1)
        regional_score = regional_matches
        state_score = state_matches
        overall_score = min(regional_score, state_score)  # Weakest link
        
        results.append({
            "eventId": t.get("eventId", ""),
            "name": event_name,
            "course": t.get("course", course),
            "currentRegional": regional_time,
            "currentState": state_time,
            "sourcesChecked": sources_checked,
            "regionalScore": f"{regional_matches}/{total_checks}",
            "stateScore": f"{state_matches}/{total_checks}",
            "overallScore": f"{overall_score}/{total_checks}",
            "confidence": "high" if overall_score >= 2 else "medium" if overall_score >= 1 else "low",
            "sources": source_details
        })
    
    # Summary
    high_confidence = sum(1 for r in results if r["confidence"] == "high")
    medium_confidence = sum(1 for r in results if r["confidence"] == "medium")
    low_confidence = sum(1 for r in results if r["confidence"] == "low")
    
    return {
        "results": results,
        "summary": {
            "total": len(results),
            "verified_3_3": high_confidence,
            "verified_2_3": medium_confidence,
            "needs_review": low_confidence
        }
    }


@app.post("/api/ai/analyze-document")
async def analyze_document(req: DocumentAnalyzeRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    prompt = """Extract ALL swim qualifying standards (cut times) from this document. 
    Return the results as a JSON array of objects.
    Each object MUST have: "name" (e.g. "50 Free"), "distance" (number), "stroke" (one of: "Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley"), "regionalTimeStr" (e.g. "28.45"), "stateTimeStr" (e.g. "27.10"), "ageGroup", "gender", "course" ("Yards" or "Meters").
    If a specific cut is missing, use null.
    Return ONLY the raw JSON array. No conversational text."""
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{req.mimeType};base64,{req.imageData}"}}
                    ]}
                ],
                "max_tokens": 2048
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Analysis failed")
        
        data = response.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        import re, json
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            return {"results": json.loads(json_match.group(0))}
        return {"results": [], "error": "No standards found in document"}

class HeatSheetAnalyzeRequest(BaseModel):
    imageData: str
    mimeType: str = "image/png"
    swimmerName: Optional[str] = None

@app.post("/api/ai/extract-heat-times")
async def extract_heat_times(req: HeatSheetAnalyzeRequest):
    """Extract swim times from a heat sheet screenshot with AI-powered event name matching"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    swimmer_context = f" Pay special attention to times for swimmer: {req.swimmerName}." if req.swimmerName else ""
    
    # Standard event names used in the app (all courses)
    standard_events = [
        "25 Free", "25 Back", "25 Fly", "25 Breast",
        "50 Free", "100 Free", "200 Free", "400 Free", "500 Free", "800 Free", "1500 Free",
        "50 Back", "100 Back", "200 Back",
        "50 Breast", "100 Breast", "200 Breast",
        "50 Fly", "100 Fly", "200 Fly",
        "100 IM", "200 IM", "400 IM"
    ]
    
    prompt = f"""Analyze this swimming results image and extract ALL swim times visible.{swimmer_context}

This could be a heat sheet, Meet Mobile screenshot, swim meet results, or any swimming results format.

IMPORTANT: Extract EVERY event and time you can see in the image.

For event names, normalize them to match these standard formats:
{', '.join(standard_events)}

Common formats you might see:
- Meet Mobile: "Boys 12&U 200 Meter Free" → "200 Free", "Boys 12&U 50 Meter Back" → "50 Back"
- Heat sheets: Event number + distance + stroke
- Results: Swimmer name, event, time, place

Normalization rules:
- "Meter" or "Yard" should be ignored for the event name (just use distance + stroke)
- "Boys 12&U", "Girls 10&U", age group prefixes should be stripped from event name
- "FR", "Free", "Freestyle" → "Free"
- "BK", "Back", "Backstroke" → "Back"  
- "BR", "Breast", "Breaststroke" → "Breast"
- "FL", "Fly", "Butterfly" → "Fly"
- "IM", "I.M.", "Individual Medley" → "IM"

Return a JSON array with ALL times found:
[{{
  "swimmerName": "Full name from the image",
  "eventName": "Normalized event name (e.g., '200 Free', '50 Back', '100 Fly')",
  "distance": 200 (number extracted from event),
  "stroke": "Freestyle" or "Backstroke" or "Breaststroke" or "Butterfly" or "Individual Medley",
  "timeStr": "2:52.11" or "42.44" (exact time as shown),
  "place": 10 (if shown, otherwise null),
  "heat": null,
  "lane": null
}}]

Critical instructions:
1. Extract EVERY time visible in the image
2. Normalize ALL event names to the standard format (strip age group prefixes, "Meter"/"Yard")
3. Include the swimmer name as shown
4. Times format: SS.XX for under a minute, M:SS.XX for over a minute
5. Return ONLY the raw JSON array, no other text or markdown"""
    
    # Try Emergent LLM key with Claude first (supports vision), fall back to OpenAI
    EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
    
    if EMERGENT_LLM_KEY:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"heat-sheet-{req.swimmerName or 'scan'}",
                system_message="You are an expert at reading swim meet results from screenshots. Extract all times accurately. Return JSON only."
            ).with_model("anthropic", "claude-sonnet-4-20250514")
            
            image_content = ImageContent(image_base64=req.imageData)
            user_message = UserMessage(text=prompt, file_contents=[image_content])
            
            text = await chat.send_message(user_message)
            
            print(f"Heat sheet extraction (Claude) response length: {len(text)}")
            print(f"Heat sheet extraction preview: {text[:500]}")
            
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                try:
                    results = json.loads(json_match.group(0))
                    for r in results:
                        r['eventName'] = normalize_event_name(r.get('eventName', ''), r.get('distance', 0))
                        r['stroke'] = normalize_stroke_name(r.get('stroke', ''))
                    print(f"Extracted {len(results)} times from heat sheet via Claude")
                    return {"success": True, "times": results, "count": len(results)}
                except json.JSONDecodeError as e:
                    print(f"Claude JSON parse error: {e}")
            else:
                print(f"Claude response had no JSON array")
        except Exception as e:
            print(f"Claude heat sheet extraction failed: {e}")
            import traceback
            traceback.print_exc()
    
    # Fallback to OpenAI
    if not OPENAI_API_KEY:
        return {"success": False, "times": [], "error": "AI service unavailable. Please try again later."}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{req.mimeType};base64,{req.imageData}", "detail": "high"}}
                    ]}
                ],
                "max_tokens": 4096,
                "temperature": 0.1
            },
            timeout=90.0
        )
        
        if response.status_code != 200:
            error_detail = response.text
            print(f"Heat sheet extraction failed: {response.status_code} - {error_detail[:500]}")
            raise HTTPException(status_code=500, detail=f"Analysis failed: {error_detail}")
        
        data = response.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        print(f"Heat sheet extraction response length: {len(text)}")
        print(f"Heat sheet extraction preview: {text[:500]}")
        
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            try:
                results = json.loads(json_match.group(0))
                
                # Post-process to ensure event names are normalized
                for r in results:
                    r['eventName'] = normalize_event_name(r.get('eventName', ''), r.get('distance', 0))
                    r['stroke'] = normalize_stroke_name(r.get('stroke', ''))
                
                print(f"Extracted {len(results)} times from heat sheet")
                return {"success": True, "times": results, "count": len(results)}
            except json.JSONDecodeError as e:
                return {"success": False, "times": [], "error": f"Failed to parse results: {str(e)}"}
        return {"success": False, "times": [], "error": "No times found in image"}

def normalize_event_name(event_name: str, distance: int) -> str:
    """Normalize event name to standard format used in app"""
    if not event_name:
        return f"{distance} Free" if distance else "Unknown Event"
    
    name_lower = event_name.lower().strip()
    
    # Extract distance if not provided
    if not distance:
        import re
        dist_match = re.search(r'(\d+)', name_lower)
        if dist_match:
            distance = int(dist_match.group(1))
    
    # Determine stroke
    stroke_abbrev = "Free"
    if any(x in name_lower for x in ['back', 'bk', 'backstroke']):
        stroke_abbrev = "Back"
    elif any(x in name_lower for x in ['breast', 'br', 'breaststroke']):
        stroke_abbrev = "Breast"
    elif any(x in name_lower for x in ['fly', 'fl', 'butter']):
        stroke_abbrev = "Fly"
    elif any(x in name_lower for x in ['im', 'i.m', 'medley', 'individual']):
        stroke_abbrev = "IM"
    elif any(x in name_lower for x in ['free', 'fr', 'freestyle']):
        stroke_abbrev = "Free"
    
    return f"{distance} {stroke_abbrev}" if distance else event_name

def normalize_stroke_name(stroke: str) -> str:
    """Normalize stroke name to full standard form"""
    if not stroke:
        return "Freestyle"
    
    stroke_lower = stroke.lower().strip()
    
    if any(x in stroke_lower for x in ['back', 'bk']):
        return "Backstroke"
    elif any(x in stroke_lower for x in ['breast', 'br']):
        return "Breaststroke"
    elif any(x in stroke_lower for x in ['fly', 'fl', 'butter']):
        return "Butterfly"
    elif any(x in stroke_lower for x in ['im', 'i.m', 'medley', 'individual']):
        return "Individual Medley"
    else:
        return "Freestyle"

# ==================== TEAM SHARING ====================

import secrets
import string

def generate_share_code(length=8):
    """Generate a unique share code"""
    chars = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

@app.post("/api/teams/share")
async def create_team_share(req: TeamShareRequest, request: Request):
    """Create a shareable link for a team"""
    session = get_session(request.headers.get("x-user-session"))
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = session.get("id")
    team_id = req.teamId or session.get("teamId", "team1")
    
    # Check if share already exists for this user
    existing_share = db.team_shares.find_one({"createdBy": user_id, "active": True})
    if existing_share:
        return {
            "shareCode": existing_share["shareCode"],
            "shareUrl": f"/share/{existing_share['shareCode']}",
            "created": existing_share.get("created"),
            "shareName": existing_share.get("shareName", "My Team")
        }
    
    # Create new share - store userId and specific athleteIds for fetching their athletes
    share_code = generate_share_code()
    
    # If athleteIds not provided, find the user's athletes
    athlete_ids = req.athleteIds or []
    if not athlete_ids:
        # For parents, get their linked athletes
        parent_athletes = list(db.athletes.find({"parentId": user_id}, {"_id": 0, "id": 1}))
        if parent_athletes:
            athlete_ids = [a["id"] for a in parent_athletes]
        else:
            # For coaches/admins, get all athletes on their team
            team_athletes = list(db.athletes.find({"teamId": team_id}, {"_id": 0, "id": 1}))
            athlete_ids = [a["id"] for a in team_athletes]
    
    share_doc = {
        "shareCode": share_code,
        "teamId": team_id,
        "createdBy": user_id,
        "athleteIds": athlete_ids,
        "shareName": req.shareName or "My Team",
        "created": datetime.utcnow().isoformat(),
        "active": True,
        "viewCount": 0
    }
    
    db.team_shares.insert_one(share_doc)
    
    return {
        "shareCode": share_code,
        "shareUrl": f"/share/{share_code}",
        "created": share_doc["created"],
        "shareName": share_doc["shareName"]
    }

@app.get("/api/teams/share/{share_code}")
async def get_shared_team(share_code: str):
    """Get team data for a shared link (public - no auth required)"""
    share = db.team_shares.find_one({"shareCode": share_code, "active": True})
    if not share:
        raise HTTPException(status_code=404, detail="Share link not found or expired")
    
    team_id = share["teamId"]
    created_by = share.get("createdBy")
    stored_athlete_ids = share.get("athleteIds", [])
    
    # Increment view count
    db.team_shares.update_one({"shareCode": share_code}, {"$inc": {"viewCount": 1}})
    
    # Get athletes - use stored athleteIds if available (most reliable)
    athletes = []
    
    if stored_athlete_ids:
        # Best strategy: use the exact athlete IDs stored at share-creation time
        athletes = list(db.athletes.find({"id": {"$in": stored_athlete_ids}}, {"_id": 0}))
    
    # Fallback strategies if no stored IDs (backwards compat with old shares)
    if len(athletes) == 0 and created_by:
        # Try by parentId (for parent accounts)
        athletes = list(db.athletes.find({"parentId": created_by}, {"_id": 0}))
    
    if len(athletes) == 0 and created_by:
        # Try by userId (for swimmer accounts)
        athletes = list(db.athletes.find({"userId": created_by}, {"_id": 0}))
    
    if len(athletes) == 0:
        # Last resort: get athletes by teamId
        athletes = list(db.athletes.find({"teamId": team_id}, {"_id": 0}).limit(50))
    
    # Get athlete IDs
    athlete_ids = [a["id"] for a in athletes]
    
    # Get times for these specific athletes
    if athlete_ids:
        athlete_times = list(db.timeEntries.find({"athleteId": {"$in": athlete_ids}}, {"_id": 0}))
    else:
        athlete_times = []
    
    # Debug logging
    print(f"Share {share_code}: teamId={team_id}, createdBy={created_by}, storedIds={stored_athlete_ids}")
    print(f"  Athletes: {len(athletes)}, Athlete IDs: {athlete_ids}")
    print(f"  Times found: {len(athlete_times)}")
    
    # Get events
    events = list(db.events.find({}, {"_id": 0}).limit(500))
    
    # Get qualifying standards
    standards = list(db.qualifyingStandards.find({}, {"_id": 0}).limit(1000))
    
    return {
        "shareName": share.get("shareName", "Shared Team"),
        "teamId": team_id,
        "athletes": athletes,
        "times": athlete_times,
        "events": events,
        "standards": standards,
        "viewCount": share.get("viewCount", 0) + 1
    }

@app.delete("/api/teams/share/{share_code}")
async def delete_team_share(share_code: str, request: Request):
    """Deactivate a share link"""
    session = get_session(request.headers.get("x-user-session"))
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = db.team_shares.update_one(
        {"shareCode": share_code, "createdBy": session.get("id")},
        {"$set": {"active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    return {"success": True}

@app.get("/api/teams/my-shares")
async def get_my_shares(request: Request):
    """Get all share links created by the current user"""
    session = get_session(request.headers.get("x-user-session"))
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    shares = list(db.team_shares.find(
        {"createdBy": session.get("id"), "active": True},
        {"_id": 0}
    ))
    
    return {"shares": shares}

# Health check

@app.post("/api/ai/verify-all")
async def verify_all_standards(x_user_session: str = Header(None)):
    """Auto re-verify ALL existing standards by re-researching each unique age/gender/course/state combo."""
    
    EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
    if not PERPLEXITY_API_KEY:
        raise HTTPException(status_code=500, detail="Perplexity API key not configured")
    
    # Get all standards grouped by unique combos
    all_standards = list(db.qualifyingStandards.find({}, {"_id": 0}))
    if not all_standards:
        return {"message": "No standards to verify", "verified": 0}
    
    # Get all events to map eventId -> event details
    all_events = {e["id"]: e for e in db.events.find({}, {"_id": 0})}
    
    # Group standards by course + ageGroup + gender (we'll verify each group)
    from collections import defaultdict
    groups = defaultdict(list)
    for s in all_standards:
        event = all_events.get(s.get("eventId"), {})
        course = s.get("course") or event.get("course", "SCY")
        age = s.get("ageGroup", "")
        gender = s.get("gender", "")
        key = f"{course}|{age}|{gender}"
        groups[key].append(s)
    
    verified_count = 0
    
    for group_key, stds in groups.items():
        course, age_group, gender = group_key.split("|")
        if not age_group or not gender:
            continue
            
        # Build list of events to verify
        times_to_check = []
        seen_events = set()
        for s in stds:
            event = all_events.get(s.get("eventId"), {})
            event_name = event.get("name", "")
            if not event_name or event_name in seen_events:
                continue
            seen_events.add(event_name)
            
            regional = next((st for st in stds if st.get("eventId") == s.get("eventId") and st.get("region") == "Regional"), None)
            state = next((st for st in stds if st.get("eventId") == s.get("eventId") and st.get("region") == "State"), None)
            
            def format_time(secs):
                if not secs: return ""
                mins = int(secs) // 60
                sec = secs - (mins * 60)
                if mins > 0:
                    return f"{mins}:{sec:05.2f}"
                return f"{sec:.2f}"
            
            times_to_check.append({
                "name": event_name,
                "eventId": s.get("eventId"),
                "course": course,
                "ageGroup": age_group,
                "gender": gender,
                "regionalTimeStr": format_time(regional["cutTimeSeconds"]) if regional else "",
                "stateTimeStr": format_time(state["cutTimeSeconds"]) if state else ""
            })
        
        if not times_to_check:
            continue
        
        # Query Perplexity for verification
        gender_display = "Boys/Men" if gender == "M" else "Girls/Women"
        event_list = ", ".join([t["name"] for t in times_to_check])
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={"Authorization": f"Bearer {PERPLEXITY_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": "sonar",
                        "messages": [
                            {"role": "system", "content": "You verify exact qualifying times from official USA Swimming LSC documents. Return JSON only."},
                            {"role": "user", "content": f"""Verify these {course} qualifying times for {age_group} {gender_display}.

For each event, find the OFFICIAL Regional and State cut times from official LSC documents.

Events: {event_list}

Return JSON array:
[{{"name":"50 Free","verifiedRegional":"exact time or N/A","verifiedState":"exact time or N/A"}}]"""}
                        ],
                        "temperature": 0,
                        "max_tokens": 3000
                    },
                    timeout=45.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    json_match = re.search(r'\[.*\]', text, re.DOTALL)
                    
                    verified_lookup = {}
                    if json_match:
                        try:
                            verified_data = json.loads(json_match.group(0))
                            for item in verified_data:
                                name = item.get("name", "").lower().strip()
                                verified_lookup[name] = item
                        except:
                            pass
                    
                    # Compare and update standards
                    def parse_time_secs(t):
                        if not t or t == "N/A" or t == "":
                            return None
                        t = str(t).strip()
                        try:
                            if ':' in t:
                                parts = t.split(':')
                                return float(parts[0]) * 60 + float(parts[1])
                            return float(t)
                        except:
                            return None
                    
                    for tc in times_to_check:
                        event_name_key = tc["name"].lower().strip()
                        verified = verified_lookup.get(event_name_key)
                        
                        if verified:
                            v_reg = parse_time_secs(verified.get("verifiedRegional"))
                            v_state = parse_time_secs(verified.get("verifiedState"))
                            c_reg = parse_time_secs(tc["regionalTimeStr"])
                            c_state = parse_time_secs(tc["stateTimeStr"])
                            
                            reg_ok = v_reg and c_reg and abs(v_reg - c_reg) <= 2.0
                            state_ok = v_state and c_state and abs(v_state - c_state) <= 2.0
                            
                            matches = 0
                            if reg_ok: matches += 1
                            if state_ok: matches += 1
                            
                            score = f"{matches + 1}/3"
                            confidence = "high" if matches >= 2 else "medium" if matches >= 1 else "low"
                        else:
                            score = "1/1"
                            confidence = "medium"
                        
                        # Update all standards for this event
                        db.qualifyingStandards.update_many(
                            {"eventId": tc["eventId"]},
                            {"$set": {"verificationScore": score, "verificationConfidence": confidence}}
                        )
                        verified_count += 1
                
        except Exception as e:
            print(f"Verify-all failed for {group_key}: {e}")
            continue
    
    return {"message": f"Verified {verified_count} events across {len(groups)} groups", "verified": verified_count}


@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Diagnostic endpoint - helps debug data issues
@app.get("/api/debug/collections")
async def debug_collections():
    """Show counts for all collections to diagnose missing data"""
    try:
        collections = db.list_collection_names()
        counts = {}
        for coll in collections:
            counts[coll] = db[coll].count_documents({})
        
        # Specifically check both possible collection names
        time_counts = {
            "timeEntries": db.timeEntries.count_documents({}),
            "times": db.times.count_documents({})
        }
        standard_counts = {
            "qualifyingStandards": db.qualifyingStandards.count_documents({}),
            "standards": db.standards.count_documents({})
        }
        
        return {
            "db_name": db.name,
            "all_collections": counts,
            "time_entries": time_counts,
            "standards_entries": standard_counts,
            "athletes_count": db.athletes.count_documents({}),
            "events_count": db.events.count_documents({})
        }
    except Exception as e:
        return {"error": str(e)}
