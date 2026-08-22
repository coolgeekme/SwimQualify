# SwimQual.app - Product Requirements Document

## Problem Statement
SwimQual.app is a full-stack application for swimmers, coaches, and parents to track qualifying times, manage teams, and research USA Swimming standards.

## Core Architecture
- **Frontend:** React + TypeScript + Tailwind CSS (dark glassmorphism theme)
- **Backend:** Python + FastAPI
- **Database:** MongoDB
- **AI:** Anthropic Claude (via Emergent LLM Key), Perplexity AI

## What's Been Implemented

### Authentication & Users
- Demo login buttons (Alex, Maria, Sarah, Admin)
- Role-based access (swimmer, parent, coach, admin)

### Dashboard
- Season best times display with event cards
- Achievement level badges (B, BB, A, AA, AAA, AAAA)
- **Course tabs (SCY | LCM | SCM | ALL)** with color-coded grouping
- Regional/State qualifying cut comparison with inline editing
- Verification badges (confidence scores from multi-source verification)
- Search/filter bar (search by name, filter by stroke)
- Performance trend charts

### Standards Data
- **SCY/LCM/SCM:** All age groups (10U, 11-12, 13-14, 15-16, 17-18) - official USA Swimming 2024-2028
- **Standards Verification Modal:** View official motivational times by course/age/gender
- **Source links:** USA Swimming + LSC website links shown during research

### AI Features
- AI-powered standards research (Perplexity + Claude) with auto-verification
- **LSC PDF download & storage** — download official PDFs as source of truth
- **LSC PDF upload** — users can upload their own PDFs for any state
- Heat sheet scanner (Claude vision, supports Meet Mobile format)
- Stroke insights generation
- Enhanced event name normalizer for scan results

### Verification System
- Multi-source verification (Perplexity + Claude + cross-reference)
- Auto-verify during research — scores stored with standards
- "Verify All" one-click button to verify all existing standards
- Confidence badges on event cards (green confirmed, amber partial, red needs review)
- Confirm Changes modal (old vs new side-by-side before applying)

### Team Management
- Team sharing with public read-only links (filtered by athlete IDs)
- Course badges on shared view
- Search/filter on shared view
- Athlete roster management

### Event Tracking
- Deduplicated event list (normalized names, no duplicates)
- PR times shown per event
- Verification status per event (REG/STATE/UNVERIFIED indicators)
- Course-grouped display (SCY/LCM/SCM sections)

## Prioritized Backlog

### Completed
- [x] All motivational standards (SCY/LCM/SCM) for all age groups
- [x] Standards Verification Modal
- [x] Fix Team Sharing (times + filtered athletes)
- [x] Enhanced event normalizer + manual mapping for scan
- [x] Search/filter on Dashboard and Shared View
- [x] Inline editable cut times
- [x] SCM 10U data accuracy fix
- [x] AI Research LCM fix (course-specific prompts)
- [x] Expanded event lists (200 Back, 200 Breast, 25-yard)
- [x] Claude merges with Perplexity results
- [x] Multi-source verification system
- [x] Auto-verify during research
- [x] Course type badges everywhere
- [x] Confidence badges on event cards
- [x] Source links (USA Swimming + LSC websites)
- [x] Confirm Changes modal
- [x] Heat sheet scanner fixed (Claude via Emergent key)
- [x] White-on-white text fix
- [x] Deduplication on Track Your Events
- [x] "Verify All" button
- [x] Course tabs on dashboard (SCY | LCM | SCM | ALL)
- [x] LSC PDF download & upload system
- [x] GitHub pull: Event name normalization + POST /api/events/dedupe endpoint (Feb 2026)
- [x] Fixed distance inference bug (age-group labels no longer parsed as distances)
- [x] Fixed stroke matching (word-boundary regex prevents false IM matches)
- [x] Extended age-group normalization (14U, 16U, 18U now handled)

### P1 (Next)
- [ ] Import meet results from files (CSV, Hy-Tek .hy3)
- [ ] Re-upload custom logos
- [x] Clean up duplicate events in production DB (dedupe endpoint + event normalization pulled from GitHub)

### P2 (Future)
- [ ] Swimmer percentile rank vs national swimmers
- [ ] Celebration animations for PBs/qualifications
- [ ] Refactor App.tsx (~3100 lines) into smaller components
- [ ] Mobile PWA with offline support
- [ ] Social sharing buttons

## Key Files
- `/app/frontend/src/utils/motivationalTimes.ts` - All standards data
- `/app/frontend/src/components/StandardsVerificationModal.tsx` - Verify modal
- `/app/frontend/src/components/DashboardCard.tsx` - Event card with verification
- `/app/frontend/src/App.tsx` - Main UI (~3100 lines)
- `/app/backend/server.py` - FastAPI backend
