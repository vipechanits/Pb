import { 
  type User, 
  type InsertUser,
  type UpdateProfile,
  type Activation,
  type InsertActivation,
  type ActivationPayment,
  type InsertActivationPayment,
  type SystemConfig,
  type UpdateSystemConfig,
  users,
  activations,
  activationPayments,
  systemConfig
} from "@shared/schema";
import { SLOT_TO_PAYMENT_TYPE, PAYMENT_TYPE_AMOUNTS } from "@shared/constants";
import { eq, and, or, ne, isNull, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  updateUserProfile(id: string, profile: UpdateProfile): Promise<User | undefined>;
  getLastUser(): Promise<User | undefined>;
  determineBestLeg(sponsorUserId: string): Promise<'left' | 'right'>;
  checkProfileComplete(userId: string): Promise<boolean>;
  getUsersBySponsorAndLeg(sponsorUserId: string, leg: 'left' | 'right'): Promise<User[]>;
  
  // Global matrix methods
  findAndAssignMatrixSlot(userId: string): Promise<User | undefined>;
  
  // System configuration methods
  getSystemConfig(): Promise<SystemConfig>;
  updateSystemConfig(config: Partial<UpdateSystemConfig>): Promise<SystemConfig>;
  
  // Activation methods
  // REMOVED: createActivation() - use createActivationWithPayments() to ensure transactional safety
  createActivationWithPayments(activation: InsertActivation, payerUserId: string, sponsorUserId: string | null): Promise<{ activation: Activation; payments: ActivationPayment[] }>;
  getActivation(id: string): Promise<Activation | undefined>;
  getActivationsByPayer(payerWallet: string): Promise<Activation[]>;
  updateActivationStatus(id: string, status: string): Promise<Activation | undefined>;
  
  // Payment methods
  createActivationPayment(payment: InsertActivationPayment): Promise<ActivationPayment>;
  // REMOVED: createActivationPayments() from interface - internal use only via transaction
  getActivationPayment(id: string): Promise<ActivationPayment | undefined>;
  getActivationPaymentsByActivationId(activationId: string): Promise<ActivationPayment[]>;
  getActivationPaymentsByPayerUserId(payerUserId: string): Promise<ActivationPayment[]>;
  getActivationPaymentsByReceiverUserId(receiverUserId: string): Promise<ActivationPayment[]>;
  getActivationPaymentsPendingConfirmation(receiverUserId: string): Promise<ActivationPayment[]>;
  getAdminPendingConfirmations(): Promise<ActivationPayment[]>;
  getAllConfirmedPayments(): Promise<ActivationPayment[]>;
  getConfirmedPaymentsWithDetails(): Promise<Array<ActivationPayment & { payerName: string | null, receiverName: string | null }>>;
  submitPaymentProof(id: string, utrId: string, proofUrl?: string): Promise<ActivationPayment | undefined>;
  confirmActivationPayment(id: string, notes?: string): Promise<ActivationPayment | undefined>;
  rejectActivationPayment(id: string, rejectionReason: string): Promise<ActivationPayment | undefined>;
}

export class DbStorage implements IStorage {
  // Initialize system configuration (ensure singleton row exists)
  async initializeSystemConfig(): Promise<void> {
    try {
      const existing = await db.select().from(systemConfig).limit(1);
      if (!existing || existing.length === 0) {
        console.log('[INIT] Creating default system configuration...');
        await db.insert(systemConfig).values({
          id: 'default-config-singleton',
        });
        console.log('[INIT] System configuration initialized successfully');
      }
    } catch (error) {
      console.error('[INIT] Error initializing system configuration:', error);
      // Don't throw - allow server to start even if config init fails
    }
  }

