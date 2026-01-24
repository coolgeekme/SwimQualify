
export enum Role {
  SWIMMER = 'swimmer',
  PARENT = 'parent',
  COACH = 'coach',
  ADMIN = 'admin'
}

export enum Stroke {
  FREE = 'Freestyle',
  BACK = 'Backstroke',
  BREAST = 'Breaststroke',
  FLY = 'Butterfly',
  IM = 'Individual Medley'
}

export enum Course {
  SCY = 'SCY',   // Short Course Yards (25 yard pool)
  SCM = 'SCM',   // Short Course Meters (25 meter pool)
  LCM = 'LCM'    // Long Course Meters (50 meter pool)
}

// Helper to get display name for course
export const CourseDisplayName: Record<Course, string> = {
  [Course.SCY]: 'Short Course Yards',
  [Course.SCM]: 'Short Course Meters', 
  [Course.LCM]: 'Long Course Meters'
};

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  teamId: string;
}

export interface Athlete {
  id: string;
  userId?: string; 
  parentId?: string; 
  name: string;
  dob: string;
  gender: 'M' | 'F';
  ageGroup: string;
  selectedEventIds: string[]; // IDs of events this swimmer is tracking
}

export interface Event {
  id: string;
  name: string;
  distance: number;
  stroke: Stroke;
  course: Course;
  ageGroup: string; // The age group this specific event definition belongs to
}

export interface TimeEntry {
  id: string;
  athleteId: string;
  eventId: string;
  timeSeconds: number;
  course: Course;
  date: string;
  meetName?: string;
  splits?: number[];
  notes?: string;
  ageGroupAtTime?: string; // Track which age group they were in when they swam this
  isDQ?: boolean; // Disqualification flag
}

export interface QualifyingStandard {
  id: string;
  eventId: string;
  region: 'Regional' | 'State';
  ageGroup: string;
  gender: 'M' | 'F';
  course: Course;
  cutTimeSeconds: number;
  season: string;
}

export interface WeeklyCheckIn {
  id: string;
  athleteId: string;
  weekStart: string;
  attendance: number;
  focusMetric: string;
  confidence: number;
}
