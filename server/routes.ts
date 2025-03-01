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
  updateEmailSchema,
  adminRequestSchema,
  updateAdminRequestSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { PostgresStorage } from "./pgStorage";
import bcrypt from "bcryptjs";
// Import session types
import "./types";

// Create a PostgreSQL storage instance
export const storage = new PostgresStorage();

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  console.log("Checking authentication status...");
  
  // @ts-ignore - session is added by express-session
  if (req.session) {
    console.log("Session exists:", {
      id: req.session.id,
      userId: req.session.userId,
      userRole: req.session.userRole
    });
    
    if (req.session.userId) {
      console.log("User is authenticated, userId:", req.session.userId);
      return next();
    } else {
      console.log("User is not authenticated, no userId in session");
    }
  } else {
    console.log("No session exists");
  }
  
  return res.status(401).json({ error: "Not authenticated" });
};

// Admin middleware
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  console.log("Checking admin authorization...");
  
  // @ts-ignore - session is added by express-session
  if (!req.session) {
    console.log("Admin check failed: No session found");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // @ts-ignore - session is added by express-session
  const userId = req.session.userId;
  console.log("Admin check - session user ID:", userId);
  
  if (!userId) {
    console.log("Admin check failed: No userId in session");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const user = await storage.getUser(userId);
    console.log("Admin check - user data:", user ? {
      id: user.id,
      username: user.username,
      role: user.role
    } : 'User not found');
    
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      console.log("Admin check passed: User has admin privileges");
      return next();
    }
    
    console.log("Admin check failed: User does not have admin privileges");
    return res.status(403).json({ error: "Not authorized" });
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: "Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  // Development admin bypass login
  app.post("/api/auth/dev-admin-login", async (req: Request, res: Response) => {
    try {
      console.log("Development admin login bypass activated");
      
      // Get the test admin user
      const adminUser = await storage.getUserByUsername("test");
      
      if (!adminUser) {
        console.log("Could not find test admin user");
        return res.status(500).json({ message: "Test admin user not found" });
      }
      
      // Reset the session completely - clear any existing data
      await new Promise<void>((resolve) => {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Error regenerating session:", err);
          }
          resolve();
        });
      });
      
      // Set session data
      req.session.userId = adminUser.id;
      req.session.userRole = adminUser.role;
      
      // Ensure cookie is set with the proper settings
      if (req.session.cookie) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        req.session.cookie.httpOnly = true;
        req.session.cookie.secure = process.env.NODE_ENV === 'production';
        req.session.cookie.sameSite = 'lax';
      }
      
      console.log("Session before save:", {
        sessionID: req.sessionID,
        cookie: req.session.cookie,
        userId: req.session.userId,
        userRole: req.session.userRole
      });
      
      // Save session explicitly to ensure it's stored before sending response
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Error saving dev admin session:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      console.log("Dev admin session saved successfully for:", adminUser.username);
      console.log("Session data:", {
        sessionID: req.sessionID,
        userId: req.session.userId,
        userRole: req.session.userRole
      });
      
      // Set special headers to ensure proper client/server sync
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('X-Session-ID', req.sessionID);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(200).json({
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        isAnonymous: adminUser.isAnonymous,
        preferredContact: adminUser.preferredContact,
        sessionId: req.sessionID // Include the session ID in the response for debugging
      });
    } catch (error) {
      console.error("Dev admin login error:", error);
      return res.status(500).json({ message: "Error during dev admin login" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login attempt with:", JSON.stringify(req.body, null, 2));
      const { identifier, password } = userLoginSchema.parse(req.body);
      
      // Try to find user by username or email
      let user = await storage.getUserByUsername(identifier);
      
      if (!user) {
        // Try by email if not found by username
        const users = await storage.getUsers();
        user = users.find((u) => u.email === identifier);
      }
      
      if (!user) {
        console.log("Login failed: user not found with identifier:", identifier);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log("Found user:", user.id, user.username, user.role);
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        console.log("Login failed: invalid password for user:", user.username);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log("User authenticated successfully:", user.username);
      
      // Set session data
      // @ts-ignore - session is added by express-session
      req.session.userId = user.id;
      // @ts-ignore - session is added by express-session
      req.session.userRole = user.role;
      
      // Save session explicitly to ensure it's stored before sending response
      // @ts-ignore - session is added by express-session
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        console.log("Session saved successfully for user:", user.username);
        console.log("Session data:", JSON.stringify({
          userId: req.session.userId,
          userRole: req.session.userRole
        }, null, 2));
        
        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isAnonymous: user.isAnonymous,
          preferredContact: user.preferredContact
        });
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
      
      // Determine role - if requesting admin, set to pending_admin
      const role = data.requestAdminAccess ? 'pending_admin' : 'user';
      
      // Create user
      const user = await storage.createUser({
        username: finalUsername,
        email: data.email || (registrationData ? registrationData.email : undefined),
        passwordHash,
        role,
        isAnonymous: data.isAnonymous,
        preferredContact: data.preferredContact || (data.email ? 'email' : 'none'),
        registrationId: data.registrationId,
        phone: data.phone
      });
      
      // If requesting admin access, create an admin request
      if (data.requestAdminAccess && data.requestReason) {
        await storage.createAdminRequest({
          userId: user.id,
          requestReason: data.requestReason,
          status: "pending"
        });
        console.log(`Created admin request for user ${user.id} with reason: ${data.requestReason}`);
      }
      
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
        preferredContact: user.preferredContact,
        phone: user.phone,
        requestedAdmin: data.requestAdminAccess || false
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
      console.log("Checking user session in /api/auth/me");
      
      // Check for debug session ID in header for client-side debugging
      const debugSessionId = req.headers['x-debug-session-id'];
      if (debugSessionId) {
        console.log("Received debug session ID in header:", debugSessionId);
      }
      
      // @ts-ignore - session is added by express-session
      if (!req.session || !req.session.userId) {
        console.log("No valid session found in /api/auth/me");
        // Log more details about the session for debugging
        console.log("Session info:", {
          sessionID: req.sessionID,
          // @ts-ignore - session is added by express-session
          cookie: req.session ? req.session.cookie : null,
          rawHeaders: req.rawHeaders,
        });
        
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      console.log("Found userId in session:", userId);
      
      const user = await storage.getUser(userId);
      console.log("User data from storage:", user ? {
        id: user.id,
        username: user.username,
        role: user.role
      } : 'User not found');
      
      if (!user) {
        console.log("User not found in database, destroying session");
        // @ts-ignore - session is added by express-session
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("User authenticated successfully:", user.username);
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
  // Add CORS preflight handling for the authentication endpoints
  app.options("/api/auth/*", (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Debug-Session-ID');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(204).end();
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

  // Admin request routes
  // Create admin request
  app.post("/api/admin-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      
      // Validate admin request data
      const adminRequestData = adminRequestSchema.parse({
        ...req.body,
        userId // Add the user ID from the session
      });
      
      // Check if user already has an admin request
      const existingRequests = await storage.getAdminRequestsByUser(userId);
      if (existingRequests.length > 0) {
        return res.status(400).json({ message: "You already have a pending admin request" });
      }
      
      // Create admin request
      const adminRequest = await storage.createAdminRequest({
        userId: adminRequestData.userId,
        requestReason: adminRequestData.requestReason,
        status: "pending"
      });
      
      // Update user role to pending_admin
      const user = await storage.getUser(userId);
      if (user) {
        // Use the updateUserRole method
        const updatedUser = await storage.updateUserRole(userId, "pending_admin");
        
        // Update session
        // @ts-ignore - session is added by express-session
        req.session.userRole = "pending_admin";
      }
      
      return res.status(201).json(adminRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Error creating admin request:", error);
      return res.status(500).json({ message: "Error creating admin request" });
    }
  });
  
  // Get all admin requests (super_admin only)
  app.get("/api/admin-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      
      // Get user to check if super_admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized to view admin requests" });
      }
      
      // Get all admin requests
      const adminRequests = await storage.getAdminRequests();
      
      // Include user information with each request
      const adminRequestsWithUsers = await Promise.all(
        adminRequests.map(async (request) => {
          const requestUser = await storage.getUser(request.userId);
          return {
            ...request,
            user: requestUser ? {
              id: requestUser.id,
              username: requestUser.username,
              email: requestUser.email,
              phone: requestUser.phone
            } : null
          };
        })
      );
      
      return res.json(adminRequestsWithUsers);
    } catch (error) {
      console.error("Error fetching admin requests:", error);
      return res.status(500).json({ message: "Error fetching admin requests" });
    }
  });
  
  // Get a specific admin request
  app.get("/api/admin-requests/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      
      // Get user to check if super_admin or the requester
      const user = await storage.getUser(userId);
      const adminRequest = await storage.getAdminRequest(id);
      
      if (!adminRequest) {
        return res.status(404).json({ message: "Admin request not found" });
      }
      
      // Only allow super_admin or the requester to view
      if (!user || (user.role !== "super_admin" && adminRequest.userId !== userId)) {
        return res.status(403).json({ message: "Not authorized to view this admin request" });
      }
      
      // Include user information with request
      const requestUser = await storage.getUser(adminRequest.userId);
      const response = {
        ...adminRequest,
        user: requestUser ? {
          id: requestUser.id,
          username: requestUser.username,
          email: requestUser.email,
          phone: requestUser.phone
        } : null
      };
      
      return res.json(response);
    } catch (error) {
      console.error("Error fetching admin request:", error);
      return res.status(500).json({ message: "Error fetching admin request" });
    }
  });
  
  // Update an admin request (super_admin only)
  app.put("/api/admin-requests/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // @ts-ignore - session is added by express-session
      const userId = req.session.userId;
      
      // Get user to check if super_admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized to update admin requests" });
      }
      
      // Validate update data
      const updateData = updateAdminRequestSchema.parse(req.body);
      
      // Update admin request
      const adminRequest = await storage.updateAdminRequest(
        id, 
        updateData.status, 
        userId, 
        updateData.reviewNotes
      );
      
      if (!adminRequest) {
        return res.status(404).json({ message: "Admin request not found" });
      }
      
      // If approved, update user role to admin
      if (updateData.status === "approved") {
        const requestUser = await storage.getUser(adminRequest.userId);
        if (requestUser) {
          // Use the updateUserRole method
          await storage.updateUserRole(adminRequest.userId, "admin");
        }
      }
      
      return res.json(adminRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      console.error("Error updating admin request:", error);
      return res.status(500).json({ message: "Error updating admin request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
