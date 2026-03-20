# SwimQual.app - Product Requirements Document

## Last Updated: Mar 15, 2026

## Original Problem Statement
SwimQual.app - A swim time tracking application with MongoDB backend, featuring:
- Multi-user access (Swimmer, Parent, Coach, Admin roles)
- Event & time tracking with qualification badges
- AI-powered heat sheet scanner (GPT-4o Vision)
- AI standards research (Perplexity + Claude for PDF reading)
- Team sharing via public links
- USA Swimming Motivational Time Standards display

## Tech Stack
- Frontend: React (port 3000)
- Backend: FastAPI (port 8001)
- Database: MongoDB
- AI: Perplexity AI (web search), Anthropic Claude (PDF extraction), OpenAI GPT-4o (image analysis)

## What's Been Implemented
- [x] Core application with role-based authentication
- [x] Dashboard with event cards and qualification tracking
- [x] Heat sheet scanner with batch upload
- [x] Standards research with AI (Perplexity + Claude for PDF accuracy)
- [x] Stroke guide with YouTube tutorials
- [x] Logo removal (Feb 6, 2026)
- [x] Year/season selector for standards research
- [x] Age-group specific events
- [x] Team sharing via public links
- [x] Manual editing of researched times before applying
- [x] Dashboard sorting by qualification status
- [x] Data overwriting for new standards
- [x] **USA Swimming Motivational Time Standards (Mar 15, 2026)** - Shows B, BB, A, AA, AAA, AAAA levels on event cards

## Recent Changes
- Mar 20, 2026: **Micro-Animations & Splash Screen Enhancement**
  - Added animated splash screen with floating logo, pulsing glow, and loading dots
  - Staggered entrance animations for event cards and UI elements
  - Floating animation on profile avatar and header logo
  - Badge shine effect on USA Time badges
  - Icon bounce on hover for navigation and action buttons
  - Glow pulse effect on active navigation item
  - Ripple effect on primary buttons
  - Water wave animation on hero card
  - Page transition animations
  - Enhanced hover states with lift and glow effects
- Mar 20, 2026: **Major UI Redesign - Dark Theme**
  - New dark navy background (#0a0f1a) throughout app
  - Glass-morphism card effects (blur backdrop, subtle borders)
  - Gradient buttons (sky-500 to blue-600)
  - Updated fonts: Barlow Condensed (display), Inter (body)
  - New bottom navigation with active state highlighting
  - Hero card with pool image on dashboard
  - Updated all screens: Login, Register, Dashboard, Focus, Team, Event Detail
- Mar 15, 2026: Integrated USA Swimming Motivational Time Standards display on dashboard
  - Added `/app/frontend/src/utils/motivationalTimes.ts` with **OFFICIAL 2024-2028** SCY standards for 10U, 11-12, 13-14 (boys & girls)
  - Source: https://swimgoals.app/guides/motivational-times (USA Swimming official data)
  - Updated `DashboardCard.tsx` to show achievement level badge (B/BB/A/AA/AAA/AAAA) next to best time
  - Shows next target time to reach next level (e.g., "30.49 for BB")
  - Color-coded badges: purple (AAAA), amber (AAA), blue (AA), green (A), teal (BB), slate (B)
  - Uses age-group standards (11-12 combined), not single-age standards

## P0 - Critical Pending Issues
- [ ] Team sharing page not displaying swimmer times (backend fix deployed, needs user verification after redeploy)

## Backlog
- P1: Import meet results from files (CSV, Hy-Tek .hy3)
- P2: Expand motivational standards to include SCM and LCM courses
- P2: Add 15-16 and 17-18 age group standards
- P2: Build SwimQual.app into myswim.io competitor (public profiles, historical database)
- P2: Add "Lookup on MySwim.io" button
- P2: Add social sharing buttons to team share modal
- P3: Refactor App.tsx (2400+ lines) into smaller components
