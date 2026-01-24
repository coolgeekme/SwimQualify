import { connectDB, getDB } from "./db";
import { ObjectId } from 'mongodb';

// Type definitions matching the original schema
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  teamId: string;
  createdAt: Date;
}

export interface InsertUser {
  name: string;
  email: string;
  password: string;
  role?: string;
  teamId?: string;
}

export interface Athlete {
  id: string;
  userId?: string;
  parentId?: string;
  name: string;
  dob: string;
  gender: string;
  ageGroup: string;
  selectedEventIds: string[];
  teamId: string;
  createdAt: Date;
}

export interface InsertAthlete {
  id: string;
  userId?: string;
  parentId?: string;
  name: string;
  dob: string;
  gender: string;
  ageGroup: string;
  selectedEventIds?: string[];
  teamId?: string;
}

export interface Event {
  id: string;
  name: string;
  distance: number;
  stroke: string;
  course: string;
  ageGroup: string;
  createdAt: Date;
}

export interface InsertEvent {
  id: string;
  name: string;
  distance: number;
  stroke: string;
  course: string;
  ageGroup: string;
}

export interface TimeEntry {
  id: string;
  athleteId: string;
  eventId: string;
  timeSeconds: number;
  course: string;
  date: string;
  meetName?: string;
  splits?: number[];
  notes?: string;
  ageGroupAtTime?: string;
  isDQ?: boolean;
  createdAt: Date;
}

export interface InsertTimeEntry {
  id: string;
  athleteId: string;
  eventId: string;
  timeSeconds: number;
  course: string;
  date: string;
  meetName?: string;
  splits?: number[];
  notes?: string;
  ageGroupAtTime?: string;
  isDQ?: boolean;
}

export interface QualifyingStandard {
  id: string;
  eventId: string;
  region: string;
  ageGroup: string;
  gender: string;
  course: string;
  cutTimeSeconds: number;
  season: string;
  createdAt: Date;
}

export interface InsertQualifyingStandard {
  id: string;
  eventId: string;
  region: string;
  ageGroup: string;
  gender: string;
  course: string;
  cutTimeSeconds: number;
  season: string;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  getAthlete(id: string): Promise<Athlete | undefined>;
  getAthletesByTeam(teamId: string): Promise<Athlete[]>;
  getAthletesByParent(parentId: string): Promise<Athlete[]>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined>;
  deleteAthlete(id: string): Promise<boolean>;
  
  getEvent(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  getTimeEntriesByAthlete(athleteId: string): Promise<TimeEntry[]>;
  getAllTimeEntries(): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;
  
  getQualifyingStandard(id: string): Promise<QualifyingStandard | undefined>;
  getAllQualifyingStandards(): Promise<QualifyingStandard[]>;
  createQualifyingStandard(standard: InsertQualifyingStandard): Promise<QualifyingStandard>;
  updateQualifyingStandard(id: string, standard: Partial<InsertQualifyingStandard>): Promise<QualifyingStandard | undefined>;
  deleteQualifyingStandard(id: string): Promise<boolean>;
}

// Helper to convert MongoDB document to typed object without _id
function stripMongoId<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest as T;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;
  private userCounter = 1;

  private async init() {
    if (this.initialized) return;
    await connectDB();
    
    // Get the highest user ID to continue sequence
    const db = getDB();
    const lastUser = await db.collection('users').findOne({}, { sort: { id: -1 } });
    if (lastUser && typeof lastUser.id === 'number') {
      this.userCounter = lastUser.id + 1;
    }
    
    this.initialized = true;
  }

