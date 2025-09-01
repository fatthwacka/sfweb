import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";

const app = express();

// Simple logging function
const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${message}`);
};

// Production static file serving
const serveStatic = (app: express.Express) => {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
};

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
  console.log("🔄 Initializing server...");
  console.log("DATABASE_URL configured:", !!process.env.DATABASE_URL);
  console.log("DATABASE_URL hostname:", process.env.DATABASE_URL?.match(/@([^:]+)/)?.[1] || 'not found');
  console.log("SUPABASE_URL configured:", !!process.env.VITE_SUPABASE_URL);
  console.log("SUPABASE_ANON_KEY configured:", !!process.env.VITE_SUPABASE_ANON_KEY);
  console.log("SUPABASE_SERVICE_ROLE_KEY configured:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // In production: serve public directory first, then built client files
  app.use(express.static(path.resolve(import.meta.dirname, "..", "public")));
  serveStatic(app);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.DOCKER_ENV === 'true' ? "0.0.0.0" : "127.0.0.1";
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
})();