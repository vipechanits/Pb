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
  type MatrixNode,
  type Reentry,
  type Notification,
  type InsertNotification,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  users,
  activations,
  activationPayments,
  systemConfig,
  reentries,
  notifications,
  passwordResetTokens
} from "@shared/schema";
import { SLOT_TO_PAYMENT_TYPE, PAYMENT_TYPE_AMOUNTS } from "@shared/constants";
import { eq, and, or, ne, isNull, desc, sql, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import crypto from "crypto";

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
  getMatrixSubtree(userId: string, maxDepth: number): Promise<MatrixNode | null>;
  
  // Income methods
  getUserIncomeSummary(userId: string): Promise<any>;
  getUserIncomeTransactions(userId: string): Promise<any[]>;
  
  // Re-entry methods
  checkMatrixCompletion(userId: string): Promise<boolean>;
  markEligibleForReentry(userId: string): Promise<void>;
  initiateReentry(userId: string): Promise<Reentry>;
  getUserReentryHistory(userId: string): Promise<Reentry[]>;
  getCurrentReentryStatus(userId: string): Promise<Reentry | null>;
  
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
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: string, limit?: number, offset?: number, isRead?: boolean): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<number>;
  deleteNotification(notificationId: string): Promise<void>;
  
  // Password reset token methods
  createPasswordResetToken(userId: string, email: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<PasswordResetToken | undefined>;
  deleteExpiredTokens(): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;
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
  
  // Initialize admin users (PB0 and root admin)
  async initializeAdminUsers(hashPassword: (password: string) => Promise<string>): Promise<void> {
    try {
      // Check if PB0 admin exists
      const pb0Exists = await this.getUserByUserId('PB0');
      if (!pb0Exists) {
        console.log('[INIT] Creating PB0 admin user...');
        const hashedPassword = await hashPassword('Admin@1234'); // Default password
        await db.insert(users).values({
          email: 'admin@payback247.com',
          password: hashedPassword,
          role: 'admin',
          userId: 'PB0',
          name: 'System Admin',
          mobile: '9999999999',
          isActivated: true,
          isProfileComplete: true,
          matrixLevel: 0, // Root of global matrix
          matrixPath: 'PB0', // Root path
        });
        console.log('[INIT] PB0 admin user created successfully');
      }
      
      // Check if root admin exists
      const rootAdminExists = await this.getUserByEmail('payback2472000@gmail.com');
      if (!rootAdminExists) {
        console.log('[INIT] Creating root admin user...');
        const hashedPassword = await hashPassword('Admin@2000');
        await db.insert(users).values({
          email: 'payback2472000@gmail.com',
          password: hashedPassword,
          role: 'admin',
          name: 'Root Administrator',
          mobile: '9876543210',
          isActivated: true,
          isProfileComplete: true,
        });
        console.log('[INIT] Root admin user created successfully');
        console.log('[INIT] IMPORTANT: Please change the root admin password immediately after first login!');
      }
    } catch (error) {
      console.error('[INIT] Error initializing admin users:', error);
      // Don't throw - allow server to start even if admin creation fails
    }
  }

  // User methods
  
  /**
   * Shared helper to evaluate if a user's profile is complete.
   * Profile is complete when user has:
   * - Name (non-empty)
   * - Mobile (non-empty)
   * - At least one payment method: UPI ID OR complete bank details (holder, number, IFSC)
   */
  private evaluateProfileCompletion(user: User): boolean {
    const hasName = !!(user.name && user.name.trim().length > 0);
    const hasMobile = !!(user.mobile && user.mobile.trim().length > 0);
    const hasUPI = !!(user.upiId && user.upiId.trim().length > 0);
    const hasBankAccount = !!(
      user.bankAccountHolder && user.bankAccountHolder.trim().length > 0 &&
      user.bankAccountNumber && user.bankAccountNumber.trim().length > 0 &&
      user.ifscCode && user.ifscCode.trim().length > 0
    );
    
    return hasName && hasMobile && (hasUPI || hasBankAccount);
  }
  
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
    
    // Use transaction to ensure atomic update and flag recalculation
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
      
      // Evaluate profile completion using shared helper
      const isComplete = this.evaluateProfileCompletion(updatedUser);
      
      // Always update isProfileComplete flag based on current state
      // Clear requiresPostActivationProfileUpdate only when profile becomes complete
      const flagUpdates: any = {
        isProfileComplete: isComplete,
        updatedAt: new Date(),
      };
      
      if (isComplete && updatedUser.requiresPostActivationProfileUpdate) {
        flagUpdates.requiresPostActivationProfileUpdate = false;
      }
      
      // Only update flags if they changed to avoid unnecessary DB operations
      if (
        updatedUser.isProfileComplete !== isComplete ||
        (isComplete && updatedUser.requiresPostActivationProfileUpdate)
      ) {
        const finalResult = await tx.update(users)
          .set(flagUpdates)
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
    
    // Use shared helper to ensure consistent evaluation
    return this.evaluateProfileCompletion(user);
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

  async getMatrixSubtree(userId: string, maxDepth: number): Promise<MatrixNode | null> {
    const rootUser = await this.getUserByUserId(userId);
    if (!rootUser || rootUser.matrixLevel === null || rootUser.matrixLevel === undefined || !rootUser.matrixPath) {
      return null;
    }

    const maxLevel = rootUser.matrixLevel + maxDepth;
    const rows = await db.execute(sql`
      WITH RECURSIVE matrix_tree AS (
        SELECT user_id, name, email, is_activated, matrix_level, matrix_position, matrix_path, matrix_parent_id, 0 as depth
        FROM users
        WHERE user_id = ${userId} AND matrix_level IS NOT NULL AND matrix_path IS NOT NULL
        
        UNION ALL
        
        SELECT u.user_id, u.name, u.email, u.is_activated, u.matrix_level, u.matrix_position, u.matrix_path, u.matrix_parent_id, mt.depth + 1
        FROM users u
        INNER JOIN matrix_tree mt ON u.matrix_parent_id = mt.user_id
        WHERE u.matrix_level IS NOT NULL 
          AND u.matrix_path IS NOT NULL 
          AND u.matrix_level <= ${maxLevel}
          AND mt.depth < ${maxDepth}
      )
      SELECT * FROM matrix_tree;
    `);

    if (rows.rows.length === 0) {
      return null;
    }

    const nodeMap = new Map<string, any>();
    rows.rows.forEach((row: any) => {
      nodeMap.set(row.user_id, {
        userId: row.user_id,
        name: row.name,
        email: row.email,
        isActivated: row.is_activated,
        matrixLevel: row.matrix_level,
        matrixPosition: row.matrix_position,
        matrixPath: row.matrix_path,
        leftChild: null,
        rightChild: null,
      });
    });

    nodeMap.forEach((node, userId) => {
      const row = rows.rows.find((r: any) => r.user_id === userId);
      if (row && row.matrix_parent_id) {
        const parent = nodeMap.get(row.matrix_parent_id);
        if (parent) {
          if (row.matrix_position === 0) {
            parent.leftChild = node;
          } else {
            parent.rightChild = node;
          }
        }
      }
    });

    return nodeMap.get(userId) || null;
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
        eq(activationPayments.receiverType, 'user'),
        eq(activationPayments.receiverUserId, receiverUserId),
        eq(activationPayments.status, 'submitted')
      )
    );
  }
  
  async getAdminPendingConfirmations(): Promise<ActivationPayment[]> {
    // Admin only sees payments where receiverType='admin'
    // Users with receiverType='user' confirm their own payments separately
    return db.select().from(activationPayments).where(
      and(
        eq(activationPayments.receiverType, 'admin'),
        eq(activationPayments.status, 'submitted')
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
    return await db.transaction(async (tx) => {
      const result = await tx.update(activationPayments)
        .set({ 
          status: 'confirmed',
          confirmedAt: new Date(),
          notes: notes,
          updatedAt: new Date()
        })
        .where(eq(activationPayments.id, id))
        .returning();
      
      const payment = result[0];
      if (!payment) return undefined;

      const { IncomeService } = await import('./income-service');
      const incomeService = new IncomeService(tx as any);
      
      try {
        await incomeService.createIncomesForPayment(payment);
      } catch (error) {
        console.error('Error creating income for payment:', error);
        throw error;
      }

      await this.checkAndCompleteActivation(payment.activationId, payment.payerUserId);
      
      return payment;
    });
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

  async getUserIncomeSummary(userId: string): Promise<any> {
    const { userIncomeSummaries } = await import('@shared/schema');
    const result = await db.select().from(userIncomeSummaries).where(eq(userIncomeSummaries.userId, userId)).limit(1);
    return result[0] || {
      userId,
      totalEarnings: '0',
      directSponsorIncome: '0',
      binaryMatchIncome: '0',
      matrixLevel1Income: '0',
      matrixLevel2Income: '0',
      matrixLevel3Income: '0',
      matrixLevel4Income: '0',
      matrixLevel5Income: '0',
    };
  }

  async getUserIncomeTransactions(userId: string): Promise<any[]> {
    const { incomeTransactions } = await import('@shared/schema');
    return await db.select().from(incomeTransactions)
      .where(eq(incomeTransactions.userId, userId))
      .orderBy(desc(incomeTransactions.createdAt));
  }

  // Re-entry methods
  async checkMatrixCompletion(userId: string): Promise<boolean> {
    const { ReentryService } = await import('./reentry-service');
    const reentryService = new ReentryService(db as any);
    return await reentryService.checkMatrixCompletion(userId);
  }

  async markEligibleForReentry(userId: string): Promise<void> {
    const { ReentryService } = await import('./reentry-service');
    const reentryService = new ReentryService(db as any);
    return await reentryService.markEligibleForReentry(userId);
  }

  async initiateReentry(userId: string): Promise<Reentry> {
    const { ReentryService } = await import('./reentry-service');
    const reentryService = new ReentryService(db as any);
    return await reentryService.initiateReentry(userId);
  }

  async getUserReentryHistory(userId: string): Promise<Reentry[]> {
    const { ReentryService } = await import('./reentry-service');
    const reentryService = new ReentryService(db as any);
    return await reentryService.getUserReentryHistory(userId);
  }

  async getCurrentReentryStatus(userId: string): Promise<Reentry | null> {
    const { ReentryService } = await import('./reentry-service');
    const reentryService = new ReentryService(db as any);
    return await reentryService.getCurrentReentryStatus(userId);
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications)
      .values(notification)
      .returning();
    return result[0];
  }

  async getNotificationsByUserId(
    userId: string, 
    limit: number = 20, 
    offset: number = 0,
    isRead?: boolean
  ): Promise<Notification[]> {
    const baseWhere = eq(notifications.userId, userId);
    const whereClause = isRead === undefined 
      ? baseWhere 
      : and(baseWhere, eq(notifications.isRead, isRead));
    
    return await db.select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return Number(result[0]?.count || 0);
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .returning();
    return result.length;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications)
      .where(eq(notifications.id, notificationId));
  }
  
  // Password reset token methods
  
  /**
   * Hash a token using SHA-256 for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
  
  /**
   * Timing-safe token comparison to prevent timing attacks
   */
  private compareTokens(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return crypto.timingSafeEqual(bufA, bufB);
  }
  
  /**
   * Create password reset token with hashed storage and single-active token enforcement
   */
  async createPasswordResetToken(userId: string, email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    return await db.transaction(async (tx) => {
      // Invalidate all previous tokens for this user (single-active token policy)
      await tx.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.userId, userId),
            isNull(passwordResetTokens.usedAt)
          )
        );
      
      // Hash the token before storage (store SHA-256 hash, not plaintext)
      const hashedToken = this.hashToken(token);
      
      // Create new reset token
      const result = await tx.insert(passwordResetTokens).values({
        token: hashedToken,
        userId,
        email,
        expiresAt,
      }).returning();
      
      return result[0];
    });
  }
  
  /**
   * Get password reset token by plain token (hashes and compares securely)
   */
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    // Hash the incoming token to compare with stored hash
    const hashedToken = this.hashToken(token);
    
    // Fetch all non-used, non-expired tokens
    const tokens = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          isNull(passwordResetTokens.usedAt),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );
    
    // Use timing-safe comparison to find matching token
    for (const tokenRecord of tokens) {
      if (this.compareTokens(tokenRecord.token, hashedToken)) {
        return tokenRecord;
      }
    }
    
    return undefined;
  }
  
  /**
   * Mark password reset token as used (one-time use enforcement)
   */
  async markTokenAsUsed(tokenId: string): Promise<PasswordResetToken | undefined> {
    const result = await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenId))
      .returning();
    
    return result[0];
  }
  
  /**
   * Delete expired and used password reset tokens (periodic cleanup)
   */
  async deleteExpiredTokens(): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(
        or(
          // Delete expired tokens
          lt(passwordResetTokens.expiresAt, new Date()),
          // Delete tokens that were used more than 24 hours ago
          and(
            sql`${passwordResetTokens.usedAt} IS NOT NULL`,
            lt(passwordResetTokens.usedAt!, sql`NOW() - INTERVAL '24 hours'`)
          )
        )
      );
  }
  
  /**
   * Update user password and invalidate all reset tokens for that user
   * Note: Session invalidation should be handled by the auth route
   */
  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    return await db.transaction(async (tx) => {
      // Update password
      const result = await tx.update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.userId, userId))
        .returning();
      
      if (result[0]) {
        // Invalidate all reset tokens for this user (mark as used)
        await tx.update(passwordResetTokens)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(passwordResetTokens.userId, userId),
              isNull(passwordResetTokens.usedAt)
            )
          );
      }
      
      return result[0];
    });
  }
}

export const storage = new DbStorage();
