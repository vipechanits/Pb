import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Object storage route for getting upload URL
  // Note: This endpoint is intentionally unauthenticated to allow users to upload
  // payment proofs as part of the offline activation process. The wallet address
  // is submitted when setting the ACL policy, linking the upload to the user.
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
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

  // Fallback payment routes
  app.post("/api/fallback-payments", async (req, res) => {
    try {
      const { paymentType, userWalletAddress, amountUsdt, amountInr, transactionId, paymentProofUrl, notes } = req.body;
      
      if (!paymentType || !userWalletAddress || !amountUsdt || !amountInr) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const payment = await storage.createFallbackPayment({
        paymentType,
        userWalletAddress,
        amountUsdt,
        amountInr,
        transactionId,
        paymentProofUrl,
        notes,
        adminConfirmed: false,
        userConfirmed: false,
      });

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating fallback payment:", error);
      res.status(500).json({ error: "Failed to create fallback payment" });
    }
  });

  app.get("/api/fallback-payments/user/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const payments = await storage.getFallbackPaymentsByUser(walletAddress);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching user fallback payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/fallback-payments/pending", async (req, res) => {
    try {
      const payments = await storage.getPendingFallbackPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching pending fallback payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/fallback-payments", async (req, res) => {
    try {
      const payments = await storage.getAllFallbackPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching all fallback payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/fallback-payments/:id/confirm-admin", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminWalletAddress } = req.body;

      if (!adminWalletAddress) {
        return res.status(400).json({ error: "adminWalletAddress is required" });
      }

      const payment = await storage.confirmFallbackPaymentByAdmin(id, adminWalletAddress);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error confirming payment by admin:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  app.post("/api/fallback-payments/:id/confirm-user", async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.confirmFallbackPaymentByUser(id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error confirming payment by user:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
