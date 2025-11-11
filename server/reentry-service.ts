import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql, desc } from 'drizzle-orm';
import * as schema from '@shared/schema';

const { users, reentries, userIncomeSummaries, activationPayments } = schema;

export class ReentryService {
  constructor(private db: NodePgDatabase<typeof schema>) {}

  async checkMatrixCompletion(userId: string): Promise<boolean> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (user.length === 0 || !user[0].isActivated || !user[0].matrixPath) {
      return false;
    }

    const userData = user[0];
    
    if (!userData.matrixPath) {
      return false;
    }
    
    const matrixDownlineCount = await this.countMatrixDownline(userData.matrixPath);

    return matrixDownlineCount >= 62;
  }

  private async countMatrixDownline(matrixPath: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          sql`${users.matrixPath} LIKE ${matrixPath} || '.%'`,
          eq(users.isActivated, true)
        )
      );

    return result[0]?.count || 0;
  }

  async markEligibleForReentry(userId: string): Promise<void> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const userData = user[0];

    if (userData.isEligibleForReentry) {
      return;
    }

    const isComplete = await this.checkMatrixCompletion(userId);
    if (!isComplete) {
      return;
    }

    const lastActivationPayment = await this.db
      .select()
      .from(activationPayments)
      .where(eq(activationPayments.payerUserId, userId))
      .orderBy(desc(activationPayments.createdAt))
      .limit(1);

    if (lastActivationPayment.length === 0) {
      throw new Error('No activation payment found for user');
    }

    const previousActivationId = lastActivationPayment[0].activationId;

    const incomeSummary = await this.db
      .select()
      .from(userIncomeSummaries)
      .where(eq(userIncomeSummaries.userId, userId))
      .limit(1);

    const matrixEarnings = incomeSummary.length > 0
      ? parseFloat(incomeSummary[0].matrixLevel1Income || '0') +
        parseFloat(incomeSummary[0].matrixLevel2Income || '0') +
        parseFloat(incomeSummary[0].matrixLevel3Income || '0') +
        parseFloat(incomeSummary[0].matrixLevel4Income || '0') +
        parseFloat(incomeSummary[0].matrixLevel5Income || '0')
      : 0;

    await this.db.transaction(async (tx) => {
      await tx.update(users)
        .set({
          isEligibleForReentry: true,
          updatedAt: new Date(),
        })
        .where(eq(users.userId, userId));

      await tx.insert(reentries).values({
        userId,
        cycleNumber: userData.currentCycleNumber + 1,
        previousActivationId,
        completedMatrixLevel: userData.matrixLevel || 5,
        completedMatrixPath: userData.matrixPath || null,
        completedMatrixParentId: userData.matrixParentId || null,
        totalMatrixEarnings: matrixEarnings.toString(),
        eligibilityDetectedAt: new Date(),
        matrixCompletedAt: new Date(),
        status: 'pending',
        originalSponsorId: userData.sponsorId!,
        originalBinaryLeg: userData.binaryLeg!,
      });
    });
  }

  async initiateReentry(userId: string): Promise<schema.Reentry> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const userData = user[0];

    if (!userData.isEligibleForReentry) {
      throw new Error('User is not eligible for re-entry');
    }

    const pendingReentry = await this.db
      .select()
      .from(reentries)
      .where(
        and(
          eq(reentries.userId, userId),
          eq(reentries.status, 'pending'),
          eq(reentries.cycleNumber, userData.currentCycleNumber + 1)
        )
      )
      .limit(1);

    if (pendingReentry.length === 0) {
      throw new Error('No pending re-entry found');
    }

    const reentryRecord = pendingReentry[0];

    await this.db.transaction(async (tx) => {
      await tx.update(reentries)
        .set({
          status: 'in_progress',
          reentryInitiatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reentries.id, reentryRecord.id));

      await tx.update(users)
        .set({
          isEligibleForReentry: false,
          lastReentryAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.userId, userId));
    });

    const updated = await this.db
      .select()
      .from(reentries)
      .where(eq(reentries.id, reentryRecord.id))
      .limit(1);

    return updated[0];
  }

  async linkReentryActivation(userId: string, activationId: string): Promise<void> {
    const inProgressReentry = await this.db
      .select()
      .from(reentries)
      .where(
        and(
          eq(reentries.userId, userId),
          eq(reentries.status, 'in_progress')
        )
      )
      .limit(1);

    if (inProgressReentry.length === 0) {
      return;
    }

    await this.db.update(reentries)
      .set({
        newActivationId: activationId,
        updatedAt: new Date(),
      })
      .where(eq(reentries.id, inProgressReentry[0].id));
  }

  async completeReentry(userId: string): Promise<void> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const userData = user[0];

    const inProgressReentry = await this.db
      .select()
      .from(reentries)
      .where(
        and(
          eq(reentries.userId, userId),
          eq(reentries.status, 'in_progress')
        )
      )
      .limit(1);

    if (inProgressReentry.length === 0) {
      return;
    }

    await this.db.transaction(async (tx) => {
      await tx.update(reentries)
        .set({
          status: 'completed',
          reentryCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reentries.id, inProgressReentry[0].id));

      await tx.update(users)
        .set({
          reentryCount: userData.reentryCount + 1,
          currentCycleNumber: userData.currentCycleNumber + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.userId, userId));
    });
  }

  async getUserReentryHistory(userId: string): Promise<schema.Reentry[]> {
    return await this.db
      .select()
      .from(reentries)
      .where(eq(reentries.userId, userId))
      .orderBy(reentries.cycleNumber);
  }

  async getCurrentReentryStatus(userId: string): Promise<schema.Reentry | null> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    const userData = user[0];

    const reentry = await this.db
      .select()
      .from(reentries)
      .where(
        and(
          eq(reentries.userId, userId),
          eq(reentries.cycleNumber, userData.currentCycleNumber)
        )
      )
      .limit(1);

    return reentry[0] || null;
  }
}