  // User methods
  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: Partial<InsertUser>): Promise<User> {
    const result = await db.insert(users).values(insertUser as any).returning();
    return result[0];
  }

  async updateUserProfile(id: string, profile: UpdateProfile): Promise<User | undefined> {
    // Normalize profile data: trim strings and convert empty strings to null
    const normalizedProfile: any = {};
    
    if (profile.name !== undefined) {
      normalizedProfile.name = profile.name?.trim() || null;
    }
    if (profile.mobile !== undefined) {
      normalizedProfile.mobile = profile.mobile?.trim() || null;
    }
    if (profile.upiId !== undefined) {
      normalizedProfile.upiId = profile.upiId?.trim() || null;
    }
    if (profile.bankAccountHolder !== undefined) {
      normalizedProfile.bankAccountHolder = profile.bankAccountHolder?.trim() || null;
    }
    if (profile.bankAccountNumber !== undefined) {
      normalizedProfile.bankAccountNumber = profile.bankAccountNumber?.trim() || null;
    }
    if (profile.ifscCode !== undefined) {
      normalizedProfile.ifscCode = profile.ifscCode?.trim() || null;
    }
    if (profile.paymentQrUrl !== undefined) {
      normalizedProfile.paymentQrUrl = profile.paymentQrUrl?.trim() || null;
    }
    if (profile.securityCode !== undefined) {
      normalizedProfile.securityCode = profile.securityCode?.trim() || null;
    }
    
    // Use transaction to ensure atomic update and flag clearing
    return await db.transaction(async (tx) => {
      // Update profile with normalized data
      const result = await tx.update(users)
        .set({
          ...normalizedProfile,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      
      const updatedUser = result[0];
      if (!updatedUser) return undefined;
      
      // Check if profile is now complete using same logic as checkProfileComplete
      const hasBasicInfo = !!(updatedUser.name && updatedUser.mobile);
      const hasPaymentInfo = !!(
        updatedUser.upiId || 
        (updatedUser.bankAccountNumber && updatedUser.ifscCode && updatedUser.bankAccountHolder)
      );
      const isComplete = hasBasicInfo && hasPaymentInfo;
      
      // If profile is complete and flag is set, clear it
      if (isComplete && updatedUser.requiresPostActivationProfileUpdate) {
        const finalResult = await tx.update(users)
          .set({
            requiresPostActivationProfileUpdate: false,
            isProfileComplete: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning();
        return finalResult[0];
      }
      
      // If profile is complete but flag not set, still update isProfileComplete
      if (isComplete && !updatedUser.isProfileComplete) {
        const finalResult = await tx.update(users)
          .set({
            isProfileComplete: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning();
        return finalResult[0];
      }
      
      return updatedUser;
    });
  }

  async getLastUser(): Promise<User | undefined> {
    // Get user with highest userId number (PBxxxxxx) to ensure no duplicates
    const result = await db.select().from(users)
      .where(sql`${users.userId} IS NOT NULL AND ${users.userId} LIKE 'PB%'`)
      .orderBy(sql`CAST(SUBSTRING(${users.userId}, 3) AS INTEGER) DESC`)
      .limit(1);
    return result[0];
  }

  async determineBestLeg(sponsorUserId: string): Promise<'left' | 'right'> {
    const sponsor = await this.getUserByUserId(sponsorUserId);
    if (!sponsor) {
      return 'left';
    }
    
    return sponsor.leftLegCount <= sponsor.rightLegCount ? 'left' : 'right';
  }

  async checkProfileComplete(userId: string): Promise<boolean> {
    const user = await this.getUserByUserId(userId);
    if (!user) return false;
    
    // Check required profile fields: name, mobile, upiId or bank details
    const hasBasicInfo = !!(user.name && user.mobile);
    const hasPaymentInfo = !!(user.upiId || (user.bankAccountNumber && user.ifscCode && user.bankAccountHolder));
    
    return hasBasicInfo && hasPaymentInfo;
  }

  async getUsersBySponsorAndLeg(sponsorUserId: string, leg: 'left' | 'right'): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(and(
        eq(users.sponsorId, sponsorUserId),
        eq(users.binaryLeg, leg)
      ))
      .orderBy(users.createdAt);
    return result;
  }

  async getMatrixAncestors(userId: string, depth: number, tx?: any): Promise<string[]> {
    const executeInTx = async (txn: any) => {
      const ancestors: string[] = [];
      let currentUserId = userId;
      
      for (let i = 0; i < depth; i++) {
        const userRows = await txn.select()
          .from(users)
          .where(eq(users.userId, currentUserId))
          .for('update')
          .limit(1);
        
        if (userRows.length === 0 || !userRows[0].matrixParentId) {
          break;
        }
        
        const parentId = userRows[0].matrixParentId;
        ancestors.push(parentId);
        currentUserId = parentId;
      }
      
      return ancestors;
    };
    
    if (tx) {
      return await executeInTx(tx);
    } else {
      return await db.transaction(executeInTx);
    }
  }

  async findAndAssignMatrixSlot(userId: string, tx?: any): Promise<User | undefined> {
    const executeInTx = async (txn: any) => {
      const targetUser = await txn.select()
        .from(users)
        .where(eq(users.userId, userId))
        .for('update')
        .limit(1);
      
      if (targetUser.length === 0) {
        throw new Error(`User ${userId} not found`);
      }

      if (targetUser[0].matrixParentId) {
        console.log(`[MATRIX] User ${userId} already placed in matrix at ${targetUser[0].matrixPath}`);
        return targetUser[0];
      }

      const frontier = await txn.select()
        .from(users)
        .where(and(
          sql`matrix_level IS NOT NULL`,
          sql`matrix_level < 5`,
          eq(users.isActivated, true)
        ))
        .orderBy(sql`matrix_level ASC, matrix_path ASC`)
        .for('update', { skipLocked: true });
      
      for (const parentCandidate of frontier) {
        const children = await txn.select()
          .from(users)
          .where(eq(users.matrixParentId, parentCandidate.userId!))
          .for('update', { skipLocked: true });
        
        if (children.length < 2) {
          const position = children.length === 0 ? 0 : 1;
          const positionChar = position === 0 ? 'L' : 'R';
          const newPath = `${parentCandidate.matrixPath}.${positionChar}`;
          const newLevel = (parentCandidate.matrixLevel || 0) + 1;
          
          console.log(`[MATRIX] Assigning ${userId} to parent ${parentCandidate.userId} at position ${position}, level ${newLevel}, path ${newPath}`);
          
          const result = await txn.update(users)
            .set({
              matrixParentId: parentCandidate.userId!,
              matrixPosition: position,
              matrixLevel: newLevel,
              matrixPath: newPath,
              updatedAt: new Date()
            })
            .where(eq(users.userId, userId))
            .returning();
          
          return result[0];
        }
      }
      
      throw new Error('Global matrix is full - no available slots');
    };
    
    if (tx) {
      return await executeInTx(tx);
    } else {
      return await db.transaction(executeInTx);
    }
  }

  // System configuration methods
  async getSystemConfig(): Promise<SystemConfig> {
    const result = await db.select().from(systemConfig).limit(1);
    if (!result[0]) {
      throw new Error('System configuration not found. Database may need initialization.');
    }
    return result[0];
  }

  async updateSystemConfig(config: Partial<UpdateSystemConfig>): Promise<SystemConfig> {
    // Always update the singleton row
    const result = await db.update(systemConfig)
      .set({
        ...config,
        updatedAt: new Date(),
      })
      .where(eq(systemConfig.id, 'default-config-singleton'))
      .returning();
    
    if (!result[0]) {
      throw new Error('Failed to update system configuration');
    }
    
    return result[0];
  }

  // REMOVED: createActivation() - use createActivationWithPayments() to ensure data consistency
  // If you need to create an activation, you MUST use the transactional method below

  // Create activation and payments transactionally (prevents orphaned activations)
  async createActivationWithPayments(
    activation: InsertActivation,
    payerUserId: string,
    sponsorUserId: string | null
  ): Promise<{ activation: Activation; payments: ActivationPayment[] }> {
    return await db.transaction(async (tx) => {
      // Fetch system config for payment amounts (with lock to prevent concurrent edits)
      const configResult = await tx.select().from(systemConfig)
        .where(eq(systemConfig.id, 'default-config-singleton'))
        .for('update')
        .limit(1);
      
      if (!configResult[0]) {
        throw new Error('System configuration not found');
      }
      
      const config = configResult[0];
      
      // Insert activation first
      const activationResult = await tx.insert(activations).values(activation).returning();
      const createdActivation = activationResult[0];
      
      // Generate all 8 payment slots with config-driven amounts
      const paymentsToCreate: InsertActivationPayment[] = [];
      
      for (let slotIndex = 0; slotIndex < SLOT_TO_PAYMENT_TYPE.length; slotIndex++) {
        const paymentType = SLOT_TO_PAYMENT_TYPE[slotIndex];
        
        // Get amount from config instead of static constant
        let amount: string;
        switch (paymentType) {
          case 'direct_sponsor':
            amount = config.sponsorPaymentAmount;
            break;
          case 'binary_match':
            amount = config.binaryMatchPaymentAmount;
            break;
          case 'creator_fee':
            amount = config.creatorFeeAmount;
            break;
          case 'matrix_level_1':
            amount = config.matrixLevel1Amount;
            break;
          case 'matrix_level_2':
            amount = config.matrixLevel2Amount;
            break;
          case 'matrix_level_3':
            amount = config.matrixLevel3Amount;
            break;
          case 'matrix_level_4':
            amount = config.matrixLevel4Amount;
            break;
          case 'matrix_level_5':
            amount = config.matrixLevel5Amount;
            break;
          default:
            amount = '625'; // Fallback
        }
        
        let receiverUserId: string | null = null;
        let receiverType: 'user' | 'admin' = 'admin';
        
        if (paymentType === 'direct_sponsor') {
          if (sponsorUserId) {
            receiverUserId = sponsorUserId;
            receiverType = 'user';
          }
        } else if (paymentType === 'binary_match') {
          receiverType = 'admin';
        } else if (paymentType === 'creator_fee') {
          receiverType = 'admin';
        } else if (paymentType.startsWith('matrix_level_')) {
          receiverType = 'admin';
        }
        
        paymentsToCreate.push({
          activationId: createdActivation.id,
          slotIndex,
          payerUserId,
          receiverUserId,
          paymentType: paymentType as any,
          receiverType,
          amountInr: amount,
          paymentMode: 'offline',
          status: 'pending',
          submissionCount: 0,
        });
      }
      
      // Insert all payments in the same transaction
      const paymentsResult = await tx.insert(activationPayments).values(paymentsToCreate).returning();
      
      return {
        activation: createdActivation,
        payments: paymentsResult,
      };
    });
  }

  async getActivation(id: string): Promise<Activation | undefined> {
    const result = await db.select().from(activations).where(eq(activations.id, id)).limit(1);
    return result[0];
  }

  async getActivationsByPayer(payerWallet: string): Promise<Activation[]> {
    // Note: Not lowercasing because we're now querying by user ID (PB...), not wallet address
    return db.select().from(activations).where(eq(activations.payerWallet, payerWallet));
  }

  async updateActivationStatus(id: string, status: string): Promise<Activation | undefined> {
    const result = await db.update(activations)
      .set({ status: status as any })
      .where(eq(activations.id, id))
      .returning();
    return result[0];
  }

  async createActivationPayment(payment: InsertActivationPayment): Promise<ActivationPayment> {
    const result = await db.insert(activationPayments).values(payment).returning();
    return result[0];
  }

  // REMOVED: createActivationPayments() - internal logic now only exists within createActivationWithPayments()
  // This prevents callers from creating orphaned activations by separating creation steps

  async getActivationPayment(id: string): Promise<ActivationPayment | undefined> {
    const result = await db.select().from(activationPayments).where(eq(activationPayments.id, id)).limit(1);
    return result[0];
  }

  async getActivationPaymentsByActivationId(activationId: string): Promise<ActivationPayment[]> {
    return db.select().from(activationPayments).where(eq(activationPayments.activationId, activationId));
  }

  async getActivationPaymentsByPayerUserId(payerUserId: string): Promise<ActivationPayment[]> {
    return db.select().from(activationPayments).where(eq(activationPayments.payerUserId, payerUserId));
  }

  async getActivationPaymentsByReceiverUserId(receiverUserId: string): Promise<ActivationPayment[]> {
    return db.select().from(activationPayments).where(eq(activationPayments.receiverUserId, receiverUserId));
  }

  async getActivationPaymentsPendingConfirmation(receiverUserId: string): Promise<ActivationPayment[]> {
    return db.select().from(activationPayments).where(
      and(
        eq(activationPayments.receiverUserId, receiverUserId),
        eq(activationPayments.status, 'submitted')
      )
    );
  }
  
  async getAdminPendingConfirmations(): Promise<ActivationPayment[]> {
    // Admin sees submitted payments EXCEPT Direct Sponsor payments (slot 0) to non-admin receivers
    // Direct Sponsor payments should only be confirmed by the actual sponsor
    // Admin DOES see slot 0 payments when:
    // - receiver is PB0 (explicitly set to admin)
    // - receiverUserId is NULL (no sponsor exists, falls back to admin)
    return db.select().from(activationPayments).where(
      and(
        eq(activationPayments.status, 'submitted'),
        or(
          ne(activationPayments.slotIndex, 0),                 // Show all non-slot-0 payments
          eq(activationPayments.receiverUserId, 'PB0'),        // OR show slot-0 if receiver is PB0
          isNull(activationPayments.receiverUserId)            // OR show slot-0 if receiver is NULL (fallback)
        )
      )
    ).orderBy(desc(activationPayments.updatedAt));
  }

  async getAllConfirmedPayments(): Promise<ActivationPayment[]> {
    // Get all confirmed payments for admin report
    return db.select().from(activationPayments).where(
      eq(activationPayments.status, 'confirmed')
    ).orderBy(desc(activationPayments.confirmedAt));
  }

  async getConfirmedPaymentsWithDetails(): Promise<Array<ActivationPayment & { 
    payerName: string | null, 
    receiverName: string | null 
  }>> {
    // Get all confirmed payments with payer and receiver details for admin report
    const payer = alias(users, 'payer');
    const receiver = alias(users, 'receiver');
    
    const results = await db.select({
      payment: activationPayments,
      payerName: payer.name,
      receiverName: receiver.name,
    })
    .from(activationPayments)
    .leftJoin(payer, eq(activationPayments.payerUserId, payer.userId))
    .leftJoin(receiver, eq(activationPayments.receiverUserId, receiver.userId))
    .where(eq(activationPayments.status, 'confirmed'))
    .orderBy(desc(activationPayments.confirmedAt));

    // Flatten the results
    return results.map(r => ({
      ...r.payment,
      payerName: r.payerName,
      receiverName: r.receiverName,
    }));
  }

  async submitPaymentProof(id: string, utrId: string, proofUrl?: string): Promise<ActivationPayment | undefined> {
    // Get current payment to increment submission count
    const currentPayment = await this.getActivationPayment(id);
    if (!currentPayment) return undefined;
    
    const result = await db.update(activationPayments)
      .set({ 
        status: 'submitted',
        offlineUtrId: utrId,
        offlineProofUrl: proofUrl,
        submissionCount: (currentPayment.submissionCount || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(activationPayments.id, id))
      .returning();
    return result[0];
  }

  async confirmActivationPayment(id: string, notes?: string): Promise<ActivationPayment | undefined> {
    const result = await db.update(activationPayments)
      .set({ 
        status: 'confirmed',
        confirmedAt: new Date(),
        notes: notes,
        updatedAt: new Date()
      })
      .where(eq(activationPayments.id, id))
      .returning();
    
    const payment = result[0];
    if (payment) {
      // Check if all 8 payments are confirmed and activate user
      await this.checkAndCompleteActivation(payment.activationId, payment.payerUserId);
    }
    
    return payment;
  }

  async checkAndCompleteActivation(activationId: string, payerUserId: string): Promise<void> {
    try {
      // Use a transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // Get all 8 payments for this activation with FOR UPDATE lock to prevent concurrent runs
        const payments = await tx.select()
          .from(activationPayments)
          .where(eq(activationPayments.activationId, activationId))
          .for('update');
        
        // Verify exactly 8 payments exist and all are confirmed
        const allConfirmed = payments.length === 8 && payments.every(p => p.status === 'confirmed');
        
        if (allConfirmed) {
          console.log(`[ACTIVATION] All 8 payments confirmed for ${payerUserId}. Activating user...`);
          
          // Load the activated user to get their sponsor relationship and binary leg
          const activatedUserRows = await tx.select()
            .from(users)
            .where(eq(users.userId, payerUserId))
            .limit(1);
          
          if (activatedUserRows.length === 0) {
            throw new Error(`User ${payerUserId} not found`);
          }
          
          const activatedUser = activatedUserRows[0];
          const now = new Date();
          
          // Update activation status to completed (with guard to prevent double-activation)
          const activationUpdateResult = await tx.update(activations)
            .set({ 
              status: 'completed',
              completedAt: now
            })
            .where(and(
              eq(activations.id, activationId),
              eq(activations.status, 'pending') // Only activate if still pending
            ))
            .returning();
          
          // If no rows updated, activation already completed - exit without error
          if (activationUpdateResult.length === 0) {
            console.log(`[ACTIVATION] Activation ${activationId} already completed, skipping duplicate run`);
            return;
          }
          
          // Activate user - this makes their referral links visible
          // Also require post-activation profile update
          await tx.update(users)
            .set({ 
              isActivated: true,
              activatedAt: now,
              requiresPostActivationProfileUpdate: true,
              updatedAt: now
            })
            .where(eq(users.userId, payerUserId));
          
          // Assign user to next available global matrix slot
          // This happens atomically within the activation transaction
          // If matrix is full or placement fails, entire activation rolls back
          console.log(`[MATRIX] Placing ${payerUserId} in global matrix...`);
          await this.findAndAssignMatrixSlot(payerUserId, tx);
          
          // Get matrix ancestors (up to 5 levels) for payment routing
          const matrixAncestors = await this.getMatrixAncestors(payerUserId, 5, tx);
          console.log(`[MATRIX] Found ${matrixAncestors.length} matrix ancestors for ${payerUserId}:`, matrixAncestors);
          
          // Update matrix payment receivers (slots 3-7) with ancestors or admin fallback
          const matrixUplines: Record<string, string> = {};
          for (let level = 1; level <= 5; level++) {
            const ancestorIndex = level - 1;
            const receiverUserId = ancestorIndex < matrixAncestors.length ? matrixAncestors[ancestorIndex] : 'PB0';
            const slotIndex = level + 2; // Slot 3 = level 1, Slot 4 = level 2, etc.
            
            // Update payment receiver for this matrix level
            await tx.update(activationPayments)
              .set({
                receiverUserId,
                receiverType: 'user',
                updatedAt: now
              })
              .where(and(
                eq(activationPayments.activationId, activationId),
                eq(activationPayments.slotIndex, slotIndex)
              ));
            
            // Track for activation record update
            matrixUplines[`matrixUpline${level}`] = receiverUserId;
            
            console.log(`[MATRIX] Slot ${slotIndex} (Level ${level}) receiver: ${receiverUserId}`);
          }
          
          // Update activation record with matrix uplines
          await tx.update(activations)
            .set(matrixUplines)
            .where(eq(activations.id, activationId));
          
          // Update sponsor's network statistics if user has a sponsor
          if (activatedUser.sponsorId && activatedUser.binaryLeg) {
            const sponsorId = activatedUser.sponsorId;
            const binaryLeg = activatedUser.binaryLeg;
            
            // Increment sponsor's referral count, global leg count, AND personal leg count
            const updateData: any = {
              totalReferrals: sql`${users.totalReferrals} + 1`,
              updatedAt: now
            };
            
            if (binaryLeg === 'left') {
              updateData.leftLegCount = sql`${users.leftLegCount} + 1`; // Global count
              updateData.personalLeftCount = sql`${users.personalLeftCount} + 1`; // Personal count
            } else if (binaryLeg === 'right') {
              updateData.rightLegCount = sql`${users.rightLegCount} + 1`; // Global count
              updateData.personalRightCount = sql`${users.personalRightCount} + 1`; // Personal count
            }
            
            await tx.update(users)
              .set(updateData)
              .where(eq(users.userId, sponsorId));
            
            console.log(`[ACTIVATION] Updated sponsor ${sponsorId} stats: +1 total, +1 to ${binaryLeg} leg (global & personal)`);
          }
          
          console.log(`[ACTIVATION] User ${payerUserId} successfully activated!`);
        }
      });
    } catch (error) {
      console.error(`[ACTIVATION ERROR] Failed to complete activation for ${payerUserId}:`, error);
      throw error;
    }
  }

  async rejectActivationPayment(id: string, rejectionReason: string): Promise<ActivationPayment | undefined> {
    const result = await db.update(activationPayments)
      .set({ 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: rejectionReason,
        updatedAt: new Date()
      })
      .where(eq(activationPayments.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
