import { eq, and } from 'drizzle-orm';
import { db, tables } from './db';
import { IStorage } from './storage';
import { 
  User, InsertUser, 
  Registration, InsertRegistration,
  StudySession, InsertStudySession 
} from '@shared/schema';

export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(tables.users).where(eq(tables.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(tables.users).where(eq(tables.users.username, username));
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(tables.users).values(user).returning();
    return result[0];
  }

  // Registration methods
  async getRegistrations(): Promise<Registration[]> {
    return await db.select().from(tables.registrations);
  }

  async getRegistration(id: number): Promise<Registration | undefined> {
    const registrations = await db.select().from(tables.registrations).where(eq(tables.registrations.id, id));
    return registrations[0];
  }

  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    const result = await db.insert(tables.registrations).values(registration).returning();
    return result[0];
  }

  // Study Session methods
  async getStudySessions(): Promise<StudySession[]> {
    return await db.select().from(tables.studySessions);
  }

  async getStudySession(id: number): Promise<StudySession | undefined> {
    const sessions = await db.select().from(tables.studySessions).where(eq(tables.studySessions.id, id));
    return sessions[0];
  }

  async getActiveStudySessions(): Promise<StudySession[]> {
    return await db.select().from(tables.studySessions).where(eq(tables.studySessions.isActive, true));
  }

  async getActiveStudySessionsByGroupType(groupType: string): Promise<StudySession[]> {
    return await db.select()
      .from(tables.studySessions)
      .where(and(
        eq(tables.studySessions.isActive, true),
        eq(tables.studySessions.groupType, groupType)
      ));
  }

  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const result = await db.insert(tables.studySessions).values(session).returning();
    return result[0];
  }

  async updateStudySession(id: number, sessionUpdate: Partial<InsertStudySession>): Promise<StudySession | undefined> {
    const result = await db.update(tables.studySessions)
      .set(sessionUpdate)
      .where(eq(tables.studySessions.id, id))
      .returning();
    return result[0];
  }

  async deleteStudySession(id: number): Promise<boolean> {
    const result = await db.delete(tables.studySessions)
      .where(eq(tables.studySessions.id, id))
      .returning();
    return result.length > 0;
  }
}