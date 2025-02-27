import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { insertRegistrationSchema, registrationFormSchema, insertStudySessionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { PostgresStorage } from "./pgStorage";

// Create a PostgreSQL storage instance
export const storage = new PostgresStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for registrations
  app.get("/api/registrations", async (req: Request, res: Response) => {
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
