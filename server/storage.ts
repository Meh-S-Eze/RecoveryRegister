import { 
  users, 
  type User, 
  type InsertUser, 
  registrations, 
  type Registration, 
  type InsertRegistration 
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private registrations: Map<number, Registration>;
  private userCurrentId: number;
  private registrationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.registrations = new Map();
    this.userCurrentId = 1;
    this.registrationCurrentId = 1;
  }

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
      availability: insertRegistration.availability ?? null,
      additionalNotes: insertRegistration.additionalNotes ?? null,
      privacyConsent: insertRegistration.privacyConsent,
      createdAt: now
    };
    
    this.registrations.set(id, registration);
    return registration;
  }
}

export const storage = new MemStorage();
