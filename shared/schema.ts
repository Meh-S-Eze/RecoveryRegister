import { pgTable, text, serial, integer, boolean, timestamp, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (kept from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Study sessions table for admin-created sessions
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(), // General location (e.g., "Church Fellowship Hall")
  address: text("address"), // Specific street address
  date: text("date").notNull(), // Storing as text for flexibility (e.g. "Every Monday starting June 5")
  
  // New fields for better date handling
  startDate: timestamp("start_date"), // Specific start date
  recurringDay: text("recurring_day"), // Day of week for recurring sessions
  isRecurring: boolean("is_recurring").default(true),
  
  time: text("time").notNull(), // Storing as text for flexibility (e.g. "7:00 PM - 9:00 PM")
  groupType: text("group_type").notNull(), // "men" or "women"
  capacity: integer("capacity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  createdAt: true,
});

export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

// Registrations table for Celebrate Recovery step study
export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  contactConsent: boolean("contact_consent").default(false),
  groupType: text("group_type"),
  // Selected study session (optional)
  sessionId: integer("session_id"),
  // For custom availability if no session selected or as additional information
  availableDays: text("available_days").array(),
  availableTimes: text("available_times").array(),
  additionalNotes: text("additional_notes"),
  flexibilityOption: text("flexibility_option"), // "preferred_session", "flexible_schedule", or "either"
  privacyConsent: boolean("privacy_consent").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  createdAt: true,
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;

// Extended schema with validation
export const registrationFormSchema = insertRegistrationSchema.extend({
  privacyConsent: z.boolean().refine(val => val === true, {
    message: "You must acknowledge the privacy notice to continue."
  }),
  groupType: z.string().min(1, "Please select a group type"),
  // Make flexibility option required
  flexibilityOption: z.string().min(1, "Please select a scheduling preference"),
  // Make days and times conditionally required based on flexibilityOption
  availableDays: z.array(z.string()).optional().default([]),
  availableTimes: z.array(z.string()).optional().default([]),
  // Session ID is optional since users can provide custom availability
  sessionId: z.number().optional()
});
