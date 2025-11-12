import { eq, and, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { incomeTransactions, userIncomeSummaries, type ActivationPayment, type InsertIncomeTransaction } from "@shared/schema";

export class IncomeService {
  private db: NodePgDatabase<any>;

  constructor(db: NodePgDatabase<any>) {
    this.db = db;
  }

  async createIncomesForPayment(payment: ActivationPayment): Promise<void> {
    if (payment.receiverUserId === null && payment.receiverType === 'admin') {
      return;
    }

    if (!payment.receiverUserId) {
      throw new Error('Payment must have a receiver to create income');
    }

    const incomeType = this.getIncomeTypeFromPaymentType(payment.paymentType);
    const amount = payment.amountInr;

    const incomeRecord: InsertIncomeTransaction = {
      userId: payment.receiverUserId,
      activationId: payment.activationId,
      activationPaymentId: payment.id,
      incomeType,
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
        await this.updateUserIncomeSummary(payment.receiverUserId, incomeType, amount);
      }
    } catch (error) {
      console.error('Error creating income transaction:', error);
      throw error;
    }
  }

  private async updateUserIncomeSummary(userId: string, incomeType: InsertIncomeTransaction['incomeType'], amount: string): Promise<void> {
    const fieldMap: Record<InsertIncomeTransaction['incomeType'], keyof typeof userIncomeSummaries> = {
      direct_sponsor: 'directSponsorIncome',
      binary_match: 'binaryMatchIncome',
      matrix_level_1: 'matrixLevel1Income',
      matrix_level_2: 'matrixLevel2Income',
      matrix_level_3: 'matrixLevel3Income',
      matrix_level_4: 'matrixLevel4Income',
      matrix_level_5: 'matrixLevel5Income',
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

  private getIncomeTypeFromPaymentType(paymentType: ActivationPayment['paymentType']): InsertIncomeTransaction['incomeType'] {
    switch (paymentType) {
      case 'direct_sponsor':
        return 'direct_sponsor';
      case 'binary_match':
        return 'binary_match';
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
