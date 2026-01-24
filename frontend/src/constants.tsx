
import { Stroke, Role, Event, QualifyingStandard, TimeEntry, Athlete, User, Course } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@team.com', password: 'password123', role: Role.SWIMMER, teamId: 'team1' },
  { id: 'u2', name: 'Coach Sarah', email: 'sarah@team.com', password: 'password123', role: Role.COACH, teamId: 'team1' },
  { id: 'u3', name: 'Maria Rivera', email: 'maria@parent.com', password: 'password123', role: Role.PARENT, teamId: 'team1' },
  { id: 'u4', name: 'Admin User', email: 'admin@swim.com', password: 'password123', role: Role.ADMIN, teamId: 'team1' },
];

export const EVENTS: Event[] = [
  { id: '1', name: '50 Free', distance: 50, stroke: Stroke.FREE, course: Course.SCY, ageGroup: '11-12' },
  { id: '2', name: '100 Free', distance: 100, stroke: Stroke.FREE, course: Course.SCY, ageGroup: '11-12' },
  { id: '3', name: '100 Back', distance: 100, stroke: Stroke.BACK, course: Course.SCY, ageGroup: '11-12' },
  { id: '4', name: '100 Breast', distance: 100, stroke: Stroke.BREAST, course: Course.SCY, ageGroup: '11-12' },
  { id: '5', name: '100 Fly', distance: 100, stroke: Stroke.FLY, course: Course.SCY, ageGroup: '11-12' },
  { id: '6', name: '200 IM', distance: 200, stroke: Stroke.IM, course: Course.SCY, ageGroup: '11-12' },
  { id: '7', name: '50 Free', distance: 50, stroke: Stroke.FREE, course: Course.SCY, ageGroup: '10U' },
];

export const MOCK_STANDARDS: QualifyingStandard[] = [
  { id: 's1', eventId: '1', region: 'Regional', ageGroup: '11-12', gender: 'M', course: Course.SCY, cutTimeSeconds: 29.50, season: '2025' },
  { id: 's2', eventId: '1', region: 'State', ageGroup: '11-12', gender: 'M', course: Course.SCY, cutTimeSeconds: 27.20, season: '2025' },
  { id: 's1-f', eventId: '1', region: 'Regional', ageGroup: '11-12', gender: 'F', course: Course.SCY, cutTimeSeconds: 30.10, season: '2025' },
  { id: 's2-f', eventId: '1', region: 'State', ageGroup: '11-12', gender: 'F', course: Course.SCY, cutTimeSeconds: 28.50, season: '2025' },
  { id: 's3', eventId: '2', region: 'Regional', ageGroup: '11-12', gender: 'M', course: Course.SCY, cutTimeSeconds: 65.00, season: '2025' },
  { id: 's4', eventId: '2', region: 'State', ageGroup: '11-12', gender: 'M', course: Course.SCY, cutTimeSeconds: 59.80, season: '2025' },
  { id: 's5', eventId: '7', region: 'Regional', ageGroup: '10U', gender: 'M', course: Course.SCY, cutTimeSeconds: 34.50, season: '2025' },
];

export const MOCK_ATHLETES: Athlete[] = [
  { id: 'a1', userId: 'u1', parentId: 'u3', name: 'Alex Rivera', dob: '2013-05-15', gender: 'M', ageGroup: '11-12', selectedEventIds: ['1', '2', '3'] },
  { id: 'a2', parentId: 'u3', name: 'Sofia Rivera', dob: '2015-08-20', gender: 'F', ageGroup: '10U', selectedEventIds: ['7'] },
  { id: 'a3', userId: 'u6', name: 'Leo Chen', dob: '2014-01-10', gender: 'M', ageGroup: '10U', selectedEventIds: ['7'] },
];

export const MOCK_TIMES: TimeEntry[] = [
  { id: 't1', athleteId: 'a1', eventId: '1', timeSeconds: 32.40, course: Course.SCY, date: '2024-11-10', meetName: 'Fall Invite', ageGroupAtTime: '11-12' },
  { id: 't2', athleteId: 'a1', eventId: '1', timeSeconds: 31.15, course: Course.SCY, date: '2025-01-12', meetName: 'Winter Open', ageGroupAtTime: '11-12' },
  { id: 't3', athleteId: 'a2', eventId: '7', timeSeconds: 38.50, course: Course.SCY, date: '2024-12-05', meetName: 'Holiday Cup', ageGroupAtTime: '10U' },
  { id: 't4', athleteId: 'a2', eventId: '7', timeSeconds: 36.20, course: Course.SCY, date: '2025-02-01', meetName: 'Polar Plunge', ageGroupAtTime: '10U' },
];
