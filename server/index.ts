import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createTables } from "./migrate";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try to use port 5000 exclusively
  // this serves both the API and the client
  const port = 5000;
  
  // First, try to ensure the port is free
  const findAndKillProcess = () => {
    try {
      // Log the attempt
      log(`Attempting to free port ${port}...`);
      
      // The real attempt to start the server happens after this message
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`serving on port ${port}`);
      }).on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
          log(`Port ${port} is still in use. Please manually restart the workflow.`);
          setTimeout(() => {
            // Try once more with the same port after a delay
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
  
  // Start the process to ensure port 5000 is available
  findAndKillProcess();
})();
