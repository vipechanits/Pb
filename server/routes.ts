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

  // Activation payment confirmation routes
  app.post("/api/activation-payments/confirmations", async (req, res) => {
    try {
      const { 
        activationId,
        payerWalletAddress, 
        receiverWalletAddress, 
        receiverIndex,
        amountUsdt, 
        paymentStage, 
        isAdminReceiver,
        paymentMode,
        transactionId,
        transactionHash,
        paymentProofUrl,
        notes 
      } = req.body;
      
      if (!activationId || !payerWalletAddress || !receiverWalletAddress || receiverIndex === undefined || !amountUsdt || !paymentStage || !paymentMode) {
        return res.status(400).json({ error: "Missing required fields (activationId, payerWalletAddress, receiverWalletAddress, receiverIndex, amountUsdt, paymentStage, paymentMode)" });
      }

      const confirmation = await storage.createActivationPaymentConfirmation({
        activationId,
        payerWalletAddress: payerWalletAddress.toLowerCase(),
        receiverWalletAddress: receiverWalletAddress.toLowerCase(),
        receiverIndex,
        amountUsdt,
        paymentStage,
        isAdminReceiver: isAdminReceiver || false,
        paymentMode,
        transactionId,
        transactionHash,
        paymentProofUrl,
        notes,
        confirmed: false,
      });

      res.status(201).json(confirmation);
    } catch (error) {
      console.error("Error creating activation payment confirmation:", error);
      res.status(500).json({ error: "Failed to create payment confirmation" });
    }
  });

  app.get("/api/activation-payments/confirmations/activation/:activationId", async (req, res) => {
    try {
      const { activationId } = req.params;
      const confirmations = await storage.getActivationPaymentConfirmationsByActivationId(activationId);
      res.json(confirmations);
    } catch (error) {
      console.error("Error fetching activation payment confirmations:", error);
      res.status(500).json({ error: "Failed to fetch payment confirmations" });
    }
  });

  app.get("/api/activation-payments/confirmations/payer/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const confirmations = await storage.getActivationPaymentConfirmationsByPayer(walletAddress);
      res.json(confirmations);
    } catch (error) {
      console.error("Error fetching payer payment confirmations:", error);
      res.status(500).json({ error: "Failed to fetch payment confirmations" });
    }
  });

  app.get("/api/activation-payments/confirmations/receiver/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const confirmations = await storage.getActivationPaymentConfirmationsByReceiver(walletAddress);
      res.json(confirmations);
    } catch (error) {
      console.error("Error fetching receiver payment confirmations:", error);
      res.status(500).json({ error: "Failed to fetch payment confirmations" });
    }
  });

  app.get("/api/activation-payments/confirmations/pending", async (req, res) => {
    try {
      const confirmations = await storage.getPendingActivationPaymentConfirmations();
      res.json(confirmations);
    } catch (error) {
      console.error("Error fetching pending payment confirmations:", error);
      res.status(500).json({ error: "Failed to fetch payment confirmations" });
    }
  });

  app.get("/api/activation-payments/confirmations", async (req, res) => {
    try {
      const confirmations = await storage.getAllActivationPaymentConfirmations();
      res.json(confirmations);
    } catch (error) {
      console.error("Error fetching all payment confirmations:", error);
      res.status(500).json({ error: "Failed to fetch payment confirmations" });
    }
  });

  app.post("/api/activation-payments/confirmations/:id/confirm", async (req, res) => {
    try {
      const { id } = req.params;
      const confirmation = await storage.confirmActivationPayment(id);
      
      if (!confirmation) {
        return res.status(404).json({ error: "Payment confirmation not found" });
      }

      res.json(confirmation);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
