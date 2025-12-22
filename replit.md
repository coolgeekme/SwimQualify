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
- **Current Implementation**: Browser localStorage with versioned keys (e.g., `sq_prod_users_v3`)
- **Data Categories**: Users, Athletes, Times, Standards, Events, Auth sessions
- **Mock Data**: Pre-seeded constants provide initial demo data for all entity types

### Authentication
- **Login**: Email/password authentication with demo account quick-login buttons
- **Registration**: Visitors can create accounts as Swimmer, Parent, or Coach
- **Session Persistence**: Current user stored in localStorage for session continuity

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
- Google Generative AI (@google/genai) integration for research features
- API key configured via environment variable `GEMINI_API_KEY`
- Used for researching qualifying standards and providing insights

## External Dependencies

### Third-Party Libraries
- **@google/genai**: Google's Generative AI SDK for AI-powered research features
- **recharts**: Charting library for performance visualization
- **lucide-react**: Icon component library

### Environment Configuration
- `GEMINI_API_KEY`: Required for AI research functionality, loaded via Vite's env handling

### Browser APIs
- **localStorage**: Primary data persistence mechanism
- **Camera**: Permission requested per metadata.json for potential future OCR/time capture features

### No Backend Required
The current architecture is entirely client-side with no server dependencies. All data persists in browser localStorage. Future iterations may introduce a backend API following the specification in `docs/specification.md`.