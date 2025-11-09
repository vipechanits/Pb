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

  // Activation routes
  app.post("/api/activations", async (req, res) => {
    try {
      const { id, payerWallet, sponsorWallet, binaryMatchId, matrixUpline1, matrixUpline2, matrixUpline3, matrixUpline4, matrixUpline5, status, blockchainTxHash } = req.body;
      
      if (!id || !payerWallet) {
        return res.status(400).json({ error: "id and payerWallet are required" });
      }
      
      if (status && !['pending', 'partial', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be one of: pending, partial, completed, failed" });
      }
      
      const activation = await storage.createActivation({
        id,
        payerWallet,
        sponsorWallet,
        binaryMatchId,
        matrixUpline1,
        matrixUpline2,
        matrixUpline3,
        matrixUpline4,
        matrixUpline5,
        status,
        blockchainTxHash,
      });
      res.status(201).json(activation);
    } catch (error) {
      console.error("Error creating activation:", error);
      res.status(500).json({ error: "Failed to create activation" });
    }
  });

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
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }
      
      const validStatuses = ['pending', 'partial', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be one of: pending, partial, completed, failed" });
      }
      
      const activation = await storage.updateActivationStatus(req.params.id, status);
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
      const { activationId, paymentType, receiverWallet, receiverType, amountUsdt, paymentMode, blockchainTxHash, offlineUtrId, offlineProofUrl, notes } = req.body;
      
      if (!activationId || !paymentType || !receiverWallet || !receiverType || !amountUsdt) {
        return res.status(400).json({ error: "activationId, paymentType, receiverWallet, receiverType, and amountUsdt are required" });
      }
      
      const validPaymentTypes = ['direct_sponsor', 'binary_match', 'creator_fee', 'matrix_level_1', 'matrix_level_2', 'matrix_level_3', 'matrix_level_4', 'matrix_level_5'];
      if (!validPaymentTypes.includes(paymentType)) {
        return res.status(400).json({ error: "Invalid paymentType" });
      }
      
      const validReceiverTypes = ['user', 'admin'];
      if (!validReceiverTypes.includes(receiverType)) {
        return res.status(400).json({ error: "Invalid receiverType. Must be 'user' or 'admin'" });
      }
      
      if (paymentMode && !['web3', 'offline'].includes(paymentMode)) {
        return res.status(400).json({ error: "Invalid paymentMode. Must be 'web3' or 'offline'" });
      }
      
      const payment = await storage.createActivationPayment({
        activationId,
        paymentType: paymentType as any,
        receiverWallet,
        receiverType: receiverType as any,
        amountUsdt,
        paymentMode: paymentMode as any,
        blockchainTxHash,
        offlineUtrId,
        offlineProofUrl,
        confirmed: false,
        notes,
      });
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

  app.get("/api/activation-payments/receiver/:walletAddress", async (req, res) => {
    try {
      const payments = await storage.getActivationPaymentsByReceiver(req.params.walletAddress);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching receiver payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/activation-payments/receiver/:walletAddress/pending", async (req, res) => {
    try {
      const payments = await storage.getActivationPaymentsPendingConfirmation(req.params.walletAddress);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      res.status(500).json({ error: "Failed to fetch pending payments" });
    }
  });

  app.post("/api/activation-payments/:id/confirm", async (req, res) => {
    try {
      const { confirmedBy } = req.body;
      if (!confirmedBy) {
        return res.status(400).json({ error: "confirmedBy is required" });
      }
      
      const payment = await storage.confirmActivationPayment(req.params.id, confirmedBy);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  app.patch("/api/activation-payments/:id/mode", async (req, res) => {
    try {
      const { mode, txHash, utrId, proofUrl } = req.body;
      if (!mode) {
        return res.status(400).json({ error: "mode is required" });
      }
      
      if (!['web3', 'offline'].includes(mode)) {
        return res.status(400).json({ error: "Invalid mode. Must be 'web3' or 'offline'" });
      }
      
      const payment = await storage.updateActivationPaymentMode(req.params.id, mode, txHash, utrId, proofUrl);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment mode:", error);
      res.status(500).json({ error: "Failed to update payment mode" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
