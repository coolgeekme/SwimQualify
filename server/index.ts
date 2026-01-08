import express from 'express';
import OpenAI from 'openai';
import bcrypt from 'bcrypt';
import { storage } from './storage';

const SALT_ROUNDS = 10;

const requiredEnvVars = ['AI_INTEGRATIONS_OPENAI_API_KEY', 'AI_INTEGRATIONS_OPENAI_BASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// Auth API endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    const existingUser = await storage.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user = await storage.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      teamId: 'team1'
    });

    res.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await storage.getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers.map(u => ({
      id: u.id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      teamId: u.teamId
    })));
  } catch (err: any) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const getClientIp = (req: express.Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = getClientIp(req);
  const now = Date.now();
  
  const record = rateLimitStore.get(clientIp);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({ 
      error: `Too many requests. Please wait ${retryAfter} seconds before trying again.` 
    });
  }
  
  record.count++;
  next();
};

const requireSession = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const sessionHeader = req.headers['x-user-session'];
  if (!sessionHeader) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  
  try {
    const session = JSON.parse(sessionHeader as string);
    if (!session || !session.id || !session.email) {
      return res.status(401).json({ error: 'Invalid session. Please log in again.' });
    }
    (req as any).userSession = session;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid session format. Please log in again.' });
  }
};


app.post('/api/ai/stroke-insights', rateLimitMiddleware, requireSession, async (req, res) => {
  try {
    const { athleteName, ageGroup, gender, timeData } = req.body;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a high-performance swim coach. Analyze competition results and provide specific technical focus areas. Return ONLY valid JSON with stroke names as keys and technique tips as values.'
        },
        {
          role: 'user',
          content: `Analyze these competition results for ${athleteName} (${ageGroup} ${gender === 'M' ? 'Male' : 'Female'}) and provide specific technical focus areas for each stroke they swim:\n\n${JSON.stringify(timeData, null, 2)}`
        }
      ],
      max_tokens: 1024
    });

    const text = response.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      res.json({ insights: JSON.parse(jsonMatch[0]) });
    } else {
      res.json({ insights: {} });
    }
  } catch (err: any) {
    console.error('Stroke insights error:', err);
    res.status(500).json({ error: 'Failed to generate stroke insights' });
  }
});

app.post('/api/ai/analyze-document', rateLimitMiddleware, requireSession, async (req, res) => {
  try {
    const { imageData, mimeType } = req.body;
    
    const prompt = `Extract ALL swim qualifying standards (cut times) from this document. 
    Return the results as a JSON array of objects.
    Each object MUST have: "name" (e.g. "50 Free"), "distance" (number), "stroke" (one of: "Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley"), "regionalTimeStr" (e.g. "28.45"), "stateTimeStr" (e.g. "27.10"), "ageGroup", "gender", "course" ("Yards" or "Meters").
    If a specific cut is missing, use null.
    Return ONLY the raw JSON array. No conversational text.`;

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: `data:${mimeType || 'image/png'};base64,${imageData}`, detail: 'auto' }
          ]
        }
      ]
    });

    const text = response.output_text || "";
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      res.json({ results: JSON.parse(jsonMatch[0]) });
    } else {
      res.json({ results: [], error: 'No standards found in document' });
    }
  } catch (err: any) {
    console.error('Document analysis error:', err);
    res.status(500).json({ error: 'Analysis failed. Try a clearer document.' });
  }
});

