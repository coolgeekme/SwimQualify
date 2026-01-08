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

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
