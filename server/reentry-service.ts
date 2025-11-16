import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql, desc } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { storage } from './storage';
import * as crypto from 'crypto';

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

    // CRITICAL: Check if there's already an in-progress re-entry (prevent duplicates)
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

    if (inProgressReentry.length > 0) {
      throw new Error('You already have a re-entry in progress. Please complete your current cycle payments first.');
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
    
    // CRITICAL: Check if this re-entry was already initiated (has activation)
    if (reentryRecord.newActivationId) {
      throw new Error('This re-entry has already been initiated. Check your activation page for payment details.');
    }
    
    // Create new activation with 8 payment slots AND assign matrix receivers atomically
    let newActivation;
    try {
      // Generate activation ID (same pattern as initial activation)
      const activationId = `ACT-${userData.id}-${crypto.randomUUID().substring(0, 8)}`;
      
      // Create activation in a single atomic transaction that includes matrix receiver assignment
      const result = await this.db.transaction(async (tx: any) => {
        // Step 1: Create activation with payments using shared transaction context
        const activationResult = await storage.createActivationWithPayments(
          {
            id: activationId,
            payerWallet: userData.id, // Store database UUID for activation lookup
            sponsorWallet: userData.sponsorId || null, // Sponsor's PB#### ID
            status: 'pending',
          },
          userId, // Use PB#### ID for payment records
          userData.sponsorId || null,
          tx // Pass transaction context to prevent nested transactions
        );
        
        // Step 2: Immediately assign matrix receivers if user has existing matrix position
        // This happens in the SAME transaction to ensure atomicity
        if (userData.matrixPath && userData.isActivated) {
          await storage.assignMatrixPaymentReceiversForReentry(activationId, userId, tx);
          console.log(`[RE-ENTRY] Assigned matrix payment receivers for ${userId} based on existing matrix position`);
        }
        
        return activationResult;
      });
      
      newActivation = result.activation;
      console.log(`[RE-ENTRY] Created activation ${activationId} for ${userId} with ${result.payments.length} payment slots`);
    } catch (error) {
      console.error('[RE-ENTRY] Failed to create activation:', error);
      
      // Mark re-entry as failed
      await this.db.update(reentries)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(reentries.id, reentryRecord.id));
      
      throw new Error('Failed to create re-entry activation');
    }

    // Update re-entry record and user status (separate transaction after activation succeeds)
    await this.db.transaction(async (tx) => {
      await tx.update(reentries)
        .set({
          status: 'in_progress',
          newActivationId: newActivation.id,
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
