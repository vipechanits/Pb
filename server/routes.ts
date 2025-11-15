import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { insertActivationSchema, insertActivationPaymentSchema, updateActivationStatusSchema, updateProfileSchema, submitPaymentProofSchema, confirmPaymentSchema, rejectPaymentSchema, users, reentries, activationPayments, forgotPasswordSchema, resetPasswordSchema, updateEmailSchema, updatePasswordSchema, manualActivationCompletionSchema } from "@shared/schema";
import { hashPassword, verifyPassword, serializeUser } from "./auth";
import { generateUserPaymentQR } from "./qrcode-generator";
import { z } from "zod";
import { db } from "./db";
import { eq, desc, sql, count, or, and } from "drizzle-orm";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from "./lib/email";
import { IncomeService } from "./income-service";

// Middleware to check if user is authenticated
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Middleware to check if user is admin
function requireAdmin(req: any, res: any, next: any) {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden - Admin access required" });
  }
  next();
}

// SECURITY: Invalidate all other sessions for a user (e.g., after password change)
async function invalidateOtherSessions(userId: string, currentSessionId: string): Promise<void> {
  try {
    // Query PostgreSQL session store to find and delete other sessions for this user
    // The connect-pg-simple session store uses a table called 'session'
    // with columns: sid (session ID) and sess (JSON data containing userId)
    await db.execute(sql`
      DELETE FROM session
      WHERE sess::jsonb->>'userId' = ${userId}
      AND sid != ${currentSessionId}
    `);
    console.log(`[SESSION] Invalidated all other sessions for user ${userId}`);
  } catch (error) {
    console.error(`[SESSION] Failed to invalidate other sessions for user ${userId}:`, error);
    // Don't throw - session invalidation failure shouldn't block password update
  }
}

// Rate limiter utility using sliding window algorithm
class RateLimiterStore {
  private buckets = new Map<string, { count: number; firstHit: number; lastHit: number }>();
  private readonly maxBuckets = 10000; // Prevent memory bloat
  
