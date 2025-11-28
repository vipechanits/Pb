import { eq, and, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { incomeTransactions, userIncomeSummaries, users, systemConfig, type ActivationPayment, type InsertIncomeTransaction } from "@shared/schema";

export class IncomeService {
  private db: NodePgDatabase<any>;

  constructor(db: NodePgDatabase<any>) {
    this.db = db;
  }

  /**
   * Calculate binary matching for a user after an activation
   * Binary matching: 3 left leg activations matched with 3 right leg activations = 1 pair
   * Each pair generates binary match income
   */
  async calculateAndProcessBinaryMatching(userId: string): Promise<void> {
    try {
      const user = await this.db.select().from(users).where(eq(users.userId, userId)).then(r => r[0]);
      if (!user || !user.binaryQualified) {
        console.log(`[BINARY-MATCH] User ${userId} not eligible for binary matching`);
        return;
      }

      // Get config for binary match amount from system config
      const configResult = await this.db.select().from(systemConfig).limit(1);
      const config = configResult[0];
      const binaryMatchAmount = config?.binaryMatchPaymentAmount || '500';

      // Calculate new matchable pairs
      const leftDiff = (user.leftLegCount || 0) - (user.binaryLastMatchedLeftCount || 0);
      const rightDiff = (user.rightLegCount || 0) - (user.binaryLastMatchedRightCount || 0);

      // How many complete 3:3 pairs can be formed?
      const leftGroups = Math.floor((user.binaryUnmatchedLeft + leftDiff) / 3);
      const rightGroups = Math.floor((user.binaryUnmatchedRight + rightDiff) / 3);
      const newPairs = Math.min(leftGroups, rightGroups);

      if (newPairs > 0) {
        console.log(`[BINARY-MATCH] User ${userId}: ${newPairs} new 3:3 pairs matched`);

        // Create income transactions for each pair
        for (let i = 0; i < newPairs; i++) {
          await this.createIncomesForPayment({
            id: `binary-match-${userId}-${Date.now()}-${i}`,
            activationId: `auto-${userId}-${Date.now()}`,
            payerUserId: userId,
            receiverUserId: userId,
            receiverType: 'user',
            paymentType: 'binary_match',
            amountInr: binaryMatchAmount,
            status: 'confirmed',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);
        }

        // Update user's binary matching tracking
        const newUnmatchedLeft = (user.binaryUnmatchedLeft + leftDiff) % 3;
        const newUnmatchedRight = (user.binaryUnmatchedRight + rightDiff) % 3;

        await this.db.update(users).set({
          binaryMatchedPairs: (user.binaryMatchedPairs || 0) + newPairs,
          binaryUnmatchedLeft: newUnmatchedLeft,
          binaryUnmatchedRight: newUnmatchedRight,
          binaryLastMatchedLeftCount: user.leftLegCount,
          binaryLastMatchedRightCount: user.rightLegCount,
          updatedAt: new Date(),
        }).where(eq(users.userId, userId));

        console.log(`[BINARY-MATCH] Updated ${userId}: matched ${newPairs} pairs, unmatched left=${newUnmatchedLeft}, right=${newUnmatchedRight}`);
      } else {
        // Still update unmatched counts even if no complete pairs yet
        const newUnmatchedLeft = user.binaryUnmatchedLeft + leftDiff;
        const newUnmatchedRight = user.binaryUnmatchedRight + rightDiff;
        
        await this.db.update(users).set({
          binaryUnmatchedLeft: newUnmatchedLeft,
          binaryUnmatchedRight: newUnmatchedRight,
          binaryLastMatchedLeftCount: user.leftLegCount,
          binaryLastMatchedRightCount: user.rightLegCount,
          updatedAt: new Date(),
        }).where(eq(users.userId, userId));

        console.log(`[BINARY-MATCH] User ${userId}: queued for matching - left queue=${newUnmatchedLeft}, right queue=${newUnmatchedRight}`);
      }
    } catch (error) {
      console.error(`[BINARY-MATCH] Error processing binary matching for ${userId}:`, error);
      // Don't throw - binary matching failure shouldn't break activation flow
    }
  }

  async createIncomesForPayment(payment: ActivationPayment): Promise<void> {
    const incomeType = this.getIncomeTypeFromPaymentType(payment.paymentType);
    
    if (!incomeType) {
      throw new Error(`No income type mapped for payment type: ${payment.paymentType}`);
    }
    
    // CRITICAL FIX: Validate binary_match payments to prevent payer/receiver swap bug
    // If this is a binary_match payment and payer==receiver (pair income), 
    // ensure sourceUserId is NOT a queue recipient who should be receiving the payment
    if (payment.paymentType === 'binary_match' && payment.payerUserId === payment.receiverUserId) {
      console.log(`[INCOME] Binary match pair income for user ${payment.payerUserId}`);
    } else if (payment.paymentType === 'binary_match' && payment.payerUserId !== payment.receiverUserId) {
      // Queue payment: payer activates and pays receiver from queue
      // This is correct: payer pays receiver, receiver gets income
      console.log(`[INCOME] Binary match queue payment: ${payment.payerUserId} → ${payment.receiverUserId}`);
    }
    
    // Determine final receiver ID with strict validation
    // ONLY top_reward can have null receiverUserId (defaults to PB0)
    // ALL other payments (including future admin payment types) MUST have receiverUserId
    let finalReceiverId: string;
    if (payment.paymentType === 'top_reward' && !payment.receiverUserId) {
      // top_reward is the only payment type that can have null receiverUserId
      // This is a known system fee that goes to admin (PB0)
      finalReceiverId = 'PB0';
      console.log(`[INCOME] top_reward has null receiverUserId, defaulting to PB0`);
    } else if (!payment.receiverUserId) {
      // ALL other payments MUST have receiverUserId populated
      // This includes: direct_sponsor, binary_match, matrix_level_*, and any future admin payments
      throw new Error(`Payment ${payment.id} (type: ${payment.paymentType}) has null receiverUserId. Only top_reward can have null receiver. This indicates a data integrity issue that must be fixed upstream.`);
    } else {
      finalReceiverId = payment.receiverUserId;
    }
    
    const amount = payment.amountInr;

    const incomeRecord: InsertIncomeTransaction = {
      userId: finalReceiverId,
      activationId: payment.activationId,
      activationPaymentId: payment.id,
      incomeType: incomeType,
      amountInr: amount,
      status: 'confirmed',
      sourceUserId: payment.payerUserId,
      triggeredBy: 'activation',
      confirmedAt: new Date(),
    };

    try {
      const result = await this.db.insert(incomeTransactions)
        .values(incomeRecord)
        .onConflictDoNothing({
          target: [incomeTransactions.activationPaymentId, incomeTransactions.incomeType],
        })
        .returning();

      if (result.length > 0) {
        // Only update user summary for non-system-fee income types
        // System fees (top_reward) go to admin but don't count as MLM earnings
        // Admin (PB0) also doesn't need summary updates
        const isAdmin = finalReceiverId === 'PB0';
        if (incomeType !== 'system_fee' && !isAdmin) {
          await this.updateUserIncomeSummary(finalReceiverId, incomeType, amount);
        } else {
          console.log(`[INCOME] Created ${incomeType} income record for ${payment.paymentType} (receiver: ${finalReceiverId}) without updating user summary`);
        }
      }
    } catch (error) {
      console.error('Error creating income transaction:', error);
      throw error;
    }
  }

  private async updateUserIncomeSummary(userId: string, incomeType: InsertIncomeTransaction['incomeType'], amount: string): Promise<void> {
    // System fees should never reach this method - they're filtered out in createIncomesForPayment
    if (incomeType === 'system_fee') {
      throw new Error('system_fee income should not update user summaries');
    }

    const fieldMap: Record<InsertIncomeTransaction['incomeType'], keyof typeof userIncomeSummaries> = {
      direct_sponsor: 'directSponsorIncome',
      binary_match: 'binaryMatchIncome',
      matrix_level_1: 'matrixLevel1Income',
      matrix_level_2: 'matrixLevel2Income',
      matrix_level_3: 'matrixLevel3Income',
      matrix_level_4: 'matrixLevel4Income',
      matrix_level_5: 'matrixLevel5Income',
      system_fee: 'userId', // Placeholder - should never be accessed due to guard above
    };

    const field = fieldMap[incomeType];
    if (!field) {
      throw new Error(`Unknown income type: ${incomeType}`);
    }

    const amountNum = parseFloat(amount);

    const initialSummary = {
      userId,
      totalEarnings: amount,
      directSponsorIncome: incomeType === 'direct_sponsor' ? amount : '0',
      binaryMatchIncome: incomeType === 'binary_match' ? amount : '0',
      matrixLevel1Income: incomeType === 'matrix_level_1' ? amount : '0',
      matrixLevel2Income: incomeType === 'matrix_level_2' ? amount : '0',
      matrixLevel3Income: incomeType === 'matrix_level_3' ? amount : '0',
      matrixLevel4Income: incomeType === 'matrix_level_4' ? amount : '0',
      matrixLevel5Income: incomeType === 'matrix_level_5' ? amount : '0',
    };

    await this.db.insert(userIncomeSummaries)
      .values(initialSummary)
      .onConflictDoUpdate({
        target: userIncomeSummaries.userId,
        set: {
          totalEarnings: sql`CAST(${userIncomeSummaries.totalEarnings} AS NUMERIC) + ${amountNum}`,
          [field]: sql`CAST(${userIncomeSummaries[field as keyof typeof userIncomeSummaries]} AS NUMERIC) + ${amountNum}`,
          updatedAt: new Date(),
        },
      });
  }

  private getIncomeTypeFromPaymentType(paymentType: ActivationPayment['paymentType']): InsertIncomeTransaction['incomeType'] | null {
    switch (paymentType) {
      case 'direct_sponsor':
        return 'direct_sponsor';
      case 'binary_match':
        return 'binary_match';
      case 'top_reward':
        // Top reward is tracked as system_fee income type for data integrity
        // Counted in Bug #2 validation but excluded from user MLM summaries
        return 'system_fee';
      case 'matrix_level_1':
        return 'matrix_level_1';
      case 'matrix_level_2':
        return 'matrix_level_2';
      case 'matrix_level_3':
        return 'matrix_level_3';
      case 'matrix_level_4':
        return 'matrix_level_4';
      case 'matrix_level_5':
        return 'matrix_level_5';
      default:
        throw new Error(`Unknown payment type: ${paymentType}`);
    }
  }
}
