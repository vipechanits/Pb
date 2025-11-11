import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { insertActivationSchema, insertActivationPaymentSchema, updateActivationStatusSchema, updateProfileSchema, submitPaymentProofSchema, confirmPaymentSchema, rejectPaymentSchema, users } from "@shared/schema";
import { hashPassword, verifyPassword, serializeUser } from "./auth";
import { generateUserPaymentQR } from "./qrcode-generator";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        role: 'user',
        userId,
        sponsorId: sponsorId || null,
        binaryLeg: assignedBinaryLeg || null,
        isActivated: false,
      });
      
      // Set session and save it before responding
      req.session.userId = user.id;
      req.session.isAdmin = user.role === 'admin';
      
      // Ensure session is saved before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.status(201).json({ user: serializeUser(user) });
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
      
      // If admin, get ALL submitted payments; regular users get only their own
      let payments: any[] = [];
      if (user.role === 'admin') {
        payments = await storage.getAdminPendingConfirmations();
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

  const httpServer = createServer(app);

  return httpServer;
}
