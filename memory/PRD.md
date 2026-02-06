# SwimQual.app - Product Requirements Document

## Last Updated: Feb 6, 2026

## Original Problem Statement
SwimQual.app - A swim time tracking application with MongoDB backend, featuring:
- Multi-user access (Swimmer, Parent, Coach, Admin roles)
- Event & time tracking with qualification badges
- AI-powered heat sheet scanner (GPT-4o Vision)
- AI standards research (Perplexity AI)
- AI Technique Coach & Stroke Guide

## Tech Stack
- Frontend: React (port 3000)
- Backend: FastAPI (port 8001)
- Database: MongoDB

## What's Been Implemented
- [x] Core application with role-based authentication
- [x] Dashboard with event cards and qualification tracking
- [x] Heat sheet scanner with batch upload
- [x] Standards research with AI
- [x] Stroke guide with YouTube tutorials
- [x] Logo removal (Feb 6, 2026)
- [x] Year/season selector for standards research (Feb 6, 2026)
- [x] Age-group specific events - swimmers only see events for their age bracket (Feb 6, 2026)

## Recent Changes
- Feb 6, 2026: Removed all custom logo images
- Feb 6, 2026: Added year/season selector to research form (2025-2026, 2024-2025, 2023-2024)
- Feb 6, 2026: Events/standards now correctly filtered by age group so Diego (11-12) and Enzo (10U) have different qualifying times

## Backlog
- P1: Bulk copy standards between age groups
- P2: Custom logo integration (if user provides new images)
- P2: Custom favicon
