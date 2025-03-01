import { 
  users, 
  type User, 
  type InsertUser, 
  registrations, 
  type Registration, 
  type InsertRegistration,
  studySessions,
  type StudySession,
  type InsertStudySession,
  userProfiles,
  type UserProfile,
  type InsertUserProfile,
  type UpdateUserProfile,
  adminRequests,
  type AdminRequest,
  type InsertAdminRequest,
  issueReports,
  type IssueReport,
  type InsertIssueReport
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserEmail(userId: number, email: string): Promise<User | undefined>;
  updateUserPassword(userId: number, passwordHash: string): Promise<boolean>;
  updateUserRole(userId: number, role: string): Promise<User | undefined>;
  
  // User profile methods
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<UserProfile | undefined>;
  
  // Registration methods
  getRegistrations(): Promise<Registration[]>;
  getRegistration(id: number): Promise<Registration | undefined>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  
  // Admin Request methods
  getAdminRequests(): Promise<AdminRequest[]>;
  getAdminRequest(id: number): Promise<AdminRequest | undefined>;
  getAdminRequestsByUser(userId: number): Promise<AdminRequest[]>;
  createAdminRequest(request: InsertAdminRequest): Promise<AdminRequest>;
  updateAdminRequest(id: number, status: string, reviewedBy: number, notes?: string): Promise<AdminRequest | undefined>;
  
  // Study Session methods
  getStudySessions(): Promise<StudySession[]>;
  getStudySession(id: number): Promise<StudySession | undefined>;
  getActiveStudySessions(): Promise<StudySession[]>;
  getActiveStudySessionsByGroupType(groupType: string): Promise<StudySession[]>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  updateStudySession(id: number, sessionUpdate: Partial<InsertStudySession>): Promise<StudySession | undefined>;
  deleteStudySession(id: number): Promise<boolean>;
  
  // Issue Report methods
  getIssueReports(): Promise<IssueReport[]>;
  getIssueReport(id: number): Promise<IssueReport | undefined>;
  createIssueReport(report: InsertIssueReport): Promise<IssueReport>;
  updateIssueReport(id: number, status: string, assignedTo?: number, resolution?: string): Promise<IssueReport | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private registrations: Map<number, Registration>;
  private studySessions: Map<number, StudySession>;
  private userProfiles: Map<number, UserProfile>;
  private adminRequests: Map<number, AdminRequest>;
  private issueReports: Map<number, IssueReport>;
  private userCurrentId: number;
  private registrationCurrentId: number;
  private studySessionCurrentId: number;
  private adminRequestCurrentId: number;
  private issueReportCurrentId: number;

  constructor() {
    this.users = new Map();
    this.registrations = new Map();
    this.studySessions = new Map();
    this.userProfiles = new Map();
    this.adminRequests = new Map();
    this.issueReports = new Map();
    this.userCurrentId = 1;
    this.registrationCurrentId = 1;
    this.studySessionCurrentId = 1;
    this.adminRequestCurrentId = 1;
    this.issueReportCurrentId = 1;
  }
  
  // We'll add the sample data after all methods are defined

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    
    const user: User = { 
      id,
      username: insertUser.username ?? null,
      email: insertUser.email ?? null,
      passwordHash: insertUser.passwordHash,
      role: insertUser.role ?? "user",
      registrationId: insertUser.registrationId ?? null,
      isAnonymous: insertUser.isAnonymous ?? false,
      preferredContact: insertUser.preferredContact ?? "username",
      isActive: insertUser.isActive ?? true,
      phone: insertUser.phone ?? null,
      createdAt: now
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUserEmail(userId: number, email: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...user,
      email,
      preferredContact: 'email'
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(userId: number, passwordHash: string): Promise<boolean> {
    const user = this.users.get(userId);
    
    if (!user) {
      return false;
    }
    
    const updatedUser: User = {
      ...user,
      passwordHash
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }
  
  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...user,
      role
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // User profile methods
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return this.userProfiles.get(userId);
  }
  
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const now = new Date();
    
    const userProfile: UserProfile = {
      userId: profile.userId,
      displayName: profile.displayName ?? null,
      biography: profile.biography ?? null,
      location: profile.location ?? null,
      preferences: profile.preferences ?? [],
      updatedAt: now
    };
    
    this.userProfiles.set(profile.userId, userProfile);
    return userProfile;
  }
  
  async updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<UserProfile | undefined> {
    const existing = this.userProfiles.get(userId);
    const now = new Date();
    
    if (existing) {
      // Update existing profile
      const updatedProfile: UserProfile = {
        ...existing,
        displayName: profile.displayName ?? existing.displayName,
        biography: profile.biography ?? existing.biography,
        location: profile.location ?? existing.location,
        preferences: profile.preferences ?? existing.preferences,
        updatedAt: now
      };
      
      this.userProfiles.set(userId, updatedProfile);
      return updatedProfile;
    } else {
      // Create new profile
      const newProfile: UserProfile = {
        userId,
        displayName: profile.displayName ?? null,
        biography: profile.biography ?? null,
        location: profile.location ?? null,
        preferences: profile.preferences ?? [],
        updatedAt: now
      };
      
      this.userProfiles.set(userId, newProfile);
      return newProfile;
    }
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
    
    // Ensure we have valid data for all fields
    const safeInsertRegistration = {
      ...insertRegistration,
      // Ensure name is a string
      name: typeof insertRegistration.name === 'string' ? insertRegistration.name : '',
      // Handle all potential invalid email values
      email: (insertRegistration.email && 
              typeof insertRegistration.email === 'string' &&
              insertRegistration.email !== "" && 
              insertRegistration.email !== "null" && 
              insertRegistration.email !== "undefined") ? insertRegistration.email : null,
      // Ensure other fields have valid values or defaults            
      phone: insertRegistration.phone ?? null,
      contactMethod: insertRegistration.contactMethod ?? null,
      contactConsent: Boolean(insertRegistration.contactConsent),
      groupType: insertRegistration.groupType ?? null,
      sessionId: typeof insertRegistration.sessionId === 'number' ? insertRegistration.sessionId : null,
      availableDays: Array.isArray(insertRegistration.availableDays) ? insertRegistration.availableDays : [],
      availableTimes: Array.isArray(insertRegistration.availableTimes) ? insertRegistration.availableTimes : [],
      flexibilityOption: insertRegistration.flexibilityOption ?? null,
      customTimesNote: insertRegistration.customTimesNote ?? null,
      privacyConsent: Boolean(insertRegistration.privacyConsent)
    };
    
    // Convert undefined values to null to satisfy the Registration type
    const registration: Registration = { 
      id,
      name: safeInsertRegistration.name,
      email: safeInsertRegistration.email,
      phone: safeInsertRegistration.phone,
      contactMethod: safeInsertRegistration.contactMethod,
      contactConsent: safeInsertRegistration.contactConsent,
      groupType: safeInsertRegistration.groupType,
      sessionId: safeInsertRegistration.sessionId,
      availableDays: safeInsertRegistration.availableDays,
      availableTimes: safeInsertRegistration.availableTimes,
      flexibilityOption: safeInsertRegistration.flexibilityOption,
      customTimesNote: safeInsertRegistration.customTimesNote,
      privacyConsent: safeInsertRegistration.privacyConsent,
      createdAt: now
    };
    
    this.registrations.set(id, registration);
    
    // Log the created registration for debugging
    console.log(`Created registration with ID ${id}:`, JSON.stringify(registration, null, 2));
    
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
  
  // Admin Request methods
  async getAdminRequests(): Promise<AdminRequest[]> {
    return Array.from(this.adminRequests.values());
  }
  
  async getAdminRequest(id: number): Promise<AdminRequest | undefined> {
    return this.adminRequests.get(id);
  }
  
  async getAdminRequestsByUser(userId: number): Promise<AdminRequest[]> {
    return Array.from(this.adminRequests.values()).filter(
      (request) => request.userId === userId
    );
  }
  
  async createAdminRequest(request: InsertAdminRequest): Promise<AdminRequest> {
    const id = this.adminRequestCurrentId++;
    const now = new Date();
    
    const adminRequest: AdminRequest = {
      id,
      userId: request.userId,
      requestReason: request.requestReason ?? null,
      status: request.status ?? "pending",
      reviewedBy: request.reviewedBy ?? null,
      reviewNotes: request.reviewNotes ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.adminRequests.set(id, adminRequest);
    return adminRequest;
  }
  
  async updateAdminRequest(
    id: number, 
    status: string, 
    reviewedBy: number, 
    notes?: string
  ): Promise<AdminRequest | undefined> {
    const request = this.adminRequests.get(id);
    
    if (!request) {
      return undefined;
    }
    
    const now = new Date();
    const updatedRequest: AdminRequest = {
      ...request,
      status,
      reviewedBy,
      reviewNotes: notes ?? request.reviewNotes,
      updatedAt: now
    };
    
    this.adminRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Issue Report methods
  async getIssueReports(): Promise<IssueReport[]> {
    return Array.from(this.issueReports.values());
  }
  
  async getIssueReport(id: number): Promise<IssueReport | undefined> {
    return this.issueReports.get(id);
  }
  
  async createIssueReport(report: InsertIssueReport): Promise<IssueReport> {
    const id = this.issueReportCurrentId++;
    const now = new Date();
    
    const issueReport: IssueReport = {
      id,
      description: report.description,
      contactInfo: report.contactInfo ?? null,
      status: report.status ?? "pending",
      assignedTo: null,
      resolution: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.issueReports.set(id, issueReport);
    return issueReport;
  }
  
  async updateIssueReport(
    id: number,
    status: string,
    assignedTo?: number,
    resolution?: string
  ): Promise<IssueReport | undefined> {
    const report = this.issueReports.get(id);
    
    if (!report) {
      return undefined;
    }
    
    const now = new Date();
    const updatedReport: IssueReport = {
      ...report,
      status,
      assignedTo: assignedTo ?? report.assignedTo,
      resolution: resolution ?? report.resolution,
      updatedAt: now
    };
    
    this.issueReports.set(id, updatedReport);
    return updatedReport;
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
