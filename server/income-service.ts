import { eq, and, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { incomeTransactions, userIncomeSummaries, type ActivationPayment, type InsertIncomeTransaction } from "@shared/schema";

export class IncomeService {
  private db: NodePgDatabase<any>;

  constructor(db: NodePgDatabase<any>) {
    this.db = db;
  }

  async createIncomesForPayment(payment: ActivationPayment): Promise<void> {
    const incomeType = this.getIncomeTypeFromPaymentType(payment.paymentType);
    
    if (!incomeType) {
      throw new Error(`No income type mapped for payment type: ${payment.paymentType}`);
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
