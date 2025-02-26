import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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

// Registrations table for Celebrate Recovery step study
export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  contactConsent: boolean("contact_consent").default(false),
  groupType: text("group_type"),
  availability: text("availability"),
  additionalNotes: text("additional_notes"),
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
  availability: z.string().min(1, "Please select your availability")
});