app.post('/api/ai/research-standards', rateLimitMiddleware, requireSession, async (req, res) => {
  try {
    const { ageGroup, gender, stateLocation, course } = req.body;
    
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return res.status(500).json({ error: 'Perplexity API key not configured' });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that researches swim qualifying standards. Always return data as valid JSON arrays only, with no additional text.'
          },
          {
            role: 'user',
            content: `Find the 2024-2025 ${ageGroup} ${gender} swim qualifying standards for ${stateLocation} in ${course} course.
            For each event (e.g. 50 Free, 100 Back), find BOTH the Regional/local level cut AND the State level cut.
            Return results as a JSON array of objects.
            Schema: [{"name": string, "distance": number, "stroke": string, "regionalTimeStr": string, "stateTimeStr": string, "ageGroup": string, "gender": string, "course": string}].
            If a cut is not found, use null for that property.
            Return ONLY the raw JSON array with no markdown formatting or explanation.`
          }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        return_related_questions: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Search failed. Please try again.' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\[.*\]/s);
    
    let results: any[] = [];
    let citations: { title: string; uri: string }[] = [];
    
    if (jsonMatch) {
      try {
        results = JSON.parse(jsonMatch[0]);
      } catch {
        results = [];
      }
    }

    if (data.citations && data.citations.length > 0) {
      citations = data.citations.map((uri: string, index: number) => ({
        title: `Source ${index + 1}`,
        uri
      }));
    }

    res.json({ results, citations });
  } catch (err: any) {
    console.error('Research standards error:', err);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

// ============ ATHLETES API ============
app.get('/api/athletes', requireSession, async (req, res) => {
  try {
    const session = (req as any).userSession;
    const athletes = await storage.getAthletesByTeam(session.teamId || 'team1');
    res.json(athletes.map(a => ({
      id: a.id,
      userId: a.userId,
      parentId: a.parentId,
      name: a.name,
      dob: a.dob,
      gender: a.gender,
      ageGroup: a.ageGroup,
      selectedEventIds: a.selectedEventIds || []
    })));
  } catch (err: any) {
    console.error('Get athletes error:', err);
    res.status(500).json({ error: 'Failed to get athletes' });
  }
});

app.post('/api/athletes', requireSession, async (req, res) => {
  try {
    const session = (req as any).userSession;
    const { id, userId, parentId, name, dob, gender, ageGroup, selectedEventIds } = req.body;
    const athlete = await storage.createAthlete({
      id: id || `a_${Date.now()}`,
      userId,
      parentId,
      name,
      dob,
      gender,
      ageGroup,
      selectedEventIds: selectedEventIds || [],
      teamId: session.teamId || 'team1'
    });
    res.json({
      id: athlete.id,
      userId: athlete.userId,
      parentId: athlete.parentId,
      name: athlete.name,
      dob: athlete.dob,
      gender: athlete.gender,
      ageGroup: athlete.ageGroup,
      selectedEventIds: athlete.selectedEventIds || []
    });
  } catch (err: any) {
    console.error('Create athlete error:', err);
    res.status(500).json({ error: 'Failed to create athlete' });
  }
});

app.put('/api/athletes/:id', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dob, gender, ageGroup, selectedEventIds, userId, parentId } = req.body;
    const athlete = await storage.updateAthlete(id, { 
      name, dob, gender, ageGroup, selectedEventIds, userId, parentId 
    });
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    res.json({
      id: athlete.id,
      userId: athlete.userId,
      parentId: athlete.parentId,
      name: athlete.name,
      dob: athlete.dob,
      gender: athlete.gender,
      ageGroup: athlete.ageGroup,
      selectedEventIds: athlete.selectedEventIds || []
    });
  } catch (err: any) {
    console.error('Update athlete error:', err);
    res.status(500).json({ error: 'Failed to update athlete' });
  }
});

app.delete('/api/athletes/:id', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteAthlete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete athlete error:', err);
    res.status(500).json({ error: 'Failed to delete athlete' });
  }
});

