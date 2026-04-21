# SwimQual.app - Product Requirements Document

## Problem Statement
SwimQual.app is a full-stack application for swimmers, coaches, and parents to track qualifying times, manage teams, and research USA Swimming standards.

## Core Architecture
- **Frontend:** React + TypeScript + Tailwind CSS (dark glassmorphism theme)
- **Backend:** Python + FastAPI
- **Database:** MongoDB
- **AI:** Anthropic Claude + Perplexity AI (via Emergent LLM Key)

## What's Been Implemented

### Authentication & Users
- Demo login buttons (Alex, Maria, Sarah, Admin)
- Role-based access (swimmer, parent, coach, admin)

### Dashboard
- Season best times display with event cards
- Achievement level badges (B, BB, A, AA, AAA, AAAA)
- Regional/State qualifying cut comparison
- Performance trend charts

### Standards Data (COMPLETED Feb 2026)
- **SCY:** All age groups (10U, 11-12, 13-14, 15-16, 17-18) - verified correct
- **LCM:** All age groups - 11-12 Boys/Girls corrected from official USA Swimming PDFs (Feb 2026), 13-18 verified correct, 10U expanded with missing events (50 Fly, 100 Fly, 200 IM)
- **SCM:** All age groups registered in index - data verified for 11-12
- **Standards Verification Modal:** Users can view official times by course/age/gender

### AI Features
- AI-powered standards research (Perplexity + Claude)
- Heat sheet scanner (document extraction)
- Stroke insights generation

### Team Management
- Team sharing with public read-only links
- Athlete roster management
- Event management (create, edit, delete)

### Admin Tools
- Standards Explorer with filter by age/gender/course
- Manual standards editing
- Event management

## Data Source
Official USA Swimming 2024-2028 Motivational Time Standards
- Source verified against: myswimapp.com, official USA Swimming PDFs
- Last verified: Feb 2026

## Prioritized Backlog

### P0 (Complete)
- [x] Correct LCM 11-12 Boys/Girls standards (was completely wrong)
- [x] Register all LCM/SCM age groups in MOTIVATIONAL_STANDARDS index
- [x] Standards Verification Modal UI
- [x] Add missing 10U LCM events (50 Fly, 100 Fly, 200 IM)
- [x] Fix Team Sharing: times not showing (wrong DB collection: db.times→db.timeEntries, db.standards→db.qualifyingStandards)
- [x] Fix Team Sharing: viewer sees all swimmers (now stores+filters by specific athleteIds)
- [x] Enhanced event name normalizer for heat sheet scanning (handles Meet Mobile naming variations)
- [x] Manual event mapping dropdown for unmatched scan results
- [x] Search/filter on Dashboard (search by name, filter by stroke/course) - shows when >3 events
- [x] Verify SCM 10U data accuracy: Fixed Boys 50 Fly, added Boys 100 Fly/100 IM/200 IM, fixed Girls 200 IM, added Girls 100 IM
- [x] Inline editable cut times: Click any Regional/State cut on dashboard cards to edit in-place (Save/Cancel/Enter/Escape)

### P1 (Next)
- [ ] Import meet results from files (CSV, Hy-Tek .hy3)
- [x] Fix AI Research returning SCY times when LCM selected (course-specific event lists + improved prompts)
- [x] Fix Claude PDF extraction overriding good Perplexity results with empty data
- [x] Expand SCY event list to include 200 Back, 200 Breast, 25-yard events
- [x] Send swimmer's actual event names to AI research (customEvents param)
- [x] Claude now merges with Perplexity results instead of always replacing
- [x] Multi-source verification system (Perplexity + Claude + cross-reference), shows 0/3 to 3/3 confidence per event
- [x] Auto-verify after Apply All + manual "Verify Sources" button on dashboard
- [x] Course type badges (SCY/LCM/SCM) on event selection, shared view, and dashboard
- [x] Fix production data visibility (removed mock fallbacks, added collection auto-migration, added /api/debug/collections)
- [ ] Verify production times visible after deploy (user needs to redeploy and check /api/debug/collections)

### P2 (Future)
- [ ] Swimmer percentile rank vs national swimmers
- [ ] Celebration animations for PBs/new qualifications
- [ ] Verify SCM 10U data (50 Fly for boys may need correction)

### P3 (Backlog)
- [ ] Mobile PWA with offline support
- [ ] Social sharing buttons (Twitter, Facebook) for team share
- [ ] Refactor App.tsx (2500+ lines) into smaller modular components

## Key Files
- `/app/frontend/src/utils/motivationalTimes.ts` - All standards data
- `/app/frontend/src/components/StandardsVerificationModal.tsx` - Verify modal
- `/app/frontend/src/App.tsx` - Main UI (2500+ lines)
- `/app/backend/server.py` - FastAPI backend
