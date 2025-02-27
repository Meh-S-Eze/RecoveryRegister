import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createTables } from "./migrate";
import { configureSession, corsOptions } from "./core/middleware/session";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS
app.use(cors(corsOptions));

// Configure session
app.use(configureSession());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize the database and create tables
  try {
    await createTables();
    log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    log('Error initializing database. See console for details.');
  }

  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Don't expose internal error details in production
    const response = process.env.NODE_ENV === 'production'
      ? { message: status === 500 ? 'Internal Server Error' : message }
      : { message, stack: err.stack };

    res.status(status).json(response);
  });

  // Set up Vite in development, static serving in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try to use port 5000 exclusively
  const port = 5000;
  
  // First, try to ensure the port is free
  const findAndKillProcess = () => {
    try {
      log(`Attempting to free port ${port}...`);
      
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`Server running on port ${port}`);
        log(`Environment: ${app.get("env")}`);
      }).on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
          log(`Port ${port} is still in use. Please manually restart the workflow.`);
          setTimeout(() => {
            log(`Retrying port ${port} after delay...`);
            findAndKillProcess();
          }, 1000);
        } else {
          log(`Failed to start server: ${e.message}`);
          process.exit(1);
        }
      });
    } catch (error) {
      log(`Error while trying to free port: ${error}`);
      process.exit(1);
    }
  };
  
  findAndKillProcess();
})();