// ============ EVENTS API ============
app.get('/api/events', async (req, res) => {
  try {
    const events = await storage.getAllEvents();
    res.json(events.map(e => ({
      id: e.id,
      name: e.name,
      distance: e.distance,
      stroke: e.stroke,
      course: e.course,
      ageGroup: e.ageGroup
    })));
  } catch (err: any) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

app.post('/api/events', requireSession, async (req, res) => {
  try {
    const { id, name, distance, stroke, course, ageGroup } = req.body;
    const event = await storage.createEvent({
      id: id || `e_${Date.now()}`,
      name,
      distance,
      stroke,
      course,
      ageGroup
    });
    res.json({
      id: event.id,
      name: event.name,
      distance: event.distance,
      stroke: event.stroke,
      course: event.course,
      ageGroup: event.ageGroup
    });
  } catch (err: any) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.delete('/api/events/:id', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteEvent(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ============ TIME ENTRIES API ============
app.get('/api/times', requireSession, async (req, res) => {
  try {
    const times = await storage.getAllTimeEntries();
    res.json(times.map(t => ({
      id: t.id,
      athleteId: t.athleteId,
      eventId: t.eventId,
      timeSeconds: t.timeSeconds,
      course: t.course,
      date: t.date,
      meetName: t.meetName,
      splits: t.splits,
      notes: t.notes,
      ageGroupAtTime: t.ageGroupAtTime
    })));
  } catch (err: any) {
    console.error('Get times error:', err);
    res.status(500).json({ error: 'Failed to get times' });
  }
});

app.post('/api/times', requireSession, async (req, res) => {
  try {
    const { id, athleteId, eventId, timeSeconds, course, date, meetName, splits, notes, ageGroupAtTime } = req.body;
    const entry = await storage.createTimeEntry({
      id: id || `t_${Date.now()}`,
      athleteId,
      eventId,
      timeSeconds,
      course,
      date,
      meetName,
      splits,
      notes,
      ageGroupAtTime
    });
    res.json({
      id: entry.id,
      athleteId: entry.athleteId,
      eventId: entry.eventId,
      timeSeconds: entry.timeSeconds,
      course: entry.course,
      date: entry.date,
      meetName: entry.meetName,
      splits: entry.splits,
      notes: entry.notes,
      ageGroupAtTime: entry.ageGroupAtTime
    });
  } catch (err: any) {
    console.error('Create time entry error:', err);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

app.put('/api/times/:id', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    const { athleteId, eventId, timeSeconds, course, date, meetName, splits, notes, ageGroupAtTime } = req.body;
    const entry = await storage.updateTimeEntry(id, {
      athleteId, eventId, timeSeconds, course, date, meetName, splits, notes, ageGroupAtTime
    });
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    res.json({
      id: entry.id,
      athleteId: entry.athleteId,
      eventId: entry.eventId,
      timeSeconds: entry.timeSeconds,
      course: entry.course,
      date: entry.date,
      meetName: entry.meetName,
      splits: entry.splits,
      notes: entry.notes,
      ageGroupAtTime: entry.ageGroupAtTime
    });
  } catch (err: any) {
    console.error('Update time entry error:', err);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

app.delete('/api/times/:id', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteTimeEntry(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete time entry error:', err);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// ============ QUALIFYING STANDARDS API ============
app.get('/api/standards', async (req, res) => {
  try {
    const standards = await storage.getAllQualifyingStandards();
    res.json(standards.map(s => ({
      id: s.id,
      eventId: s.eventId,
      region: s.region,
      ageGroup: s.ageGroup,
      gender: s.gender,
      course: s.course,
      cutTimeSeconds: s.cutTimeSeconds,
      season: s.season
    })));
  } catch (err: any) {
    console.error('Get standards error:', err);
    res.status(500).json({ error: 'Failed to get standards' });
  }
});

app.post('/api/standards', requireSession, async (req, res) => {
  try {
    const { id, eventId, region, ageGroup, gender, course, cutTimeSeconds, season } = req.body;
    const standard = await storage.createQualifyingStandard({
      id: id || `s_${Date.now()}`,
      eventId,
      region,
      ageGroup,
      gender,
      course,
      cutTimeSeconds,
      season
    });
    res.json({
      id: standard.id,
      eventId: standard.eventId,
      region: standard.region,
      ageGroup: standard.ageGroup,
      gender: standard.gender,
      course: standard.course,
      cutTimeSeconds: standard.cutTimeSeconds,
      season: standard.season
    });
  } catch (err: any) {
    console.error('Create standard error:', err);
    res.status(500).json({ error: 'Failed to create standard' });
  }
});

app.post('/api/standards/bulk', requireSession, async (req, res) => {
  try {
    const { standards } = req.body;
    const created = [];
    for (const s of standards) {
      const standard = await storage.createQualifyingStandard({
        id: s.id || `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: s.eventId,
        region: s.region,
        ageGroup: s.ageGroup,
        gender: s.gender,
        course: s.course,
        cutTimeSeconds: s.cutTimeSeconds,
        season: s.season
      });
      created.push({
        id: standard.id,
        eventId: standard.eventId,
        region: standard.region,
        ageGroup: standard.ageGroup,
        gender: standard.gender,
        course: standard.course,
        cutTimeSeconds: standard.cutTimeSeconds,
        season: standard.season
      });
    }
    res.json(created);
  } catch (err: any) {
    console.error('Bulk create standards error:', err);
    res.status(500).json({ error: 'Failed to create standards' });
  }
});

app.delete('/api/standards/:id', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteQualifyingStandard(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Standard not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete standard error:', err);
    res.status(500).json({ error: 'Failed to delete standard' });
  }
});

// ============ DATA SEEDING ENDPOINT ============
app.post('/api/seed', async (req, res) => {
  try {
    const existingEvents = await storage.getAllEvents();
    if (existingEvents.length > 0) {
      return res.json({ message: 'Data already seeded', seeded: false });
    }

    const defaultEvents = [
      { id: '1', name: '50 Free', distance: 50, stroke: 'Freestyle', course: 'Yards', ageGroup: '11-12' },
      { id: '2', name: '100 Free', distance: 100, stroke: 'Freestyle', course: 'Yards', ageGroup: '11-12' },
      { id: '3', name: '100 Back', distance: 100, stroke: 'Backstroke', course: 'Yards', ageGroup: '11-12' },
      { id: '4', name: '100 Breast', distance: 100, stroke: 'Breaststroke', course: 'Yards', ageGroup: '11-12' },
      { id: '5', name: '100 Fly', distance: 100, stroke: 'Butterfly', course: 'Yards', ageGroup: '11-12' },
      { id: '6', name: '200 IM', distance: 200, stroke: 'Individual Medley', course: 'Yards', ageGroup: '11-12' },
      { id: '7', name: '50 Free', distance: 50, stroke: 'Freestyle', course: 'Yards', ageGroup: '10U' },
    ];

    for (const e of defaultEvents) {
      try {
        await storage.createEvent(e);
      } catch (err: any) {
        if (err.cause?.code !== '23505') throw err;
      }
    }

    const defaultStandards = [
      { id: 's1', eventId: '1', region: 'Regional', ageGroup: '11-12', gender: 'M', course: 'Yards', cutTimeSeconds: 29.50, season: '2025' },
      { id: 's2', eventId: '1', region: 'State', ageGroup: '11-12', gender: 'M', course: 'Yards', cutTimeSeconds: 27.20, season: '2025' },
      { id: 's1-f', eventId: '1', region: 'Regional', ageGroup: '11-12', gender: 'F', course: 'Yards', cutTimeSeconds: 30.10, season: '2025' },
      { id: 's2-f', eventId: '1', region: 'State', ageGroup: '11-12', gender: 'F', course: 'Yards', cutTimeSeconds: 28.50, season: '2025' },
      { id: 's3', eventId: '2', region: 'Regional', ageGroup: '11-12', gender: 'M', course: 'Yards', cutTimeSeconds: 65.00, season: '2025' },
      { id: 's4', eventId: '2', region: 'State', ageGroup: '11-12', gender: 'M', course: 'Yards', cutTimeSeconds: 59.80, season: '2025' },
      { id: 's5', eventId: '7', region: 'Regional', ageGroup: '10U', gender: 'M', course: 'Yards', cutTimeSeconds: 34.50, season: '2025' },
    ];

    for (const s of defaultStandards) {
      try {
        await storage.createQualifyingStandard(s);
      } catch (err: any) {
        if (err.cause?.code !== '23505') throw err;
      }
    }

    res.json({ message: 'Data seeded successfully', seeded: true });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ error: 'Failed to seed data' });
  }
});

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
