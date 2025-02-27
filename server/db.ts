import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { users, registrations, studySessions } from '@shared/schema';

// Initialize the database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle client
export const db = drizzle(pool);

// Export tables for convenience
export const tables = {
  users,
  registrations,
  studySessions
};