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

  const httpServer = createServer(app);

  return httpServer;
}
