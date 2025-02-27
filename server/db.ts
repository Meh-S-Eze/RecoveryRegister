import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, registrations, studySessions, userProfiles } from '@shared/schema';

// Initialize the database connection
const queryClient = postgres(process.env.DATABASE_URL!);

// Create a drizzle client
export const db = drizzle(queryClient);

// Export tables for convenience
export const tables = {
  users,
  registrations,
  studySessions,
  userProfiles
};