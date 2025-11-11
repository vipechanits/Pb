import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { insertActivationSchema, insertActivationPaymentSchema, updateActivationStatusSchema, updateProfileSchema, submitPaymentProofSchema, confirmPaymentSchema, rejectPaymentSchema, users, reentries, forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { hashPassword, verifyPassword, serializeUser } from "./auth";
import { generateUserPaymentQR } from "./qrcode-generator";
import { z } from "zod";
import { db } from "./db";
import { eq, desc, sql, count } from "drizzle-orm";
import crypto from "crypto";
import { sendVerificationEmail } from "./lib/email";

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
  // CSRF token endpoint
  app.get("/api/csrf-token", (req: any, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Authentication routes
  
  // Signup
  app.post("/api/auth/signup", async (req, res) => {
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
      
      // Generate next userId starting from PB10000
      const lastUser = await storage.getLastUser();
      let nextUserNumber = 10000; // Start from PB10000
      
      if (lastUser && lastUser.userId) {
        // Extract number from userId (e.g., "PB10005" -> 10005)
        const match = lastUser.userId.match(/PB(\d+)/);
        if (match) {
          nextUserNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      const userId = `PB${nextUserNumber}`;
      
      // Auto-assign binary leg if sponsor provided but leg not specified
      let assignedBinaryLeg = binaryLeg;
      if (sponsorId && !binaryLeg) {
        assignedBinaryLeg = await storage.determineBestLeg(sponsorId);
        console.log(`[SIGNUP] Auto-assigned ${userId} to ${assignedBinaryLeg} leg under sponsor ${sponsorId}`);
      }
      
      // Generate email verification token (same pattern as password reset)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create user with email verification token
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        role: 'user',
        userId,
        sponsorId: sponsorId || null,
        binaryLeg: assignedBinaryLeg || null,
        isActivated: false,
        emailVerified: false,
        emailVerificationToken: tokenHash,
        emailVerificationExpiry: expiresAt,
      });
      
      // Send verification email (async, don't wait)
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : `http://localhost:5000`;
      
      sendVerificationEmail(email, rawToken, baseUrl).catch((err) => {
        console.error('[SIGNUP] Failed to send verification email:', err);
      });
      
      console.log(`[SIGNUP] Created user ${userId} (${email}) - verification email sent`);
      
      // DO NOT auto-login - user must verify email first
      res.status(201).json({ 
        message: "Account created! Please check your email to verify your account.",
        email: email,
        requiresVerification: true
      });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
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
      
      // Check if email is verified (skip for admins)
      if (user.role !== 'admin' && !user.emailVerified) {
        return res.status(403).json({ 
          error: "Please verify your email before logging in. Check your inbox for the verification link.",
          requiresVerification: true,
          email: user.email
        });
      }
      
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
      limit: 3,
      windowMs: 60 * 60 * 1000, // 3 requests per hour per email
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
        
        // TODO: Send email with reset link
        // For development/testing ONLY: Log token to server console
        // SECURITY: Never expose token in API response - this defeats the purpose of email-based recovery!
        console.log(`[FORGOT_PASSWORD] ==========================================`);
        console.log(`[FORGOT_PASSWORD] Password reset token for ${user.userId} (${normalizedEmail}):`);
        console.log(`[FORGOT_PASSWORD] Token: ${rawToken}`);
        console.log(`[FORGOT_PASSWORD] Reset URL: /reset-password/${rawToken}`);
        console.log(`[FORGOT_PASSWORD] Expires: ${expiresAt.toISOString()}`);
        console.log(`[FORGOT_PASSWORD] ==========================================`);
        console.log(`[FORGOT_PASSWORD] IMPORTANT: In production, this token would be sent via email.`);
        console.log(`[FORGOT_PASSWORD] NEVER expose tokens in API responses!`);
        
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
      limit: 10,
      windowMs: 60 * 1000, // 10 requests per minute per IP
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
      limit: 5,
      windowMs: 60 * 60 * 1000, // 5 requests per hour per IP
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

  // Get binary tree structure for a user
  app.get("/api/users/:userId/binary-tree", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUser = await storage.getUserById(req.session.userId!);
      
      // Users can only view their own tree, admins can view any
      if (requestingUser?.userId !== userId && requestingUser?.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - You can only view your own binary tree" });
      }
      
      const rootUser = await storage.getUserByUserId(userId);
      if (!rootUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Recursively fetch binary tree (limit to 5 levels deep)
      const fetchTreeNode = async (user: any, depth: number = 0): Promise<any> => {
        if (depth > 5) return null; // Limit recursion depth
        
        const node = {
          userId: user.userId,
          name: user.name,
          email: user.email,
          isActivated: user.isActivated,
          leftLegCount: user.leftLegCount,
          rightLegCount: user.rightLegCount,
          personalLeftCount: user.personalLeftCount,
          personalRightCount: user.personalRightCount,
          totalReferrals: user.totalReferrals,
          leftChild: null as any,
          rightChild: null as any,
        };
        
        // Find users under this user's left and right legs
        const [leftUsers, rightUsers] = await Promise.all([
          storage.getUsersBySponsorAndLeg(user.userId, 'left'),
          storage.getUsersBySponsorAndLeg(user.userId, 'right'),
        ]);
        
        // Recursively fetch children
        if (leftUsers && leftUsers.length > 0) {
          node.leftChild = await fetchTreeNode(leftUsers[0], depth + 1);
        }
        if (rightUsers && rightUsers.length > 0) {
          node.rightChild = await fetchTreeNode(rightUsers[0], depth + 1);
        }
        
        return node;
      };
      
      const tree = await fetchTreeNode(rootUser);
      res.json(tree);
    } catch (error) {
      console.error("Error fetching binary tree:", error);
      res.status(500).json({ error: "Failed to fetch binary tree" });
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
      
      const tree = await storage.getMatrixSubtree(userId, 5);
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
  // Note: This endpoint is intentionally unauthenticated to allow users to upload
  // payment proofs as part of the offline activation process. The wallet address
  // is submitted when setting the ACL policy, linking the upload to the user.
  app.post("/api/objects/upload", async (req, res) => {
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
  // Note: This endpoint is intentionally unauthenticated to allow users to submit
  // payment proofs during offline activation. Payment proofs are set to public
  // visibility so admins can review them for verification. The owner field links
  // the proof to the wallet address that submitted it.
  app.put("/api/payment-proofs", async (req, res) => {
    if (!req.body.proofUrl || !req.body.walletAddress) {
      return res.status(400).json({ error: "proofUrl and walletAddress are required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.proofUrl,
        {
          owner: req.body.walletAddress,
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
      
      if (!user.userId) {
        return res.status(400).json({ error: "User ID not assigned" });
      }
      
      // Check profile completion before allowing activation
      const isProfileComplete = await storage.checkProfileComplete(user.userId);
      if (!isProfileComplete) {
        return res.status(400).json({ 
          error: "Profile incomplete. Please update your profile with name, mobile, and UPI/bank details before requesting activation." 
        });
      }
      
      // Create activation record and payment slots transactionally
      // Database unique constraint on payerWallet prevents duplicates at DB level
      // Using crypto.randomUUID() for collision-safe ID generation
      const activationId = `ACT-${user.userId}-${crypto.randomUUID().substring(0, 8)}`;
      const result = await storage.createActivationWithPayments(
        {
          id: activationId,
          payerWallet: user.userId, // Store as-is (not lowercased)
          sponsorWallet: user.sponsorId || null, // Store as-is (not lowercased)
          status: 'pending',
        },
        user.userId,
        user.sponsorId || null
      );
      
      // Link activation to in-progress re-entry (if any)
      try {
        const { ReentryService } = await import('./reentry-service');
        const reentryService = new ReentryService(db as any);
        await reentryService.linkReentryActivation(user.userId, activationId);
      } catch (error) {
        console.log('[ACTIVATION] No in-progress re-entry to link');
      }
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error requesting activation:", error);
      
      // Handle unique constraint violation
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
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

  app.patch("/api/activations/:id/status", async (req, res) => {
    try {
      const validationResult = updateActivationStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.flatten() });
      }
      
      const activation = await storage.updateActivationStatus(req.params.id, validationResult.data.status);
      if (!activation) {
        return res.status(404).json({ error: "Activation not found" });
      }
      res.json(activation);
    } catch (error) {
      console.error("Error updating activation status:", error);
      res.status(500).json({ error: "Failed to update activation status" });
    }
  });

  // Activation payment routes
  app.post("/api/activation-payments", async (req, res) => {
    try {
      const validationResult = insertActivationPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.flatten() });
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
      res.status(500).json({ error: "Failed to submit payment proof" });
    }
  });

  // Confirm payment (only the designated receiver based on receiverType)
  app.patch("/api/activation-payments/:id/confirm", requireAuth, async (req, res) => {
    try {
      const validationResult = confirmPaymentSchema.safeParse(req.body);
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
      
      // Enforce receiverType-based authorization
      if (existingPayment.receiverType === 'user') {
        // Only the specific user receiver can confirm
        if (existingPayment.receiverUserId !== user.userId) {
          return res.status(403).json({ error: "Forbidden - Only the receiver user can confirm this payment" });
        }
      } else if (existingPayment.receiverType === 'admin') {
        // Only admin can confirm
        if (user.role !== 'admin') {
          return res.status(403).json({ error: "Forbidden - Only admin can confirm this payment" });
        }
      } else {
        return res.status(400).json({ error: "Invalid receiver type" });
      }
      
      const payment = await storage.confirmActivationPayment(req.params.id, validationResult.data.notes);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Check if this completes all 8 payments and triggers re-entry completion
      try {
        const allPayments = await storage.getActivationPaymentsByActivationId(payment.activationId);
        const confirmedCount = allPayments.filter(p => p.status === 'confirmed').length;
        
        if (confirmedCount === 8) {
          // All payments confirmed - complete re-entry if in progress
          const payerUserId = payment.payerUserId;
          if (payerUserId) {
            const { ReentryService } = await import('./reentry-service');
            const reentryService = new ReentryService(db as any);
            await reentryService.completeReentry(payerUserId);
            console.log(`[RE-ENTRY] Completed re-entry for user ${payerUserId} after 8th payment`);
          }
        }
      } catch (error) {
        console.error('[RE-ENTRY] Error checking re-entry completion:', error);
        // Don't fail the payment confirmation if re-entry completion fails
      }

      res.json(payment);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
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
      
      // Enforce receiverType-based authorization
      if (existingPayment.receiverType === 'user') {
        // Only the specific user receiver can reject
        if (existingPayment.receiverUserId !== user.userId) {
          return res.status(403).json({ error: "Forbidden - Only the receiver user can reject this payment" });
        }
      } else if (existingPayment.receiverType === 'admin') {
        // Only admin can reject
        if (user.role !== 'admin') {
          return res.status(403).json({ error: "Forbidden - Only admin can reject this payment" });
        }
      } else {
        return res.status(400).json({ error: "Invalid receiver type" });
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

  // Admin: Get system configuration
  app.get("/api/admin/config", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }

      const config = await storage.getSystemConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ error: "Failed to fetch system configuration" });
    }
  });

  // Admin: Update system configuration
  app.patch("/api/admin/config", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }

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
  app.get("/api/admin/payments/confirmed", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }

      const payments = await storage.getConfirmedPaymentsWithDetails();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching confirmed payments:", error);
      res.status(500).json({ error: "Failed to fetch confirmed payments" });
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
        .where(eq(users.isActive, true));
      const completedUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.hasCompletedActivation, true));

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
        .where(eq(users.hasCompletedActivation, true));

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
  // Database Backup/Restore Routes (Root Admin Only - PB1)
  // ========================================

  // GET /api/admin/database/backup - Create and download database backup
  app.get("/api/admin/database/backup", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || user.userId !== 'PB1') {
        return res.status(403).json({ error: "Forbidden - Root admin access required (PB1 only)" });
      }

      // Export database to JSON
      const backupJson = await storage.exportDatabaseToJSON();
      const filename = `payback247_backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
      const fileSize = Buffer.byteLength(backupJson, 'utf8');

      // Save backup metadata to database
      await storage.createDatabaseBackup(filename, fileSize, user.userId!, req.body.notes);

      // Send file as download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(backupJson);

      console.log(`[DB_BACKUP] Database backed up by ${user.userId} (${user.email})`);
    } catch (error) {
      console.error("Error creating database backup:", error);
      res.status(500).json({ error: "Failed to create database backup" });
    }
  });

  // POST /api/admin/database/restore - Restore database from uploaded backup
  app.post("/api/admin/database/restore", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || user.userId !== 'PB1') {
        return res.status(403).json({ error: "Forbidden - Root admin access required (PB1 only)" });
      }

      const { backupData, createPreBackup } = req.body;

      if (!backupData) {
        return res.status(400).json({ error: "Backup data is required" });
      }

      // Validate backup format
      if (!backupData.version || !backupData.timestamp || !backupData.tables) {
        return res.status(400).json({ error: "Invalid backup format" });
      }

      let preRestoreBackupJson: string | null = null;
      let preRestoreFilename: string | null = null;

      // Create pre-restore backup if requested (recommended)
      if (createPreBackup) {
        preRestoreBackupJson = await storage.exportDatabaseToJSON();
        preRestoreFilename = `pre_restore_backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
        const preRestoreSize = Buffer.byteLength(preRestoreBackupJson, 'utf8');
        
        // Save metadata (preserved during restore since we don't delete database_backups table)
        await storage.createDatabaseBackup(
          preRestoreFilename,
          preRestoreSize,
          user.userId!,
          'Automatic pre-restore backup'
        );
        console.log(`[DB_RESTORE] Pre-restore backup created: ${preRestoreFilename}`);
      }

      // Perform restore
      await storage.importDatabaseFromJSON(backupData, user.userId!);

      // Return success response with pre-restore backup (client should save it)
      const response: any = {
        success: true,
        message: "Database restored successfully",
        restoredFrom: backupData.timestamp,
        tablesRestored: Object.keys(backupData.tables).length
      };

      // Include pre-restore backup in response so client can save it
      if (preRestoreBackupJson && preRestoreFilename) {
        response.preRestoreBackup = {
          filename: preRestoreFilename,
          data: preRestoreBackupJson
        };
        response.message += " (Pre-restore backup included in response - save it immediately!)";
      }

      res.json(response);

      console.log(`[DB_RESTORE] Database restored by ${user.userId} (${user.email}) from backup dated ${backupData.timestamp}`);
    } catch (error) {
      console.error("Error restoring database:", error);
      res.status(500).json({ error: "Failed to restore database" });
    }
  });

  // GET /api/admin/database/backups - Get backup history
  app.get("/api/admin/database/backups", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || user.userId !== 'PB1') {
        return res.status(403).json({ error: "Forbidden - Root admin access required (PB1 only)" });
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
  app.delete("/api/admin/database/backups/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId as string);
      if (!user || user.userId !== 'PB1') {
        return res.status(403).json({ error: "Forbidden - Root admin access required (PB1 only)" });
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

  const httpServer = createServer(app);

  return httpServer;
}
