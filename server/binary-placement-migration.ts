import { db } from "./db";
import { users } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

interface UserPlacementData {
  userId: string;
  sponsorId: string | null;
  binaryLeg: string | null;
  isActivated: boolean;
}

export async function migrateBinaryPlacement() {
  console.log("Starting binary placement migration...");

  try {
    await db.transaction(async (tx) => {
      console.log("Step 1: Copy binaryLeg to sponsorRequestedLeg for all users");
      await tx.execute(sql`
        UPDATE users 
        SET sponsor_requested_leg = binary_leg 
        WHERE sponsor_requested_leg IS NULL
      `);

      console.log("Step 2: Fetch all users ordered by creation");
      const allUsers = await tx.select({
        userId: users.userId,
        sponsorId: users.sponsorId,
        binaryLeg: users.binaryLeg,
        isActivated: users.isActivated,
      }).from(users).orderBy(users.createdAt);

      if (allUsers.length === 0) {
        console.log("No users found. Migration complete.");
        return;
      }

      console.log(`Found ${allUsers.length} users`);

      // Find first activated regular user (not PB0) to be binary tree root
      const firstActivatedUser = allUsers.find(
        (u) => u.userId !== "PB0" && u.isActivated
      );

      if (!firstActivatedUser) {
        console.log("No activated users found. Binary tree not initialized.");
        return;
      }

      console.log(`Binary tree root: ${firstActivatedUser.userId}`);

      // Set root user (no parent, no leg)
      await tx.update(users)
        .set({
          binaryParentId: null,
          binaryPlacementLeg: null,
        })
        .where(eq(users.userId, firstActivatedUser.userId));

      console.log("Step 3: Build binary tree using breadth-first placement");

      // Track which positions are occupied
      const occupiedPositions = new Map<string, Set<string>>(); // parentId -> Set of legs
      occupiedPositions.set(firstActivatedUser.userId, new Set());

      // Queue for breadth-first traversal (start with root)
      const queue: string[] = [firstActivatedUser.userId];
      let processedCount = 1;

      // Process remaining activated users
      const remainingUsers = allUsers.filter(
        (u) => u.userId !== "PB0" && 
               u.userId !== firstActivatedUser.userId && 
               u.isActivated
      );

      console.log(`Processing ${remainingUsers.length} remaining activated users`);

      for (const user of remainingUsers) {
        // Find first available position in binary tree
        let placed = false;

        while (queue.length > 0 && !placed) {
          const parentId = queue[0];
          const parentOccupied = occupiedPositions.get(parentId) || new Set();

          // Try left leg first
          if (!parentOccupied.has("left")) {
            await tx.update(users)
              .set({
                binaryParentId: parentId,
                binaryPlacementLeg: "left",
              })
              .where(eq(users.userId, user.userId));

            parentOccupied.add("left");
            occupiedPositions.set(parentId, parentOccupied);
            occupiedPositions.set(user.userId, new Set());
            queue.push(user.userId);
            placed = true;
            processedCount++;
            console.log(`Placed ${user.userId} in ${parentId}-left`);
          }
          // Try right leg
          else if (!parentOccupied.has("right")) {
            await tx.update(users)
              .set({
                binaryParentId: parentId,
                binaryPlacementLeg: "right",
              })
              .where(eq(users.userId, user.userId));

            parentOccupied.add("right");
            occupiedPositions.set(parentId, parentOccupied);
            occupiedPositions.set(user.userId, new Set());
            queue.push(user.userId);
            placed = true;
            processedCount++;
            console.log(`Placed ${user.userId} in ${parentId}-right`);
          }
          // Both positions filled, move to next parent in queue
          else {
            queue.shift();
          }
        }

        if (!placed) {
          const errorMsg = `FATAL: Could not place user ${user.userId} - binary tree full or logic error`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
      }

      console.log(`Step 4: Validate migration - all users should be placed`);
      
      // Validate: processedCount should equal activated users
      const expectedCount = remainingUsers.length + 1; // +1 for root
      if (processedCount !== expectedCount) {
        throw new Error(
          `Migration validation failed: Processed ${processedCount} users but expected ${expectedCount}`
        );
      }

      // Validate: All activated users (except root) should have placement
      const unplacedActivated = await tx.select({
        userId: users.userId,
      }).from(users)
        .where(
          and(
            eq(users.isActivated, true),
            sql`${users.userId} != 'PB0'`,
            sql`${users.userId} != ${firstActivatedUser.userId}`,
            isNull(users.binaryParentId)
          )
        );

      if (unplacedActivated.length > 0) {
        const unplacedIds = unplacedActivated.map(u => u.userId).join(", ");
        throw new Error(
          `Migration validation failed: ${unplacedActivated.length} activated users not placed: ${unplacedIds}`
        );
      }

      console.log(`✅ Validation passed: All ${processedCount} activated users have binary placement`);
      console.log(`Step 5: Migration complete. Processed ${processedCount} users.`);
    });

    console.log("\n✅ Binary placement migration completed successfully!");
    console.log("Next step: Add unique constraint via SQL");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if executed directly
migrateBinaryPlacement()
  .then(() => {
    console.log("Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script error:", error);
    process.exit(1);
  });
