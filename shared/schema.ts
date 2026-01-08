import { pgTable, text, serial, varchar, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Users table for authentication persistence
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("swimmer"),
  teamId: text("team_id").notNull().default("team1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Athletes table
export const athletes = pgTable("athletes", {
  id: varchar("id", { length: 50 }).primaryKey(),
  userId: varchar("user_id", { length: 50 }),
  parentId: varchar("parent_id", { length: 50 }),
  name: text("name").notNull(),
  dob: text("dob").notNull(),
  gender: text("gender").notNull(),
  ageGroup: text("age_group").notNull(),
  selectedEventIds: jsonb("selected_event_ids").$type<string[]>().default([]),
  teamId: text("team_id").notNull().default("team1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  distance: real("distance").notNull(),
  stroke: text("stroke").notNull(),
  course: text("course").notNull(),
  ageGroup: text("age_group").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: varchar("id", { length: 50 }).primaryKey(),
  athleteId: varchar("athlete_id", { length: 50 }).notNull(),
  eventId: varchar("event_id", { length: 50 }).notNull(),
  timeSeconds: real("time_seconds").notNull(),
  course: text("course").notNull(),
  date: text("date").notNull(),
  meetName: text("meet_name"),
  splits: jsonb("splits").$type<number[]>(),
  notes: text("notes"),
  ageGroupAtTime: text("age_group_at_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Qualifying standards table
export const qualifyingStandards = pgTable("qualifying_standards", {
  id: varchar("id", { length: 50 }).primaryKey(),
  eventId: varchar("event_id", { length: 50 }).notNull(),
  region: text("region").notNull(),
  ageGroup: text("age_group").notNull(),
  gender: text("gender").notNull(),
  course: text("course").notNull(),
  cutTimeSeconds: real("cut_time_seconds").notNull(),
  season: text("season").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Athlete = typeof athletes.$inferSelect;
export type InsertAthlete = typeof athletes.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;
export type QualifyingStandard = typeof qualifyingStandards.$inferSelect;
export type InsertQualifyingStandard = typeof qualifyingStandards.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertAthleteSchema = createInsertSchema(athletes);
export const selectAthleteSchema = createSelectSchema(athletes);
export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export const insertTimeEntrySchema = createInsertSchema(timeEntries);
export const selectTimeEntrySchema = createSelectSchema(timeEntries);
export const insertQualifyingStandardSchema = createInsertSchema(qualifyingStandards);
export const selectQualifyingStandardSchema = createSelectSchema(qualifyingStandards);
