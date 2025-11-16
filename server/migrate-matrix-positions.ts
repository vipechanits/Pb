/**
 * Migration Script: Extract existing matrix positions from users table
 * into activation_matrix_positions for Cycle 1 activations
 */
import { db } from "./db";
import { users, activations, activationMatrixPositions } from "@shared/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";

async function migrateMatrixPositions() {
  console.log("[MIGRATION] Starting matrix position migration...");
  
  try {
    // Find all users with matrix positions (activated users)
    const usersWithMatrix = await db
      .select()
      .from(users)
      .where(
        and(
          isNotNull(users.matrixLevel),
          isNotNull(users.matrixPath),
          eq(users.isActivated, true)
        )
      );

    console.log(`[MIGRATION] Found ${usersWithMatrix.length} users with matrix positions`);

    if (usersWithMatrix.length === 0) {
      console.log("[MIGRATION] No users to migrate. Exiting.");
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithMatrix) {
      // Find the user's FIRST activation (Cycle 1)
      // NOTE: activations.payerWallet stores users.id (UUID), not users.userId (PB####)
      const userActivations = await db
        .select()
        .from(activations)
        .where(eq(activations.payerWallet, user.id)) // Use UUID, not userId
        .orderBy(activations.createdAt); // Get oldest first

      if (userActivations.length === 0) {
        console.log(`[MIGRATION] ⚠️  User ${user.userId} (ID: ${user.id}) has matrix position but no activation found. Skipping.`);
        skippedCount++;
        continue;
      }

      const firstActivation = userActivations[0];
      
      // Check if matrix position already exists for this activation
      const existingPosition = await db
        .select()
        .from(activationMatrixPositions)
        .where(eq(activationMatrixPositions.activationId, firstActivation.id))
        .limit(1);

      if (existingPosition.length > 0) {
        console.log(`[MIGRATION] Matrix position already exists for activation ${firstActivation.id}. Skipping.`);
        skippedCount++;
        continue;
      }

      // Find the parent activation ID based on matrixParentId from users table
      let matrixParentActivationId: string | null = null;
      if (user.matrixParentId) {
        const parentUser = await db
          .select()
          .from(users)
          .where(eq(users.userId, user.matrixParentId))
          .limit(1);

        if (parentUser.length > 0) {
          // Use parent's UUID to find their first activation
          const parentActivations = await db
            .select()
            .from(activations)
            .where(eq(activations.payerWallet, parentUser[0].id)) // Use UUID, not userId
            .orderBy(activations.createdAt) // Get parent's first activation
            .limit(1);

          if (parentActivations.length > 0) {
            matrixParentActivationId = parentActivations[0].id;
          }
        }
      }

      // Create matrix position record
      await db.insert(activationMatrixPositions).values({
        activationId: firstActivation.id,
        matrixParentActivationId: matrixParentActivationId,
        matrixPosition: user.matrixPosition,
        matrixLevel: user.matrixLevel!,
        matrixPath: user.matrixPath!,
      });

      console.log(`[MIGRATION] ✓ Migrated ${user.userId} -> activation ${firstActivation.id}`);
      migratedCount++;
    }

    console.log(`[MIGRATION] ✅ Migration complete!`);
    console.log(`[MIGRATION]    Migrated: ${migratedCount}`);
    console.log(`[MIGRATION]    Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error("[MIGRATION] ❌ Error during migration:", error);
    throw error;
  }
}

// Run migration
migrateMatrixPositions()
  .then(() => {
    console.log("[MIGRATION] Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[MIGRATION] Script failed:", error);
    process.exit(1);
  });
