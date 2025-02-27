import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { 
  insertRegistrationSchema, 
  registrationFormSchema, 
  insertStudySessionSchema,
  userLoginSchema,
  userRegisterSchema,
  updateUserProfileSchema,
  updatePasswordSchema,
  updateEmailSchema
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
      console.log("Registration request data:", JSON.stringify(req.body, null, 2));
      
      const data = userRegisterSchema.parse(req.body);
      
      // Get registration data if registrationId is provided
      let registrationData = null;
      if (data.registrationId) {
        try {
          registrationData = await storage.getRegistration(data.registrationId);
          console.log("Found registration data:", JSON.stringify(registrationData, null, 2));
        } catch (regErr) {
          console.error("Error fetching registration data:", regErr);
        }
      }
      
      // Special handling for anonymous users
      if (data.isAnonymous) {
        // For anonymous users, we just need a password
        if (!data.password) {
          return res.status(400).json({ message: "Password is required even for anonymous accounts" });
        }
      } else {
        // For non-anonymous users, check if username exists
        if (data.username) {
          const existingUser = await storage.getUserByUsername(data.username);
          if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
          }
        }
        
        // Check if email exists (if provided)
        if (data.email) {
          const users = await storage.getUsers();
          const emailExists = users.some((u) => u.email === data.email);
          if (emailExists) {
            return res.status(400).json({ message: "Email already registered" });
          }
        }
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      // Add registration name to username if username is not provided
      let finalUsername = data.username;
      if (!finalUsername && registrationData && registrationData.name) {
        // Convert registration name to username format (lowercase, no spaces)
        finalUsername = registrationData.name.toLowerCase().replace(/\s+/g, '_');
        console.log(`Generated username '${finalUsername}' from registration name '${registrationData.name}'`);
      }
      
      // Create user
      const user = await storage.createUser({
        username: finalUsername,
        email: data.email || (registrationData ? registrationData.email : undefined),
        passwordHash,
        role: 'user',
        isAnonymous: data.isAnonymous,
        preferredContact: data.preferredContact || (data.email ? 'email' : 'none'),
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
      // Log the raw request for debugging
      console.log("Raw registration request body:", req.body);
      
      // Deep clone and sanitize the request body to handle all edge cases
      const requestBody = JSON.parse(JSON.stringify(req.body));
      
      // Ensure all required fields exist with defaults if missing
      requestBody.name = requestBody.name || "";
      requestBody.groupType = requestBody.groupType || "";
      requestBody.flexibilityOption = requestBody.flexibilityOption || "";
      requestBody.privacyConsent = Boolean(requestBody.privacyConsent);
      requestBody.contactConsent = Boolean(requestBody.contactConsent);
      
      // Handle all potential invalid email values
      if (!requestBody.email || 
          requestBody.email === "" || 
          requestBody.email === "null" || 
          requestBody.email === "undefined" ||
          typeof requestBody.email !== "string") {
        requestBody.email = undefined;
      }
      
      // Ensure arrays are properly formatted
      requestBody.availableDays = Array.isArray(requestBody.availableDays) ? requestBody.availableDays : [];
      requestBody.availableTimes = Array.isArray(requestBody.availableTimes) ? requestBody.availableTimes : [];
      requestBody.preferences = Array.isArray(requestBody.preferences) ? requestBody.preferences : [];
      
      // Log the sanitized request body for debugging
      console.log("Sanitized registration request body:", JSON.stringify(requestBody, null, 2));
      
      try {
        // Validate the request body against the schema
        const data = registrationFormSchema.parse(requestBody);
        
        // Log the parsed data for debugging
        console.log("Parsed registration data:", JSON.stringify(data, null, 2));
        
        // Create the registration in storage
        const registration = await storage.createRegistration(data);
        
        return res.status(201).json(registration);
      } catch (validationError) {
        // Handle validation errors
        if (validationError instanceof ZodError) {
          // Print detailed validation error information
          console.error("Validation error details:", JSON.stringify(validationError.format(), null, 2));
          console.error("Validation error path:", validationError.errors.map(e => e.path.join('.')));
          
          const formattedError = fromZodError(validationError);
          return res.status(400).json({ 
            message: "Validation error", 
            errors: formattedError.details 
          });
        }
        throw validationError; // Re-throw if not a ZodError
      }
    } catch (error) {
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

  // User profile routes (authenticated only)
  app.get("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      
      // Get user and profile
      const user = await storage.getUser(userId);
      const profile = await storage.getUserProfile(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return basic user info along with profile
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isAnonymous: user.isAnonymous,
          preferredContact: user.preferredContact
        },
        profile: profile || null
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Error fetching user profile" });
    }
  });
  
  app.post("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      
      // Validate profile data
      const profileData = updateUserProfileSchema.parse(req.body);
      
      // Update or create profile
      const updatedProfile = await storage.updateUserProfile(userId, profileData);
      
      return res.json(updatedProfile);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Error updating user profile" });
    }
  });
  
  // Credential update routes (authenticated only)
  app.post("/api/user/password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      
      // Validate password data
      const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
      
      // Get user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash and update new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const updated = await storage.updateUserPassword(userId, passwordHash);
      
      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Error updating password:", error);
      return res.status(500).json({ message: "Error updating password" });
    }
  });
  
  app.post("/api/user/email", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      
      // Validate email data
      const { email, password } = updateEmailSchema.parse(req.body);
      
      // Get user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Password is incorrect" });
      }
      
      // Check if email is already in use by another user
      const users = await storage.getUsers();
      const emailExists = users.some((u) => u.email === email && u.id !== userId);
      
      if (emailExists) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      
      // Update email
      const updatedUser = await storage.updateUserEmail(userId, email);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update email" });
      }
      
      return res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isAnonymous: updatedUser.isAnonymous,
        preferredContact: updatedUser.preferredContact
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Error updating email:", error);
      return res.status(500).json({ message: "Error updating email" });
    }
  });

  // Add a new endpoint to fetch registration by ID for the registration flow
  app.get("/api/public/registration/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      console.log(`Fetching registration data for ID: ${id}`);
      const registration = await storage.getRegistration(id);
      
      if (!registration) {
        console.log(`Registration not found for ID: ${id}`);
        return res.status(404).json({ message: "Registration not found" });
      }

      console.log(`Successfully retrieved registration for ID: ${id}`, JSON.stringify(registration, null, 2));
      
      // Return a more complete set of fields for the registration flow
      return res.json({
        id: registration.id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        contactMethod: registration.contactMethod,
        groupType: registration.groupType,
        sessionId: registration.sessionId,
        availableDays: registration.availableDays,
        availableTimes: registration.availableTimes,
        flexibilityOption: registration.flexibilityOption,
        // Don't include private data like privacy consent
      });
    } catch (error) {
      console.error("Error fetching registration:", error);
      return res.status(500).json({ message: "Error fetching registration" });
    }
  });

  // Add a helper endpoint to prepare registration data for account creation
  app.get("/api/public/prepare-account/:registrationId", async (req: Request, res: Response) => {
    try {
      const registrationId = parseInt(req.params.registrationId);
      if (isNaN(registrationId)) {
        return res.status(400).json({ message: "Invalid registration ID format" });
      }

      console.log(`Preparing account creation data for registration ID: ${registrationId}`);
      const registration = await storage.getRegistration(registrationId);
      
      if (!registration) {
        console.log(`Registration not found for ID: ${registrationId}`);
        return res.status(404).json({ message: "Registration not found" });
      }

      // Generate a suggested username from the registration name
      let suggestedUsername = "";
      if (registration.name) {
        // Convert registration name to username format (lowercase, no spaces)
        suggestedUsername = registration.name.toLowerCase().replace(/\s+/g, '_');
      }
      
      // Return data prepared for account creation
      return res.json({
        registrationId: registration.id,
        suggestedUsername,
        email: registration.email,
        name: registration.name,
        // Include any other fields that might be useful for account creation
      });
    } catch (error) {
      console.error("Error preparing account creation data:", error);
      return res.status(500).json({ message: "Error preparing account creation data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
