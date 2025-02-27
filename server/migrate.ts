import { db } from './db';
import { users, registrations, studySessions } from '@shared/schema';
import { log } from './vite';

// Create the main database tables
export async function createTables() {
  try {
    // Create the tables if they don't exist
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        email TEXT NOT NULL,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Registrations table
      `CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        contactMethod TEXT,
        groupType TEXT,
        sessionId INTEGER,
        availableDays TEXT[],
        availableTimes TEXT[],
        flexibilityOption TEXT,
        contactConsent BOOLEAN DEFAULT FALSE,
        privacyConsent BOOLEAN DEFAULT FALSE,
        customTimesNote TEXT,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Study sessions table
      `CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        address TEXT,
        date TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE,
        recurring_day TEXT,
        is_recurring BOOLEAN DEFAULT TRUE,
        time TEXT NOT NULL,
        group_type TEXT NOT NULL,
        capacity INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];

    // Execute the queries
    for (const query of queries) {
      await db.execute(query);
    }
    
    log('Database tables created successfully');
    
    // Seed sample data for study sessions
    await seedStudySessions();
    
    return true;
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

// Seed some initial data
async function seedStudySessions() {
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