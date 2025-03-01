import { eq, and } from 'drizzle-orm';
import { db, tables } from './db';
import { IStorage } from './storage';
import { 
  User, InsertUser, 
  Registration, InsertRegistration,
  StudySession, InsertStudySession,
  UserProfile, InsertUserProfile, UpdateUserProfile,
  AdminRequest, InsertAdminRequest,
  IssueReport, InsertIssueReport
} from '@shared/schema';

export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(tables.users).where(eq(tables.users.id, id));
    return users[0];
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(tables.users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(tables.users).where(eq(tables.users.username, username));
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(tables.users).values(user).returning();
    return result[0];
  }
  
  async updateUserEmail(userId: number, email: string): Promise<User | undefined> {
    const result = await db.update(tables.users)
      .set({ email, preferredContact: 'email' })
      .where(eq(tables.users.id, userId))
      .returning();
    return result[0];
  }
  
  async updateUserPassword(userId: number, passwordHash: string): Promise<boolean> {
    const result = await db.update(tables.users)
      .set({ passwordHash })
      .where(eq(tables.users.id, userId))
      .returning();
    return result.length > 0;
  }
  
  // User profile methods
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const profiles = await db.select().from(tables.userProfiles).where(eq(tables.userProfiles.userId, userId));
    return profiles[0];
  }
  
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const result = await db.insert(tables.userProfiles).values(profile).returning();
    return result[0];
  }
  
  async updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<UserProfile | undefined> {
    // Check if profile exists
    const existing = await this.getUserProfile(userId);
    
    if (existing) {
      // Update existing profile
      const result = await db.update(tables.userProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(tables.userProfiles.userId, userId))
        .returning();
      return result[0];
    } else {
      // Create new profile if it doesn't exist
      const result = await db.insert(tables.userProfiles).values({
        userId,
        displayName: profile.displayName,
        biography: profile.biography,
        location: profile.location,
        preferences: profile.preferences
      }).returning();
      return result[0];
    }
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
    try {
      // Ensure we have valid data for all fields
      const safeRegistration = {
        ...registration,
        // Ensure name is a string
        name: typeof registration.name === 'string' ? registration.name : '',
        // Handle all potential invalid email values
        email: (registration.email && 
                typeof registration.email === 'string' &&
                registration.email !== "" && 
                registration.email !== "null" && 
                registration.email !== "undefined") ? registration.email : null,
        // Ensure other fields have valid values or defaults            
        phone: registration.phone ?? null,
        contactMethod: registration.contactMethod ?? null,
        contactConsent: Boolean(registration.contactConsent),
        groupType: registration.groupType ?? null,
        sessionId: typeof registration.sessionId === 'number' ? registration.sessionId : null,
        availableDays: Array.isArray(registration.availableDays) ? registration.availableDays : [],
        availableTimes: Array.isArray(registration.availableTimes) ? registration.availableTimes : [],
        flexibilityOption: registration.flexibilityOption ?? null,
        customTimesNote: registration.customTimesNote ?? null,
        privacyConsent: Boolean(registration.privacyConsent)
      };
      
      // Log the sanitized registration data
      console.log("PostgresStorage: Creating registration with sanitized data:", JSON.stringify(safeRegistration, null, 2));
      
      const result = await db.insert(tables.registrations).values(safeRegistration).returning();
      
      console.log("PostgresStorage: Created registration:", JSON.stringify(result[0], null, 2));
      
      return result[0];
    } catch (error) {
      console.error("PostgresStorage: Error creating registration:", error);
      throw error;
    }
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

  // Admin Request methods
  async getAdminRequests(): Promise<AdminRequest[]> {
    return await db.select().from(tables.adminRequests);
  }
  
  async getAdminRequest(id: number): Promise<AdminRequest | undefined> {
    const requests = await db.select().from(tables.adminRequests).where(eq(tables.adminRequests.id, id));
    return requests[0];
  }
  
  async getAdminRequestsByUser(userId: number): Promise<AdminRequest[]> {
    return await db.select()
      .from(tables.adminRequests)
      .where(eq(tables.adminRequests.userId, userId));
  }
  
  async createAdminRequest(request: InsertAdminRequest): Promise<AdminRequest> {
    const result = await db.insert(tables.adminRequests).values(request).returning();
    return result[0];
  }
  
  async updateAdminRequest(
    id: number, 
    status: string, 
    reviewedBy: number,
    notes?: string
  ): Promise<AdminRequest | undefined> {
    const updateData: any = {
      status,
      reviewedBy,
      updatedAt: new Date()
    };
    
    if (notes) {
      updateData.reviewNotes = notes;
    }
    
    const result = await db.update(tables.adminRequests)
      .set(updateData)
      .where(eq(tables.adminRequests.id, id))
      .returning();
      
    return result[0];
  }
  
  // Add the missing updateUserRole method
  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    const result = await db.update(tables.users)
      .set({ role })
      .where(eq(tables.users.id, userId))
      .returning();
    return result[0];
  }

  // Issue Report methods
  async getIssueReports(): Promise<IssueReport[]> {
    return await db.select().from(tables.issueReports);
  }
  
  async getIssueReport(id: number): Promise<IssueReport | undefined> {
    const reports = await db.select().from(tables.issueReports).where(eq(tables.issueReports.id, id));
    return reports[0];
  }
  
  async createIssueReport(report: InsertIssueReport): Promise<IssueReport> {
    try {
      console.log("Creating issue report:", JSON.stringify(report, null, 2));
      const result = await db.insert(tables.issueReports).values(report).returning();
      console.log("Created issue report:", JSON.stringify(result[0], null, 2));
      return result[0];
    } catch (error) {
      console.error("Error creating issue report:", error);
      throw error;
    }
  }
  
  async updateIssueReport(
    id: number, 
    status: string, 
    assignedTo?: number, 
    resolution?: string
  ): Promise<IssueReport | undefined> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }
    
    if (resolution) {
      updateData.resolution = resolution;
    }
    
    const result = await db.update(tables.issueReports)
      .set(updateData)
      .where(eq(tables.issueReports.id, id))
      .returning();
      
    return result[0];
  }
}