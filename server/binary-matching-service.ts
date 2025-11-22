import { eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users, incomeTransactions, type User, type SystemConfig, type InsertIncomeTransaction } from "@shared/schema";

export class BinaryMatchingService {
  constructor() {
    // No dependencies - all operations require explicit transaction parameter
  }

  /**
   * Calculate and persist binary matching for a user
   * Must be called within a transaction with user row locked (FOR UPDATE)
   * 
   * Rules:
   * 1. User must be qualified (personalLeftCount >= 1 AND personalRightCount >= 1)
   * 2. Matching ratio from config (default 3:3)
   * 3. Unmatched activations carry forward
   * 4. Income created per matched pair
   */
  async calculateAndPersistMatching(
    userId: string, 
    config: SystemConfig,
    txDb: NodePgDatabase<any>
  ): Promise<{ pairsMatched: number; incomeGenerated: number }> {
    const db = txDb;
    
    // Lock user row for update
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .for('update')
      .limit(1);
      
    const user = userRows[0];
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Check if user is qualified (1 personal left + 1 personal right)
    const isQualified = (user.personalLeftCount || 0) >= 1 && (user.personalRightCount || 0) >= 1;
    
    // Update qualification status if changed
    if (user.binaryQualified !== isQualified) {
      await db
        .update(users)
        .set({ binaryQualified: isQualified })
        .where(eq(users.userId, userId));
    }

    // Even if not qualified, we still need to advance last-matched counters
    // to prevent reprocessing when user later qualifies
    if (!isQualified) {
      // Store overflow in unmatched fields so activation volume is not lost
      const newLeft = Math.max(0, (user.leftLegCount || 0) - (user.binaryLastMatchedLeftCount || 0));
      const newRight = Math.max(0, (user.rightLegCount || 0) - (user.binaryLastMatchedRightCount || 0));
      
      await db
        .update(users)
        .set({
          binaryUnmatchedLeft: newLeft,
          binaryUnmatchedRight: newRight,
          binaryLastMatchedLeftCount: user.leftLegCount || 0,
          binaryLastMatchedRightCount: user.rightLegCount || 0,
        })
        .where(eq(users.userId, userId));
        
      console.log(`[BINARY_MATCH] User ${userId} not qualified (PL:${user.personalLeftCount}, PR:${user.personalRightCount}), stored unmatched: L:${newLeft}, R:${newRight}`);
      return { pairsMatched: 0, incomeGenerated: 0 };
    }

    // Calculate new activations since last matching (including carry forward)
    const newLeft = Math.max(0, (user.leftLegCount || 0) - (user.binaryLastMatchedLeftCount || 0)) + (user.binaryUnmatchedLeft || 0);
    const newRight = Math.max(0, (user.rightLegCount || 0) - (user.binaryLastMatchedRightCount || 0)) + (user.binaryUnmatchedRight || 0);

    // Get matching ratios from config (default 3:3)
    // Ratio 3:3 means: 3 left legs + 3 right legs = 1 matched pair
    const ratioLeft = config.binaryMatchingRatioLeft || 3;
    const ratioRight = config.binaryMatchingRatioRight || 3;
    
    // Calculate how many complete pairs can be matched
    // With 10 left + 3 right and 3:3 ratio: min(10/3, 3/3) = min(3, 1) = 1 match
    // With 10 left + 10 right and 3:3 ratio: min(10/3, 10/3) = min(3, 3) = 3 matches
    const pairsMatched = Math.min(Math.floor(newLeft / ratioLeft), Math.floor(newRight / ratioRight));
    
    if (pairsMatched === 0) {
      // No complete pairs to match, but update unmatched counts
      await db
        .update(users)
        .set({
          binaryUnmatchedLeft: newLeft,
          binaryUnmatchedRight: newRight,
          binaryLastMatchedLeftCount: user.leftLegCount || 0,
          binaryLastMatchedRightCount: user.rightLegCount || 0,
        })
        .where(eq(users.userId, userId));
        
      console.log(`[BINARY_MATCH] User ${userId} no complete pairs (L:${newLeft}/${ratioLeft}, R:${newRight}/${ratioRight})`);
      return { pairsMatched: 0, incomeGenerated: 0 };
    }

    // Calculate unmatched activations (carry forward)
    // Each matched pair consumes ratioLeft from left and ratioRight from right
    const unmatchedLeft = newLeft - (pairsMatched * ratioLeft);
    const unmatchedRight = newRight - (pairsMatched * ratioRight);

    // Get income amount per pair from config (default ₹1000)
    const incomePerPair = parseFloat(config.binaryMatchPaymentAmount?.toString() || '1000');
    const totalIncome = pairsMatched * incomePerPair;

    // Update user binary matching stats
    await db
      .update(users)
      .set({
        binaryMatchedPairs: (user.binaryMatchedPairs || 0) + pairsMatched,
        binaryUnmatchedLeft: unmatchedLeft,
        binaryUnmatchedRight: unmatchedRight,
        binaryLastMatchedLeftCount: user.leftLegCount || 0,
        binaryLastMatchedRightCount: user.rightLegCount || 0,
      })
      .where(eq(users.userId, userId));

    // Create income transaction for matched pairs
    // Note: We create one income record for all pairs matched
    const incomeRecord: InsertIncomeTransaction = {
      userId: userId,
      activationId: null, // Binary matching is not tied to a specific activation
      activationPaymentId: null,
      incomeType: 'binary_match',
      amountInr: totalIncome.toString(),
      status: 'confirmed',
      sourceUserId: null, // Binary matching comes from team, not specific user
      triggeredBy: 'activation',
      confirmedAt: new Date(),
      notes: `${pairsMatched} pairs matched (${ratioLeft}:${ratioRight} ratio)`,
    };

    await db.insert(incomeTransactions).values(incomeRecord);

    // Update user income summary
    await db.execute(sql`
      INSERT INTO user_income_summaries (user_id, binary_match_income)
      VALUES (${userId}, ${totalIncome})
      ON CONFLICT (user_id) DO UPDATE
      SET binary_match_income = user_income_summaries.binary_match_income + ${totalIncome}
    `);

    console.log(`[BINARY_MATCH] User ${userId} matched ${pairsMatched} pairs (L:${newLeft}/${ratioLeft}, R:${newRight}/${ratioRight}), earned ₹${totalIncome}, unmatched: L:${unmatchedLeft}, R:${unmatchedRight}`);
    
    return { pairsMatched, incomeGenerated: totalIncome };
  }

