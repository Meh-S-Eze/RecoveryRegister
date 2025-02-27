import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { 
  insertRegistrationSchema, 
  registrationFormSchema, 
  insertStudySessionSchema,
  userLoginSchema,
  userRegisterSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { PostgresStorage } from "./pgStorage";
import bcrypt from "bcryptjs";

// Create a PostgreSQL storage instance
export const storage = new PostgresStorage();

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore - session is added by express-session
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
};

// Admin middleware
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore - session is added by express-session
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const user = await storage.getUser(userId);
    if (user && user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ error: "Not authorized" });
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: "Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { identifier, password } = userLoginSchema.parse(req.body);
      
      // Try to find user by username or email
      let user = await storage.getUserByUsername(identifier);
      
      if (!user) {
        // Try by email if not found by username
        const users = await storage.getUsers();
        user = users.find((u) => u.email === identifier);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session data
      // @ts-ignore - session is added by express-session
      req.session.userId = user.id;
      // @ts-ignore - session is added by express-session
      req.session.userRole = user.role;
      
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAnonymous: user.isAnonymous,
        preferredContact: user.preferredContact
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Login error:", error);
      return res.status(500).json({ message: "Error during login" });
    }
  });
  
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = userRegisterSchema.parse(req.body);
      
      // Check if username or email already exists
      if (data.username) {
        const existingUser = await storage.getUserByUsername(data.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      if (data.email) {
        const users = await storage.getUsers();
        const emailExists = users.some((u) => u.email === data.email);
        if (emailExists) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        passwordHash,
        role: 'user',
        isAnonymous: data.isAnonymous,
        preferredContact: data.preferredContact,
        registrationId: data.registrationId
      });
      
      // Set session data
      // @ts-ignore - session is added by express-session
      req.session.userId = user.id;
      // @ts-ignore - session is added by express-session  
      req.session.userRole = user.role;
      
      return res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAnonymous: user.isAnonymous,
        preferredContact: user.preferredContact
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Error during registration" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // @ts-ignore - session is added by express-session
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error during logout" });
      }
      
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        // @ts-ignore - session is added by express-session
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAnonymous: user.isAnonymous,
        preferredContact: user.preferredContact
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Error fetching user profile" });
    }
  });
  // API routes for registrations (admin only)
  app.get("/api/registrations", isAdmin, async (req: Request, res: Response) => {
    try {
      const registrations = await storage.getRegistrations();
      return res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      return res.status(500).json({ message: "Error fetching registrations" });
    }
  });

  app.get("/api/registrations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const registration = await storage.getRegistration(id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      return res.json(registration);
    } catch (error) {
      console.error("Error fetching registration:", error);
      return res.status(500).json({ message: "Error fetching registration" });
    }
  });

  app.post("/api/registrations", async (req: Request, res: Response) => {
    try {
      // Validate the request body against the schema
      const data = registrationFormSchema.parse(req.body);
      
      // Create the registration in storage
      const registration = await storage.createRegistration(data);
      
      return res.status(201).json(registration);
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod error to a more readable format
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Error creating registration:", error);
      return res.status(500).json({ message: "Error creating registration" });
    }
  });

  // API routes for study sessions
  app.get("/api/study-sessions", async (req: Request, res: Response) => {
    try {
      const { groupType, activeOnly } = req.query;
      
      let sessions;
      if (groupType && activeOnly === 'true') {
        sessions = await storage.getActiveStudySessionsByGroupType(groupType as string);
      } else if (activeOnly === 'true') {
        sessions = await storage.getActiveStudySessions();
      } else {
        sessions = await storage.getStudySessions();
      }
      
      return res.json(sessions);
    } catch (error) {
      console.error("Error fetching study sessions:", error);
      return res.status(500).json({ message: "Error fetching study sessions" });
    }
  });

  app.get("/api/study-sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const session = await storage.getStudySession(id);
      if (!session) {
        return res.status(404).json({ message: "Study session not found" });
      }

      return res.json(session);
    } catch (error) {
      console.error("Error fetching study session:", error);
      return res.status(500).json({ message: "Error fetching study session" });
    }
  });

  app.post("/api/study-sessions", async (req: Request, res: Response) => {
    try {
      // Validate the request body against the schema
      const data = insertStudySessionSchema.parse(req.body);
      
      // Create the study session in storage
      const session = await storage.createStudySession(data);
      
      return res.status(201).json(session);
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod error to a more readable format
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Error creating study session:", error);
      return res.status(500).json({ message: "Error creating study session" });
    }
  });

  app.put("/api/study-sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Validate the request body against the schema
      const data = insertStudySessionSchema.partial().parse(req.body);
      
      // Update the study session in storage
      const session = await storage.updateStudySession(id, data);
      
      if (!session) {
        return res.status(404).json({ message: "Study session not found" });
      }
      
      return res.json(session);
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod error to a more readable format
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Error updating study session:", error);
      return res.status(500).json({ message: "Error updating study session" });
    }
  });

  app.delete("/api/study-sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteStudySession(id);
      if (!success) {
        return res.status(404).json({ message: "Study session not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting study session:", error);
      return res.status(500).json({ message: "Error deleting study session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
