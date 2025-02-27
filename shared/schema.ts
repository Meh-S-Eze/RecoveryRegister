import { pgTable, text, serial, integer, boolean, timestamp, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with enhanced auth support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  registrationId: integer("registration_id"), // link to registration if user is a registrant
  isAnonymous: boolean("is_anonymous").default(false), // For users who prefer anonymity
  preferredContact: text("preferred_contact").default("username"), // "username" or "email"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Auth schemas for login and registration
export const userLoginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const userRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAnonymous: z.boolean().optional().default(false),
  preferredContact: z.enum(["username", "email", "none"]).optional().default("username"),
  registrationId: z.number().int("Registration ID must be an integer").positive("Registration ID must be positive").optional(),
}).refine(data => {
  // If anonymous, no username required
  if (data.isAnonymous) return true;
  
  // If registrationId is provided, we can use that to get the name
  if (data.registrationId) return true;
  
  // Otherwise, either username or email is required
  return !!data.username || !!data.email;
}, {
  message: "Either username, email, or registration ID must be provided for non-anonymous accounts",
  path: ["username"]
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
  
  // Fields for better date handling
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

// User profiles table for managing basic demographic information
export const userProfiles = pgTable("user_profiles", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  displayName: text("display_name"),
  biography: text("biography"),
  location: text("location"),
  preferences: text("preferences").array(), // Store serialized preferences
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  updatedAt: true,
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  biography: z.string().max(500, "Biography must be less than 500 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  preferences: z.array(z.string()).optional(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Credentials update schemas
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const updateEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required to update email"),
});

// Registrations table for Celebrate Recovery step study
export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  contactMethod: text("contact_method"),
  groupType: text("group_type"),
  // Selected study session (optional)
  sessionId: integer("session_id"),
  // For custom availability if no session selected or as additional information
  availableDays: text("available_days").array(),
  availableTimes: text("available_times").array(),
  flexibilityOption: text("flexibility_option"), // "preferred_session", "flexible_schedule", or "either"
  contactConsent: boolean("contact_consent").default(false),
  privacyConsent: boolean("privacy_consent").default(false),
  customTimesNote: text("custom_times_note"),
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
  // Make email field super flexible - accept anything but transform invalid values to undefined
  email: z.preprocess(
    (val) => {
      // If it's empty, null, undefined, or not a string, return undefined
      if (!val || val === "" || val === "null" || val === "undefined" || typeof val !== "string") {
        return undefined;
      }
      
      // If it looks like a valid email, keep it
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        return val;
      }
      
      // Otherwise return undefined
      return undefined;
    },
    z.string().email("Please enter a valid email address").optional()
  ),
  // Make flexibility option required
  flexibilityOption: z.string().min(1, "Please select a scheduling preference"),
  // Make days and times conditionally required based on flexibilityOption
  availableDays: z.array(z.string()).optional().default([]),
  availableTimes: z.array(z.string()).optional().default([]),
  // Session ID is optional since users can provide custom availability
  sessionId: z.number().optional()
});
