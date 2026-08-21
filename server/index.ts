import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";

const app = express();

// Enable gzip compression for all responses
app.use(compression({
  threshold: 1024,  // Only compress files larger than 1KB
  level: 6,         // Balanced compression level (1-9, higher = better compression)
  filter: (req, res) => {
    // Don't compress responses if this request asks for no compression
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use default compression filter for all other responses
    return compression.filter(req, res);
  }
}));

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
app.use(express.json({ limit: '10mb' })); // Increased for base64 image uploads
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS for upload subdomain - allows slyfox.co.za to upload to upload.slyfox.co.za
// This bypasses Cloudflare's 100MB upload limit for large video files
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://slyfox.co.za',
    'https://www.slyfox.co.za',
    'http://localhost:3000',  // Development
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

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
  console.log("SUPABASE_PUBLISHABLE_KEY configured:", !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  console.log("SUPABASE_SECRET_KEY configured:", !!process.env.SUPABASE_SECRET_KEY);
  
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
    // In development: serve public directory and setup vite
    app.use(express.static(path.resolve(import.meta.dirname, "..", "public")));
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // In production: serve public directory first, then built client files
    app.use(express.static(path.resolve(import.meta.dirname, "..", "public")));
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.DOCKER_ENV === 'true' ? "0.0.0.0" : "127.0.0.1";
  // Node 22 defaults to a 5-minute requestTimeout, which aborts large video
  // uploads mid-transfer (1.5GB wedding videos on normal connections exceed it).
  // Match Traefik's 1-hour readTimeout on the websecure entrypoint.
  server.requestTimeout = 3600000;
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
})();
