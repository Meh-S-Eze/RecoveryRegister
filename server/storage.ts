import { 
  users, 
  type User, 
  type InsertUser, 
  registrations, 
  type Registration, 
  type InsertRegistration,
  studySessions,
  type StudySession,
  type InsertStudySession
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Registration methods
  getRegistrations(): Promise<Registration[]>;
  getRegistration(id: number): Promise<Registration | undefined>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  
  // Study Session methods
  getStudySessions(): Promise<StudySession[]>;
  getStudySession(id: number): Promise<StudySession | undefined>;
  getActiveStudySessions(): Promise<StudySession[]>;
  getActiveStudySessionsByGroupType(groupType: string): Promise<StudySession[]>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  updateStudySession(id: number, sessionUpdate: Partial<InsertStudySession>): Promise<StudySession | undefined>;
  deleteStudySession(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private registrations: Map<number, Registration>;
  private studySessions: Map<number, StudySession>;
  private userCurrentId: number;
  private registrationCurrentId: number;
  private studySessionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.registrations = new Map();
    this.studySessions = new Map();
    this.userCurrentId = 1;
    this.registrationCurrentId = 1;
    this.studySessionCurrentId = 1;
  }
  
  // We'll add the sample data after all methods are defined

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getRegistrations(): Promise<Registration[]> {
    return Array.from(this.registrations.values());
  }

  async getRegistration(id: number): Promise<Registration | undefined> {
    return this.registrations.get(id);
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = this.registrationCurrentId++;
    const now = new Date();
    
    // Convert undefined values to null to satisfy the Registration type
    const registration: Registration = { 
      id,
      name: insertRegistration.name ?? null,
      email: insertRegistration.email ?? null,
      phone: insertRegistration.phone ?? null,
      contactConsent: insertRegistration.contactConsent ?? null,
      groupType: insertRegistration.groupType ?? null,
      sessionId: insertRegistration.sessionId ?? null,
      availableDays: insertRegistration.availableDays ?? null,
      availableTimes: insertRegistration.availableTimes ?? null,
      additionalNotes: insertRegistration.additionalNotes ?? null,
      flexibilityOption: insertRegistration.flexibilityOption ?? null,
      privacyConsent: insertRegistration.privacyConsent,
      createdAt: now
    };
    
    this.registrations.set(id, registration);
    return registration;
  }
  
  async getStudySessions(): Promise<StudySession[]> {
    return Array.from(this.studySessions.values());
  }
  
  async getStudySession(id: number): Promise<StudySession | undefined> {
    return this.studySessions.get(id);
  }
  
  async getActiveStudySessions(): Promise<StudySession[]> {
    return Array.from(this.studySessions.values()).filter(
      (session) => session.isActive
    );
  }
  
  async getActiveStudySessionsByGroupType(groupType: string): Promise<StudySession[]> {
    return Array.from(this.studySessions.values()).filter(
      (session) => session.isActive && session.groupType === groupType
    );
  }
  
  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = this.studySessionCurrentId++;
    const now = new Date();
    
    const session: StudySession = {
      id,
      title: insertSession.title,
      description: insertSession.description ?? null,
      location: insertSession.location,
      address: insertSession.address ?? null,
      date: insertSession.date,
      time: insertSession.time,
      startDate: insertSession.startDate ?? null,
      recurringDay: insertSession.recurringDay ?? null,
      isRecurring: insertSession.isRecurring ?? true,
      groupType: insertSession.groupType,
      capacity: insertSession.capacity ?? null,
      isActive: insertSession.isActive ?? true,
      createdAt: now
    };
    
    this.studySessions.set(id, session);
    return session;
  }
  
  async updateStudySession(id: number, sessionUpdate: Partial<InsertStudySession>): Promise<StudySession | undefined> {
    const existingSession = this.studySessions.get(id);
    
    if (!existingSession) {
      return undefined;
    }
    
    const updatedSession: StudySession = {
      ...existingSession,
      ...sessionUpdate
    };
    
    this.studySessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async deleteStudySession(id: number): Promise<boolean> {
    return this.studySessions.delete(id);
  }
}

export const storage = new MemStorage();

// Add some sample study sessions
(async () => {
  await storage.createStudySession({
    title: "Men's Morning Step Study",
    description: "Join us for a men's step study focused on recovery from hurts, habits, and hang-ups.",
    location: "Church Fellowship Hall - Room 101",
    address: "123 Faith Street, Springfield, IL 62701",
    date: "Every Tuesday starting March 5, 2025",
    time: "7:00 AM - 8:30 AM",
    groupType: "men",
    capacity: 12,
    isActive: true
  });
  
  await storage.createStudySession({
    title: "Women's Evening Step Study",
    description: "A women's step study in a supportive environment to work through the 12 steps of recovery.",
    location: "Community Center - Maple Room",
    address: "456 Hope Avenue, Springfield, IL 62702",
    date: "Every Thursday starting March 7, 2025",
    time: "6:30 PM - 8:00 PM",
    groupType: "women",
    capacity: 10,
    isActive: true
  });
})();
