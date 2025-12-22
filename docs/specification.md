
# SwimQualify MVP Specification

## 1. Product Requirements Document (PRD)
- **Objective**: Provide swimmers with a clear roadmap to "making the cut" (Regional/State times).
- **Core Features**:
  - **Athlete Profiles**: Track age-group specific performance.
  - **Time Management**: Manual entry for PB/SB data.
  - **Qualifying Standards**: Centralized DB of cut times by age/gender/region.
  - **Gap Analysis**: Automated calculation of seconds-to-cut and required pace.
  - **Trend Forecasting**: Simple linear trend based on recent performances.
  - **Engagement Loop**: Weekly check-ins (attendance, focus, confidence).

## 2. Information Architecture
- **Root**: Tab Bar Navigation (Dashboard, Roster, Focus, Settings).
- **Dashboard**: Event cards sorted by "closeness to cut".
- **Event Details**: History graph, pace breakdown, goal tracking.
- **Coach View**: Team roster, aggregate attendance, set weekly focus.
- **Admin**: CRUD interface for Qualifying Standards.

## 3. Data Model
### Relational Tables
- **Teams**: `id (PK), name, club_code`
- **Users**: `id (PK), email, name, role (swimmer|parent|coach|admin)`
- **Athletes**: `id (PK), user_id (FK), team_id (FK), dob, gender, current_age_group`
- **Events**: `id (PK), name (e.g., 100 Free), distance, stroke`
- **TimeEntries**: `id (PK), athlete_id (FK), event_id (FK), time_seconds, date, is_pb, splits (json)`
- **QualifyingStandards**: `id (PK), event_id (FK), season, region, age_group, gender, cut_time_seconds`
- **WeeklyCheckIns**: `id (PK), athlete_id (FK), week_start, attendance_count, focus_metric, confidence_score`

## 4. Calculation Spec
- **Time Conversion**: `(mm * 60) + ss + (xx / 100)`.
- **Pace (Per 25)**: `total_seconds / (distance / 25)`.
- **Improvement Rate**: `(Previous_Best - Current_Best) / Weeks_Between`.
- **Forecast Logic**: 
  - `Likely`: Trend slope matches or exceeds required improvement.
  - `Possible`: Improvement exists but needs to accelerate.
  - `Breakthrough Needed`: Flat or regressing trend.

## 5. API Spec (Mock Implementation)
- `GET /api/athletes/:id/dashboard` -> Returns summary of event gaps.
- `POST /api/times` -> Adds a new meet result.
- `GET /api/standards/:age_group/:gender` -> Fetches relevant cuts.

## 6. Implementation Plan (2-Week Sprint)
- **Week 1**: Core Data Schema, Time Entry UI, Standard Management, Auth Flow.
- **Week 2**: Calculation Engine, Dashboard Visualizations (Charts), Weekly Check-in Loop, Final UI Polishing.