  /**
   * Process binary matching up the sponsor chain
   * Should be called after activation completion within the same transaction
   */
  async processUplineMatching(
    activatedUserId: string,
    config: SystemConfig,
    txDb: NodePgDatabase<any>,
    maxDepth: number = 50
  ): Promise<void> {
    console.log(`[BINARY_MATCH] Starting upline matching from ${activatedUserId}`);
    
    // Get sponsor chain
    const sponsorChain = await this.getSponsorChain(activatedUserId, txDb, maxDepth);
    
    // Process each sponsor in chain
    // Note: Errors are NOT caught here - they will abort the entire activation transaction
    // This ensures atomic "all uplines succeed or none" behavior
    for (const sponsorId of sponsorChain) {
      if (sponsorId === 'PB0') {
        // Skip admin
        continue;
      }
      
      const result = await this.calculateAndPersistMatching(sponsorId, config, txDb);
      if (result.pairsMatched > 0) {
        console.log(`[BINARY_MATCH] Upline ${sponsorId}: ${result.pairsMatched} pairs, ₹${result.incomeGenerated}`);
      }
    }
  }

  /**
   * Get sponsor chain for a user (excluding PB0)
   */
  private async getSponsorChain(userId: string, txDb: NodePgDatabase<any>, maxDepth: number = 50): Promise<string[]> {
    const result = await txDb.execute<{ user_id: string }>(sql`
      WITH RECURSIVE sponsor_chain AS (
        SELECT sponsor_id, 1 as depth
        FROM users
        WHERE user_id = ${userId} AND sponsor_id IS NOT NULL
        
        UNION ALL
        
        SELECT u.sponsor_id, sc.depth + 1
        FROM users u
        INNER JOIN sponsor_chain sc ON u.user_id = sc.sponsor_id
        WHERE u.sponsor_id IS NOT NULL 
          AND u.sponsor_id != 'PB0'
          AND sc.depth < ${maxDepth}
      )
      SELECT sponsor_id as user_id
      FROM sponsor_chain
      WHERE sponsor_id IS NOT NULL AND sponsor_id != 'PB0'
      ORDER BY depth
    `);
    
    return result.rows.map(row => row.user_id);
  }
}