  // ============ Users ============
  async getUser(id: number): Promise<User | undefined> {
    await this.init();
    const db = getDB();
    const user = await db.collection('users').findOne({ id });
    return user ? stripMongoId<User>(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.init();
    const db = getDB();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    return user ? stripMongoId<User>(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.init();
    const db = getDB();
    const user: User = {
      id: this.userCounter++,
      name: insertUser.name,
      email: insertUser.email.toLowerCase(),
      password: insertUser.password,
      role: insertUser.role || 'swimmer',
      teamId: insertUser.teamId || 'team1',
      createdAt: new Date()
    };
    await db.collection('users').insertOne({ ...user });
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    await this.init();
    const db = getDB();
    const users = await db.collection('users').find({}).toArray();
    return users.map(u => stripMongoId<User>(u));
  }

  // ============ Athletes ============
  async getAthlete(id: string): Promise<Athlete | undefined> {
    await this.init();
    const db = getDB();
    const athlete = await db.collection('athletes').findOne({ id });
    return athlete ? stripMongoId<Athlete>(athlete) : undefined;
  }

  async getAthletesByTeam(teamId: string): Promise<Athlete[]> {
    await this.init();
    const db = getDB();
    const athletes = await db.collection('athletes').find({ teamId }).toArray();
    return athletes.map(a => stripMongoId<Athlete>(a));
  }

  async getAthletesByParent(parentId: string): Promise<Athlete[]> {
    await this.init();
    const db = getDB();
    const athletes = await db.collection('athletes').find({ parentId }).toArray();
    return athletes.map(a => stripMongoId<Athlete>(a));
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    await this.init();
    const db = getDB();
    const newAthlete: Athlete = {
      ...athlete,
      selectedEventIds: athlete.selectedEventIds || [],
      teamId: athlete.teamId || 'team1',
      createdAt: new Date()
    };
    await db.collection('athletes').insertOne({ ...newAthlete });
    return newAthlete;
  }

  async updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    await this.init();
    const db = getDB();
    const result = await db.collection('athletes').findOneAndUpdate(
      { id },
      { $set: athlete },
      { returnDocument: 'after' }
    );
    return result ? stripMongoId<Athlete>(result) : undefined;
  }

  async deleteAthlete(id: string): Promise<boolean> {
    await this.init();
    const db = getDB();
    const result = await db.collection('athletes').deleteOne({ id });
    return result.deletedCount > 0;
  }

  // ============ Events ============
  async getEvent(id: string): Promise<Event | undefined> {
    await this.init();
    const db = getDB();
    const event = await db.collection('events').findOne({ id });
    return event ? stripMongoId<Event>(event) : undefined;
  }

  async getAllEvents(): Promise<Event[]> {
    await this.init();
    const db = getDB();
    const events = await db.collection('events').find({}).toArray();
    return events.map(e => stripMongoId<Event>(e));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    await this.init();
    const db = getDB();
    const newEvent: Event = {
      ...event,
      createdAt: new Date()
    };
    await db.collection('events').insertOne({ ...newEvent });
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    await this.init();
    const db = getDB();
    const result = await db.collection('events').findOneAndUpdate(
      { id },
      { $set: event },
      { returnDocument: 'after' }
    );
    return result ? stripMongoId<Event>(result) : undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    await this.init();
    const db = getDB();
    const result = await db.collection('events').deleteOne({ id });
    return result.deletedCount > 0;
  }

  // ============ Time Entries ============
  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    await this.init();
    const db = getDB();
    const entry = await db.collection('timeEntries').findOne({ id });
    return entry ? stripMongoId<TimeEntry>(entry) : undefined;
  }

  async getTimeEntriesByAthlete(athleteId: string): Promise<TimeEntry[]> {
    await this.init();
    const db = getDB();
    const entries = await db.collection('timeEntries').find({ athleteId }).toArray();
    return entries.map(e => stripMongoId<TimeEntry>(e));
  }

  async getAllTimeEntries(): Promise<TimeEntry[]> {
    await this.init();
    const db = getDB();
    const entries = await db.collection('timeEntries').find({}).toArray();
    return entries.map(e => stripMongoId<TimeEntry>(e));
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    await this.init();
    const db = getDB();
    const newEntry: TimeEntry = {
      ...entry,
      createdAt: new Date()
    };
    await db.collection('timeEntries').insertOne({ ...newEntry });
    return newEntry;
  }

  async updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    await this.init();
    const db = getDB();
    const result = await db.collection('timeEntries').findOneAndUpdate(
      { id },
      { $set: entry },
      { returnDocument: 'after' }
    );
    return result ? stripMongoId<TimeEntry>(result) : undefined;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    await this.init();
    const db = getDB();
    const result = await db.collection('timeEntries').deleteOne({ id });
    return result.deletedCount > 0;
  }

  // ============ Qualifying Standards ============
  async getQualifyingStandard(id: string): Promise<QualifyingStandard | undefined> {
    await this.init();
    const db = getDB();
    const standard = await db.collection('qualifyingStandards').findOne({ id });
    return standard ? stripMongoId<QualifyingStandard>(standard) : undefined;
  }

  async getAllQualifyingStandards(): Promise<QualifyingStandard[]> {
    await this.init();
    const db = getDB();
    const standards = await db.collection('qualifyingStandards').find({}).toArray();
    return standards.map(s => stripMongoId<QualifyingStandard>(s));
  }

  async createQualifyingStandard(standard: InsertQualifyingStandard): Promise<QualifyingStandard> {
    await this.init();
    const db = getDB();
    const newStandard: QualifyingStandard = {
      ...standard,
      createdAt: new Date()
    };
    await db.collection('qualifyingStandards').insertOne({ ...newStandard });
    return newStandard;
  }

  async updateQualifyingStandard(id: string, standard: Partial<InsertQualifyingStandard>): Promise<QualifyingStandard | undefined> {
    await this.init();
    const db = getDB();
    const result = await db.collection('qualifyingStandards').findOneAndUpdate(
      { id },
      { $set: standard },
      { returnDocument: 'after' }
    );
    return result ? stripMongoId<QualifyingStandard>(result) : undefined;
  }

  async deleteQualifyingStandard(id: string): Promise<boolean> {
    await this.init();
    const db = getDB();
    const result = await db.collection('qualifyingStandards').deleteOne({ id });
    return result.deletedCount > 0;
  }
}

export const storage = new DatabaseStorage();