  constructor() {
    // Cleanup expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }
  
  check(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    
    // No previous attempts or window expired - allow and reset
    if (!bucket || (now - bucket.firstHit) >= windowMs) {
      this.buckets.set(key, { count: 1, firstHit: now, lastHit: now });
      return { allowed: true };
    }
    
    // Within window - check if limit exceeded
    if (bucket.count >= limit) {
      const retryAfter = Math.ceil((bucket.firstHit + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    // Increment count and update last hit
    bucket.count++;
    bucket.lastHit = now;
    return { allowed: true };
  }
  
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Remove buckets older than 24 hours
    const entries = Array.from(this.buckets.entries());
    for (const [key, bucket] of entries) {
      if (now - bucket.lastHit > maxAge) {
        this.buckets.delete(key);
      }
    }
    
    // If still over limit, remove oldest buckets
    if (this.buckets.size > this.maxBuckets) {
      const sortedBuckets = Array.from(this.buckets.entries())
        .sort((a, b) => a[1].lastHit - b[1].lastHit);
      
      const toRemove = sortedBuckets.slice(0, sortedBuckets.length - this.maxBuckets);
      toRemove.forEach(([key]) => this.buckets.delete(key));
    }
  }
}

// Shared rate limiter instance
const rateLimiter = new RateLimiterStore();

// Rate limit middleware factory
function applyRateLimit(options: {
  keyFn: (req: any) => string;
  limit: number;
  windowMs: number;
  name?: string;
}) {
  return (req: any, res: any, next: any) => {
    const key = options.keyFn(req);
    const result = rateLimiter.check(key, options.limit, options.windowMs);
    
    if (!result.allowed) {
      console.warn(`[RATE_LIMIT] ${options.name || 'Request'} blocked for key: ${key.substring(0, 20)}...`);
      
      if (result.retryAfter) {
        res.set('Retry-After', String(result.retryAfter));
      }
      
      return res.status(429).json({
        error: "Too many requests. Please try again later."
      });
    }
    
    next();
  };
}

// Helper to extract client IP (respecting proxy headers)
function getClientIp(req: any): string {
  // Try X-Forwarded-For first (Replit uses reverse proxy)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Take first IP if multiple
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  // Fallback to req.ip
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // CSRF token endpoint - ensures session is saved so cookie is set before first login attempt
  app.get("/api/csrf-token", (req: any, res) => {
    // Touch the session to ensure it gets saved and the cookie is sent
    if (!req.session.csrfInitialized) {
      req.session.csrfInitialized = true;
      req.session.save((err: any) => {
        if (err) {
          console.error('[CSRF] Error saving session:', err);
          return res.status(500).json({ error: 'Failed to initialize session' });
        }
        res.json({ csrfToken: req.csrfToken() });
      });
    } else {
      res.json({ csrfToken: req.csrfToken() });
    }
  });

  // Authentication routes
  
  // Signup - Rate limited to prevent spam account creation
  app.post("/api/auth/signup", 
    applyRateLimit({
      keyFn: (req) => getClientIp(req),
      limit: 20,
      windowMs: 60 * 60 * 1000, // 20 signups per hour per IP (increased for testing)
      name: 'Signup'
    }),
    async (req, res) => {
    try {
      const { email, password, sponsorId, binaryLeg } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Validate binaryLeg if provided
      if (binaryLeg && binaryLeg !== 'left' && binaryLeg !== 'right') {
        return res.status(400).json({ error: "Binary leg must be 'left' or 'right'" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Auto-assign PB0 as sponsor if no sponsor provided
      // ALL admin fees and fallback payments go to PB0
      let finalSponsorId = sponsorId ? sponsorId.toUpperCase() : 'PB0';
      let finalBinaryLeg = binaryLeg;
      
      // Validate sponsor exists
      const sponsor = await storage.getUserByUserId(finalSponsorId);
      if (!sponsor) {
        return res.status(400).json({ error: `Invalid sponsor ID: ${finalSponsorId}` });
      }
      
      // Auto-select best leg if not provided
      if (!finalBinaryLeg) {
        finalBinaryLeg = await storage.determineBestLeg(finalSponsorId);
        console.log(`[SIGNUP] Auto-assigned ${finalBinaryLeg} leg for sponsor ${finalSponsorId}`);
      }
      
      // Create user with auto-generated PB#### ID (transaction-safe)
      // Binary leg placement deferred to activation (stored as requested preference)
      const user = await storage.createUserWithGeneratedId({
        email,
        password: hashedPassword,
        role: 'user',
        // userId auto-generated from sequence (PB10000+)
        sponsorId: finalSponsorId, // Auto-assign PB0 if not provided (all admin fees go to PB0)
        binaryLeg: finalBinaryLeg, // DEPRECATED: kept for backward compatibility
        sponsorRequestedLeg: finalBinaryLeg, // Requested leg preference (actual placement at activation)
        isActivated: false,
        emailVerified: true, // Auto-verify email (no verification required)
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      });
      
      console.log(`[SIGNUP] Created user ${user.userId} (${email}) - binary placement deferred to activation`);
      
      // Auto-login after signup
      req.session.userId = user.id;
      req.session.isAdmin = user.role === 'admin';
      
      // Save session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.status(201).json({ 
          message: "Account created successfully! You are now logged in.",
          user: serializeUser(user)
        });
      });
    } catch (error: any) {
      // Enhanced error logging for debugging
      console.error("========================================");
      console.error("ERROR DURING SIGNUP:");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Log Postgres-specific errors
      if (error.code) {
        console.error("Postgres error code:", error.code);
        console.error("Postgres error detail:", error.detail);
        console.error("Postgres error constraint:", error.constraint);
      }
      
      // Provide specific error messages for known issues
      if (error.code === '23505') { // Unique constraint violation
        console.error("UNIQUE CONSTRAINT VIOLATION:", error.constraint);
        return res.status(400).json({ 
          error: "This email is already registered or account creation conflict occurred" 
        });
      }
      
      if (error.message?.includes('sequence')) {
        console.error("SEQUENCE ERROR - pb_user_id_seq may not be initialized");
        return res.status(500).json({ 
          error: "System configuration error. Please contact support." 
        });
      }
      
      console.error("========================================");
      res.status(500).json({ error: "Failed to create account" });
    }
  });
  
  // Login - Rate limited to prevent brute-force attacks
  app.post("/api/auth/login", 
    applyRateLimit({
      keyFn: (req) => getClientIp(req),
      limit: 600,
      windowMs: 15 * 60 * 1000, // 600 attempts per 15 minutes per IP
      name: 'Login'
    }),
    async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Email verification disabled - users can login immediately
      
      // Set session and save it before responding
      req.session.userId = user.id;
      req.session.isAdmin = user.role === 'admin';
      
      // Ensure session is saved before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json({ user: serializeUser(user) });
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });
  
  // Email Verification
  app.get("/api/auth/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }
      
      // Hash the token to compare with stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find user with this token
      const user = await storage.getUserByVerificationToken(tokenHash);
      
      if (!user) {
        return res.status(400).json({ 
          error: "Invalid or expired verification link. Please request a new one.",
          expired: true
        });
      }
      
      // Check if token is expired
      if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
        return res.status(400).json({ 
          error: "Verification link has expired. Please request a new one.",
          expired: true
        });
      }
      
      // Check if already verified
      if (user.emailVerified) {
        return res.status(200).json({ 
          message: "Email already verified. You can now log in.",
          alreadyVerified: true
        });
      }
      
      // Mark email as verified and clear token
      await storage.markEmailAsVerified(user.id);
      
      console.log(`[EMAIL_VERIFY] User ${user.userId} (${user.email}) verified their email`);
      
      // Auto-login user after verification
      req.session.userId = user.id;
      req.session.isAdmin = user.role === 'admin';
      
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session after verification:", err);
          return res.status(200).json({ 
            message: "Email verified successfully! Please log in.",
            verified: true
          });
        }
        res.json({ 
          message: "Email verified successfully! You are now logged in.",
          verified: true,
          user: serializeUser(user)
        });
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });
  
  // Password Reset Routes
  
  // Forgot password - Generate reset token
  app.post("/api/auth/forgot-password", 
    applyRateLimit({
      keyFn: (req) => req.body.email?.toLowerCase().trim() || 'unknown',
      limit: 20,
      windowMs: 60 * 60 * 1000, // 20 requests per hour per email
      name: 'Forgot Password'
    }),
    async (req, res) => {
      try {
        // Validate request body
        const validation = forgotPasswordSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: validation.error.errors[0].message });
        }
        
        const { email } = validation.data;
        const normalizedEmail = email.toLowerCase().trim();
        
        // Always return generic success message (prevent email enumeration)
        const genericMessage = "If an account with that email exists, a password reset token has been generated.";
        
        // Check if user exists
        const user = await storage.getUserByEmail(normalizedEmail);
        if (!user) {
          console.warn(`[FORGOT_PASSWORD] Attempt for non-existent email: ${normalizedEmail}`);
          return res.json({ message: genericMessage });
        }
        
        // Generate secure random token (32 bytes = 64 hex chars)
        const rawToken = crypto.randomBytes(32).toString('hex');
        
        // Create password reset token (stores SHA-256 hash)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        await storage.createPasswordResetToken(
          user.userId!, // userId
          normalizedEmail, // email
          rawToken, // token (will be hashed in storage layer)
          expiresAt // expiresAt
        );
        
        // Send password reset email (async, don't wait)
        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
          : `http://localhost:5000`;
        
        sendPasswordResetEmail(normalizedEmail, rawToken, baseUrl).catch((err) => {
          console.error('[FORGOT_PASSWORD] Failed to send password reset email:', err);
        });
        
        console.log(`[FORGOT_PASSWORD] Password reset email sent to ${normalizedEmail}`);
        
        // Return generic success message only (prevent email enumeration + token exposure)
        res.json({ 
          message: genericMessage
        });
      } catch (error) {
        console.error("Error during forgot password:", error);
        res.status(500).json({ error: "Failed to process password reset request" });
      }
    }
  );
  
  // Verify reset token - Check if token is valid
  app.get("/api/auth/verify-reset-token/:token",
    applyRateLimit({
      keyFn: (req) => getClientIp(req),
      limit: 20,
      windowMs: 60 * 1000, // 20 requests per minute per IP
      name: 'Verify Reset Token'
    }),
    async (req, res) => {
      try {
        const { token } = req.params;
        
        if (!token) {
          return res.status(400).json({ error: "Token is required" });
        }
        
        // Verify token exists and is valid
        const resetToken = await storage.getPasswordResetToken(token);
        
        if (!resetToken) {
          console.warn(`[VERIFY_TOKEN] Invalid or expired token attempt from IP: ${getClientIp(req)}`);
          return res.json({ valid: false });
        }
        
        // Check if token already used
        if (resetToken.usedAt) {
          console.warn(`[VERIFY_TOKEN] Attempt to reuse token for user ${resetToken.userId}`);
          return res.json({ valid: false });
        }
        
        // Check if token expired
        if (new Date() > new Date(resetToken.expiresAt)) {
          console.warn(`[VERIFY_TOKEN] Expired token attempt for user ${resetToken.userId}`);
          return res.json({ valid: false });
        }
        
        // Token is valid
        res.json({ 
          valid: true,
          email: resetToken.email
        });
      } catch (error) {
        console.error("Error verifying reset token:", error);
        res.status(500).json({ error: "Failed to verify token" });
      }
    }
  );
  
  // Reset password - Update password with valid token
  app.post("/api/auth/reset-password",
    applyRateLimit({
      keyFn: (req) => getClientIp(req),
      limit: 20,
      windowMs: 60 * 60 * 1000, // 20 requests per hour per IP
      name: 'Reset Password'
    }),
    async (req, res) => {
      try {
        // Validate request body
        const validation = resetPasswordSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: validation.error.errors[0].message });
        }
        
        const { token, newPassword } = validation.data;
        
        // Verify token exists and is valid
        const resetToken = await storage.getPasswordResetToken(token);
        
        if (!resetToken) {
          console.warn(`[RESET_PASSWORD] Invalid token attempt from IP: ${getClientIp(req)}`);
          return res.status(400).json({ error: "Invalid or expired reset token" });
        }
        
        // Check if token already used
        if (resetToken.usedAt) {
          console.warn(`[RESET_PASSWORD] Attempt to reuse token for user ${resetToken.userId}`);
          return res.status(400).json({ error: "Reset token has already been used" });
        }
        
        // Check if token expired
        if (new Date() > new Date(resetToken.expiresAt)) {
          console.warn(`[RESET_PASSWORD] Expired token attempt for user ${resetToken.userId}`);
          return res.status(400).json({ error: "Reset token has expired" });
        }
        
        // Hash new password
        const hashedPassword = await hashPassword(newPassword);
        
        // Update user password and invalidate all reset tokens
        await storage.updateUserPassword(resetToken.userId, hashedPassword);
        
        // Mark token as used
        await storage.markTokenAsUsed(token);
        
        // Invalidate all sessions for this user (security measure)
        // TODO: Implement session invalidation via session store
        // For now, user will need to log in again with new password
        
        console.log(`[RESET_PASSWORD] Password successfully reset for user ${resetToken.userId}`);
        
        res.json({ 
          message: "Password has been reset successfully. Please log in with your new password."
        });
      } catch (error) {
        console.error("Error during password reset:", error);
        res.status(500).json({ error: "Failed to reset password" });
      }
    }
  );
  
  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: serializeUser(user) });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  
  // Profile routes
  
  // Get user profile
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: serializeUser(user) });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  
  // Update user email (requires security code verification)
  app.patch("/api/profile/email", requireAuth,
    applyRateLimit({
      keyFn: (req) => req.session.userId || getClientIp(req),
      limit: 20,
      windowMs: 60 * 60 * 1000, // 20 requests per hour
      name: 'Update Email'
    }),
    async (req, res) => {
      try {
        const validation = updateEmailSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: validation.error.errors[0].message });
        }
        
        const { newEmail, securityCode } = validation.data;
        const normalizedEmail = newEmail.toLowerCase().trim();
        
        // Get current user
        const user = await storage.getUserById(req.session.userId!);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Verify security code (SECURITY: use constant-time bcrypt comparison)
        if (!user.securityCode) {
          return res.status(400).json({ error: "Security code not set. Please set up your security code first." });
        }
        
        const isValidCode = await verifyPassword(securityCode, user.securityCode);
        if (!isValidCode) {
          console.warn(`[UPDATE_EMAIL] Invalid security code attempt for user ${user.userId}`);
          return res.status(401).json({ error: "Invalid security code" });
        }
        
        // Check if email already exists
        const existingUser = await storage.getUserByEmail(normalizedEmail);
        if (existingUser && existingUser.id !== req.session.userId) {
          return res.status(400).json({ error: "Email address is already in use" });
        }
        
        // Update email
        await db.update(users)
          .set({ email: normalizedEmail })
          .where(eq(users.id, req.session.userId!));
        
        console.log(`[UPDATE_EMAIL] Email updated for user ${user.userId} from ${user.email} to ${normalizedEmail}`);
        
        res.json({ message: "Email updated successfully" });
      } catch (error) {
        console.error("Error updating email:", error);
        res.status(500).json({ error: "Failed to update email" });
      }
    }
  );
  
  // Update user password (requires security code, sends confirmation email)
  app.patch("/api/profile/password", requireAuth,
    applyRateLimit({
      keyFn: (req) => req.session.userId || getClientIp(req),
      limit: 20,
      windowMs: 60 * 60 * 1000, // 20 requests per hour
      name: 'Update Password'
    }),
    async (req, res) => {
      try {
        const validation = updatePasswordSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: validation.error.errors[0].message });
        }
        
        const { newPassword, securityCode } = validation.data;
        
        // Get current user
        const user = await storage.getUserById(req.session.userId!);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Verify security code (SECURITY: use constant-time bcrypt comparison)
        if (!user.securityCode) {
          return res.status(400).json({ error: "Security code not set. Please set up your security code first." });
        }
        
        const isValidCode = await verifyPassword(securityCode, user.securityCode);
        if (!isValidCode) {
          console.warn(`[UPDATE_PASSWORD] Invalid security code attempt for user ${user.userId}`);
          return res.status(401).json({ error: "Invalid security code" });
        }
        
        // SECURITY: Reject pre-hashed passwords (must be plaintext only)
        if (newPassword.startsWith('$2a$') || newPassword.startsWith('$2b$') || newPassword.startsWith('$2y$')) {
          console.warn(`[UPDATE_PASSWORD] Rejected pre-hashed password attempt for user ${user.userId}`);
          return res.status(400).json({ error: "Invalid password format" });
        }
        
        // Hash new password server-side
        const hashedPassword = await hashPassword(newPassword);
        
        // Update password and invalidate all reset tokens
        await storage.updateUserPassword(user.userId!, hashedPassword);
        
        // Invalidate all password reset tokens for this user (security measure)
        await db.update(users)
          .set({ passwordResetToken: null, passwordResetExpiry: null })
          .where(eq(users.id, req.session.userId!));
        
        // SECURITY: Invalidate all other sessions for this user (prevent session hijacking)
        const currentSessionId = req.sessionID;
        await invalidateOtherSessions(user.userId!, currentSessionId);
        
        // SECURITY: Regenerate current session ID (prevent session fixation)
        await new Promise<void>((resolve, reject) => {
          req.session.regenerate((err: any) => {
            if (err) {
              console.error('[UPDATE_PASSWORD] Failed to regenerate session:', err);
              reject(err);
            } else {
              // Restore session data after regeneration
              req.session.userId = user.id;
              req.session.isAdmin = user.role === 'admin';
              resolve();
            }
          });
        });
        
        console.log(`[UPDATE_PASSWORD] Password updated and sessions invalidated for user ${user.userId}`);
        
        // Send confirmation email (async, with error handling)
        try {
          await sendPasswordChangedEmail(user.email, user.name);
          console.log(`[UPDATE_PASSWORD] Confirmation email sent to ${user.email}`);
        } catch (emailError) {
          console.error('[UPDATE_PASSWORD] Failed to send confirmation email:', emailError);
          // Don't fail the request if email fails - password is already updated
        }
        
        res.json({ message: "Password updated successfully. A confirmation email has been sent." });
      } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ error: "Failed to update password" });
      }
    }
  );
  
  // Get public user info (for sponsor details, etc.)
  app.get("/api/users/:userId/public", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUserByUserId(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Return only public information
      res.json({ 
        userId: user.userId,
        name: user.name || null,
        isActivated: user.isActivated
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  });

  // Get binary tree structure for a user (with lazy loading support)
  app.get("/api/users/:userId/binary-tree", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const maxDepth = parseInt(req.query.maxDepth as string) || 5; // Default 5 levels for initial load
      const requestingUser = await storage.getUserById(req.session.userId!);
      
      if (!requestingUser?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Authorization: Can view if (1) own tree, (2) admin, or (3) target is in requester's downline
      const canView = 
        requestingUser.userId === userId ||
        requestingUser.role === 'admin' ||
        await storage.isInDownline(requestingUser.userId, userId);
        
      if (!canView) {
        return res.status(403).json({ error: "Forbidden - You can only view your own tree or downline trees" });
      }
      
      const rootUser = await storage.getUserByUserId(userId);
      if (!rootUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get sponsor info for the root node
      // Exclude PB0 (admin) as per documentation: "admin account (PB0) completely excluded from tree structures"
      let directSponsor = null;
      if (rootUser.sponsorId && rootUser.sponsorId !== 'PB0') {
        const sponsor = await storage.getUserByUserId(rootUser.sponsorId);
        if (sponsor) {
          directSponsor = {
            userId: sponsor.userId,
            name: sponsor.name,
            email: sponsor.email,
            isActivated: sponsor.isActivated,
          };
        }
      }
      
      // Recursively fetch binary tree with sponsor and placement info
      const fetchTreeNode = async (user: any, depth: number = 0, parentUserId: string | null): Promise<any> => {
        // Find users under this user's left and right legs
        const [leftUsers, rightUsers] = await Promise.all([
          storage.getUsersBySponsorAndLeg(user.userId, 'left'),
          storage.getUsersBySponsorAndLeg(user.userId, 'right'),
        ]);
        
        const hasLeftChild = leftUsers && leftUsers.length > 0;
        const hasRightChild = rightUsers && rightUsers.length > 0;
        
        const node: any = {
          userId: user.userId,
          name: user.name,
          email: user.email,
          isActivated: user.isActivated,
          leftLegCount: user.leftLegCount,
          rightLegCount: user.rightLegCount,
          personalLeftCount: user.personalLeftCount,
          personalRightCount: user.personalRightCount,
          totalReferrals: user.totalReferrals,
          binaryMatchedPairs: user.binaryMatchedPairs || 0,
          
          // Sponsor and placement info
          sponsorId: user.sponsorId,
          directSponsor: depth === 0 ? directSponsor : null, // Only for root
          // Compare to immediate parent: if no parent (root), mark as 'direct'; otherwise compare sponsorId
          placementType: !parentUserId ? 'direct' : (user.sponsorId === parentUserId ? 'direct' : 'spillover') as 'direct' | 'spillover',
          binaryLeg: user.binaryLeg,
          
          // Lazy loading flags
          hasLeftChild,
          hasRightChild,
        };
        
        // Only fetch children if within depth limit
        // Don't include leftChild/rightChild unless they're being loaded
        if (depth < maxDepth) {
          if (hasLeftChild) {
            node.leftChild = await fetchTreeNode(leftUsers[0], depth + 1, user.userId);
          }
          if (hasRightChild) {
            node.rightChild = await fetchTreeNode(rightUsers[0], depth + 1, user.userId);
          }
        }
        
        return node;
      };
      
      const tree = await fetchTreeNode(rootUser, 0, null); // Root has no parent
      res.json(tree);
    } catch (error) {
      console.error("Error fetching binary tree:", error);
      res.status(500).json({ error: "Failed to fetch binary tree" });
    }
  });
  
  // Get child nodes for a specific user (for lazy loading)
  app.get("/api/users/:userId/binary-tree/children/:childUserId", requireAuth, async (req, res) => {
    try {
      const { userId, childUserId } = req.params;
      const requestingUser = await storage.getUserById(req.session.userId!);
      
      if (!requestingUser?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Authorization: Can view if (1) own tree, (2) admin, or (3) target is in requester's downline
      const canView = 
        requestingUser.userId === userId ||
        requestingUser.role === 'admin' ||
        await storage.isInDownline(requestingUser.userId, userId);
        
      if (!canView) {
        return res.status(403).json({ error: "Forbidden - You can only view your own tree or downline trees" });
      }
      
      const childUser = await storage.getUserByUserId(childUserId);
      if (!childUser) {
        return res.status(404).json({ error: "Child user not found" });
      }
      
      // Fetch ONLY immediate children (left and right) of the node being expanded
      // childUserId is the parent of the children we're fetching
      const [leftUsers, rightUsers] = await Promise.all([
        storage.getUsersBySponsorAndLeg(childUserId, 'left'),
        storage.getUsersBySponsorAndLeg(childUserId, 'right'),
      ]);
      
      const buildChildNode = (user: any): any => {
        return {
          userId: user.userId,
          name: user.name,
          email: user.email,
          isActivated: user.isActivated,
          leftLegCount: user.leftLegCount,
          rightLegCount: user.rightLegCount,
          personalLeftCount: user.personalLeftCount,
          personalRightCount: user.personalRightCount,
          totalReferrals: user.totalReferrals,
          binaryMatchedPairs: user.binaryMatchedPairs || 0,
          sponsorId: user.sponsorId,
          directSponsor: null,
          // childUserId is the parent being expanded - check if this child is directly sponsored by it
          placementType: user.sponsorId === childUserId ? 'direct' : 'spillover' as 'direct' | 'spillover',
          binaryLeg: user.binaryLeg,
          hasLeftChild: false, // Will be populated below
          hasRightChild: false,
        };
      };
      
      // Build response with just the immediate children
      const response: any = {
        leftChild: null,
        rightChild: null,
      };
      
      if (leftUsers && leftUsers.length > 0) {
        const leftNode = buildChildNode(leftUsers[0]);
        // Check if left child has its own children
        const [leftGrandLeft, leftGrandRight] = await Promise.all([
          storage.getUsersBySponsorAndLeg(leftNode.userId, 'left'),
          storage.getUsersBySponsorAndLeg(leftNode.userId, 'right'),
        ]);
        leftNode.hasLeftChild = leftGrandLeft && leftGrandLeft.length > 0;
        leftNode.hasRightChild = leftGrandRight && leftGrandRight.length > 0;
        response.leftChild = leftNode;
      }
      
      if (rightUsers && rightUsers.length > 0) {
        const rightNode = buildChildNode(rightUsers[0]);
        // Check if right child has its own children
        const [rightGrandLeft, rightGrandRight] = await Promise.all([
          storage.getUsersBySponsorAndLeg(rightNode.userId, 'left'),
          storage.getUsersBySponsorAndLeg(rightNode.userId, 'right'),
        ]);
        rightNode.hasLeftChild = rightGrandLeft && rightGrandLeft.length > 0;
        rightNode.hasRightChild = rightGrandRight && rightGrandRight.length > 0;
        response.rightChild = rightNode;
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching binary tree children:", error);
      res.status(500).json({ error: "Failed to fetch binary tree children" });
    }
  });

  app.get("/api/users/:userId/direct-referrals", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUser = await storage.getUserById(req.session.userId!);
      
      if (requestingUser?.userId !== userId && requestingUser?.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - You can only view your own direct referrals" });
      }
      
      const referrals = await storage.getDirectReferrals(userId);
      
      const referralData = referrals.map(ref => ({
        userId: ref.userId,
        name: ref.name,
        email: ref.email,
        mobile: ref.mobile,
        isActivated: ref.isActivated,
        binaryLeg: ref.binaryLeg,
        createdAt: ref.createdAt,
        activatedAt: ref.activatedAt,
      }));
      
      res.json(referralData);
    } catch (error) {
      console.error("Error fetching direct referrals:", error);
      res.status(500).json({ error: "Failed to fetch direct referrals" });
    }
  });

  app.get("/api/global-matrix/stats", requireAuth, async (req, res) => {
    try {
      const stats = await db.execute(sql`
        WITH level_stats AS (
          SELECT 
            COALESCE(matrix_level, -1) as level,
            COUNT(*) as count
          FROM users
          WHERE matrix_level IS NOT NULL
            AND matrix_path IS NOT NULL
            AND is_activated = true
          GROUP BY matrix_level
        ),
        total_activated AS (
          SELECT COUNT(*) as count
          FROM users
          WHERE is_activated = true
            AND matrix_level IS NOT NULL
        )
        SELECT 
          json_build_object(
            'totalCapacity', (2 + 4 + 8 + 16 + 32),
            'totalFilled', (SELECT count FROM total_activated),
            'levelBreakdown', (
              SELECT json_agg(
                json_build_object('level', level, 'filled', count)
                ORDER BY level
              )
              FROM level_stats
            )
          ) as stats
      `);

      const result = stats.rows[0] as { stats: any };
      const matrixStats = result.stats || {
        totalCapacity: 62,
        totalFilled: 0,
        levelBreakdown: []
      };

      const levelCapacities = [2, 4, 8, 16, 32];
      const levelBreakdown = levelCapacities.map((capacity, index) => {
        const level = index + 1;
        const existing = matrixStats.levelBreakdown?.find((l: any) => l.level === level);
        return {
          level,
          capacity,
          filled: existing?.filled || 0,
          available: capacity - (existing?.filled || 0)
        };
      });

      res.json({
        totalCapacity: matrixStats.totalCapacity,
        totalFilled: matrixStats.totalFilled || 0,
        percentageFilled: matrixStats.totalFilled 
          ? Math.round((matrixStats.totalFilled / matrixStats.totalCapacity) * 100) 
          : 0,
        levelBreakdown
      });
    } catch (error) {
      console.error("Error fetching global matrix stats:", error);
      res.status(500).json({ error: "Failed to fetch global matrix statistics" });
    }
  });

  app.get("/api/users/:userId/global-matrix", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUser = await storage.getUserById(req.session.userId!);
      
      if (requestingUser?.userId !== userId && requestingUser?.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - You can only view your own global matrix" });
      }
      
      const rootUser = await storage.getUserByUserId(userId);
      if (!rootUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`[GLOBAL-MATRIX] Fetching matrix for ${userId}`);
      console.log(`[GLOBAL-MATRIX] Root user data:`, JSON.stringify({
        userId: rootUser.userId,
        matrixLevel: rootUser.matrixLevel,
        matrixPath: rootUser.matrixPath,
        matrixPosition: rootUser.matrixPosition
      }, null, 2));
      
      const tree = await storage.getMatrixSubtree(userId, 5);
      
      console.log(`[GLOBAL-MATRIX] Tree result:`, JSON.stringify(tree, null, 2));
      
      res.json(tree);
    } catch (error) {
      console.error("Error fetching global matrix:", error);
      res.status(500).json({ error: "Failed to fetch global matrix" });
    }
  });

  app.get("/api/users/:userId/income-summary", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUser = await storage.getUserById(req.session.userId!);
      
      if (requestingUser?.userId !== userId && requestingUser?.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - You can only view your own income" });
      }
      
      const summary = await storage.getUserIncomeSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching income summary:", error);
      res.status(500).json({ error: "Failed to fetch income summary" });
    }
  });

  app.get("/api/users/:userId/income-transactions", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUser = await storage.getUserById(req.session.userId!);
      
      if (requestingUser?.userId !== userId && requestingUser?.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - You can only view your own income transactions" });
      }
      
      const transactions = await storage.getUserIncomeTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching income transactions:", error);
      res.status(500).json({ error: "Failed to fetch income transactions" });
    }
  });

  // Update user profile
  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const validationResult = updateProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.flatten() });
      }
      
      const user = await storage.updateUserProfile(req.session.userId!, validationResult.data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ user: serializeUser(user) });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  
  // Generate UPI QR code for user's payment details
  app.post("/api/profile/generate-qr", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.upiId || !user.name || !user.mobile) {
        return res.status(400).json({ error: "UPI ID, name, and mobile number are required" });
      }
      
      const { amount } = req.body;
      
      const qrCode = await generateUserPaymentQR(
        user.upiId,
        user.name,
        user.mobile,
        amount
      );
      
      res.json({ qrCode });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });
  
  // Get user payment details by userId
  app.get("/api/users/payment-details/:userId", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByUserId(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Generate QR code if user has UPI details
      let paymentQrUrl = null;
      if (user.upiId && user.name && user.mobile) {
        try {
          paymentQrUrl = await generateUserPaymentQR(
            user.upiId,
            user.name,
            user.mobile
          );
        } catch (error) {
          console.error("Error generating QR code:", error);
          // Continue without QR code if generation fails
        }
      }
      
      // Return only payment-related information
      const paymentInfo = {
        userId: user.userId,
        name: user.name,
        mobile: user.mobile,
        upiId: user.upiId,
        bankAccountHolder: user.bankAccountHolder,
        ifscCode: user.ifscCode,
        paymentQrUrl,
      };
      
      res.json(paymentInfo);
    } catch (error) {
      console.error("Error fetching user payment details:", error);
      res.status(500).json({ error: "Failed to fetch payment details" });
    }
  });
  
  // Get admin payment details (public endpoint for users to see where to pay)
  app.get("/api/admin/payment-details", requireAuth, async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      
      // Return only payment-related information
      const adminPaymentInfo = {
        userId: 'PB0',
        name: 'Admin',
        mobile: config.adminMobile,
        upiId: config.adminUpiId,
        bankAccountHolder: 'Admin',
        bankAccount: config.adminBankAccount,
        ifscCode: config.adminIfscCode,
        paymentQrUrl: config.adminQrCodeUrl,
      };
      
      res.json(adminPaymentInfo);
    } catch (error) {
      console.error("Error fetching admin payment details:", error);
      res.status(500).json({ error: "Failed to fetch admin payment details" });
    }
  });
  
  // Get user by ID (for general user info)
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const user = await storage.getUserByUserId(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return only basic user information
      const userInfo = {
        userId: user.userId,
        name: user.name,
        email: user.email,
      };
      
      res.json(userInfo);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Object storage route for getting upload URL
  // SECURITY FIX: Now requires authentication. Users must be logged in to upload files.
  // Legacy comments about "wallet address" removed - system now uses userId-based auth.
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const { uploadUrl, publicUrl } = await objectStorageService.getObjectEntityUploadURLWithPublicPath();
      res.json({ uploadUrl, publicUrl });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Object storage route for setting payment proof metadata
  // SECURITY FIX: Now requires authentication. Users must be logged in to submit payment proofs.
  // Uses userId from session instead of wallet address for ownership tracking.
  app.put("/api/payment-proofs", requireAuth, async (req, res) => {
    if (!req.body.proofUrl) {
      return res.status(400).json({ error: "proofUrl is required" });
    }
    
    // Use userId from authenticated session instead of wallet address
    const userId = req.session.userId as string;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.proofUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting payment proof metadata:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage route for serving uploaded files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: undefined,
        requestedPermission: undefined,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error retrieving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Activation routes
  
  // Request activation - creates activation record and 8 payment slots
  app.post("/api/activations/request", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check profile completion before allowing activation
      // Use database ID (user.id) for pre-activation users without PB#### ID
      const isProfileComplete = await storage.checkProfileComplete(user.userId || user.id);
      if (!isProfileComplete) {
        return res.status(400).json({ 
          error: "Profile incomplete. Please update your profile with name, mobile, and UPI/bank details before requesting activation." 
        });
      }
      
      // Check if user already has a pending activation
      const existingActivations = await storage.getActivationsByPayer(user.id);
      const pendingActivation = existingActivations.find(a => a.status === 'pending');
      
      if (pendingActivation) {
        console.log(`[ACTIVATION] User ${user.userId || user.id} already has pending activation ${pendingActivation.id}, returning existing data`);
        // Return existing activation and its payments with 200 status
        const payments = await storage.getActivationPaymentsByActivationId(pendingActivation.id);
        return res.status(200).json({
          activation: pendingActivation,
          payments,
          isExisting: true
        });
      }
      
      // Create activation record and payment slots transactionally
      // Database unique constraint on payerWallet prevents duplicates at DB level
      // Using crypto.randomUUID() for collision-safe ID generation
      // Note: Users now get PB#### IDs immediately at signup (userId is assigned)
      const activationId = `ACT-${user.id}-${crypto.randomUUID().substring(0, 8)}`;
      const result = await storage.createActivationWithPayments(
        {
          id: activationId,
          payerWallet: user.id, // Store database ID (UUID) for activation lookup
          sponsorWallet: user.sponsorId || null, // Sponsor's PB#### ID (if they have one)
          status: 'pending',
        },
        user.userId!, // Use PB#### ID for payment records (assigned at signup)
        user.sponsorId || null
      );
      
      // Link activation to in-progress re-entry (if any)
      try {
        const { ReentryService } = await import('./reentry-service');
        const reentryService = new ReentryService(db as any);
        // Use PB#### ID for re-entry linking
        await reentryService.linkReentryActivation(user.userId!, activationId);
      } catch (error) {
        console.log('[ACTIVATION] No in-progress re-entry to link');
      }
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error requesting activation:", error);
      
      // Handle unique constraint violation (race condition fallback)
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        // Query and return existing activation
        const user = await storage.getUserById(req.session.userId as string);
        if (user) {
          const existingActivations = await storage.getActivationsByPayer(user.id);
          const pendingActivation = existingActivations.find(a => a.status === 'pending');
          if (pendingActivation) {
            const payments = await storage.getActivationPaymentsByActivationId(pendingActivation.id);
            return res.status(200).json({
              activation: pendingActivation,
              payments,
              isExisting: true
            });
          }
        }
        return res.status(400).json({ 
          error: "Activation already requested for this user" 
        });
      }
      
      res.status(500).json({ error: "Failed to request activation" });
    }
  });

  // REMOVED: Legacy POST /api/activations - use /api/activations/request instead
  // The old endpoint allowed creating activations without payments (orphaned data)
  // All activation creation must now use the transactional endpoint above

  app.get("/api/activations/:id", async (req, res) => {
    try {
      const activation = await storage.getActivation(req.params.id);
      if (!activation) {
        return res.status(404).json({ error: "Activation not found" });
      }
      res.json(activation);
    } catch (error) {
      console.error("Error fetching activation:", error);
      res.status(500).json({ error: "Failed to fetch activation" });
    }
  });

  app.get("/api/activations/payer/:walletAddress", async (req, res) => {
    try {
      const activations = await storage.getActivationsByPayer(req.params.walletAddress);
      res.json(activations);
    } catch (error) {
      console.error("Error fetching activations:", error);
      res.status(500).json({ error: "Failed to fetch activations" });
    }
  });

  // REMOVED: /api/activations/:id/status endpoint (SECURITY FIX)
  // This endpoint was unused by frontend and allowed anyone to change activation status
  // Activation status changes should only happen through:
  // 1. Payment confirmation flow (storage.confirmActivationPayment)
  // 2. Admin manual completion (POST /api/admin/activation/manual-complete)

  // Activation payment routes
  // SECURITY FIX: Now requires authentication and validates ownership
  // Users can only create activation payments for their own activations
  app.post("/api/activation-payments", requireAuth, async (req, res) => {
    try {
      const validationResult = insertActivationPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.flatten() });
      }
      
      // Verify the activation belongs to the authenticated user
      const activation = await storage.getActivation(validationResult.data.activationId);
      if (!activation) {
        return res.status(404).json({ error: "Activation not found" });
      }
      
      const userId = req.session.userId as string;
      const user = await storage.getUserById(userId);
      if (!user || activation.payerWallet !== user.userId) {
        return res.status(403).json({ error: "Forbidden - You can only create payments for your own activations" });
      }
      
      const payment = await storage.createActivationPayment(validationResult.data);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating activation payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.get("/api/activation-payments/activation/:activationId", async (req, res) => {
    try {
      const payments = await storage.getActivationPaymentsByActivationId(req.params.activationId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching activation payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Get payment archive by cycle - only for logged-in user's own payments
  app.get("/api/activation-payments/archive/:userId", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Users can only view their own archive, admins can view any
      if (user.userId !== req.params.userId && user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - You can only view your own payment archive" });
      }

      const cycles = await storage.getActivationPaymentsByCycle(req.params.userId);
      res.json(cycles);
    } catch (error: any) {
      console.error('[API] Error fetching payment archive:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get payments by payer user ID - only for logged-in user's own payments
  app.get("/api/activation-payments/payer/:userId", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Users can only view their own payments, admins can view any
      if (user.userId !== req.params.userId && user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - You can only view your own payments" });
      }
      
      const payments = await storage.getActivationPaymentsByPayerUserId(req.params.userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payer payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Get payments by receiver user ID - only for logged-in user's own payments
  app.get("/api/activation-payments/receiver/:userId", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Users can only view their own received payments, admins can view any
      if (user.userId !== req.params.userId && user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - You can only view your own payments" });
      }
      
      const payments = await storage.getActivationPaymentsByReceiverUserId(req.params.userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching receiver payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Get pending confirmation payments for receiver
  app.get("/api/activation-payments/pending-confirmations", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || !user.userId) {
        return res.status(400).json({ error: "User ID not found" });
      }
      
      // If admin, get ALL submitted payments (system + their personal); regular users get only their own
      let payments: any[] = [];
      if (user.role === 'admin') {
        payments = await storage.getAdminPendingConfirmations(user.userId);
      } else {
        payments = await storage.getActivationPaymentsPendingConfirmation(user.userId);
      }
      
      res.json(payments);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      res.status(500).json({ error: "Failed to fetch pending payments" });
    }
  });

  // Get count of pending confirmations for notification badge
  app.get("/api/activation-payments/pending-count", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || !user.userId) {
        return res.status(400).json({ error: "User ID not found" });
      }
      
      // If admin, count ALL submitted payments in the system; regular users count only their own
      let count: number = 0;
      if (user.role === 'admin') {
        count = await storage.getAllPendingConfirmationsCount();
      } else {
        const payments = await storage.getActivationPaymentsPendingConfirmation(user.userId);
        count = payments.length;
      }
      
      res.json({ count });
    } catch (error) {
      console.error("Error fetching pending count:", error);
      res.status(500).json({ error: "Failed to fetch pending count" });
    }
  });

  // Submit payment proof - only payer can submit
  app.patch("/api/activation-payments/:id/submit", requireAuth, async (req, res) => {
    try {
      const validationResult = submitPaymentProofSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.flatten() });
      }
      
      const user = await storage.getUserById(req.session.userId as string);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if payment exists and user is the payer
      const existingPayment = await storage.getActivationPayment(req.params.id);
      if (!existingPayment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      if (existingPayment.payerUserId !== user.userId) {
        return res.status(403).json({ error: "Forbidden - You can only submit proof for your own payments" });
      }
      
      // Block submission if payment is awaiting receiver assignment (matrix payments before first 3 confirmed)
      if (existingPayment.status === 'awaiting_assignment') {
        return res.status(400).json({ 
          error: "Payment receiver not yet assigned. Please complete and confirm the first 3 payments (sponsor, binary match, and top reward) before paying matrix levels. Matrix receivers will be assigned automatically after your account is activated."
        });
      }
      
      const payment = await storage.submitPaymentProof(
        req.params.id, 
        validationResult.data.offlineUtrId,
        validationResult.data.offlineProofUrl
      );
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error submitting payment proof:", error);
      
      // Handle duplicate UTR error with user-friendly message
      if (error instanceof Error && error.message.includes('UTR/Transaction ID has already been used')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to submit payment proof" });
    }
  });

  // Confirm payment (only the designated receiver based on receiverType)
  app.patch("/api/activation-payments/:id/confirm", requireAuth, async (req, res) => {
    try {
      console.log(`[CONFIRM-ROUTE] Received confirmation request for payment ${req.params.id} from user ${req.session.userId}`);
      
      const validationResult = confirmPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log('[CONFIRM-ROUTE] Validation failed:', validationResult.error);
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.flatten() });
      }
      
      const user = await storage.getUserById(req.session.userId as string);
      if (!user) {
        console.log('[CONFIRM-ROUTE] User not found');
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`[CONFIRM-ROUTE] User ${user.userId} (role: ${user.role}) attempting to confirm payment`);
      
      // Check if payment exists
      const existingPayment = await storage.getActivationPayment(req.params.id);
      if (!existingPayment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // All payments use receiverType='user' - only the receiver can confirm
      if (existingPayment.receiverType !== 'user') {
        return res.status(400).json({ error: "Invalid receiver type" });
      }
      
      // Only the specific receiver user can confirm this payment
      if (existingPayment.receiverUserId !== user.userId) {
        return res.status(403).json({ error: "Forbidden - Only the receiver can confirm this payment" });
      }
      
      console.log(`[CONFIRM-ROUTE] Attempting to confirm payment ${req.params.id}`);
      const payment = await storage.confirmActivationPayment(req.params.id, validationResult.data.notes);
      if (!payment) {
        console.log('[CONFIRM-ROUTE] Payment not found after confirmation attempt');
        return res.status(404).json({ error: "Payment not found" });
      }
      
      console.log(`[CONFIRM-ROUTE] Payment confirmed successfully:`, payment.id);
      
      // NOTE: Income distribution is handled inside storage.confirmActivationPayment() within a transaction
      // - Immediate incomes (binary_match, top_reward) created at payment confirmation
      // - Deferred incomes (sponsor, matrix) created when all 8 payments confirmed
      // See storage.ts lines 1176-1720 for complete implementation

      res.json(payment);
    } catch (error: any) {
      console.error("[CONFIRM-ROUTE] Error confirming payment:", error);
      console.error("[CONFIRM-ROUTE] Error stack:", error?.stack);
      console.error("[CONFIRM-ROUTE] Error message:", error?.message);
      res.status(500).json({ error: "Failed to confirm payment", details: error?.message });
    }
  });

  // Reject payment (only the designated receiver based on receiverType)
  app.patch("/api/activation-payments/:id/reject", requireAuth, async (req, res) => {
    try {
      const validationResult = rejectPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.flatten() });
      }
      
      const user = await storage.getUserById(req.session.userId as string);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if payment exists
      const existingPayment = await storage.getActivationPayment(req.params.id);
      if (!existingPayment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // All payments use receiverType='user' - only the receiver can reject
      if (existingPayment.receiverType !== 'user') {
        return res.status(400).json({ error: "Invalid receiver type" });
      }
      
      // Only the specific receiver user can reject this payment
      if (existingPayment.receiverUserId !== user.userId) {
        return res.status(403).json({ error: "Forbidden - Only the receiver can reject this payment" });
      }
      
      const payment = await storage.rejectActivationPayment(req.params.id, validationResult.data.rejectionReason);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      res.status(500).json({ error: "Failed to reject payment" });
    }
  });

  // Public: Get system configuration (for landing page, dashboard, etc.)
  app.get("/api/system-config", async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      
      // Convert decimal strings to numbers for client consumption
      const normalizedConfig = {
        sponsorPaymentAmount: parseFloat(config.sponsorPaymentAmount),
        binaryMatchPaymentAmount: parseFloat(config.binaryMatchPaymentAmount),
        topRewardAmount: parseFloat(config.topRewardAmount),
        matrixLevel1Amount: parseFloat(config.matrixLevel1Amount),
        matrixLevel2Amount: parseFloat(config.matrixLevel2Amount),
        matrixLevel3Amount: parseFloat(config.matrixLevel3Amount),
        matrixLevel4Amount: parseFloat(config.matrixLevel4Amount),
        matrixLevel5Amount: parseFloat(config.matrixLevel5Amount),
        binaryLeftQualification: config.binaryLeftQualification,
        binaryRightQualification: config.binaryRightQualification,
        binaryMatchingRatioLeft: config.binaryMatchingRatioLeft,
        binaryMatchingRatioRight: config.binaryMatchingRatioRight,
        adminUpiId: config.adminUpiId,
        adminBankAccount: config.adminBankAccount,
        adminIfscCode: config.adminIfscCode,
        adminMobile: config.adminMobile,
        adminQrCodeUrl: config.adminQrCodeUrl,
      };
      
      res.json(normalizedConfig);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ error: "Failed to fetch system configuration" });
    }
  });

  // Admin: Get system configuration
  app.get("/api/admin/config", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ error: "Failed to fetch system configuration" });
    }
  });

  // Admin: Update system configuration
  app.patch("/api/admin/config", requireAdmin, async (req, res) => {
    try {
      // Prevent ID changes via API
      const { id, ...configData } = req.body;
      
      const config = await storage.updateSystemConfig(configData);
      res.json(config);
    } catch (error) {
      console.error("Error updating system config:", error);
      res.status(500).json({ error: "Failed to update system configuration" });
    }
  });

  // Admin: Get all confirmed payments
  app.get("/api/admin/payments/confirmed", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getConfirmedPaymentsWithDetails();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching confirmed payments:", error);
      res.status(500).json({ error: "Failed to fetch confirmed payments" });
    }
  });

  // Admin: Get all users with comprehensive filtering
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const {
        search,
        activationStatus,
        role,
        binaryLeg,
        sponsorId,
        matrixLevel,
        reentryEligible,
        binaryQualified,
      } = req.query;

      // Start with all users
      let query = db.select().from(users).$dynamic();

      // Apply filters
      const conditions = [];

      // Search filter (userId, email, name, mobile)
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        conditions.push(
          or(
            sql`LOWER(${users.userId}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${users.email}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${users.name}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${users.mobile}) LIKE ${`%${searchTerm}%`}`
          )!
        );
      }

      // Activation status filter
      if (activationStatus === 'activated') {
        conditions.push(eq(users.isActivated, true));
      } else if (activationStatus === 'pending') {
        conditions.push(eq(users.isActivated, false));
      }

      // Role filter
      if (role === 'admin' || role === 'user') {
        conditions.push(eq(users.role, role));
      }

      // Binary leg filter (sponsor requested leg)
      if (binaryLeg === 'left' || binaryLeg === 'right') {
        conditions.push(eq(users.sponsorRequestedLeg, binaryLeg));
      }

      // Sponsor ID filter
      if (sponsorId && typeof sponsorId === 'string') {
        conditions.push(eq(users.sponsorId, sponsorId.toUpperCase()));
      }

      // Matrix level filter
      if (matrixLevel && typeof matrixLevel === 'string') {
        if (matrixLevel === '6') {
          // Level 6+ means level >= 6
          conditions.push(sql`${users.matrixLevel} >= 6`);
        } else {
          const level = parseInt(matrixLevel);
          if (!isNaN(level)) {
            conditions.push(eq(users.matrixLevel, level));
          }
        }
      }

      // Re-entry eligibility filter
      if (reentryEligible === 'true') {
        conditions.push(eq(users.isEligibleForReentry, true));
      } else if (reentryEligible === 'false') {
        conditions.push(eq(users.isEligibleForReentry, false));
      }

      // Binary qualified filter
      if (binaryQualified === 'true') {
        conditions.push(eq(users.binaryQualified, true));
      } else if (binaryQualified === 'false') {
        conditions.push(eq(users.binaryQualified, false));
      }

      // Apply all conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Order by creation date (newest first)
      const allUsers = await query.orderBy(desc(users.createdAt));

      // Remove sensitive data
      const sanitizedUsers = allUsers.map(user => ({
        id: user.id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        name: user.name,
        mobile: user.mobile,
        upiId: user.upiId,
        sponsorId: user.sponsorId,
        sponsorRequestedLeg: user.sponsorRequestedLeg,
        binaryParentId: user.binaryParentId,
        binaryPlacementLeg: user.binaryPlacementLeg,
        leftLegCount: user.leftLegCount,
        rightLegCount: user.rightLegCount,
        personalLeftCount: user.personalLeftCount,
        personalRightCount: user.personalRightCount,
        totalReferrals: user.totalReferrals,
        binaryQualified: user.binaryQualified,
        binaryMatchedPairs: user.binaryMatchedPairs,
        matrixParentId: user.matrixParentId,
        matrixPosition: user.matrixPosition,
        matrixLevel: user.matrixLevel,
        matrixPath: user.matrixPath,
        isProfileComplete: user.isProfileComplete,
        isActivated: user.isActivated,
        activatedAt: user.activatedAt,
        reentryCount: user.reentryCount,
        currentCycleNumber: user.currentCycleNumber,
        isEligibleForReentry: user.isEligibleForReentry,
        lastReentryAt: user.lastReentryAt,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Re-entry routes
  
  // Get current re-entry status
  app.get("/api/reentry/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || !user.userId) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user has completed matrix
      const isMatrixComplete = await storage.checkMatrixCompletion(user.userId);
      
      // Get current re-entry record (if any)
      const currentReentry = await storage.getCurrentReentryStatus(user.userId);

      res.json({
        isEligibleForReentry: user.isEligibleForReentry,
        isMatrixComplete,
        currentCycleNumber: user.currentCycleNumber,
        reentryCount: user.reentryCount,
        currentReentry,
        lastReentryAt: user.lastReentryAt,
      });
    } catch (error) {
      console.error("Error fetching re-entry status:", error);
      res.status(500).json({ error: "Failed to fetch re-entry status" });
    }
  });

  // Get re-entry history
  app.get("/api/reentry/history", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || !user.userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const history = await storage.getUserReentryHistory(user.userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching re-entry history:", error);
      res.status(500).json({ error: "Failed to fetch re-entry history" });
    }
  });

  // Initiate re-entry
  app.post("/api/reentry/initiate", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || !user.userId) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if profile is complete
      const isProfileComplete = await storage.checkProfileComplete(user.userId);
      if (!isProfileComplete) {
        return res.status(400).json({ error: "Please complete your profile before initiating re-entry" });
      }

      // Check if user is eligible
      if (!user.isEligibleForReentry) {
        return res.status(400).json({ error: "You are not eligible for re-entry yet" });
      }

      // Check for existing in-progress re-entry
      const existingReentry = await storage.getCurrentReentryStatus(user.userId);
      if (existingReentry && existingReentry.status === 'in_progress') {
        return res.status(400).json({ error: "You already have a re-entry in progress" });
      }

      // Initiate re-entry
      const reentry = await storage.initiateReentry(user.userId);
      
      res.json({
        reentry,
        message: "Re-entry initiated successfully. Please proceed to activation payment.",
        redirectTo: "/activate"
      });
    } catch (error: any) {
      console.error("Error initiating re-entry:", error);
      res.status(500).json({ error: error.message || "Failed to initiate re-entry" });
    }
  });

  // Admin: Get all re-entries for management
  app.get("/api/admin/reentry/all", requireAdmin, async (req, res) => {
    try {
      const reentryList = await db
        .select({
          id: reentries.id,
          userId: reentries.userId,
          userName: users.name,
          cycleNumber: reentries.cycleNumber,
          status: reentries.status,
          initiatedAt: reentries.reentryInitiatedAt,
          completedAt: reentries.reentryCompletedAt,
          activationId: reentries.newActivationId,
        })
        .from(reentries)
        .leftJoin(users, eq(reentries.userId, users.userId))
        .orderBy(desc(reentries.reentryInitiatedAt));

      res.json(reentryList);
    } catch (error) {
      console.error("Error fetching all re-entries:", error);
      res.status(500).json({ error: "Failed to fetch re-entries" });
    }
  });

  // Admin: Get re-entry statistics
  app.get("/api/admin/reentry/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await db
        .select({
          status: reentries.status,
          count: count(),
        })
        .from(reentries)
        .groupBy(reentries.status);

      const eligibleUsersCount = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isEligibleForReentry, true));

      res.json({
        byStatus: stats,
        eligibleUsers: eligibleUsersCount[0]?.count || 0,
      });
    } catch (error) {
      console.error("Error fetching re-entry stats:", error);
      res.status(500).json({ error: "Failed to fetch re-entry statistics" });
    }
  });

  // Admin: Check eligibility for specific user (optional/manual trigger)
  app.post("/api/admin/reentry/eligibility/:userId/check", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const targetUser = await storage.getUserByUserId(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check and mark if eligible
      await storage.markEligibleForReentry(userId);
      
      const updatedUser = await storage.getUserByUserId(userId);
      res.json({
        userId,
        isEligibleForReentry: updatedUser?.isEligibleForReentry,
        message: "Eligibility check completed"
      });
    } catch (error) {
      console.error("Error checking re-entry eligibility:", error);
      res.status(500).json({ error: "Failed to check re-entry eligibility" });
    }
  });

  // Admin: Get comprehensive analytics
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      // User statistics
      const totalUsers = await db.select({ count: count() }).from(users);
      const activeUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isActivated, true));
      const completedUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isActivated, true));

      // Payment statistics
      const confirmedPayments = await db
        .select({ count: count() })
        .from(activationPayments)
        .where(eq(activationPayments.status, "confirmed"));
      
      const pendingPayments = await db
        .select({ count: count() })
        .from(activationPayments)
        .where(eq(activationPayments.status, "pending"));

      // Calculate total payment amount (₹500 per confirmed payment)
      const totalAmount = (confirmedPayments[0]?.count || 0) * 500;

      // Re-entry statistics
      const totalReentries = await db.select({ count: count() }).from(reentries);
      const completedReentries = await db
        .select({ count: count() })
        .from(reentries)
        .where(eq(reentries.status, "completed"));
      const inProgressReentries = await db
        .select({ count: count() })
        .from(reentries)
        .where(eq(reentries.status, "in_progress"));
      const eligibleUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isEligibleForReentry, true));

      // Binary tree statistics - calculate in SQL for efficiency
      const binaryStats = await db
        .select({
          avgLeft: sql<number>`AVG(${users.personalLeftCount})`,
          avgRight: sql<number>`AVG(${users.personalRightCount})`,
          totalPairs: sql<number>`SUM(LEAST(${users.personalLeftCount}, ${users.personalRightCount}))`,
        })
        .from(users)
        .where(eq(users.isActivated, true));

      // Matrix statistics
      const matrixPlacements = await db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.matrixParentId} IS NOT NULL`);

      const avgMatrixLevel = await db
        .select({
          avg: sql<number>`AVG(${users.matrixLevel})`,
        })
        .from(users)
        .where(sql`${users.matrixParentId} IS NOT NULL`);

      res.json({
        users: {
          total: totalUsers[0]?.count || 0,
          active: activeUsers[0]?.count || 0,
          completed: completedUsers[0]?.count || 0,
        },
        payments: {
          totalConfirmed: confirmedPayments[0]?.count || 0,
          totalAmount: totalAmount,
          pendingCount: pendingPayments[0]?.count || 0,
        },
        reentry: {
          totalCycles: totalReentries[0]?.count || 0,
          completedCycles: completedReentries[0]?.count || 0,
          inProgressCycles: inProgressReentries[0]?.count || 0,
          eligibleUsers: eligibleUsers[0]?.count || 0,
        },
        binary: {
          totalPairs: Number(binaryStats[0]?.totalPairs) || 0,
          avgLeftLeg: Number(binaryStats[0]?.avgLeft) || 0,
          avgRightLeg: Number(binaryStats[0]?.avgRight) || 0,
        },
        matrix: {
          totalPlacements: matrixPlacements[0]?.count || 0,
          avgLevel: Number(avgMatrixLevel[0]?.avg) || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Notification routes
  
  // Zod schema for notification query params
  const getNotificationsQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(20).default(10),
    offset: z.coerce.number().min(0).default(0),
    isRead: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  });

  // GET /api/notifications - Get user's notifications with unread count
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const queryResult = getNotificationsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: queryResult.error });
      }

      const { limit, offset, isRead } = queryResult.data;
      const userId = req.session.userId;

      const [notifications, unreadCount] = await Promise.all([
        storage.getNotificationsByUserId(userId, limit, offset, isRead),
        storage.getUnreadNotificationCount(userId),
      ]);

      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // POST /api/notifications/:id/read - Mark single notification as read
  app.post("/api/notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      const notificationId = req.params.id;
      const userId = req.session.userId;

      // Fetch notification to verify ownership
      const existingNotification = await storage.getNotificationsByUserId(userId, 1000, 0);
      const notification = existingNotification.find(n => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - Cannot access another user's notification" });
      }

      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      if (!updatedNotification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({ notification: updatedNotification });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // POST /api/notifications/mark-all-read - Mark all user's notifications as read
  app.post("/api/notifications/mark-all-read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const affectedCount = await storage.markAllNotificationsAsRead(userId);

      res.json({ affectedCount });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // ========================================
  // Database Backup/Restore Routes (Admin Only - PB0 or PB1)
  // ========================================

  // GET /api/admin/database/backup - Create and download database backup
  // SECURITY: Changed from requireAuth to requireAdmin - backups must be admin-only
  app.get("/api/admin/database/backup", requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || (user.userId !== 'PB1' && user.userId !== 'PB0')) {
        return res.status(403).json({ error: "Forbidden - Admin access required (PB0 or PB1 only)" });
      }

      console.log(`[DB_BACKUP] Starting database backup for ${user.userId} (${user.email})`);

      // Export database to JSON
      const backupJson = await storage.exportDatabaseToJSON();
      const filename = `payback247_backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
      const fileSize = Buffer.byteLength(backupJson, 'utf8');

      console.log(`[DB_BACKUP] Backup created: ${filename} (${(fileSize / 1024).toFixed(2)} KB)`);

      // Save backup metadata to database
      await storage.createDatabaseBackup(filename, fileSize, user.userId!);

      // Send file as download with proper headers
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', fileSize.toString());
      res.send(backupJson);

      console.log(`[DB_BACKUP] Database backup completed successfully`);
    } catch (error) {
      console.error("[DB_BACKUP] Error creating database backup:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create database backup" });
      }
    }
  });

  // REMOVED: Database restore endpoint - CATASTROPHIC SECURITY VULNERABILITY
  // This endpoint allowed ANY logged-in user to DELETE ALL DATABASE DATA
  // Database restoration must be done manually via direct database access
  // by qualified database administrators with proper backup procedures

  // GET /api/admin/database/backups - Get backup history
  // SECURITY: Changed from requireAuth to requireAdmin
  app.get("/api/admin/database/backups", requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || (user.userId !== 'PB0')) {
        return res.status(403).json({ error: "Forbidden - Admin access required (PB0 or PB1 only)" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const backups = await storage.getBackupHistory(limit);

      res.json(backups);
    } catch (error) {
      console.error("Error fetching backup history:", error);
      res.status(500).json({ error: "Failed to fetch backup history" });
    }
  });

  // DELETE /api/admin/database/backups/:id - Delete backup metadata
  // SECURITY: Changed from requireAuth to requireAdmin
  app.delete("/api/admin/database/backups/:id", requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || (user.userId !== 'PB0')) {
        return res.status(403).json({ error: "Forbidden - Admin access required (PB0 or PB1 only)" });
      }

      const backupId = req.params.id;
      await storage.deleteBackup(backupId);

      res.json({ success: true, message: "Backup deleted successfully" });
      console.log(`[DB_BACKUP] Backup ${backupId} deleted by ${user.userId}`);
    } catch (error) {
      console.error("Error deleting backup:", error);
      res.status(500).json({ error: "Failed to delete backup" });
    }
  });

  // POST /api/admin/queue/cleanup - Release abandoned queue reservations
  app.post("/api/admin/queue/cleanup", requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user) {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }

      // Get hours threshold from query param or use default (72 hours)
      const hoursOld = parseInt(req.query.hoursOld as string) || 72;

      if (hoursOld < 1 || hoursOld > 720) { // 1 hour to 30 days
        return res.status(400).json({ error: "Invalid hours threshold (must be 1-720)" });
      }

      console.log(`[QUEUE_CLEANUP] Admin ${user.userId} initiating cleanup for entries older than ${hoursOld} hours`);

      const releasedCount = await storage.releaseAbandonedQueueReservations(hoursOld);

      res.json({ 
        success: true, 
        message: `Released ${releasedCount} abandoned queue reservation(s)`,
        releasedCount,
        thresholdHours: hoursOld
      });

      console.log(`[QUEUE_CLEANUP] Released ${releasedCount} entries by admin ${user.userId}`);
    } catch (error) {
      console.error("Error cleaning up queue:", error);
      res.status(500).json({ error: "Failed to clean up queue" });
    }
  });

  // ========================================
  // User Income & Transaction History APIs
  // ========================================

  // Get binary match queue history for logged in user
  app.get("/api/user/binary-match-queue-history", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || !user.userId) {
        return res.status(404).json({ error: "User not found or not activated" });
      }

      // Get all queue entries for this user with payer information
      const queueHistory = await db
        .select({
          id: sql`binary_match_queue.id`.as('id'),
          queuePosition: sql`binary_match_queue.queue_position`.as('queue_position'),
          enteredAt: sql`binary_match_queue.entered_at`.as('entered_at'),
          paidAt: sql`binary_match_queue.paid_at`.as('paid_at'),
          status: sql`binary_match_queue.status`.as('status'),
          amountInr: sql`binary_match_queue.amount_inr`.as('amount_inr'),
          paidByActivationId: sql`binary_match_queue.paid_by_activation_id`.as('paid_by_activation_id'),
          payerUserId: sql`ap.payer_user_id`.as('payer_user_id'),
          payerName: sql`u.name`.as('payer_name'),
        })
        .from(sql`binary_match_queue`)
        .leftJoin(sql`activation_payments ap`, sql`binary_match_queue.paid_by_activation_id = ap.activation_id AND ap.payment_type = 'binary_match'`)
        .leftJoin(sql`users u`, sql`ap.payer_user_id = u.user_id`)
        .where(sql`binary_match_queue.user_id = ${user.userId}`)
        .orderBy(sql`binary_match_queue.entered_at DESC`);

      res.json(queueHistory);
    } catch (error) {
      console.error("Error fetching binary match queue history:", error);
      res.status(500).json({ error: "Failed to fetch binary match queue history" });
    }
  });

  // Get binary pair matching history (when user built 3:3 pairs and entered queue)
  app.get("/api/user/binary-pair-matching-history", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || !user.userId) {
        return res.status(404).json({ error: "User not found or not activated" });
      }

      // Get queue entries to show when user qualified and entered queue
      const pairHistory = await db
        .select({
          id: sql`binary_match_queue.id`.as('id'),
          enteredAt: sql`binary_match_queue.entered_at`.as('entered_at'),
          queuePosition: sql`binary_match_queue.queue_position`.as('queue_position'),
          status: sql`binary_match_queue.status`.as('status'),
          paidAt: sql`binary_match_queue.paid_at`.as('paid_at'),
          amountInr: sql`binary_match_queue.amount_inr`.as('amount_inr'),
        })
        .from(sql`binary_match_queue`)
        .where(sql`binary_match_queue.user_id = ${user.userId}`)
        .orderBy(sql`binary_match_queue.entered_at DESC`);

      res.json(pairHistory);
    } catch (error) {
      console.error("Error fetching binary pair matching history:", error);
      res.status(500).json({ error: "Failed to fetch binary pair matching history" });
    }
  });

  // Get global matrix income transaction history
  app.get("/api/user/matrix-income-history", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || !user.userId) {
        return res.status(404).json({ error: "User not found or not activated" });
      }

      // Get all matrix income transactions for this user
      const matrixIncomeHistory = await db
        .select({
          id: sql`income_transactions.id`.as('id'),
          incomeType: sql`income_transactions.income_type`.as('income_type'),
          amountInr: sql`income_transactions.amount_inr`.as('amount_inr'),
          status: sql`income_transactions.income_status`.as('status'),
          sourceUserId: sql`income_transactions.source_user_id`.as('source_user_id'),
          sourceName: sql`u.name`.as('source_name'),
          confirmedAt: sql`income_transactions.confirmed_at`.as('confirmed_at'),
          createdAt: sql`income_transactions.created_at`.as('created_at'),
          notes: sql`income_transactions.notes`.as('notes'),
        })
        .from(sql`income_transactions`)
        .leftJoin(sql`users u`, sql`income_transactions.source_user_id = u.user_id`)
        .where(sql`income_transactions.user_id = ${user.userId} AND income_transactions.income_type LIKE 'matrix_%'`)
        .orderBy(sql`income_transactions.created_at DESC`);

      res.json(matrixIncomeHistory);
    } catch (error) {
      console.error("Error fetching matrix income history:", error);
      res.status(500).json({ error: "Failed to fetch matrix income history" });
    }
  });

  // ============================================================================
  // TEMPORARY TESTING UTILITY - REMOVE AFTER PB10004 MATRIX FIX IS VALIDATED
  // ============================================================================
  // Force re-confirmation of a payment to trigger matrix reconciliation
  // This is used to test/fix legacy activations like PB10004 who are missing matrix placement
  app.post("/api/admin/activation/force-confirm", requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        paymentId: z.string().uuid("paymentId must be a valid UUID"),
      });
      
      const { paymentId } = schema.parse(req.body);
      
      console.log(`[ADMIN UTILITY] Admin ${req.session.userId} forcing confirmation for payment ${paymentId}`);
      
      // Call the storage method to trigger reconciliation
      const result = await storage.confirmActivationPayment(paymentId, "Admin forced re-confirmation for matrix placement fix");
      
      if (!result) {
        return res.status(404).json({ 
          success: false,
          error: "Payment not found or confirmation failed" 
        });
      }
      
      // Get updated matrix info for the payer (query directly by userId)
      const userResult = await db.select()
        .from(users)
        .where(eq(users.userId, result.payerUserId))
        .limit(1);
      const user = userResult[0];
      
      // Get updated matrix payment receivers
      const matrixPayments = await db.select()
        .from(activationPayments)
        .where(eq(activationPayments.activationId, result.activationId))
        .orderBy(activationPayments.slotIndex);
      
      res.json({
        success: true,
        paymentId,
        result: {
          payerId: result.payerUserId,
          activationId: result.activationId,
          paymentStatus: result.status,
        },
        reconciliation: {
          matrixPlacement: {
            parentId: user?.matrixParentId || null,
            level: user?.matrixLevel || null,
            path: user?.matrixPath || null,
          },
          matrixPaymentReceivers: matrixPayments
            .filter(p => p.slotIndex >= 3)
            .map(p => ({
              slot: p.slotIndex,
              type: p.paymentType,
              receiver: p.receiverUserId,
              status: p.status,
            })),
        },
      });
    } catch (error: any) {
      console.error("[ADMIN UTILITY] Error forcing confirmation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to force confirmation" });
    }
  });
  // ============================================================================
  // END TEMPORARY TESTING UTILITY
  // ============================================================================

  // ADMIN: Change admin password
  app.post("/api/admin/change-password", requireAdmin, async (req: any, res: any) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long" });
      }
      
      // Get current admin user by internal database ID (stored in session)
      // req.session.userId is the numeric database ID (users.id column)
      const user = await storage.getUserById(String(req.session.userId));
      if (!user) {
        console.error(`[ADMIN] User not found for session ID: ${req.session.userId}`);
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify user is actually admin
      if (user.role !== 'admin') {
        console.warn(`[ADMIN] Non-admin user ${user.userId} attempted to use admin password change`);
        return res.status(403).json({ error: "Only administrators can use this endpoint" });
      }
      
      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        console.warn(`[ADMIN] Invalid current password attempt for ${user.userId}`);
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password using string userId (e.g., "PB0")
      // updateUserPassword expects the string userId, not the numeric id
      await storage.updateUserPassword(user.userId!, hashedPassword);
      
      // Invalidate all other sessions for security
      await invalidateOtherSessions(String(user.id), req.session.id);
      
      console.log(`[ADMIN] Password changed successfully for ${user.userId}`);
      
      res.json({ 
        success: true, 
        message: "Admin password updated successfully" 
      });
    } catch (error: any) {
      console.error("[ADMIN] Password change failed:", error);
      console.error("[ADMIN] Error stack:", error?.stack);
      // Return generic error message to client, details logged server-side
      res.status(500).json({ 
        error: "Failed to change password" 
      });
    }
  });

  // ADMIN: Manual activation completion for broken activations
  // Use case: When activation has all 8 payments confirmed but completion failed
  app.post("/api/admin/activation/manual-complete", requireAdmin, async (req: any, res: any) => {
    try {
      // Validate request body with Zod schema
      const validationResult = manualActivationCompletionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.warn(`[ADMIN] Manual completion validation failed:`, validationResult.error.errors);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { activationId, userId } = validationResult.data;
      
      console.log(`[ADMIN] Manual activation completion requested by ${req.session.userId} for user ${userId}, activation ${activationId}`);
      
      // Call storage method which handles transaction and completion logic
      await storage.manualCompleteActivation(activationId, userId);
      
      console.log(`[ADMIN] Manual activation completion successful for ${userId}`);
      res.json({ 
        success: true, 
        message: `Activation ${activationId} completed successfully for user ${userId}`,
        activationId,
        userId
      });
    } catch (error: any) {
      console.error("[ADMIN] Manual activation completion failed:", error);
      console.error("[ADMIN] Error stack:", error?.stack);
      res.status(500).json({ 
        error: "Manual activation completion failed", 
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
