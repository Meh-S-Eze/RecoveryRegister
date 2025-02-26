import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRegistrationSchema, registrationFormSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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

  const httpServer = createServer(app);
  return httpServer;
}
