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

class DocumentAnalyzeRequest(BaseModel):
    imageData: str
    mimeType: str = "image/png"

class TeamShareRequest(BaseModel):
    teamId: str
    shareName: Optional[str] = None

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

@app.get("/api/auth/users")
async def get_users():
    users = list(db.users.find({}))
    return [{"id": str(u["id"]), "name": u["name"], "email": u["email"], "role": u["role"], "teamId": u.get("teamId", "team1")} for u in users]

# Events Endpoints
@app.get("/api/events")
async def get_events():
    events = list(db.events.find({}))
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
    times = list(db.timeEntries.find({}))
    return [strip_mongo_id(t) for t in times]

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
    standards = list(db.qualifyingStandards.find({}))
    return [strip_mongo_id(s) for s in standards]

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
    existing_events = list(db.events.find({}))
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
    
    async with httpx.AsyncClient() as client:
        # VERIFICATION METHOD 1: Primary search with Perplexity
        response = await client.post(
            "https://api.perplexity.ai/chat/completions",
            headers={"Authorization": f"Bearer {PERPLEXITY_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "sonar",
                "messages": [
                    {"role": "system", "content": """You extract EXACT qualifying times from official USA Swimming LSC PDF documents.
Rules:
1. Boys/Men and Girls/Women are interchangeable terms in swimming
2. State times are ALWAYS faster (smaller numbers) than Regional times  
3. Return valid JSON array only, no markdown code blocks
4. Copy times EXACTLY as they appear in official documents"""},
                    {"role": "user", "content": f"""Find the {season_description} {req.stateLocation} official qualifying times.

Age Group: {req.ageGroup} {gender_terms} (also check "{req.ageGroup} {'Men' if req.gender == 'M' else 'Women'}")
Course: {course_description}

Look for the official PDF time standards document. Extract EXACT times for these events:
50 Free, 100 Free, 200 Free, 500 Free, 50 Back, 100 Back, 50 Breast, 100 Breast, 50 Fly, 100 Fly, 100 IM, 200 IM

Return JSON array:
[{{"name":"50 Free","distance":50,"stroke":"Freestyle","regionalTimeStr":"exact time","stateTimeStr":"exact time","source":"document name"}}]"""}
                ],
                "temperature": 0,
                "max_tokens": 4000
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Search failed")
        
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
        
        # STEP 2: Use GPT-4o Vision to extract EXACT times from the PDF
        # Perplexity finds PDFs, OpenAI Vision reads them accurately
        if pdf_urls and OPENAI_API_KEY:
            print(f"Found {len(pdf_urls)} PDF URLs, attempting GPT-4o Vision extraction...")
            
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
                    pdf_response = await client.get(target_pdf, timeout=30.0, follow_redirects=True)
                    if pdf_response.status_code == 200:
                        print(f"PDF downloaded, size: {len(pdf_response.content)} bytes")
                        
                        # Convert PDF to images using PyMuPDF
                        pdf_document = fitz.open(stream=pdf_response.content, filetype="pdf")
                        images_base64 = []
                        
                        # Convert first 3 pages to images (usually enough for time standards)
                        for page_num in range(min(3, len(pdf_document))):
                            page = pdf_document[page_num]
                            # Render at 2x resolution for better OCR
                            mat = fitz.Matrix(2, 2)
                            pix = page.get_pixmap(matrix=mat)
                            img_data = pix.tobytes("png")
                            img_base64 = base64.b64encode(img_data).decode('utf-8')
                            images_base64.append(img_base64)
                            print(f"Converted page {page_num + 1} to image")
                        
                        pdf_document.close()
                        
                        if images_base64:
                            # Use GPT-4o Vision to extract times from the images
                            gender_term = "Men" if req.gender == "M" else "Women"
                            alt_gender = "Boys" if req.gender == "M" else "Girls"
                            
                            # Build content with all page images
                            content = [
                                {"type": "text", "text": f"""Extract the EXACT qualifying times from this official swimming time standards document.

SEARCH FOR: {req.ageGroup} {gender_term} (may also be labeled as "{req.ageGroup} {alt_gender}")
COURSE TYPE: {req.course} (SCY = Short Course Yards)

Find the table/section for {req.ageGroup} {gender_term} or {req.ageGroup} {alt_gender} and extract EXACT times for:
- 50 Free, 100 Free, 200 Free, 500 Free
- 50 Back, 100 Back  
- 50 Breast, 100 Breast
- 50 Fly, 100 Fly
- 100 IM, 200 IM

CRITICAL: Copy the EXACT numbers from the document. Do NOT estimate or round.

Return a JSON array:
[{{"name":"50 Free","distance":50,"stroke":"Freestyle","regionalTimeStr":"EXACT regional time","stateTimeStr":"EXACT state time"}}]

Return ONLY the JSON array, no other text."""}
                            ]
                            
                            # Add each page image
                            for idx, img_b64 in enumerate(images_base64):
                                content.append({
                                    "type": "image_url", 
                                    "image_url": {"url": f"data:image/png;base64,{img_b64}", "detail": "high"}
                                })
                            
                            print(f"Sending {len(images_base64)} page images to GPT-4o Vision...")
                            
                            vision_response = await client.post(
                                f"{OPENAI_BASE_URL}/chat/completions",
                                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                                json={
                                    "model": "gpt-4o",
                                    "messages": [{"role": "user", "content": content}],
                                    "max_tokens": 4000,
                                    "temperature": 0
                                },
                                timeout=90.0
                            )
                            
                            if vision_response.status_code == 200:
                                vision_data = vision_response.json()
                                vision_text = vision_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                                print(f"GPT-4o Vision response length: {len(vision_text)}")
                                print(f"GPT-4o Vision preview: {vision_text[:300]}...")
                                
                                vision_json_match = re.search(r'\[.*\]', vision_text, re.DOTALL)
                                if vision_json_match:
                                    try:
                                        pdf_results = json.loads(vision_json_match.group(0))
                                        if pdf_results and len(pdf_results) > 0:
                                            print(f"✓ Successfully extracted {len(pdf_results)} events from PDF via GPT-4o Vision")
                                            # Use PDF results - they're more accurate
                                            for r in pdf_results:
                                                r['ageGroup'] = req.ageGroup
                                                r['gender'] = req.gender
                                                r['course'] = req.course
                                                r['source'] = f"Extracted from {target_pdf.split('/')[-1]}"
                                            results = pdf_results
                                    except Exception as e:
                                        print(f"Failed to parse GPT-4o Vision extraction: {e}")
                            else:
                                print(f"GPT-4o Vision request failed: {vision_response.status_code}")
                                print(f"Error: {vision_response.text[:500]}")
                except Exception as e:
                    print(f"PDF extraction failed: {e}")
                    import traceback
                    traceback.print_exc()
        
        # VERIFICATION METHOD 2: Validate and fix times
        results = validate_and_fix_times(results)
        
        # Count validation issues
        validation_issues = sum(1 for r in results if not r.get('validated', True))
        
        return {
            "results": results, 
            "citations": citations, 
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
    
    # Standard event names used in the app
    standard_events = [
        "50 Free", "100 Free", "200 Free", "500 Free",
        "50 Back", "100 Back", "200 Back",
        "50 Breast", "100 Breast", "200 Breast",
        "50 Fly", "100 Fly", "200 Fly",
        "100 IM", "200 IM", "400 IM"
    ]
    
    prompt = f"""Analyze this swim meet heat sheet or results image and extract ALL swim times visible.{swimmer_context}

IMPORTANT: Extract EVERY time you can see in the image, not just one swimmer.

For event names, normalize them to match these standard formats:
{', '.join(standard_events)}

Common abbreviations to normalize:
- "FR", "Free", "Freestyle" → use distance + "Free" (e.g., "50 Free")
- "BK", "Back", "Backstroke" → use distance + "Back" (e.g., "100 Back")
- "BR", "Breast", "Breaststroke" → use distance + "Breast" (e.g., "100 Breast")
- "FL", "Fly", "Butterfly" → use distance + "Fly" (e.g., "50 Fly")
- "IM", "I.M.", "Individual Medley" → use distance + "IM" (e.g., "200 IM")

Return a JSON array with ALL times found:
[{{
  "swimmerName": "Full name from the sheet",
  "eventName": "Normalized event name (e.g., '50 Free', '100 Back')",
  "distance": 50 (number extracted from event),
  "stroke": "Freestyle" or "Backstroke" or "Breaststroke" or "Butterfly" or "Individual Medley",
  "timeStr": "28.45" or "1:05.32" (exact time as shown),
  "place": 1 (if shown, otherwise null),
  "heat": 3 (if shown, otherwise null),
  "lane": 4 (if shown, otherwise null)
}}]

Critical instructions:
1. Extract ALL swimmers' times, not just one person
2. Normalize ALL event names to the standard format
3. Include the full swimmer name as shown
4. Times format: SS.XX for under a minute, M:SS.XX for over a minute
5. Return ONLY the raw JSON array, no other text or explanation"""
    
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
            raise HTTPException(status_code=500, detail=f"Analysis failed: {error_detail}")
        
        data = response.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        print(f"Heat sheet extraction response length: {len(text)}")
        
        import re, json
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
    
    # Create new share - store userId for fetching their athletes
    share_code = generate_share_code()
    share_doc = {
        "shareCode": share_code,
        "teamId": team_id,
        "createdBy": user_id,
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
    
    # Increment view count
    db.team_shares.update_one({"shareCode": share_code}, {"$inc": {"viewCount": 1}})
    
    # Get athletes - try multiple strategies to find the user's athletes
    athletes = []
    
    # Strategy 1: By teamId
    athletes = list(db.athletes.find({"teamId": team_id}, {"_id": 0}))
    
    # Strategy 2: By parentId (for parent accounts)
    if len(athletes) == 0 and created_by:
        athletes = list(db.athletes.find({"parentId": created_by}, {"_id": 0}))
    
    # Strategy 3: By userId (for swimmer accounts)
    if len(athletes) == 0 and created_by:
        athletes = list(db.athletes.find({"userId": created_by}, {"_id": 0}))
    
    # Strategy 4: Get all athletes (fallback for backwards compatibility)
    if len(athletes) == 0:
        athletes = list(db.athletes.find({}, {"_id": 0}))
    
    # Get ALL times from database - don't filter by athleteId here
    # Let the frontend filter since there might be ID format mismatches
    all_times = list(db.times.find({}, {"_id": 0}))
    
    # Get athlete IDs
    athlete_ids = [a["id"] for a in athletes]
    
    # Filter times to only those belonging to our athletes
    times = [t for t in all_times if t.get("athleteId") in athlete_ids]
    
    # Debug logging
    print(f"Share {share_code}: teamId={team_id}, createdBy={created_by}")
    print(f"  Athletes: {len(athletes)}, Athlete IDs: {athlete_ids}")
    print(f"  All times in DB: {len(all_times)}, Filtered times: {len(times)}")
    if all_times and len(times) == 0:
        sample_athlete_ids = list(set([t.get("athleteId") for t in all_times[:5]]))
        print(f"  Sample athleteIds in times: {sample_athlete_ids}")
    
    # Get events
    events = list(db.events.find({}, {"_id": 0}))
    
    # Get standards
    standards = list(db.standards.find({}, {"_id": 0}))
    
    return {
        "shareName": share.get("shareName", "Shared Team"),
        "teamId": team_id,
        "athletes": athletes,
        "times": times,
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
@app.get("/api/health")
async def health():
    return {"status": "ok"}
