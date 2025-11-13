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
  type DatabaseBackup,
  type InsertDatabaseBackup,
  users,
  activations,
  activationPayments,
  systemConfig,
  reentries,
  notifications,
  passwordResetTokens,
  databaseBackups,
  binaryMatchQueue,
  incomeTransactions
} from "@shared/schema";
import { SLOT_TO_PAYMENT_TYPE, PAYMENT_TYPE_AMOUNTS } from "@shared/constants";
import { eq, and, or, ne, isNull, desc, sql, lt, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import crypto from "crypto";

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  markEmailAsVerified(userId: string): Promise<void>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  createUserWithGeneratedId(user: Partial<InsertUser>): Promise<User>;
  updateUserProfile(id: string, profile: UpdateProfile): Promise<User | undefined>;
  getLastUser(): Promise<User | undefined>;
  determineBestLeg(sponsorUserId: string): Promise<'left' | 'right'>;
  checkProfileComplete(identifier: string): Promise<boolean>;
  getUsersBySponsorAndLeg(sponsorUserId: string, leg: 'left' | 'right'): Promise<User[]>;
  
  // Binary match queue methods
  releaseAbandonedQueueReservations(hoursOld?: number): Promise<number>;
  
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
  getAdminPendingConfirmations(adminUserId: string): Promise<ActivationPayment[]>;
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
  
  // Database backup/restore methods
  createDatabaseBackup(filename: string, fileSize: number, createdBy: string, notes?: string): Promise<any>;
  getBackupHistory(limit?: number): Promise<any[]>;
  deleteBackup(backupId: string): Promise<void>;
  exportDatabaseToJSON(): Promise<string>; // Returns JSON string of entire database
  importDatabaseFromJSON(backupData: any, performedBy: string): Promise<void>; // Restores database from JSON
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
  
  // Initialize admin users (PB0 root admin and PB1 secondary admin)
  async initializeAdminUsers(hashPassword: (password: string) => Promise<string>): Promise<void> {
    try {
      // Get admin password from environment - REQUIRED unless explicitly in development
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
      const nodeEnv = process.env.NODE_ENV;
      
      // CRITICAL SECURITY: Only allow fallback if NODE_ENV is EXPLICITLY "development"
      // Treat undefined, "production", "staging", "test", or ANY other value as production
      const isExplicitlyDevelopment = nodeEnv === 'development';
      
      // CRITICAL SECURITY: Require ADMIN_DEFAULT_PASSWORD unless in explicit development mode
      if (!adminPassword && !isExplicitlyDevelopment) {
        console.error('');
        console.error('═══════════════════════════════════════════════════════════════════');
        console.error('  ❌ FATAL ERROR: ADMIN_DEFAULT_PASSWORD NOT SET');
        console.error('═══════════════════════════════════════════════════════════════════');
        console.error(`  Current NODE_ENV: ${nodeEnv || '(undefined)'}`);
        console.error('  Fallback admin passwords are ONLY allowed when NODE_ENV="development"');
        console.error('');
        console.error('  Set ADMIN_DEFAULT_PASSWORD in deployment secrets:');
        console.error('  - Minimum 12 characters');
        console.error('  - Mix of uppercase, lowercase, numbers, and symbols');
        console.error('  - NOT a dictionary word or common password');
        console.error('');
        console.error('  Server startup aborted for security.');
        console.error('═══════════════════════════════════════════════════════════════════');
        console.error('');
        throw new Error('ADMIN_DEFAULT_PASSWORD is required in production environments');
      }
      
      // Development fallback - ONLY allowed when NODE_ENV is explicitly "development"
      if (!adminPassword && isExplicitlyDevelopment) {
        console.error('');
        console.error('═══════════════════════════════════════════════════════════════════');
        console.error('  ⚠️  WARNING: Using fallback admin passwords in DEVELOPMENT');
        console.error('═══════════════════════════════════════════════════════════════════');
        console.error('  This is ONLY allowed in development.');
        console.error('  Production deployments will fail without ADMIN_DEFAULT_PASSWORD.');
        console.error('═══════════════════════════════════════════════════════════════════');
        console.error('');
      }
      
      const pb0Password = adminPassword || 'Admin@1234'; // Fallback ONLY in development
      const pb1Password = adminPassword || 'Admin@2000'; // Fallback ONLY in development
      
      // Check if PB0 root admin exists
      const pb0Exists = await this.getUserByUserId('PB0');
      if (!pb0Exists) {
        console.log('[INIT] Creating PB0 root admin user...');
        const hashedPassword = await hashPassword(pb0Password);
        await db.insert(users).values({
          email: 'admin@payback247.com',
          password: hashedPassword,
          role: 'admin',
          userId: 'PB0',
          name: 'Root Administrator',
          mobile: '9999999999',
          isActivated: true,
          isProfileComplete: true,
          matrixLevel: 0, // Root of global matrix
          matrixPath: 'PB0', // Root path
          requiresPostActivationProfileUpdate: true, // Force password change on first login
        });
        console.log('[INIT] ✓ PB0 root admin user created');
        console.log('[INIT] ⚠️  IMPORTANT: Change root admin password immediately after first login!');
      }
      
      // Check if PB1 secondary admin exists
      const pb1AdminExists = await this.getUserByEmail('payback2472000@gmail.com');
      if (!pb1AdminExists) {
        console.log('[INIT] Creating PB1 secondary admin user...');
        const hashedPassword = await hashPassword(pb1Password);
        await db.insert(users).values({
          email: 'payback2472000@gmail.com',
          password: hashedPassword,
          role: 'admin',
          userId: 'PB1',
          name: 'Secondary Administrator',
          mobile: '9876543210',
          isActivated: true,
          isProfileComplete: true,
          requiresPostActivationProfileUpdate: true, // Force password change on first login
        });
        console.log('[INIT] ✓ PB1 secondary admin user created');
      }
    } catch (error) {
      // CRITICAL: Rethrow production security errors to halt server startup
      if (error instanceof Error && error.message.includes('ADMIN_DEFAULT_PASSWORD is required')) {
        throw error; // Fatal error - server must not start
      }
      
      // Log and suppress other non-critical admin initialization errors
      console.error('[INIT] Error initializing admin users:', error);
      // Don't throw - allow server to start even if admin creation fails for other reasons
    }
  }

  /**
   * Initialize PostgreSQL sequence for auto-generating PB#### user IDs.
   * This ensures transaction-safe, sequential ID generation during signup.
   * Sequence starts at the current MAX PB#### number + 1.
   */
  async initializeUserIdSequence(): Promise<void> {
    try {
      console.log('[INIT] Initializing pb_user_id_seq sequence...');
      
      // Create sequence if it doesn't exist (separate statement)
      await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS pb_user_id_seq START WITH 10000`);
      
      // Set sequence to MAX existing PB#### number (using is_called=true)
      // This makes next nextval() return MAX+1, avoiding duplicates
      // Exclude system admins PB0, PB1 from MAX calculation
      // Fallback to 9999 so next ID is PB10000 (not PB15!)
      await db.execute(sql`
        SELECT setval('pb_user_id_seq', 
          COALESCE((
            SELECT MAX(CAST(SUBSTRING(user_id FROM 3) AS INTEGER))
            FROM users
            WHERE user_id LIKE 'PB%' 
              AND user_id != 'PB0' 
              AND user_id != 'PB1'
          ), 9999),
          true
        )
      `);
      
      // Verify current sequence value
      const currentVal = await db.execute(sql`SELECT last_value FROM pb_user_id_seq`);
      const lastValue = (currentVal.rows[0] as { last_value: number }).last_value;
      console.log(`[INIT] pb_user_id_seq initialized - next ID will be: PB${lastValue + 1}`);
    } catch (error) {
      console.error('[INIT] Error initializing user ID sequence:', error);
      // Don't throw - allow server to start even if sequence initialization fails
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

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    // Only return user if token matches AND hasn't expired
    const result = await db.select().from(users).where(
      and(
        eq(users.emailVerificationToken, token),
        or(
          isNull(users.emailVerificationExpiry),
          sql`${users.emailVerificationExpiry} > NOW()`
        )
      )
    ).limit(1);
    return result[0];
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await db.update(users)
      .set({ 
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null 
      })
      .where(eq(users.id, userId));
  }

  async createUser(insertUser: Partial<InsertUser>): Promise<User> {
    const result = await db.insert(users).values(insertUser as any).returning();
    return result[0];
  }

  async createUserWithGeneratedId(insertUser: Partial<InsertUser>): Promise<User> {
    // Reject if caller provides userId - must be generated by sequence
    if (insertUser.userId) {
      throw new Error('userId must not be provided - it will be auto-generated');
    }

    return await db.transaction(async (tx) => {
      // Get next PB#### ID from sequence (transaction-safe)
      const nextIdResult = await tx.execute(sql`SELECT nextval('pb_user_id_seq') as next_id`);
      const nextIdRow = nextIdResult.rows[0] as { next_id: number };
      const userId = `PB${nextIdRow.next_id}`;

      console.log(`[SIGNUP] Generated new userId: ${userId}`);

      // Insert user with generated ID
      const result = await tx.insert(users)
        .values({
          ...insertUser,
          userId,
        } as any)
        .returning();

      return result[0];
    });
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

  async checkProfileComplete(identifier: string): Promise<boolean> {
    // Handle both PB#### marketing IDs and database UUIDs
    let user;
    if (identifier.startsWith('PB')) {
      // Marketing ID (e.g., "PB10001") - use getUserByUserId
      user = await this.getUserByUserId(identifier);
    } else {
      // Database UUID (e.g., "7e53730c-5b72-4ecc-85ac-a4c4e33d...") - use getUserById
      user = await this.getUserById(identifier);
    }
    
    if (!user) return false;
    
    // Use shared helper to ensure consistent evaluation
    return this.evaluateProfileCompletion(user);
  }

  async getUsersBySponsorAndLeg(sponsorUserId: string, leg: 'left' | 'right'): Promise<User[]> {
    // Only return ACTIVATED users - inactive users are not visible in binary tree
    const result = await db
      .select()
      .from(users)
      .where(and(
        eq(users.sponsorId, sponsorUserId),
        eq(users.binaryLeg, leg),
        eq(users.isActivated, true), // CRITICAL: Only show activated users in binary tree
        sql`${users.userId} IS NOT NULL` // Ensure user has PB#### ID assigned
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
    console.log(`[MATRIX] getMatrixSubtree for ${userId}:`, {
      exists: !!rootUser,
      matrixLevel: rootUser?.matrixLevel,
      matrixPath: rootUser?.matrixPath,
      matrixPosition: rootUser?.matrixPosition
    });
    if (!rootUser || rootUser.matrixLevel === null || rootUser.matrixLevel === undefined || !rootUser.matrixPath) {
      console.log(`[MATRIX] User ${userId} not placed in matrix - returning null`);
      return null;
    }

    interface MatrixTreeRow {
      user_id: string;
      name: string | null;
      email: string;
      is_activated: boolean;
      matrix_level: number;
      matrix_position: number;
      matrix_path: string;
      matrix_parent_id: string | null;
      depth: number;
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

    const typedRows = rows.rows as unknown as MatrixTreeRow[];
    const nodeMap = new Map<string, any>();
    typedRows.forEach((row) => {
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
      const row = typedRows.find((r) => r.user_id === userId);
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
      
      // Generate 8 payment slots (binary match slot 1 pays first person in queue)
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
            amount = config.binaryMatchPaymentAmount; // ₹1000 to first person in queue
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
          } else {
            // No sponsor - default to admin
            receiverUserId = 'PB0';
            receiverType = 'admin';
          }
        } else if (paymentType === 'binary_match') {
          // Binary match pays FIRST person in queue (fallback to admin if empty)
          // Use FOR UPDATE lock and exclude already-reserved entries to prevent race conditions
          const firstInQueue = await tx.select()
            .from(binaryMatchQueue)
            .where(and(
              eq(binaryMatchQueue.status, 'waiting'),
              isNull(binaryMatchQueue.paidByActivationId) // MUST be unreserved
            ))
            .orderBy(asc(binaryMatchQueue.queuePosition))
            .limit(1)
            .for('update');
          
          if (firstInQueue[0]) {
            receiverUserId = firstInQueue[0].userId;
            receiverType = 'user';
            console.log(`[ACTIVATION] Binary match payment will go to queue user ${receiverUserId} (position ${firstInQueue[0].queuePosition})`);
            
            // IMMEDIATELY mark as RESERVED (prevents concurrent activations from selecting same entry)
            // When payment is confirmed, status will change from reserved → paid
            await tx.update(binaryMatchQueue)
              .set({ 
                status: 'reserved', // Mark as reserved (no longer selectable)
                paidByActivationId: createdActivation.id, // Reserve for this activation
              })
              .where(eq(binaryMatchQueue.id, firstInQueue[0].id));
          } else {
            // Queue empty - fallback to admin
            receiverUserId = 'PB0';
            receiverType = 'admin';
            console.log(`[ACTIVATION] Binary match queue empty - payment goes to admin fallback`);
          }
        } else if (paymentType === 'creator_fee') {
          receiverUserId = 'PB0';
          receiverType = 'admin';
        } else if (paymentType.startsWith('matrix_level_')) {
          // Matrix income goes to upline users based on level
          // Extract level number from payment type (matrix_level_1 → 1, matrix_level_2 → 2, etc.)
          const level = parseInt(paymentType.split('_')[2]);
          
          // Get the appropriate upline from activation record
          let uplineId: string | null = null;
          switch (level) {
            case 1:
              uplineId = createdActivation.matrixUpline1;
              break;
            case 2:
              uplineId = createdActivation.matrixUpline2;
              break;
            case 3:
              uplineId = createdActivation.matrixUpline3;
              break;
            case 4:
              uplineId = createdActivation.matrixUpline4;
              break;
            case 5:
              uplineId = createdActivation.matrixUpline5;
              break;
          }
          
          // If upline exists and is not admin, route to that user
          if (uplineId && uplineId !== 'PB0') {
            receiverUserId = uplineId;
            receiverType = 'user';
            console.log(`[ACTIVATION] Matrix Level ${level} payment will go to upline user ${uplineId}`);
          } else {
            // Upline is null or is admin - fallback to admin
            receiverUserId = 'PB0';
            receiverType = 'admin';
            console.log(`[ACTIVATION] Matrix Level ${level} upline is admin/null - payment goes to admin`);
          }
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
  
  async getAdminPendingConfirmations(adminUserId: string): Promise<ActivationPayment[]> {
    // Admin sees both:
    // 1. Payments where receiverType='admin' (system payments)
    // 2. Payments where receiverType='user' AND receiverUserId=their userId (personal sponsor payments)
    // This ensures admins can confirm both system and their personal sponsor income
    return db.select().from(activationPayments).where(
      and(
        or(
          eq(activationPayments.receiverType, 'admin'),
          and(
            eq(activationPayments.receiverType, 'user'),
            eq(activationPayments.receiverUserId, adminUserId)
          )
        ),
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
      console.log(`[STORAGE] Confirming payment ${id}`);
      
      // Step 1: Lock payment row with SELECT FOR UPDATE to prevent concurrent confirmations
      const existingPayment = await tx.select()
        .from(activationPayments)
        .where(eq(activationPayments.id, id))
        .for('update')
        .limit(1);
      
      if (existingPayment.length === 0) {
        console.log(`[STORAGE] Payment ${id} not found`);
        return undefined;
      }
      
      const payment = existingPayment[0];
      
      // Step 2: Idempotency check - if already confirmed, verify income exists and return
      if (payment.status === 'confirmed') {
        console.log(`[STORAGE] Payment ${id} already confirmed, verifying income exists`);
        
        // DEFENSIVE: Check if income was actually created for this payment
        // This handles edge case where status was updated but income creation failed
        const existingIncome = await tx.select()
          .from(incomeTransactions)
          .where(eq(incomeTransactions.activationPaymentId, id))
          .limit(1);
        
        if (existingIncome.length === 0 && payment.paymentType !== 'creator_fee' && payment.receiverUserId && payment.receiverUserId !== 'PB0') {
          console.warn(`[STORAGE] WARNING: Payment ${id} is confirmed but no income exists - recreating income`);
          const { IncomeService } = await import('./income-service');
          const incomeService = new IncomeService(tx as any);
          await incomeService.createIncomesForPayment(payment);
        }
        
        return payment;
      }
      
      // Step 3: Ensure payment is in 'submitted' status before confirming
      if (payment.status !== 'submitted') {
        throw new Error(`Cannot confirm payment in status '${payment.status}' - must be 'submitted'`);
      }
      
      // Step 4: Update payment status to confirmed
      const updateResult = await tx.update(activationPayments)
        .set({ 
          status: 'confirmed',
          confirmedAt: new Date(),
          notes: notes,
          updatedAt: new Date()
        })
        .where(eq(activationPayments.id, id))
        .returning();
      
      const confirmedPayment = updateResult[0];
      if (!confirmedPayment) {
        console.log(`[STORAGE] Payment ${id} update failed`);
        return undefined;
      }
      
      console.log(`[STORAGE] Payment updated successfully, creating income for receiver: ${confirmedPayment.receiverUserId}`);

      const { IncomeService } = await import('./income-service');
      const incomeService = new IncomeService(tx as any);
      
      try {
        console.log(`[STORAGE] Creating income for payment type: ${confirmedPayment.paymentType}`);
        await incomeService.createIncomesForPayment(confirmedPayment);
        console.log(`[STORAGE] Income created successfully`);
      } catch (error) {
        console.error('[STORAGE] Error creating income for payment:', error);
        throw error;
      }

      // If this is a binary_match payment to a real user (not admin), mark queue entry as paid
      // DEFENSIVE: Skip if receiver is PB0 (admin fallback) even if receiverType was incorrectly set to 'user'
      if (confirmedPayment.paymentType === 'binary_match' && confirmedPayment.receiverType === 'user' && confirmedPayment.receiverUserId !== 'PB0') {
        console.log(`[STORAGE] Marking binary match queue entry as paid for user ${confirmedPayment.receiverUserId}`);
        
        // Update queue entry from reserved → paid
        // Match by activation ID to ensure we update the correct reserved entry
        const queueUpdateResult = await tx.update(binaryMatchQueue)
          .set({
            status: 'paid',
            paidAt: new Date(),
          })
          .where(and(
            eq(binaryMatchQueue.userId, confirmedPayment.receiverUserId!),
            eq(binaryMatchQueue.paidByActivationId, confirmedPayment.activationId),
            eq(binaryMatchQueue.status, 'reserved') // MUST be reserved (not waiting or already paid)
          ))
          .returning();
        
        if (queueUpdateResult.length > 0) {
          console.log(`[STORAGE] Queue entry marked as paid - user ${confirmedPayment.receiverUserId} received ₹${confirmedPayment.amountInr}`);
        } else {
          // This is a critical error - means the queue entry was not properly reserved
          console.error(`[STORAGE] CRITICAL ERROR: No reserved queue entry found for user ${confirmedPayment.receiverUserId} and activation ${confirmedPayment.activationId}`);
          throw new Error(`Queue entry not found for binary match payment confirmation`);
        }
      } else if (confirmedPayment.paymentType === 'binary_match' && confirmedPayment.receiverUserId === 'PB0') {
        // Binary match payment to admin (queue was empty)
        console.log(`[STORAGE] Binary match payment to admin (queue empty fallback) - no queue entry to mark`);
        if (confirmedPayment.receiverType === 'user') {
          console.warn(`[STORAGE] WARNING: Binary match payment to PB0 has receiverType='user' - should be 'admin'`);
        }
      }

      console.log(`[STORAGE] Checking if all 8 payments are confirmed for activation ${confirmedPayment.activationId}`);
      await this.checkAndCompleteActivation(confirmedPayment.activationId, confirmedPayment.payerUserId, tx);
      
      console.log(`[STORAGE] Payment confirmation complete`);
      return confirmedPayment;
    });
  }

  async checkAndCompleteActivation(activationId: string, payerUserIdOrDbId: string, existingTx?: any): Promise<void> {
    try {
      // Execute the logic within the provided transaction or create a new one
      const executeLogic = async (tx: any) => {
        // Get all 8 payments for this activation with FOR UPDATE lock to prevent concurrent runs
        const payments = await tx.select()
          .from(activationPayments)
          .where(eq(activationPayments.activationId, activationId))
          .for('update');
        
        // BUG #5 FIX: Strict 8-payment enforcement - verify exactly 8 payments exist
        if (payments.length !== 8) {
          console.error(`[ACTIVATION ERROR] Expected 8 payments, found ${payments.length} for activation ${activationId}`);
          throw new Error(`8-payment enforcement failed: Expected 8 payments, found ${payments.length}`);
        }
        
        // Verify all payments are confirmed
        const allConfirmed = payments.every((p: any) => p.status === 'confirmed');
        
        if (!allConfirmed) {
          const pendingCount = payments.filter((p: any) => p.status !== 'confirmed').length;
          console.log(`[ACTIVATION] Waiting for ${pendingCount} more payments to be confirmed`);
          return; // Exit gracefully - not ready yet
        }
        
        console.log(`[ACTIVATION] All 8 payments confirmed. Verifying income creation...`);
        
        // BUG #2 FIX: Defensive income verification - ensure income was created for all confirmed payments
        // This prevents "confirmed but unpaid" states if income creation failed
        // CRITICAL: Only count slot-linked income (activationPaymentId NOT NULL) to exclude queue payouts
        const expectedIncomeCount = 8; // One income per payment slot (0-7)
        const actualIncome = await tx.select()
          .from(incomeTransactions)
          .where(and(
            eq(incomeTransactions.activationId, activationId),
            eq(incomeTransactions.status, 'confirmed'),
            sql`${incomeTransactions.activationPaymentId} IS NOT NULL` // Exclude queue payouts (they have NULL activationPaymentId)
          ));
        
        if (actualIncome.length !== expectedIncomeCount) {
          // CRITICAL: Payments confirmed but income missing - this is a data integrity issue
          console.error(`[ACTIVATION ERROR] Income mismatch for ${activationId}: Expected ${expectedIncomeCount}, Found ${actualIncome.length}`);
          console.error(`[ACTIVATION ERROR] Confirmed payments: ${payments.length}, Income created: ${actualIncome.length}`);
          
          // Mark activation as failed for manual investigation
          await tx.update(activations)
            .set({ 
              status: 'failed',
              completedAt: new Date()
            })
            .where(eq(activations.id, activationId));
          
          throw new Error(`Income verification failed: Expected ${expectedIncomeCount} income records, found ${actualIncome.length}. Activation marked as FAILED for manual investigation.`);
        }
        
        console.log(`[ACTIVATION] ✓ Income verification passed: ${actualIncome.length} income records confirmed`);
        
        if (allConfirmed) {
          console.log(`[ACTIVATION] All validations passed. Proceeding with activation...`);
          
          // Load the user by PB#### ID (payerUserId now contains PB#### IDs after migration)
          const activatedUserRows = await tx.select()
            .from(users)
            .where(eq(users.userId, payerUserIdOrDbId))
            .limit(1);
          
          if (activatedUserRows.length === 0) {
            throw new Error(`User with PB#### ID ${payerUserIdOrDbId} not found`);
          }
          
          const activatedUser = activatedUserRows[0];
          
          // Verify user has PB#### ID (assigned at signup)
          if (!activatedUser.userId) {
            throw new Error(`User ${payerUserIdOrDbId} missing PB#### ID - signup may have failed`);
          }
          
          const now = new Date();
          
          console.log(`[ACTIVATION] Activating user ${activatedUser.userId}...`);
          
          // Determine binary leg placement (tree placement happens at activation)
          let assignedBinaryLeg = activatedUser.binaryLeg; // May be pre-specified from signup
          if (activatedUser.sponsorId && !assignedBinaryLeg) {
            // Auto-assign to the leg with fewer members
            assignedBinaryLeg = await this.determineBestLeg(activatedUser.sponsorId);
            console.log(`[ACTIVATION] Auto-assigned ${activatedUser.userId} to ${assignedBinaryLeg} leg under sponsor ${activatedUser.sponsorId}`);
          }
          
          console.log(`[ACTIVATION] Binary placement: Sponsor=${activatedUser.sponsorId}, Leg=${assignedBinaryLeg}`);
          
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
          
          // Activate user with binary leg assignment
          // userId already assigned at signup, only updating binary placement and activation status
          await tx.update(users)
            .set({ 
              // userId NOT updated (already assigned at signup via sequence)
              binaryLeg: assignedBinaryLeg, // ASSIGN binary leg placement
              isActivated: true,
              activatedAt: now,
              requiresPostActivationProfileUpdate: true,
              updatedAt: now
            })
            .where(eq(users.userId, payerUserIdOrDbId));
          
          console.log(`[ACTIVATION] User ${activatedUser.userId} activated with binary leg: ${assignedBinaryLeg}`);
          
          // Assign user to next available global matrix slot
          // This happens atomically within the activation transaction
          // If matrix is full or placement fails, entire activation rolls back
          console.log(`[MATRIX] Placing ${activatedUser.userId} in global matrix...`);
          const placedUser = await this.findAndAssignMatrixSlot(activatedUser.userId, tx);
          
          // CRITICAL: Verify matrix placement succeeded before continuing
          if (!placedUser || !placedUser.matrixParentId || !placedUser.matrixLevel || !placedUser.matrixPath) {
            // Matrix placement failed - mark activation as failed before rolling back
            // This allows us to track and potentially retry failed activations
            await tx.update(activations)
              .set({ 
                status: 'failed',
                completedAt: now,
                notes: 'Matrix placement failed - matrix may be saturated or placement logic error'
              })
              .where(eq(activations.id, activationId));
            
            // Log critical error for manual investigation
            console.error(`[ACTIVATION] CRITICAL: Matrix placement failed for ${activatedUser.userId} - activation marked as FAILED`);
            console.error(`[ACTIVATION] Admin must investigate: ${activationId}`);
            
            throw new Error(`Matrix placement failed for user ${activatedUser.userId} - activation marked as FAILED for manual investigation`);
          }
          
          console.log(`[MATRIX] ✓ User ${activatedUser.userId} successfully placed in matrix at ${placedUser.matrixPath} (Level ${placedUser.matrixLevel})`);
          
          // Get matrix ancestors (up to 5 levels) for payment routing
          const matrixAncestors = await this.getMatrixAncestors(activatedUser.userId, 5, tx);
          console.log(`[MATRIX] Found ${matrixAncestors.length} matrix ancestors for ${activatedUser.userId}:`, matrixAncestors);
          
          // Update matrix payment receivers (slots 3-7) with ancestors or admin fallback
          // ONLY update if payment is NOT already confirmed (prevent income duplication)
          const matrixUplines: Record<string, string> = {};
          for (let level = 1; level <= 5; level++) {
            const ancestorIndex = level - 1;
            const receiverUserId = ancestorIndex < matrixAncestors.length ? matrixAncestors[ancestorIndex] : 'PB0';
            const slotIndex = level + 2; // Slot 3 = level 1, Slot 4 = level 2, etc.
            
            // Update payment receiver ONLY if not already confirmed
            await tx.update(activationPayments)
              .set({
                receiverUserId,
                receiverType: receiverUserId === 'PB0' ? 'admin' : 'user',
                updatedAt: now
              })
              .where(and(
                eq(activationPayments.activationId, activationId),
                eq(activationPayments.slotIndex, slotIndex),
                eq(activationPayments.status, 'pending') // Only update pending payments
              ));
            
            // Track for activation record update
            matrixUplines[`matrixUpline${level}`] = receiverUserId;
            
            console.log(`[MATRIX] Slot ${slotIndex} (Level ${level}) receiver: ${receiverUserId}`);
          }
          
          // Update activation record with matrix uplines
          await tx.update(activations)
            .set(matrixUplines)
            .where(eq(activations.id, activationId));
          
          // Step 4: Update sponsor's network statistics NOW (only after activation)
          // This is when the user becomes visible in the binary tree
          if (activatedUser.sponsorId && assignedBinaryLeg) {
            const sponsorId = activatedUser.sponsorId;
            
            // Increment sponsor's referral count, global leg count, AND personal leg count
            const updateData: any = {
              totalReferrals: sql`${users.totalReferrals} + 1`,
              updatedAt: now
            };
            
            if (assignedBinaryLeg === 'left') {
              updateData.leftLegCount = sql`${users.leftLegCount} + 1`; // Global count
              updateData.personalLeftCount = sql`${users.personalLeftCount} + 1`; // Personal count
            } else if (assignedBinaryLeg === 'right') {
              updateData.rightLegCount = sql`${users.rightLegCount} + 1`; // Global count
              updateData.personalRightCount = sql`${users.personalRightCount} + 1`; // Personal count
            }
            
            await tx.update(users)
              .set(updateData)
              .where(eq(users.userId, sponsorId));
            
            console.log(`[ACTIVATION] Updated sponsor ${sponsorId} stats: +1 total, +1 to ${assignedBinaryLeg} leg (global & personal)`);
          }
          
          // Process binary match queue for upline (check if upline users built 3:3 pairs)
          const { BinaryMatchService } = await import('./binary-match-service');
          const binaryMatchService = new BinaryMatchService(tx);
          
          console.log(`[ACTIVATION] Processing binary match queue for upline after user ${activatedUser.userId} activation`);
          await binaryMatchService.processUplineForQueueEntry(activatedUser.userId);
          
          console.log(`[ACTIVATION] User ${activatedUser.userId} successfully activated and placed in binary tree!`);
        }
      };

      // Use existing transaction if provided, otherwise create a new one
      if (existingTx) {
        await executeLogic(existingTx);
      } else {
        await db.transaction(executeLogic);
      }
    } catch (error) {
      console.error(`[ACTIVATION ERROR] Failed to complete activation:`, error);
      throw error;
    }
  }

  async rejectActivationPayment(id: string, rejectionReason: string): Promise<ActivationPayment | undefined> {
    return await db.transaction(async (tx) => {
      // Reject the payment
      const result = await tx.update(activationPayments)
        .set({ 
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason,
          updatedAt: new Date()
        })
        .where(eq(activationPayments.id, id))
        .returning();
      
      const payment = result[0];
      if (!payment) {
        return undefined;
      }
      
      // If this is a binary_match payment, release the queue entry
      // Reset from 'reserved' back to 'waiting' so next activation can select it
      if (payment.paymentType === 'binary_match' && payment.receiverType === 'user') {
        console.log(`[STORAGE] Releasing reserved queue entry for user ${payment.receiverUserId} (payment rejected)`);
        
        const queueReleaseResult = await tx.update(binaryMatchQueue)
          .set({
            status: 'waiting', // Reset to waiting
            paidByActivationId: null, // Clear reservation
          })
          .where(and(
            eq(binaryMatchQueue.userId, payment.receiverUserId!),
            eq(binaryMatchQueue.paidByActivationId, payment.activationId),
            eq(binaryMatchQueue.status, 'reserved')
          ))
          .returning();
        
        if (queueReleaseResult.length > 0) {
          console.log(`[STORAGE] Queue entry released - back to waiting status`);
        } else {
          console.log(`[STORAGE] WARNING: No reserved queue entry found to release`);
        }
      }
      
      return payment;
    });
  }

  // Release abandoned queue reservations (for activations that were never completed/rejected)
  // This is a safety mechanism to prevent queue deadlock from abandoned activations
  async releaseAbandonedQueueReservations(hoursOld: number = 72): Promise<number> {
    return await db.transaction(async (tx) => {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hoursOld);
      
      console.log(`[QUEUE CLEANUP] Searching for queue entries reserved before ${cutoffDate.toISOString()}`);
      
      // Find reserved entries that are older than threshold
      // These are likely from abandoned activations (user never submitted payment, etc)
      const abandonedEntries = await tx.select()
        .from(binaryMatchQueue)
        .where(and(
          eq(binaryMatchQueue.status, 'reserved'),
          lt(binaryMatchQueue.enteredAt, cutoffDate) // Older than threshold
        ));
      
      if (abandonedEntries.length === 0) {
        console.log(`[QUEUE CLEANUP] No abandoned reservations found`);
        return 0;
      }
      
      console.log(`[QUEUE CLEANUP] Found ${abandonedEntries.length} abandoned queue reservations - releasing...`);
      
      // Reset to waiting status
      const released = await tx.update(binaryMatchQueue)
        .set({
          status: 'waiting',
          paidByActivationId: null,
        })
        .where(and(
          eq(binaryMatchQueue.status, 'reserved'),
          lt(binaryMatchQueue.enteredAt, cutoffDate)
        ))
        .returning();
      
      console.log(`[QUEUE CLEANUP] Released ${released.length} abandoned queue entries back to waiting`);
      return released.length;
    });
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
  
  // Database backup/restore methods
  
  /**
   * Create database backup metadata record
   */
  async createDatabaseBackup(filename: string, fileSize: number, createdBy: string, notes?: string): Promise<DatabaseBackup> {
    const result = await db.insert(databaseBackups).values({
      filename,
      fileSize,
      createdBy,
      backupType: 'manual',
      notes,
    }).returning();
    
    return result[0];
  }
  
  /**
   * Get backup history (most recent first)
   */
  async getBackupHistory(limit: number = 50): Promise<DatabaseBackup[]> {
    return await db.select()
      .from(databaseBackups)
      .orderBy(desc(databaseBackups.createdAt))
      .limit(limit);
  }
  
  /**
   * Delete backup metadata record
   */
  async deleteBackup(backupId: string): Promise<void> {
    await db.delete(databaseBackups)
      .where(eq(databaseBackups.id, backupId));
  }
  
  /**
   * Export entire database to JSON format
   * Returns JSON string with schema version and all table data
   */
  async exportDatabaseToJSON(): Promise<string> {
    // Export all tables
    const [
      allUsers,
      allActivations,
      allActivationPayments,
      allSystemConfig,
      allReentries,
      allNotifications,
      allDatabaseBackups,
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(activations),
      db.select().from(activationPayments),
      db.select().from(systemConfig),
      db.select().from(reentries),
      db.select().from(notifications),
      db.select().from(databaseBackups),
    ]);
    
    // Build backup object with metadata
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables: {
        users: allUsers,
        activations: allActivations,
        activation_payments: allActivationPayments,
        system_config: allSystemConfig,
        reentries: allReentries,
        notifications: allNotifications,
        database_backups: allDatabaseBackups,
      },
      metadata: {
        userCount: allUsers.length,
        activationCount: allActivations.length,
        paymentCount: allActivationPayments.length,
      }
    };
    
    return JSON.stringify(backup, null, 2);
  }
  
  /**
   * Import database from JSON backup
   * WARNING: This will clear all existing data and restore from backup
   * Always create a pre-restore backup before calling this
   * NOTE: system_config, database_backups, and password_reset_tokens are preserved
   */
  async importDatabaseFromJSON(backupData: any, performedBy: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete existing data (in reverse order of dependencies)
      // PRESERVE: system_config, database_backups (backup history), password_reset_tokens (transient)
      await tx.delete(notifications);
      await tx.delete(activationPayments);
      await tx.delete(activations);
      await tx.delete(reentries);
      await tx.delete(users);
      
      // Insert restored data
      if (backupData.tables.users && backupData.tables.users.length > 0) {
        await tx.insert(users).values(backupData.tables.users);
      }
      
      if (backupData.tables.activations && backupData.tables.activations.length > 0) {
        await tx.insert(activations).values(backupData.tables.activations);
      }
      
      if (backupData.tables.activation_payments && backupData.tables.activation_payments.length > 0) {
        await tx.insert(activationPayments).values(backupData.tables.activation_payments);
      }
      
      if (backupData.tables.reentries && backupData.tables.reentries.length > 0) {
        await tx.insert(reentries).values(backupData.tables.reentries);
      }
      
      if (backupData.tables.notifications && backupData.tables.notifications.length > 0) {
        await tx.insert(notifications).values(backupData.tables.notifications);
      }
      
      // Log restore operation
      console.log(`[DB_RESTORE] Database restored by ${performedBy} from backup dated ${backupData.timestamp}`);
      console.log(`[DB_RESTORE] Preserved tables: system_config, database_backups, password_reset_tokens`);
    });
  }
}

export const storage = new DbStorage();
