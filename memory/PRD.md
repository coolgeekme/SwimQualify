# SwimQualify - Product Requirements Document

## Original Problem Statement
SwimQualify - Swim Performance Tracker for competitive youth swimmers to track progress toward qualifying times.

## Core Requirements
- **Performance Tracking**: Log swim times for various events (strokes, distances, course types)
- **Qualifying Cut Analysis**: See how close swimmers are to Regional and State times
- **Progress Visualization**: Charts showing time improvements over the season
- **Trend Forecasting**: Predictions based on improvement patterns
- **DQ Support**: Mark disqualified results, excluded from best time calculations

## User Personas
1. **Swimmer**: Personal dashboard for tracking own times
2. **Parent**: View linked children's progress
3. **Coach**: Manage team roster and set focus goals
4. **Admin**: Full access including managing qualifying standards

## Technical Architecture
- **Frontend**: React with TypeScript (port 3000), Recharts for graphs
- **Backend**: FastAPI server (port 8001)
- **Database**: MongoDB (swimqualify database)
- **AI Features**:
  - OpenAI GPT-4o-mini for Technique Coach stroke analysis
  - Perplexity API for real-time qualifying standards research

## What's Been Implemented (Jan 24, 2026)
- [x] MongoDB database migration from PostgreSQL
- [x] User authentication (login/register)
- [x] Demo accounts (Alex, Sarah, Maria, Admin)
- [x] Events management with auto-seeding (50 Free, 100 Free, 100 Back, etc.)
- [x] Qualifying standards database (Regional/State cuts)
- [x] Swimmer dashboard with gap-to-cut analysis
- [x] Event detail pages with performance charts
- [x] Time entry with DQ support
- [x] Admin tools: Explorer, Search (Perplexity), Events management
- [x] AI Technique Coach (OpenAI integration)

## API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/events` - Get all events
- `GET /api/standards` - Get qualifying standards
- `GET /api/athletes` - Get athletes (session required)
- `GET /api/times` - Get time entries (session required)
- `POST /api/seed` - Seed initial data
- `POST /api/ai/stroke-insights` - AI technique analysis
- `POST /api/ai/research-standards` - Perplexity standards research

## Backlog / Future Enhancements
### P0 (Critical)
- None currently

### P1 (High Priority)
- Weekly check-in feature for engagement
- Team management for coaches

### P2 (Medium Priority)
- Mobile app optimization
- Export times to CSV
- Meet schedule integration
- Parent-child account linking

## Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| alex@team.com | swimmer123 | Swimmer |
| sarah@team.com | coach123 | Coach |
| maria@parent.com | parent123 | Parent |
| admin@swim.com | admin123 | Admin |
