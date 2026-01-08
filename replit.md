# SwimQualify MVP

## Overview

SwimQualify is a performance tracking application for competitive youth swimmers. It helps athletes, parents, and coaches track swim times, visualize progress toward qualifying cuts (Regional/State times), and manage season goals with data-driven insights. The app provides gap analysis showing how close swimmers are to making qualifying times, trend forecasting based on performance history, and weekly engagement tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript, using functional components and hooks
- **Styling**: Tailwind CSS loaded via CDN for utility-first styling
- **Build Tool**: Vite 6 for fast development and bundling
- **Charts**: Recharts library for performance visualization (line charts for time progression)
- **Icons**: Lucide React for consistent iconography
- **State Management**: React useState with localStorage persistence for data storage

### Data Persistence Strategy
- **Full Database Persistence**: All core data is stored in PostgreSQL database with Drizzle ORM
- **Database Tables**: Users, Athletes, Events, TimeEntries, QualifyingStandards
- **Data Seeding**: Initial events and qualifying standards are auto-seeded on first login
- **Mock Data**: Pre-seeded constants provide demo accounts for quick testing
- **Session Only**: Only user session is stored in localStorage for login persistence
- **Database**: Unified PostgreSQL database used for both development and production

### Authentication
- **Login**: Email/password authentication with bcrypt password hashing
- **Registration**: New accounts stored in PostgreSQL database with secure password hashing
- **Demo Accounts**: Quick-login buttons for testing (Alex, Sarah, Maria, Admin)
- **Session Persistence**: Current user stored in localStorage for session continuity
- **API Endpoints**: `/api/auth/register`, `/api/auth/login`, `/api/auth/users`

### Role-Based Access Control
The app supports four user roles with different navigation and capabilities:
- **Swimmer**: Personal dashboard and focus tracking
- **Parent**: View linked children's progress, team roster access, admin features
- **Coach**: Team roster management, focus setting, admin capabilities
- **Admin**: Full access including CRUD for qualifying standards (demo account only)

### Core Domain Model
- **Users**: Authentication identity with role assignment
- **Athletes**: Swimmer profiles with age group, gender, and event selections
- **Events**: Swimming events defined by distance, stroke, course (Yards/Meters), and age group
- **TimeEntries**: Individual swim times linked to athletes and events
- **QualifyingStandards**: Regional and State cut times by event, age group, and gender
- **WeeklyCheckIns**: Engagement tracking for attendance and confidence

### Key Calculations
- Time conversion between display format (mm:ss.xx) and seconds
- Pace calculation per 25 yards/meters
- Gap analysis: difference between personal best and qualifying cut
- Trend forecasting based on improvement rate over time

### AI Integration
- **OpenAI** (via Replit AI Integrations): Used for AI Technique Coach and document analysis
- **Perplexity AI**: Used for real-time qualifying times research with internet access
- All AI requests are handled server-side to keep API keys secure
- Security measures:
  - Rate limiting: 10 requests per IP per minute
  - Session validation: Requires logged-in user context
  - API keys never exposed to frontend

### Backend Server
- Express.js API server running on port 3001
- **Database**: PostgreSQL with Drizzle ORM
- Endpoints:
  - `/api/auth/register`: User registration with bcrypt password hashing
  - `/api/auth/login`: User login with password verification
  - `/api/auth/users`: List all registered users (for frontend sync)
  - `/api/athletes`: CRUD operations for athlete profiles
  - `/api/events`: CRUD operations for swim events
  - `/api/times`: CRUD operations for time entries
  - `/api/standards`: CRUD operations for qualifying standards
  - `/api/standards/bulk`: Bulk create qualifying standards
  - `/api/seed`: Auto-seed initial events and standards data
  - `/api/ai/stroke-insights`: AI Technique Coach analysis
  - `/api/ai/analyze-document`: Document OCR and parsing for qualifying standards
  - `/api/ai/research-standards`: Real-time qualifying times research using Perplexity

## External Dependencies

### Third-Party Libraries
- **openai**: OpenAI SDK for AI-powered features (server-side)
- **express**: API server framework
- **recharts**: Charting library for performance visualization
- **lucide-react**: Icon component library

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (managed by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key (managed by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI base URL (managed by Replit)
- `PERPLEXITY_API_KEY`: Required for real-time qualifying times research

### Browser APIs
- **localStorage**: User session persistence only (login state)
- **Camera**: Permission requested per metadata.json for potential future OCR/time capture features

### Recent Changes (January 2026)
- Migrated all data from localStorage to PostgreSQL database for permanent persistence
- Extended database schema with Athletes, Events, TimeEntries, and QualifyingStandards tables
- Added full CRUD API endpoints for all data entities
- Auto-seeding of initial events and qualifying standards on first login
- Added bcrypt password hashing for secure password storage
- Configured unified database for development and production environments
- All data now persists across sessions - athletes, times, events, and standards are saved permanently

### Architecture
- Frontend: React app served by Vite on port 5000
- Backend: Express API server on port 3001
- Vite proxies `/api` requests to the backend server