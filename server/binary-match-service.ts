import { eq, sql, and, isNull, asc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users, binaryMatchQueue, incomeTransactions, userIncomeSummaries, type User } from "@shared/schema";

/**
 * BinaryMatchService - Handles QUEUE-BASED 3:3 binary matching
 * 
 * Rules:
 * 1. ONE-TIME Qualification: User must have 1 personal left + 1 personal right (forever qualified)
 * 2. Building pairs: 3 left + 3 right = 1 matched pair (self + spill counts)
 * 3. Queue entry: When user builds 3:3 pair → enters FIFO queue
 * 4. Payment trigger: Each new activation pays FIRST person in queue (₹1000)
 * 5. Re-entry: After receiving payment, user exits queue. Can re-enter with new 3:3 pair.
 * 6. Carry forward: Unmatched legs carry to next cycle
 */
export class BinaryMatchService {
  private db: NodePgDatabase<any>;

  constructor(db: NodePgDatabase<any>) {
    this.db = db;
  }

  /**
   * Record leg volume and check if user can enter queue (called after downline activation)
   * @param userId User ID to check
   */
  async recordLegVolumeAndMaybeEnqueue(userId: string): Promise<void> {
    console.log(`[BINARY-MATCH-QUEUE] Checking user ${userId} for queue entry`);

    const user = await this.db.select().from(users).where(eq(users.userId, userId)).limit(1);
    if (!user[0]) {
      console.log(`[BINARY-MATCH-QUEUE] User ${userId} not found`);
      return;
    }

    const userRecord = user[0];

    // Check ONE-TIME qualification: 1 personal left + 1 personal right
    const isQualified = userRecord.personalLeftCount >= 1 && userRecord.personalRightCount >= 1;
    
    if (!isQualified) {
      console.log(`[BINARY-MATCH-QUEUE] User ${userId} not qualified (${userRecord.personalLeftCount}L, ${userRecord.personalRightCount}R personal)`);
      
      // Update qualification status
      if (userRecord.binaryQualified) {
        await this.db.update(users)
          .set({ binaryQualified: false })
          .where(eq(users.userId, userId));
      }
      return;
    }

    // Mark as qualified if not already
    if (!userRecord.binaryQualified) {
      await this.db.update(users)
        .set({ binaryQualified: true })
        .where(eq(users.userId, userId));
      console.log(`[BINARY-MATCH-QUEUE] User ${userId} is now qualified for binary matching!`);
    }

    // Calculate NEW leg volume since last check (delta accounting)
    const newLeftVolume = userRecord.leftLegCount - userRecord.binaryLastMatchedLeftCount;
    const newRightVolume = userRecord.rightLegCount - userRecord.binaryLastMatchedRightCount;

    console.log(`[BINARY-MATCH-QUEUE] User ${userId} new volume: ${newLeftVolume}L, ${newRightVolume}R`);

    // Total matchable volume = carry-forward + new volume
    const totalUnmatchedLeft = userRecord.binaryUnmatchedLeft + newLeftVolume;
    const totalUnmatchedRight = userRecord.binaryUnmatchedRight + newRightVolume;

    console.log(`[BINARY-MATCH-QUEUE] User ${userId} total unmatched: ${totalUnmatchedLeft}L, ${totalUnmatchedRight}R`);

    // Calculate 3:3 pairs
    const leftPairs = Math.floor(totalUnmatchedLeft / 3);
    const rightPairs = Math.floor(totalUnmatchedRight / 3);
    const completePairs = Math.min(leftPairs, rightPairs);

    // Update tracking (even if no pairs - prevents reprocessing)
    const updateData: any = {
      binaryLastMatchedLeftCount: userRecord.leftLegCount,
      binaryLastMatchedRightCount: userRecord.rightLegCount,
    };

    if (completePairs === 0) {
      console.log(`[BINARY-MATCH-QUEUE] User ${userId} has no complete 3:3 pairs yet`);
      
      // Carry forward unmatched volume
      updateData.binaryUnmatchedLeft = totalUnmatchedLeft;
      updateData.binaryUnmatchedRight = totalUnmatchedRight;
      
      await this.db.update(users)
        .set(updateData)
        .where(eq(users.userId, userId));
      
      return;
    }

    // User has complete pair(s)! Add to queue
    console.log(`[BINARY-MATCH-QUEUE] User ${userId} has ${completePairs} complete pair(s)! Adding to queue...`);

    // Calculate remaining unmatched after taking pairs for queue
    const usedLeft = completePairs * 3;
    const usedRight = completePairs * 3;
    const remainingLeft = totalUnmatchedLeft - usedLeft;
    const remainingRight = totalUnmatchedRight - usedRight;

    // Get current max queue position
    const maxPosResult = await this.db
      .select({ maxPos: sql<number>`COALESCE(MAX(queue_position), 0)` })
      .from(binaryMatchQueue);
    
    const nextPosition = (maxPosResult[0]?.maxPos || 0) + 1;

    // Add each pair as separate queue entry (for multiple pairs)
    for (let i = 0; i < completePairs; i++) {
      await this.db.insert(binaryMatchQueue).values({
        userId: userId,
        queuePosition: nextPosition + i,
        amountInr: '1000',
        status: 'waiting',
      });
      console.log(`[BINARY-MATCH-QUEUE] Added user ${userId} to queue at position ${nextPosition + i}`);
    }

    // Update user tracking
    updateData.binaryUnmatchedLeft = remainingLeft;
    updateData.binaryUnmatchedRight = remainingRight;
    updateData.binaryMatchedPairs = userRecord.binaryMatchedPairs + completePairs;

    await this.db.update(users)
      .set(updateData)
      .where(eq(users.userId, userId));

    console.log(`[BINARY-MATCH-QUEUE] User ${userId} entered queue with ${completePairs} pair(s). Carry-forward: ${remainingLeft}L, ${remainingRight}R`);
  }

  /**
   * Process upline after a new activation - check all sponsors for queue eligibility
   * NOTE: Queue payments are handled during activation creation in storage.ts:createActivationWithPayments
   * This function only updates leg volume and checks for new queue entries
   * @param activatedUserId User who just activated
   */
  async processUplineForQueueEntry(activatedUserId: string): Promise<void> {
    console.log(`[BINARY-MATCH-QUEUE] Processing upline for newly activated user ${activatedUserId}`);

    const activatedUser = await this.db.select().from(users)
      .where(eq(users.userId, activatedUserId))
      .limit(1);

    if (!activatedUser[0] || !activatedUser[0].sponsorId) {
      console.log(`[BINARY-MATCH-QUEUE] No sponsor found for ${activatedUserId}`);
      return;
    }

    // Walk up sponsor tree
    let currentUserId = activatedUser[0].sponsorId;
    let depth = 0;
    const maxDepth = 100;

    while (currentUserId && depth < maxDepth) {
      try {
        await this.recordLegVolumeAndMaybeEnqueue(currentUserId);
      } catch (error) {
        console.error(`[BINARY-MATCH-QUEUE] Error checking ${currentUserId}:`, error);
      }

      // Move to next sponsor
      const currentUser = await this.db.select().from(users)
        .where(eq(users.userId, currentUserId))
        .limit(1);

      if (!currentUser[0] || !currentUser[0].sponsorId) {
        break;
      }

      currentUserId = currentUser[0].sponsorId;
      depth++;
    }

    console.log(`[BINARY-MATCH-QUEUE] Processed upline up to depth ${depth}`);
  }
}
