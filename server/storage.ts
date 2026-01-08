import { 
  users, type User, type InsertUser,
  athletes, type Athlete, type InsertAthlete,
  events, type Event, type InsertEvent,
  timeEntries, type TimeEntry, type InsertTimeEntry,
  qualifyingStandards, type QualifyingStandard, type InsertQualifyingStandard
} from "../shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Athletes
  getAthlete(id: string): Promise<Athlete | undefined>;
  getAthletesByTeam(teamId: string): Promise<Athlete[]>;
  getAthletesByParent(parentId: string): Promise<Athlete[]>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined>;
  deleteAthlete(id: string): Promise<boolean>;
  
  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Time Entries
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  getTimeEntriesByAthlete(athleteId: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;
  
  // Qualifying Standards
  getQualifyingStandard(id: string): Promise<QualifyingStandard | undefined>;
  getAllQualifyingStandards(): Promise<QualifyingStandard[]>;
  createQualifyingStandard(standard: InsertQualifyingStandard): Promise<QualifyingStandard>;
  updateQualifyingStandard(id: string, standard: Partial<InsertQualifyingStandard>): Promise<QualifyingStandard | undefined>;
  deleteQualifyingStandard(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // ============ Users ============
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        email: insertUser.email.toLowerCase(),
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // ============ Athletes ============
  async getAthlete(id: string): Promise<Athlete | undefined> {
    const [athlete] = await db.select().from(athletes).where(eq(athletes.id, id));
    return athlete || undefined;
  }

  async getAthletesByTeam(teamId: string): Promise<Athlete[]> {
    return await db.select().from(athletes).where(eq(athletes.teamId, teamId));
  }

  async getAthletesByParent(parentId: string): Promise<Athlete[]> {
    return await db.select().from(athletes).where(eq(athletes.parentId, parentId));
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const [created] = await db.insert(athletes).values(athlete).returning();
    return created;
  }

  async updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    const [updated] = await db.update(athletes).set(athlete).where(eq(athletes.id, id)).returning();
    return updated || undefined;
  }

  async deleteAthlete(id: string): Promise<boolean> {
    const result = await db.delete(athletes).where(eq(athletes.id, id)).returning();
    return result.length > 0;
  }

  // ============ Events ============
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return updated || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  // ============ Time Entries ============
  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return entry || undefined;
  }

  async getTimeEntriesByAthlete(athleteId: string): Promise<TimeEntry[]> {
    return await db.select().from(timeEntries).where(eq(timeEntries.athleteId, athleteId));
  }

  async getAllTimeEntries(): Promise<TimeEntry[]> {
    return await db.select().from(timeEntries);
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [created] = await db.insert(timeEntries).values(entry).returning();
    return created;
  }

  async updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [updated] = await db.update(timeEntries).set(entry).where(eq(timeEntries.id, id)).returning();
    return updated || undefined;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    const result = await db.delete(timeEntries).where(eq(timeEntries.id, id)).returning();
    return result.length > 0;
  }

  // ============ Qualifying Standards ============
  async getQualifyingStandard(id: string): Promise<QualifyingStandard | undefined> {
    const [standard] = await db.select().from(qualifyingStandards).where(eq(qualifyingStandards.id, id));
    return standard || undefined;
  }

  async getAllQualifyingStandards(): Promise<QualifyingStandard[]> {
    return await db.select().from(qualifyingStandards);
  }

  async createQualifyingStandard(standard: InsertQualifyingStandard): Promise<QualifyingStandard> {
    const [created] = await db.insert(qualifyingStandards).values(standard).returning();
    return created;
  }

  async updateQualifyingStandard(id: string, standard: Partial<InsertQualifyingStandard>): Promise<QualifyingStandard | undefined> {
    const [updated] = await db.update(qualifyingStandards).set(standard).where(eq(qualifyingStandards.id, id)).returning();
    return updated || undefined;
  }

  async deleteQualifyingStandard(id: string): Promise<boolean> {
    const result = await db.delete(qualifyingStandards).where(eq(qualifyingStandards.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
