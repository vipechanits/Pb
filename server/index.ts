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

// Import database configuration
import { dbConfig } from "./db";

// Environment validation - fail fast if critical secrets are missing
const nodeEnv = process.env.NODE_ENV;
const isProduction = dbConfig.isProduction;
const isExplicitDevelopment = nodeEnv === 'development';

console.log(`🔧 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`🔧 NODE_ENV: ${nodeEnv || '(undefined)'}`);

// Require SESSION_SECRET at boot - fail fast if missing
if (!process.env.SESSION_SECRET) {
  console.error('');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('  ❌ FATAL: SESSION_SECRET environment variable is required');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('  Add SESSION_SECRET to your deployment secrets');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('');
  process.exit(1);
}

// Require ADMIN_DEFAULT_PASSWORD in production - fail fast if missing
if (!process.env.ADMIN_DEFAULT_PASSWORD && !isExplicitDevelopment) {
  console.error('');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('  ❌ FATAL: ADMIN_DEFAULT_PASSWORD environment variable is required');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error(`  Current environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.error(`  Current NODE_ENV: ${nodeEnv || '(undefined)'}`);
  console.error('');
  console.error('  Fallback admin passwords are ONLY allowed when NODE_ENV="development"');
  console.error('');
  console.error('  📋 Required action:');
  console.error('  1. Go to Replit Deployments pane');
  console.error('  2. Navigate to Environment Variables section');
  console.error('  3. Add secret: ADMIN_DEFAULT_PASSWORD');
  console.error('  4. Use a strong password (min 12 chars, mixed case, numbers, symbols)');
  console.error('');
  console.error('  ⚠️  DO NOT use deployment secrets in your workspace!');
  console.error('  Deployment secrets are separate from workspace secrets.');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('');
  process.exit(1);
}

// Verify database connection - dbConfig.getDatabaseUrl() will throw if not configured
try {
  const dbUrl = dbConfig.getDatabaseUrl();
  console.log('✓ Database connection configured');
  
  // Validate that production is using a real database (not local helium)
  if (isProduction && dbUrl.includes('helium')) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('  ❌ FATAL: Production cannot use local helium database');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('  DATABASE_URL is pointing to local helium instance.');
    console.error('  Production deployments require a real PostgreSQL database.');
    console.error('');
    console.error('  Current DATABASE_URL: ' + dbUrl.substring(0, 50) + '...');
    console.error('');
    console.error('  📋 Required action:');
    console.error('  1. Ensure Replit PostgreSQL database is provisioned');
    console.error('  2. DATABASE_URL should point to Neon/PostgreSQL cloud instance');
    console.error('  3. Check deployment environment variables configuration');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  }
} catch (error) {
  console.error('');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('  ❌ FATAL: Database connection not configured');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('  Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  console.error('');
  console.error('  📋 Required action:');
  console.error('  1. Verify DATABASE_URL is set in deployment secrets');
  console.error('  2. Ensure PostgreSQL database is provisioned and accessible');
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('');
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
const sessionPool = new Pool({ connectionString: dbConfig.getDatabaseUrl() });

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
    
    // Initialize admin users (PB0 root admin and PB1 secondary admin)
    const { hashPassword } = await import('./auth');
    await storage.initializeAdminUsers(hashPassword);
    
    // Initialize PB#### ID sequence for transaction-safe signup
    await storage.initializeUserIdSequence();
    
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
