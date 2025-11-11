import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import csrf from "csurf";
import { Pool } from "@neondatabase/serverless";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import "./types";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Require SESSION_SECRET at boot - fail fast if missing
if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is required');
  console.error('Please set SESSION_SECRET in deployment secrets');
  process.exit(1);
}

// Verify database connection environment variables
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is required');
  console.error('Database connection is not configured');
  process.exit(1);
}

console.log('✓ Environment variables validated');
console.log('✓ Starting PAYBACK247 server...');

const app = express();

// Trust Replit's reverse proxy for production deployments
// This is required for secure cookies and proper IP addresses
app.set('trust proxy', 1);

// Setup PostgreSQL session store
const PgSession = connectPgSimple(session);
const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: true, // Always use secure cookies (Replit provides HTTPS)
      sameSite: 'lax',
    },
  })
);

// CSRF protection - only validate on state-changing methods
const csrfProtection = csrf({ 
  cookie: false,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});
app.use(csrfProtection);

// CSRF error handler - must be after csrfProtection
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('[CSRF] Invalid or missing CSRF token:', {
      path: req.path,
      method: req.method,
      hasToken: !!req.headers['csrf-token']
    });
    return res.status(403).json({ error: 'Invalid or missing CSRF token. Please refresh the page and try again.' });
  }
  next(err);
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
  try {
    console.log('✓ Initializing Express server...');
    const server = await registerRoutes(app);

    // Health check endpoint for deployment monitoring
    app.get('/health', (_req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env: app.get('env')
      });
    });

    console.log('✓ Initializing database...');
    // Initialize system configuration (ensure singleton row exists)
    await storage.initializeSystemConfig();
    
    // Initialize admin users (PB0 and root admin)
    const { hashPassword } = await import('./auth');
    await storage.initializeAdminUsers(hashPassword);
    console.log('✓ Database initialized successfully');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`Error ${status}: ${message}`, err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log('✓ Setting up Vite dev server...');
      await setupVite(app, server);
    } else {
      console.log('✓ Serving static files...');
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    console.log(`✓ Starting server on 0.0.0.0:${port}...`);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`✓ Server successfully started!`);
      console.log(`✓ Listening on http://0.0.0.0:${port}`);
      console.log(`✓ Environment: ${app.get('env')}`);
      console.log(`✓ Health check: http://0.0.0.0:${port}/health`);
      log(`serving on port ${port}`);
    });

    // Handle server errors
    server.on('error', (err: any) => {
      console.error('FATAL: Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('FATAL: Failed to start server:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
})();
