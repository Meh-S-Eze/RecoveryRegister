import { db } from './db';
import { users, registrations, studySessions } from '@shared/schema';
import { log } from './vite';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm/expressions';

// Create the main database tables
export async function createTables() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);

    // Create the tables if they don't exist
    const queries = [
      // Users table with enhanced auth support
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT,
        email TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        registration_id INTEGER,
        is_anonymous BOOLEAN DEFAULT FALSE,
        preferred_contact TEXT DEFAULT 'username',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      // User profiles table for basic demographic information
      `CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id),
        display_name TEXT,
        biography TEXT,
        location TEXT,
        preferences TEXT[],
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      // Registrations table
      `CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        contact_method TEXT,
        group_type TEXT,
        session_id INTEGER,
        available_days TEXT[],
        available_times TEXT[],
        flexibility_option TEXT,
        contact_consent BOOLEAN DEFAULT FALSE,
        privacy_consent BOOLEAN DEFAULT FALSE,
        custom_times_note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      // Study sessions table
      `CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        address TEXT,
        date TEXT NOT NULL,
        start_date TIMESTAMPTZ,
        recurring_day TEXT,
        is_recurring BOOLEAN DEFAULT TRUE,
        time TEXT NOT NULL,
        group_type TEXT NOT NULL,
        capacity INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    ];

    // Execute the queries
    for (const query of queries) {
      await sql.unsafe(query);
    }
    
    log('Database tables created successfully');
    
    // Close the connection after creating tables
    await sql.end();
    
    // Seed sample data
    await seedStudySessions();
    await seedAdminUser();
    
    return true;
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

// Seed some initial data for study sessions
export async function seedStudySessions() {
  try {
    // Check if we already have study sessions
    const existingSessions = await db.select().from(studySessions);
    
    if (existingSessions.length === 0) {
      // Insert sample study sessions
      await db.insert(studySessions).values([
        {
          title: "Men's Morning Step Study",
          description: "Join us for a men's step study focused on recovery from hurts, habits, and hang-ups.",
          location: "Church Fellowship Hall - Room 101",
          address: "123 Faith Street, Springfield, IL 62701",
          date: "Every Tuesday starting March 5, 2025",
          time: "7:00 AM - 8:30 AM",
          groupType: "men",
          capacity: 12,
          isActive: true
        },
        {
          title: "Women's Evening Step Study",
          description: "A women's step study in a supportive environment to work through the 12 steps of recovery.",
          location: "Community Center - Maple Room",
          address: "456 Hope Avenue, Springfield, IL 62702",
          date: "Every Thursday starting March 7, 2025",
          time: "6:30 PM - 8:00 PM",
          groupType: "women",
          capacity: 10,
          isActive: true
        }
      ]);
      
      log('Sample study sessions created');
    }
  } catch (error) {
    console.error('Error seeding study sessions:', error);
    throw error;
  }
}

// Create a default admin user for initial access
export async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));
    
    if (existingAdmin.length === 0) {
      // Create an admin user
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await db.insert(users).values({
        username: 'admin',
        email: 'admin@celebraterecovery.org',
        passwordHash,
        role: 'admin',
        isAnonymous: false,
        preferredContact: 'email',
        isActive: true
      });
      
      log('Default admin user created');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
}