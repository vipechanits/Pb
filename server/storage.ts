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
  incomeTransactions,
  userIncomeSummaries
} from "@shared/schema";
import { SLOT_TO_PAYMENT_TYPE, PAYMENT_TYPE_AMOUNTS, MATRIX_PAYMENT_TYPES } from "@shared/constants";
import { eq, and, or, ne, isNull, desc, sql, lt, asc, inArray, count } from "drizzle-orm";
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
  getDirectReferrals(sponsorUserId: string): Promise<User[]>;
  getSponsorChain(userId: string): Promise<string[]>;
  isInDownline(requesterId: string, targetId: string): Promise<boolean>;
  
  // Binary match queue methods
  releaseAbandonedQueueReservations(hoursOld?: number): Promise<number>;
  
  // Global matrix methods (legacy - user-scoped)
  findAndAssignMatrixSlot(userId: string): Promise<User | undefined>;
  getMatrixSubtree(userId: string, maxDepth: number): Promise<MatrixNode | null>;
  
  // Activation-scoped matrix methods (new)
  findAndAssignActivationMatrixSlot(activationId: string, tx?: any): Promise<void>;
  getActivationMatrixSubtree(activationId: string, maxDepth: number): Promise<MatrixNode | null>;
  getActivationMatrixAncestors(activationId: string, maxDepth: number, tx?: any): Promise<Array<{activationId: string; payerUserId: string}>>;
  getUserActivationsList(userId: string): Promise<Array<{
    activationId: string;
    cycleNumber: number;
    status: string;
    matrixLevel: number | null;
    matrixPath: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }>>;
  
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
  getActivationPaymentsByPayerUserId(payerUserId: string): Promise<(ActivationPayment & { 
    receiverName?: string; 
    receiverEmail?: string; 
    receiverMobile?: string; 
    receiverUpiId?: string;
    receiverBankAccountHolder?: string;
    receiverBankAccount?: string;
    receiverIfscCode?: string;
  })[]>;
  getActivationPaymentsByCycle(userId: string): Promise<Array<{
    cycleNumber: number;
    activationId: string;
    activationStatus: string;
    completedAt: Date | null;
    payments: ActivationPayment[];
  }>>;
  getActivationPaymentsByReceiverUserId(receiverUserId: string): Promise<ActivationPayment[]>;
  getActivationPaymentsPendingConfirmation(receiverUserId: string): Promise<ActivationPayment[]>;
  getAdminPendingConfirmations(adminUserId: string): Promise<ActivationPayment[]>;
  getAllPendingConfirmationsCount(): Promise<number>;
  getAllConfirmedPayments(): Promise<ActivationPayment[]>;
  getConfirmedPaymentsWithDetails(): Promise<Array<ActivationPayment & { 
    payerName: string | null,
    payerEmail: string | null,
    payerMobile: string | null,
    payerUpiId: string | null,
    receiverName: string | null,
    receiverEmail: string | null,
    receiverMobile: string | null,
    receiverUpiId: string | null
  }>>;
  submitPaymentProof(id: string, utrId: string, proofUrl?: string): Promise<ActivationPayment | undefined>;
  confirmActivationPayment(id: string, notes?: string): Promise<ActivationPayment | undefined>;
  rejectActivationPayment(id: string, rejectionReason: string): Promise<ActivationPayment | undefined>;
  assignMatrixPaymentReceiversForReentry(activationId: string, userId: string, tx: any): Promise<void>;
  
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
  // REMOVED: importDatabaseFromJSON - Security vulnerability removed (see line 2249)
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
  
  // Initialize admin user (PB0 root admin only)
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
        console.error('  ⚠️  WARNING: Using fallback admin password in DEVELOPMENT');
        console.error('═══════════════════════════════════════════════════════════════════');
        console.error('  This is ONLY allowed in development.');
        console.error('  Production deployments will fail without ADMIN_DEFAULT_PASSWORD.');
        console.error('═══════════════════════════════════════════════════════════════════');
        console.error('');
      }
      
      const pb0Password = adminPassword || 'Admin@1234'; // Fallback ONLY in development
      
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
          matrixLevel: 0, // Excluded from matrix tree
          matrixPath: 'PB0', // Admin path
          requiresPostActivationProfileUpdate: true, // Force password change on first login
        });
        console.log('[INIT] ✓ PB0 root admin user created');
        console.log('[INIT] ⚠️  IMPORTANT: Change root admin password immediately after first login!');
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
      // Exclude system admin PB0 from MAX calculation
      // Fallback to 9999 so next ID is PB10000
      await db.execute(sql`
        SELECT setval('pb_user_id_seq', 
          COALESCE((
            SELECT MAX(CAST(SUBSTRING(user_id FROM 3) AS INTEGER))
            FROM users
            WHERE user_id LIKE 'PB%' 
              AND user_id != 'PB0'
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
    // SECURITY: Hash security code before storing (never store plaintext)
    if (profile.securityCode !== undefined) {
      const trimmedCode = profile.securityCode?.trim() || null;
      if (trimmedCode) {
        // Import hashPassword dynamically to avoid circular dependency
        const { hashPassword } = await import('./auth');
        normalizedProfile.securityCode = await hashPassword(trimmedCode);
      } else {
        normalizedProfile.securityCode = null;
      }
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
    // DEPRECATED: This method uses sponsorship tree counts (leftLegCount/rightLegCount)
    // For binary PLACEMENT, use findFirstAvailableBinarySlot() instead
    const sponsor = await this.getUserByUserId(sponsorUserId);
    if (!sponsor) {
      return 'left';
    }
    
    return sponsor.leftLegCount <= sponsor.rightLegCount ? 'left' : 'right';
  }

  async findFirstAvailableBinarySlot(preferredParentId?: string): Promise<{ parentId: string | null; leg: 'left' | 'right' | null } | null> {
    // Find first available position in binary PLACEMENT tree using breadth-first search
    // If preferredParentId is provided, try to place under that parent first
    
    // Find binary tree root (first activated regular user with no binary parent)
    const rootUser = await db.select({
      userId: users.userId,
    }).from(users)
      .where(and(
        eq(users.isActivated, true),
        sql`${users.userId} != 'PB0'`,
        isNull(users.binaryParentId)
      ))
      .limit(1);

    if (!rootUser || rootUser.length === 0) {
      // Empty tree - caller becomes the binary tree root
      // This handles first-ever activation in fresh deployment
      return { parentId: null, leg: null };
    }

    const root = rootUser[0].userId;

    // If preferredParentId provided, try it first
    if (preferredParentId && preferredParentId !== 'PB0') {
      const preferredParent = await this.getUserByUserId(preferredParentId);
      if (preferredParent && preferredParent.isActivated) {
        // Check if preferred parent has available slots
        const leftChild = await this.getUsersByBinaryParentAndLeg(preferredParentId, 'left');
        if (leftChild.length === 0) {
          return { parentId: preferredParentId, leg: 'left' };
        }
        const rightChild = await this.getUsersByBinaryParentAndLeg(preferredParentId, 'right');
        if (rightChild.length === 0) {
          return { parentId: preferredParentId, leg: 'right' };
        }
      }
    }

    // Breadth-first search for first available slot
    const queue: string[] = [root];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentParentId = queue.shift()!;
      if (visited.has(currentParentId)) continue;
      visited.add(currentParentId);

      // Check left leg
      const leftChildren = await this.getUsersByBinaryParentAndLeg(currentParentId, 'left');
      if (leftChildren.length === 0) {
        return { parentId: currentParentId, leg: 'left' };
      } else {
        // Add left child to queue for deeper search
        queue.push(leftChildren[0].userId);
      }

      // Check right leg
      const rightChildren = await this.getUsersByBinaryParentAndLeg(currentParentId, 'right');
      if (rightChildren.length === 0) {
        return { parentId: currentParentId, leg: 'right' };
      } else {
        // Add right child to queue for deeper search
        queue.push(rightChildren[0].userId);
      }
    }

    // No available slot found (tree is full - shouldn't happen in practice)
    return null;
  }

  async getUsersByBinaryParentAndLeg(parentUserId: string, leg: 'left' | 'right'): Promise<User[]> {
    // Query binary PLACEMENT tree (binaryParentId + binaryPlacementLeg)
    // Only return ACTIVATED users - inactive users are not visible in binary tree
    const result = await db
      .select()
      .from(users)
      .where(and(
        eq(users.binaryParentId, parentUserId),
        eq(users.binaryPlacementLeg, leg),
        eq(users.isActivated, true),
        sql`${users.userId} IS NOT NULL`
      ))
      .orderBy(users.createdAt);
    return result;
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
    // DEPRECATED: Replaced by getUsersByBinaryParentAndLeg()
    // This method kept for backward compatibility during migration
    return this.getUsersByBinaryParentAndLeg(sponsorUserId, leg);
  }

  async getDirectReferrals(sponsorUserId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(and(
        eq(users.sponsorId, sponsorUserId),
        sql`${users.userId} IS NOT NULL`
      ))
      .orderBy(desc(users.createdAt));
    return result;
  }

  async getSponsorChain(userId: string): Promise<string[]> {
    // Get all ancestors in the sponsor chain using WITH RECURSIVE
    // Returns array ordered from user up to root: [userId, sponsor, sponsor's sponsor, ...]
    // Excludes PB0 (admin) as per documentation: "admin account (PB0) completely excluded from tree structures"
    const result = await db.execute<{ user_id: string }>(sql`
      WITH RECURSIVE sponsor_chain AS (
        -- Base case: start with the given user (exclude PB0 from being a starting point)
        SELECT user_id, sponsor_id, 0 as depth
        FROM users
        WHERE user_id = ${userId} AND user_id != 'PB0'
        
        UNION ALL
        
        -- Recursive case: get sponsor of current user
        -- Add sponsor only if it's not NULL and not PB0
        SELECT u.user_id, u.sponsor_id, sc.depth + 1
        FROM users u
        INNER JOIN sponsor_chain sc ON u.user_id = sc.sponsor_id
        WHERE u.user_id != 'PB0'
      )
      SELECT user_id FROM sponsor_chain ORDER BY depth ASC
    `);
    
    return result.rows.map(row => row.user_id);
  }

  async getBinaryAncestorChain(userId: string): Promise<Array<{userId: string, legFromChild: 'left' | 'right'}>> {
    // Get all ancestors in the BINARY PLACEMENT chain for bubble-up counts
    // Returns array of {userId, legFromChild} where legFromChild is the leg the CHILD occupies relative to this ancestor
    // This is used for binary matching count bubbling, NOT sponsorship
    const user = await this.getUserByUserId(userId);
    
    if (!user || !user.binaryParentId || !user.binaryPlacementLeg) {
      return []; // Root user or not placed in binary tree yet
    }
    
    const chain: Array<{userId: string, legFromChild: 'left' | 'right'}> = [];
    
    // Start with the user's direct parent and the leg the user occupies
    let currentUserId = userId;
    let currentUser = user;
    
    while (currentUser.binaryParentId && currentUser.binaryParentId !== 'PB0' && currentUser.binaryPlacementLeg) {
      // Add the parent with the leg this child occupies relative to it
      chain.push({ 
        userId: currentUser.binaryParentId, 
        legFromChild: currentUser.binaryPlacementLeg // The leg THIS user occupies in their parent's tree
      });
      
      // Move up to the parent
      const parent = await this.getUserByUserId(currentUser.binaryParentId);
      if (!parent) break;
      
      currentUser = parent;
      
      // Safety check
      if (chain.length > 100) {
        console.error('[STORAGE] Binary chain exceeds 100 levels - possible circular reference');
        break;
      }
    }
    
    return chain;
  }

  async isInDownline(requesterId: string, targetId: string): Promise<boolean> {
    // Check if targetId is in requesterId's downline (sponsor hierarchy)
    // Returns true ONLY if targetId is a descendant of requesterId
    if (requesterId === targetId) return true;
    
    // Get sponsor chain for target user
    const targetChain = await this.getSponsorChain(targetId);
    
    // Check if requester is an ancestor of target (requester is in target's upline)
    return targetChain.includes(requesterId);
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

  /**
   * Reconciles matrix payment receivers after 3rd payment confirmed.
   * Handles BOTH new activations (awaiting_assignment) AND legacy broken data (pending with wrong receivers).
   * 
   * @param activationId - The activation ID
   * @param payerUserId - The user being activated (PB####)
   * @param allPayments - All 8 activation payments
   * @param tx - Active transaction
   */
  async reconcileMatrixPaymentsForActivation(
    activationId: string,
    payerUserId: string,
    allPayments: ActivationPayment[],
    tx: any
  ): Promise<void> {
    console.log(`[MATRIX RECONCILE] Starting reconciliation for activation ${activationId}`);
    
    // STEP 1: Lock user row to prevent race conditions
    const userRows = await tx.select()
      .from(users)
      .where(eq(users.userId, payerUserId))
      .for('update')
      .limit(1);
    
    if (userRows.length === 0) {
      throw new Error(`User ${payerUserId} not found for matrix reconciliation`);
    }
    
    const user = userRows[0];
    
    // STEP 2: Ensure matrix placement exists (if not, place user now)
    if (!user.matrixParentId || !user.matrixPath) {
      console.log(`[MATRIX RECONCILE] User ${user.userId} not yet placed in matrix - placing now...`);
      const placedUser = await this.findAndAssignMatrixSlot(user.userId, tx);
      
      if (!placedUser || !placedUser.matrixPath) {
        // Matrix placement failed - this will abort the entire confirmation transaction
        throw new Error(`Matrix placement failed for user ${user.userId} during reconciliation`);
      }
      
      console.log(`[MATRIX RECONCILE] ✓ User ${user.userId} placed at ${placedUser.matrixPath} (Level ${placedUser.matrixLevel})`);
    } else {
      console.log(`[MATRIX RECONCILE] User ${user.userId} already placed at ${user.matrixPath} (Level ${user.matrixLevel})`);
    }
    
    // STEP 3: Get matrix ancestors (up to 5 levels upline)
    const matrixAncestors = await this.getMatrixAncestors(user.userId, 5, tx);
    console.log(`[MATRIX RECONCILE] Found ${matrixAncestors.length}/5 matrix ancestors:`, matrixAncestors);
    
    // STEP 4: Build expected receiver map for slots 3-7 (Matrix Levels 1-5)
    const expectedReceivers: Record<number, string> = {
      3: matrixAncestors[0] || 'PB0', // Matrix Level 1
      4: matrixAncestors[1] || 'PB0', // Matrix Level 2
      5: matrixAncestors[2] || 'PB0', // Matrix Level 3
      6: matrixAncestors[3] || 'PB0', // Matrix Level 4
      7: matrixAncestors[4] || 'PB0', // Matrix Level 5
    };
    
    // STEP 5: Reconcile matrix payments (slots 3-7)
    const matrixPayments = allPayments.filter(p => 
      p.slotIndex >= 3 && 
      p.slotIndex <= 7 &&
      MATRIX_PAYMENT_TYPES.includes(p.paymentType as any)
    );
    
    console.log(`[MATRIX RECONCILE] Checking ${matrixPayments.length} matrix payments for receiver correctness...`);
    
    let correctedCount = 0;
    let newlyAssignedCount = 0;
    
    for (const payment of matrixPayments) {
      const expectedReceiver = expectedReceivers[payment.slotIndex];
      const currentReceiver = payment.receiverUserId;
      const isAwaitingAssignment = payment.status === 'awaiting_assignment';
      const isMismatched = currentReceiver !== expectedReceiver;
      
      // Update if: (1) awaiting initial assignment, OR (2) has wrong receiver (legacy incorrect data)
      if (isAwaitingAssignment || isMismatched) {
        // Only update payments that aren't already confirmed (don't mess with completed payments)
        if (payment.status !== 'confirmed') {
          await tx.update(activationPayments)
            .set({
              receiverUserId: expectedReceiver,
              receiverType: 'user',
              status: 'pending', // Always set to pending (ready for payment submission)
              updatedAt: new Date()
            })
            .where(eq(activationPayments.id, payment.id));
          
          if (isAwaitingAssignment) {
            newlyAssignedCount++;
            console.log(`[MATRIX RECONCILE] ✓ Slot ${payment.slotIndex} (${payment.paymentType}) newly assigned: ${expectedReceiver}`);
          } else if (isMismatched) {
            correctedCount++;
            console.warn(`[MATRIX RECONCILE] ⚠️  LEGACY FIX: Slot ${payment.slotIndex} receiver corrected from ${currentReceiver} to ${expectedReceiver}`);
          }
        } else {
          // Payment already confirmed - don't touch it
          console.log(`[MATRIX RECONCILE] Slot ${payment.slotIndex} already confirmed - skipping reconciliation`);
        }
      } else {
        // Receiver already correct and not awaiting assignment
        console.log(`[MATRIX RECONCILE] Slot ${payment.slotIndex} receiver already correct: ${expectedReceiver}`);
      }
    }
    
    if (newlyAssignedCount > 0) {
      console.log(`[MATRIX RECONCILE] ✓ ${newlyAssignedCount} matrix slots newly assigned`);
    }
    
    if (correctedCount > 0) {
      console.warn(`[MATRIX RECONCILE] ⚠️  ${correctedCount} legacy matrix slots corrected (had wrong receivers)`);
    }
    
    console.log(`[MATRIX RECONCILE] ✓ Matrix reconciliation complete for activation ${activationId}`);
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

      // Check if this is the FIRST user in the matrix (root node)
      // Excludes admin account (PB0) - they are not part of the matrix
      const existingMatrixUsers = await txn.select()
        .from(users)
        .where(and(
          sql`matrix_level IS NOT NULL`,
          ne(users.role, 'admin')  // Exclude admin accounts from matrix
        ))
        .limit(1);

      if (existingMatrixUsers.length === 0) {
        // This user is the first non-admin to activate - make them the root node
        // Typically PB10000, but dynamically handles whichever user activates first
        console.log(`[MATRIX] ${userId} is the FIRST user in matrix - assigning as ROOT NODE`);
        const result = await txn.update(users)
          .set({
            matrixParentId: null,      // Root has no parent
            matrixPosition: null,      // Root has no position (not 0 or 1)
            matrixLevel: 1,            // Root is level 1
            matrixPath: userId,        // Root path is just the user ID (e.g., "PB10000")
            updatedAt: new Date()
          })
          .where(and(
            eq(users.userId, userId),
            sql`matrix_parent_id IS NULL`  // Safety: only if not already placed
          ))
          .returning();
        
        if (result.length > 0) {
          console.log(`[MATRIX] ✓ ${userId} successfully assigned as matrix root (Level 1, Path: ${userId})`);
          return result[0];
        } else {
          throw new Error(`Failed to assign ${userId} as matrix root - already placed by another transaction`);
        }
      }

      // Matrix has existing users - find next available slot using BFS
      // NO LEVEL LIMIT: Matrix grows infinitely, each user earns from their 5-level downline (62 users)
      const frontier = await txn.select()
        .from(users)
        .where(and(
          sql`matrix_level IS NOT NULL`,
          eq(users.isActivated, true),
          ne(users.role, 'admin')  // Exclude admin accounts from matrix
        ))
        .orderBy(sql`matrix_level ASC, matrix_path ASC`)
        .for('update');
      
      for (const parentCandidate of frontier) {
        const children = await txn.select()
          .from(users)
          .where(eq(users.matrixParentId, parentCandidate.userId!))
          .for('update');
        
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
            .where(and(
              eq(users.userId, userId),
              sql`matrix_parent_id IS NULL`
            ))
            .returning();
          
          if (result.length > 0) {
            return result[0];
          } else {
            console.log(`[MATRIX] User ${userId} was already placed by another transaction - retrying next parent`);
            continue;
          }
        }
      }
      
      // This should never happen as matrix grows infinitely
      throw new Error('Matrix placement failed - unable to find available slot (database error)');
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

  // Activation-scoped matrix methods (new)
  async findAndAssignActivationMatrixSlot(activationId: string, tx?: any): Promise<void> {
    const executeInTx = async (txContext: any) => {
      // Import the new schema
      const { activationMatrixPositions } = await import('@shared/schema');
      
      // Check if this activation already has a matrix position
      const existingPosition = await txContext
        .select()
        .from(activationMatrixPositions)
        .where(eq(activationMatrixPositions.activationId, activationId))
        .limit(1);

      if (existingPosition.length > 0) {
        console.log(`[ACTIVATION-MATRIX] Activation ${activationId} already has matrix position`);
        return;
      }

      // Find the next available slot using breadth-first search
      // Start from level 1 and search for first available position
      let currentLevel = 1;
      const maxSearchLevels = 100; // Safety limit
      
      while (currentLevel <= maxSearchLevels) {
        // Get all positions at this level
        const levelPositions = await txContext
          .select()
          .from(activationMatrixPositions)
          .where(eq(activationMatrixPositions.matrixLevel, currentLevel))
          .orderBy(asc(activationMatrixPositions.createdAt));

        // If this is level 1 and empty, this is the root
        if (currentLevel === 1 && levelPositions.length === 0) {
          await txContext.insert(activationMatrixPositions).values({
            activationId: activationId,
            matrixParentActivationId: null,
            matrixPosition: null,
            matrixLevel: 1,
            matrixPath: activationId, // Root path is just the activation ID
          });
          console.log(`[ACTIVATION-MATRIX] Assigned ${activationId} as matrix root (level 1)`);
          return;
        }

        // Check each position at this level for available children
        for (const position of levelPositions) {
          // Check left child (position 0)
          const leftChild = await txContext
            .select()
            .from(activationMatrixPositions)
            .where(
              and(
                eq(activationMatrixPositions.matrixParentActivationId, position.activationId),
                eq(activationMatrixPositions.matrixPosition, 0)
              )
            )
            .limit(1);

          if (leftChild.length === 0) {
            // Left slot available!
            const newPath = `${position.matrixPath}.L`;
            await txContext.insert(activationMatrixPositions).values({
              activationId: activationId,
              matrixParentActivationId: position.activationId,
              matrixPosition: 0,
              matrixLevel: currentLevel + 1,
              matrixPath: newPath,
            });
            console.log(`[ACTIVATION-MATRIX] Assigned ${activationId} to left of ${position.activationId} at level ${currentLevel + 1}`);
            return;
          }

          // Check right child (position 1)
          const rightChild = await txContext
            .select()
            .from(activationMatrixPositions)
            .where(
              and(
                eq(activationMatrixPositions.matrixParentActivationId, position.activationId),
                eq(activationMatrixPositions.matrixPosition, 1)
              )
            )
            .limit(1);

          if (rightChild.length === 0) {
            // Right slot available!
            const newPath = `${position.matrixPath}.R`;
            await txContext.insert(activationMatrixPositions).values({
              activationId: activationId,
              matrixParentActivationId: position.activationId,
              matrixPosition: 1,
              matrixLevel: currentLevel + 1,
              matrixPath: newPath,
            });
            console.log(`[ACTIVATION-MATRIX] Assigned ${activationId} to right of ${position.activationId} at level ${currentLevel + 1}`);
            return;
          }
        }

        // No slots at this level, move to next
        currentLevel++;
      }

      throw new Error('Matrix placement failed - reached maximum search depth');
    };

    if (tx) {
      return await executeInTx(tx);
    } else {
      return await db.transaction(executeInTx);
    }
  }

  async getActivationMatrixSubtree(activationId: string, maxDepth: number): Promise<MatrixNode | null> {
    const { activationMatrixPositions, activations } = await import('@shared/schema');
    
    // Get the root position for this activation
    const rootPosition = await db
      .select()
      .from(activationMatrixPositions)
      .where(eq(activationMatrixPositions.activationId, activationId))
      .limit(1);

    if (rootPosition.length === 0) {
      console.log(`[ACTIVATION-MATRIX] Activation ${activationId} has no matrix position`);
      return null;
    }

    const root = rootPosition[0];
    
    interface ActivationMatrixTreeRow {
      activation_id: string;
      payer_wallet: string;
      user_id: string | null;
      name: string | null;
      email: string | null;
      is_activated: boolean;
      matrix_level: number;
      matrix_position: number | null;
      matrix_path: string;
      matrix_parent_activation_id: string | null;
      depth: number;
    }

    // Recursively fetch subtree
    const maxLevel = root.matrixLevel + maxDepth;
    const rows = await db.execute(sql`
      WITH RECURSIVE matrix_tree AS (
        SELECT 
          amp.activation_id,
          a.payer_wallet,
          u.user_id,
          u.name,
          u.email,
          u.is_activated,
          amp.matrix_level,
          amp.matrix_position,
          amp.matrix_path,
          amp.matrix_parent_activation_id,
          0 as depth
        FROM activation_matrix_positions amp
        INNER JOIN activations a ON amp.activation_id = a.id
        LEFT JOIN users u ON a.payer_wallet = u.id
        WHERE amp.activation_id = ${activationId}
        
        UNION ALL
        
        SELECT 
          amp.activation_id,
          a.payer_wallet,
          u.user_id,
          u.name,
          u.email,
          u.is_activated,
          amp.matrix_level,
          amp.matrix_position,
          amp.matrix_path,
          amp.matrix_parent_activation_id,
          mt.depth + 1
        FROM activation_matrix_positions amp
        INNER JOIN activations a ON amp.activation_id = a.id
        LEFT JOIN users u ON a.payer_wallet = u.id
        INNER JOIN matrix_tree mt ON amp.matrix_parent_activation_id = mt.activation_id
        WHERE amp.matrix_level <= ${maxLevel}
          AND mt.depth < ${maxDepth}
      )
      SELECT * FROM matrix_tree;
    `);

    if (rows.rows.length === 0) {
      return null;
    }

    const typedRows = rows.rows as unknown as ActivationMatrixTreeRow[];
    const nodeMap = new Map<string, any>();
    
    typedRows.forEach((row) => {
      nodeMap.set(row.activation_id, {
        userId: row.user_id || row.payer_wallet, // Use PB#### if available, else UUID
        name: row.name,
        email: row.email || 'Unknown',
        isActivated: row.is_activated,
        matrixLevel: row.matrix_level,
        matrixPosition: row.matrix_position,
        matrixPath: row.matrix_path,
        leftChild: null,
        rightChild: null,
      });
    });

    // Build tree structure
    nodeMap.forEach((node, activationId) => {
      const row = typedRows.find((r) => r.activation_id === activationId);
      if (row && row.matrix_parent_activation_id) {
        const parent = nodeMap.get(row.matrix_parent_activation_id);
        if (parent) {
          if (row.matrix_position === 0) {
            parent.leftChild = node;
          } else {
            parent.rightChild = node;
          }
        }
      }
    });

    return nodeMap.get(activationId) || null;
  }

  async getUserActivationsList(userId: string): Promise<Array<{
    activationId: string;
    cycleNumber: number;
    status: string;
    matrixLevel: number | null;
    matrixPath: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }>> {
    const { activations, activationMatrixPositions, reentries } = await import('@shared/schema');
    
    // Get user's database ID
    const user = await this.getUserByUserId(userId);
    if (!user) {
      return [];
    }

    // Get all activations for this user
    const userActivations = await db
      .select({
        activationId: activations.id,
        status: activations.status,
        createdAt: activations.createdAt,
        completedAt: activations.completedAt,
        reentryId: reentries.id,
        cycleNumber: reentries.cycleNumber,
      })
      .from(activations)
      .leftJoin(reentries, eq(reentries.newActivationId, activations.id))
      .where(eq(activations.payerWallet, userId)) // FIXED: Use userId directly, not user.id (UUID)
      .orderBy(asc(activations.createdAt));

    // Enrich with matrix position data
    const result = await Promise.all(
      userActivations.map(async (activation) => {
        const matrixPosition = await db
          .select()
          .from(activationMatrixPositions)
          .where(eq(activationMatrixPositions.activationId, activation.activationId))
          .limit(1);

        return {
          activationId: activation.activationId,
          cycleNumber: activation.cycleNumber ? activation.cycleNumber + 1 : 1, // First activation is Cycle 1, re-entries are cycleNumber + 1
          status: activation.status,
          matrixLevel: matrixPosition[0]?.matrixLevel || null,
          matrixPath: matrixPosition[0]?.matrixPath || null,
          createdAt: activation.createdAt,
          completedAt: activation.completedAt,
        };
      })
    );

    return result;
  }

  async getActivationMatrixAncestors(activationId: string, maxDepth: number, tx?: any): Promise<Array<{activationId: string; payerUserId: string}>> {
    const executeInTx = async (txContext: any) => {
      const { activationMatrixPositions, activations } = await import('@shared/schema');
      
      // Get the current activation's matrix position
      const currentPosition = await txContext
        .select()
        .from(activationMatrixPositions)
        .where(eq(activationMatrixPositions.activationId, activationId))
        .limit(1);

      if (currentPosition.length === 0 || !currentPosition[0].matrixPath) {
        console.log(`[ACTIVATION-MATRIX] Activation ${activationId} has no matrix position yet`);
        return [];
      }

      const position = currentPosition[0];
      
      // Walk up the matrix tree to find ancestors
      const ancestors: Array<{activationId: string; payerUserId: string}> = [];
      let currentParentId = position.matrixParentActivationId;
      let level = 0;

      while (currentParentId && level < maxDepth) {
        // Get parent activation position
        const parentPosition = await txContext
          .select({
            activationId: activationMatrixPositions.activationId,
            matrixParentActivationId: activationMatrixPositions.matrixParentActivationId,
            payerWallet: activations.payerWallet,
          })
          .from(activationMatrixPositions)
          .innerJoin(activations, eq(activations.id, activationMatrixPositions.activationId))
          .where(eq(activationMatrixPositions.activationId, currentParentId))
          .limit(1);

        if (parentPosition.length === 0) {
          break; // No more ancestors
        }

        const parent = parentPosition[0];
        
        // Get user's PB#### ID from the activation's payer_wallet (which is users.id UUID)
        const userRecord = await txContext
          .select({ userId: users.userId })
          .from(users)
          .where(eq(users.id, parent.payerWallet))
          .limit(1);

        if (userRecord.length > 0 && userRecord[0].userId) {
          ancestors.push({
            activationId: parent.activationId,
            payerUserId: userRecord[0].userId, // PB#### format
          });
        }

        currentParentId = parent.matrixParentActivationId;
        level++;
      }

      return ancestors;
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
    sponsorUserId: string | null,
    existingTx?: any // Optional transaction context for atomic re-entry operations
  ): Promise<{ activation: Activation; payments: ActivationPayment[] }> {
    const executeInTx = async (tx: any) => {
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
          case 'top_reward':
            amount = config.topRewardAmount;
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
            // No sponsor - PB0 confirms as receiver user
            receiverUserId = 'PB0';
            receiverType = 'user';
          }
        } else if (paymentType === 'binary_match') {
          // Binary match pays FIRST person in queue (fallback to PB0 if empty)
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
            // Queue empty - fallback to PB0 (receiver confirms as user, not as admin)
            receiverUserId = 'PB0';
            receiverType = 'user';
            console.log(`[ACTIVATION] Binary match queue empty - payment goes to PB0 (user confirmation)`);
          }
        } else if (paymentType === 'top_reward') {
          // Top reward goes to PB0, who confirms as receiver user
          receiverUserId = 'PB0';
          receiverType = 'user';
        } else if (paymentType.startsWith('matrix_level_')) {
          // Matrix payments: receivers will be assigned AFTER matrix placement during activation completion
          // Use NULL receiver and 'awaiting_assignment' status to prevent premature payment submission
          // This fixes the issue where users see PB0 as receiver before actual uplines are determined
          receiverUserId = null;
          receiverType = 'user'; // Will be user (either actual upline or PB0 fallback)
          console.log(`[ACTIVATION] Matrix Level ${paymentType} receiver will be assigned after matrix placement`);
        }
        
        // Matrix payments start with 'awaiting_assignment' status until receivers are determined
        const paymentStatus = paymentType.startsWith('matrix_level_') ? 'awaiting_assignment' : 'pending';
        
        paymentsToCreate.push({
          activationId: createdActivation.id,
          slotIndex,
          payerUserId,
          receiverUserId,
          paymentType: paymentType as any,
          receiverType,
          amountInr: amount,
          paymentMode: 'offline',
          status: paymentStatus as any,
          submissionCount: 0,
        });
      }
      
      // Insert all payments in the same transaction
      const paymentsResult = await tx.insert(activationPayments).values(paymentsToCreate).returning();
      
      return {
        activation: createdActivation,
        payments: paymentsResult,
      };
    };
    
    // Use existing transaction if provided, otherwise create new one
    if (existingTx) {
      return await executeInTx(existingTx);
    } else {
      return await db.transaction(executeInTx);
    }
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

  async getActivationPaymentsByPayerUserId(payerUserId: string): Promise<(ActivationPayment & { 
    receiverName?: string; 
    receiverEmail?: string; 
    receiverMobile?: string; 
    receiverUpiId?: string;
    receiverBankAccountHolder?: string;
    receiverBankAccount?: string;
    receiverIfscCode?: string;
  })[]> {
    const payments = await db.select().from(activationPayments).where(eq(activationPayments.payerUserId, payerUserId));
    
    // Get unique receiver user IDs (filter out null/undefined)
    const receiverUserIds = Array.from(new Set(payments.map(p => p.receiverUserId).filter((id): id is string => id !== null && id !== undefined)));
    
    // Fetch receiver details if there are any
    const receivers = receiverUserIds.length > 0
      ? await db.select().from(users).where(inArray(users.userId, receiverUserIds))
      : [];
    
    const receiverMap = new Map(receivers.map(u => [u.userId, u]));
    
    // Enrich payments with receiver metadata
    return payments.map(p => {
      const receiver = p.receiverUserId ? receiverMap.get(p.receiverUserId) : null;
      return {
        ...p,
        receiverName: receiver?.name || undefined,
        receiverEmail: receiver?.email || undefined,
        receiverMobile: receiver?.mobile || undefined,
        receiverUpiId: receiver?.upiId || undefined,
        receiverBankAccountHolder: receiver?.bankAccountHolder || undefined,
        receiverBankAccount: receiver?.bankAccountNumber || undefined,
        receiverIfscCode: receiver?.ifscCode || undefined,
      };
    });
  }

  async getActivationPaymentsByCycle(userId: string): Promise<Array<{
    cycleNumber: number;
    activationId: string;
    activationStatus: string;
    completedAt: Date | null;
    payments: (ActivationPayment & { 
      receiverName?: string; 
      receiverEmail?: string; 
      receiverMobile?: string; 
      receiverUpiId?: string;
      receiverBankAccountHolder?: string;
      receiverBankAccount?: string;
      receiverIfscCode?: string;
    })[];
  }>> {
    const cycles: Array<{
      cycleNumber: number;
      activationId: string;
      activationStatus: string;
      completedAt: Date | null;
      payments: (ActivationPayment & { 
        receiverName?: string; 
        receiverEmail?: string; 
        receiverMobile?: string; 
        receiverUpiId?: string;
        receiverBankAccountHolder?: string;
        receiverBankAccount?: string;
        receiverIfscCode?: string;
      })[];
    }> = [];

    // Get all payments for this user
    const userPayments = await db.select()
      .from(activationPayments)
      .where(eq(activationPayments.payerUserId, userId))
      .orderBy(activationPayments.createdAt);

    // Group payments by activationId
    const paymentsByActivation = new Map<string, ActivationPayment[]>();
    for (const payment of userPayments) {
      if (!paymentsByActivation.has(payment.activationId)) {
        paymentsByActivation.set(payment.activationId, []);
      }
      paymentsByActivation.get(payment.activationId)!.push(payment);
    }

    // Get all receiver user IDs to enrich payment data
    const receiverUserIds = Array.from(new Set(userPayments.map(p => p.receiverUserId).filter((id): id is string => id !== null && id !== undefined)));
    const receivers = receiverUserIds.length > 0
      ? await db.select().from(users).where(inArray(users.userId, receiverUserIds))
      : [];
    const receiverMap = new Map(receivers.map(u => [u.userId, u]));

    // Helper to enrich payments with receiver metadata
    const enrichPayments = (payments: ActivationPayment[]) => {
      return payments.map(p => {
        const receiver = p.receiverUserId ? receiverMap.get(p.receiverUserId) : null;
        return {
          ...p,
          receiverName: receiver?.name || undefined,
          receiverEmail: receiver?.email || undefined,
          receiverMobile: receiver?.mobile || undefined,
          receiverUpiId: receiver?.upiId || undefined,
          receiverBankAccountHolder: receiver?.bankAccountHolder || undefined,
          receiverBankAccount: receiver?.bankAccountNumber || undefined,
          receiverIfscCode: receiver?.ifscCode || undefined,
        };
      }).sort((a, b) => a.slotIndex - b.slotIndex);
    };

    // Find first activation (Cycle 1)
    if (paymentsByActivation.size > 0) {
      const activationIds = Array.from(paymentsByActivation.keys());
      const allActivations = await db.select()
        .from(activations)
        .where(inArray(activations.id, activationIds));
      
      // Find earliest activation
      let firstActivation = allActivations[0];
      for (const activation of allActivations) {
        if (activation.createdAt < firstActivation.createdAt) {
          firstActivation = activation;
        }
      }

      if (firstActivation) {
        const payments = paymentsByActivation.get(firstActivation.id) || [];
        cycles.push({
          cycleNumber: 1,
          activationId: firstActivation.id,
          activationStatus: firstActivation.status,
          completedAt: firstActivation.completedAt,
          payments: enrichPayments(payments),
        });
      }
    } else {
      // No payments yet - add pending Cycle 1
      cycles.push({
        cycleNumber: 1,
        activationId: 'PENDING',
        activationStatus: 'pending',
        completedAt: null,
        payments: [],
      });
    }

    // Get re-entry activations (Cycle 2+)
    const userReentries = await db.select()
      .from(reentries)
      .where(eq(reentries.userId, userId))
      .orderBy(reentries.cycleNumber);
    
    for (const reentry of userReentries) {
      if (reentry.newActivationId) {
        // Verify activation exists and belongs to this user via payments
        if (paymentsByActivation.has(reentry.newActivationId)) {
          const activation = await db.select()
            .from(activations)
            .where(eq(activations.id, reentry.newActivationId))
            .limit(1);
          
          if (activation.length > 0) {
            // Double-check: ensure at least one payment from this activation belongs to user
            const payments = paymentsByActivation.get(reentry.newActivationId) || [];
            const userOwnsActivation = payments.some(p => p.payerUserId === userId);
            
            if (userOwnsActivation) {
              cycles.push({
                cycleNumber: reentry.cycleNumber,
                activationId: activation[0].id,
                activationStatus: activation[0].status,
                completedAt: activation[0].completedAt,
                payments: enrichPayments(payments),
              });
            } else {
              // Activation exists but doesn't belong to user - mark as pending
              cycles.push({
                cycleNumber: reentry.cycleNumber,
                activationId: 'PENDING',
                activationStatus: 'pending',
                completedAt: null,
                payments: [],
              });
            }
          } else {
            // Activation ID exists but activation not found - mark as pending
            cycles.push({
              cycleNumber: reentry.cycleNumber,
              activationId: 'PENDING',
              activationStatus: 'pending',
              completedAt: null,
              payments: [],
            });
          }
        } else {
          // newActivationId exists but no payments yet - mark as pending
          cycles.push({
            cycleNumber: reentry.cycleNumber,
            activationId: 'PENDING',
            activationStatus: 'pending',
            completedAt: null,
            payments: [],
          });
        }
      } else {
        // Re-entry exists but no activation created yet
        cycles.push({
          cycleNumber: reentry.cycleNumber,
          activationId: 'PENDING',
          activationStatus: 'pending',
          completedAt: null,
          payments: [],
        });
      }
    }

    // Ensure cycles are sorted by cycle number
    return cycles.sort((a, b) => a.cycleNumber - b.cycleNumber);
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
    // All payments now use receiverType='user', so admins only see payments where they are the receiver
    // This includes sponsor payments, binary fallback, matrix fallback, and top reward where receiverUserId=adminUserId
    return db.select().from(activationPayments).where(
      and(
        eq(activationPayments.receiverType, 'user'),
        eq(activationPayments.receiverUserId, adminUserId),
        eq(activationPayments.status, 'submitted')
      )
    ).orderBy(desc(activationPayments.updatedAt));
  }

  async getAllPendingConfirmationsCount(): Promise<number> {
    // Get total count of ALL submitted payments in the system (for admin global notifications)
    const result = await db.select({ count: count() })
      .from(activationPayments)
      .where(eq(activationPayments.status, 'submitted'));
    
    return result[0]?.count || 0;
  }

  async getAllConfirmedPayments(): Promise<ActivationPayment[]> {
    // Get all confirmed payments for admin report
    return db.select().from(activationPayments).where(
      eq(activationPayments.status, 'confirmed')
    ).orderBy(desc(activationPayments.confirmedAt));
  }

  async getConfirmedPaymentsWithDetails(): Promise<Array<ActivationPayment & { 
    payerName: string | null,
    payerEmail: string | null,
    payerMobile: string | null,
    payerUpiId: string | null,
    receiverName: string | null,
    receiverEmail: string | null,
    receiverMobile: string | null,
    receiverUpiId: string | null
  }>> {
    // Get all confirmed payments with comprehensive payer and receiver details for admin report
    const payer = alias(users, 'payer');
    const receiver = alias(users, 'receiver');
    
    const results = await db.select({
      payment: activationPayments,
      payerName: payer.name,
      payerEmail: payer.email,
      payerMobile: payer.mobile,
      payerUpiId: payer.upiId,
      receiverName: receiver.name,
      receiverEmail: receiver.email,
      receiverMobile: receiver.mobile,
      receiverUpiId: receiver.upiId,
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
      payerEmail: r.payerEmail,
      payerMobile: r.payerMobile,
      payerUpiId: r.payerUpiId,
      receiverName: r.receiverName,
      receiverEmail: r.receiverEmail,
      receiverMobile: r.receiverMobile,
      receiverUpiId: r.receiverUpiId,
    }));
  }

  async submitPaymentProof(id: string, utrId: string, proofUrl?: string): Promise<ActivationPayment | undefined> {
    // PHASE 1 FIX: Advisory lock with normalization to prevent duplicate UTR race condition
    // Normalizes UTR (trim + uppercase) before locking to prevent whitespace/case variants
    return await db.transaction(async (tx) => {
      // STEP 1: Validate input BEFORE normalization
      // Reject empty, whitespace-only, or overly long UTRs before any processing
      if (!utrId || utrId.trim().length === 0) {
        throw new Error('UTR/Transaction ID cannot be empty. Please enter a valid transaction reference.');
      }
      
      if (utrId.length > 100) {
        throw new Error('UTR/Transaction ID is too long (maximum 100 characters).');
      }
      
      // STEP 2: Normalize UTR (trim + uppercase)
      // Prevents bypass via whitespace/case variants: "ABC123" vs " ABC123 " vs "abc123"
      const normalizedUtr = utrId.trim().toUpperCase();
      
      // STEP 2: Lock current payment row to prevent concurrent modifications
      const currentPaymentResult = await tx.select()
        .from(activationPayments)
        .where(eq(activationPayments.id, id))
        .for('update')
        .limit(1);
      
      if (currentPaymentResult.length === 0) return undefined;
      const currentPayment = currentPaymentResult[0];
      
      // STEP 3: Validate payment state
      if (currentPayment.status === 'awaiting_assignment') {
        throw new Error('Payment receiver not yet assigned - complete first 3 payments before paying matrix levels');
      }
      
      // STEP 4: CRITICAL - Acquire advisory lock on NORMALIZED UTR hash
      // Uses PostgreSQL advisory lock to serialize concurrent submissions with same UTR
      // Lock is automatically released when transaction commits/rolls back
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${normalizedUtr}))`);
      
      // STEP 5: Check for duplicate NORMALIZED UTR (while holding lock)
      // Even if two transactions start simultaneously, only one gets the lock at a time
      const existingPaymentWithUtr = await tx.select()
        .from(activationPayments)
        .where(and(
          eq(activationPayments.offlineUtrId, normalizedUtr),
          ne(activationPayments.id, id) // Exclude current payment being updated
        ))
        .limit(1);
      
      if (existingPaymentWithUtr.length > 0) {
        throw new Error('This UTR/Transaction ID has already been used for another payment. Each payment must have a unique transaction ID.');
      }
      
      // STEP 6: Update payment with NORMALIZED UTR (within locked transaction)
      const result = await tx.update(activationPayments)
        .set({ 
          status: 'submitted',
          offlineUtrId: normalizedUtr, // Store normalized version
          offlineProofUrl: proofUrl,
          submissionCount: (currentPayment.submissionCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(activationPayments.id, id))
        .returning();
      
      return result[0];
    });
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
      
      // Step 1.5: LEGACY FIX - If payment already confirmed, check if user needs matrix placement/reconciliation
      // This fixes legacy broken activations (like PB10004) who were activated before matrix logic existed
      if (payment.status === 'confirmed') {
        console.log(`[STORAGE] Payment ${id} already confirmed - checking if legacy reconciliation needed...`);
        
        // Check if user is missing matrix placement (legacy users from before matrix logic)
        const userCheck = await tx.select()
          .from(users)
          .where(eq(users.userId, payment.payerUserId))
          .limit(1);
        
        const needsMatrixPlacement = userCheck.length > 0 && !userCheck[0].matrixParentId;
        
        // Get all payments to check confirmation count
        const allPayments = await tx.select()
          .from(activationPayments)
          .where(eq(activationPayments.activationId, payment.activationId));
        
        const confirmedCount = allPayments.filter(p => p.status === 'confirmed').length;
        console.log(`[STORAGE] Legacy activation ${payment.activationId} has ${confirmedCount}/8 payments confirmed`);
        
        // Force reconciliation if:
        // 1. User is missing matrix placement (critical fix for PB10004 and similar cases), OR
        // 2. Activation has >= 3 confirmations (normal legacy fix)
        if (needsMatrixPlacement) {
          console.log(`[STORAGE] CRITICAL: User ${payment.payerUserId} missing matrix placement - forcing reconciliation...`);
          await this.reconcileMatrixPaymentsForActivation(
            payment.activationId,
            payment.payerUserId,
            allPayments,
            tx
          );
        } else if (confirmedCount >= 3) {
          console.log(`[STORAGE] Running standard legacy reconciliation for activation ${payment.activationId}...`);
          await this.reconcileMatrixPaymentsForActivation(
            payment.activationId,
            payment.payerUserId,
            allPayments,
            tx
          );
        }
      }
      
      // Step 2: Idempotency check - if already confirmed, verify income exists and return
      if (payment.status === 'confirmed') {
        console.log(`[STORAGE] Payment ${id} already confirmed, verifying income exists`);
        
        // DEFENSIVE: Check if income was actually created for this payment
        // This handles edge case where status was updated but income creation failed
        const existingIncome = await tx.select()
          .from(incomeTransactions)
          .where(eq(incomeTransactions.activationPaymentId, id))
          .limit(1);
        
        if (existingIncome.length === 0 && payment.paymentType !== 'top_reward' && payment.receiverUserId && payment.receiverUserId !== 'PB0') {
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

      // IMPORTANT: Defer income creation for matrix AND sponsor payments
      // Matrix payments: Receivers determined after matrix placement (during activation)
      // Sponsor payments: Only credited AFTER user completes full activation (8 payments)
      // Other payments (binary_match, top_reward): Created immediately
      const isMatrixPayment = confirmedPayment.paymentType.startsWith('matrix_level_');
      const isSponsorPayment = confirmedPayment.paymentType === 'direct_sponsor';
      
      if (isMatrixPayment) {
        console.log(`[STORAGE] Skipping income creation for ${confirmedPayment.paymentType} - will be created after matrix placement`);
      } else if (isSponsorPayment) {
        console.log(`[STORAGE] Skipping income creation for ${confirmedPayment.paymentType} - will be created after full activation`);
      } else {
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
      }

      // If this is a binary_match payment to a real user (not PB0 fallback), mark queue entry as paid
      // PB0 fallback payments don't have queue entries to mark (queue was empty)
      if (confirmedPayment.paymentType === 'binary_match' && confirmedPayment.receiverUserId !== 'PB0') {
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
        // Binary match payment to PB0 (queue was empty) - no queue entry to mark
        console.log(`[STORAGE] Binary match payment to PB0 (queue empty fallback) - no queue entry to mark`);
      }

      // Step 5: NEW ACTIVATION FIX - After confirming this payment, check if we now have >= 3 confirmations
      // This triggers matrix placement and receiver assignment for new activations
      console.log(`[STORAGE] Checking if matrix reconciliation should run after confirming payment...`);
      
      // Re-fetch all payments with fresh data (using FOR UPDATE to prevent concurrent drift)
      const freshPayments = await tx.select()
        .from(activationPayments)
        .where(eq(activationPayments.activationId, confirmedPayment.activationId))
        .for('update');
      
      const freshConfirmedCount = freshPayments.filter(p => p.status === 'confirmed').length;
      console.log(`[STORAGE] Activation ${confirmedPayment.activationId} now has ${freshConfirmedCount}/8 payments confirmed (post-confirmation)`);
      
      // If we have at least 3 confirmed payments, reconcile matrix placement and receivers
      // This handles NEW activations where the 3rd payment just got confirmed
      if (freshConfirmedCount >= 3) {
        console.log(`[STORAGE] Running post-confirmation matrix reconciliation...`);
        await this.reconcileMatrixPaymentsForActivation(
          confirmedPayment.activationId,
          confirmedPayment.payerUserId,
          freshPayments,
          tx
        );
      }

      console.log(`[STORAGE] Checking if all 8 payments are confirmed for activation ${confirmedPayment.activationId}`);
      
      try {
        await this.checkAndCompleteActivation(confirmedPayment.activationId, confirmedPayment.payerUserId, tx);
        console.log(`[STORAGE] Activation completion check finished successfully`);
      } catch (error) {
        console.error(`[STORAGE] CRITICAL ERROR in checkAndCompleteActivation:`, error);
        // Re-throw to roll back the entire transaction (prevents partial confirmations)
        throw error;
      }
      
      console.log(`[STORAGE] Payment confirmation complete`);
      return confirmedPayment;
    });
  }

  // ADMIN UTILITY: Manually complete a broken activation (with its own transaction)
  // Use case: When activation has all 8 payments confirmed but completion failed
  async manualCompleteActivation(activationId: string, userId: string): Promise<void> {
    console.log(`[MANUAL-COMPLETE] Starting manual activation completion for ${userId}, activation ${activationId}`);
    
    // Run in a fresh transaction with dedicated error handling
    try {
      return await db.transaction(async (tx) => {
        await this.checkAndCompleteActivation(activationId, userId, tx);
        console.log(`[MANUAL-COMPLETE] Manual activation completion successful for ${userId}`);
      });
    } catch (error) {
      console.error(`[MANUAL-COMPLETE] Failed for ${userId}, activation ${activationId}:`, error);
      // Re-throw with context for upstream logging
      throw new Error(`Manual completion failed for ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async checkAndCompleteActivation(activationId: string, payerUserIdOrDbId: string, existingTx?: any): Promise<void> {
    try {
      // Execute the logic within the provided transaction or create a new one
      const executeLogic = async (tx: any) => {
        // CRITICAL FIX: Lock activation record FIRST to prevent race conditions
        // This serializes access so only one transaction can complete activation
        console.log(`[ACTIVATION] Acquiring lock on activation ${activationId}...`);
        const activationLock = await tx.select()
          .from(activations)
          .where(eq(activations.id, activationId))
          .for('update')
          .limit(1);
        
        if (activationLock.length === 0) {
          console.error(`[ACTIVATION] Activation ${activationId} not found`);
          return;
        }
        
        const lockedActivation = activationLock[0];
        
        // Idempotency check: If already completed/failed, skip
        if (lockedActivation.status === 'completed') {
          console.log(`[ACTIVATION] Activation ${activationId} already completed, skipping`);
          return;
        }
        
        if (lockedActivation.status === 'failed') {
          console.log(`[ACTIVATION] Activation ${activationId} marked as failed, skipping`);
          return;
        }
        
        console.log(`[ACTIVATION] Lock acquired, activation status: ${lockedActivation.status}`);
        
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
        
        console.log(`[ACTIVATION] All 8 payments confirmed. Verifying immediately-created income...`);
        
        // DEFERRED INCOME POLICY: Both sponsor AND matrix incomes are deferred until activation completion
        // Only binary_match (Slot 1) and top_reward (Slot 2) incomes are created immediately upon payment confirmation
        // Sponsor income (Slot 0) is created AFTER all 8 payments are confirmed (see lines 1388-1427)
        // Matrix income (Slots 3-7) is created AFTER matrix placement (see lines 1431-1469)
        // CRITICAL: Only count slot-linked income (activationPaymentId NOT NULL) to exclude queue payouts
        
        // FIX: Dynamically count confirmed immediate-type payments instead of hardcoding 2
        // This prevents false failures when activation completion check runs during partial payment confirmation
        const confirmedImmediatePayments = payments.filter((p: any) => 
          p.status === 'confirmed' && 
          (p.paymentType === 'binary_match' || p.paymentType === 'top_reward')
        );
        const expectedImmediateIncomeCount = confirmedImmediatePayments.length;
        
        console.log(`[ACTIVATION] Verified ${confirmedImmediatePayments.length} immediate-type payments confirmed (binary_match + top_reward)`);
        
        const actualImmediateIncome = await tx.select()
          .from(incomeTransactions)
          .where(and(
            eq(incomeTransactions.activationId, activationId),
            eq(incomeTransactions.status, 'confirmed'),
            sql`${incomeTransactions.activationPaymentId} IS NOT NULL`, // Exclude queue payouts (they have NULL activationPaymentId)
            sql`${incomeTransactions.activationPaymentId} IN (
              SELECT id FROM ${activationPayments} 
              WHERE ${activationPayments.activationId} = ${activationId} 
              AND ${activationPayments.paymentType} IN ('binary_match', 'top_reward')
            )`
          ));
        
        if (actualImmediateIncome.length !== expectedImmediateIncomeCount) {
          // CRITICAL: Immediate-creation payments confirmed but income missing - this is a data integrity issue
          console.error(`[ACTIVATION ERROR] Immediate income mismatch for ${activationId}: Expected ${expectedImmediateIncomeCount}, Found ${actualImmediateIncome.length}`);
          console.error(`[ACTIVATION ERROR] Confirmed immediate payments: ${confirmedImmediatePayments.length}, Immediate income created: ${actualImmediateIncome.length}`);
          console.error(`[ACTIVATION ERROR] Confirmed payment types: ${confirmedImmediatePayments.map((p: any) => p.paymentType).join(', ')}`);
          
          // Mark activation as failed for manual investigation
          await tx.update(activations)
            .set({ 
              status: 'failed',
              completedAt: new Date()
            })
            .where(eq(activations.id, activationId));
          
          throw new Error(`Income verification failed: Expected ${expectedImmediateIncomeCount} immediate income records (matching confirmed binary_match + top_reward payments), found ${actualImmediateIncome.length}. Activation marked as FAILED for manual investigation.`);
        }
        
        console.log(`[ACTIVATION] ✓ Immediate income verification passed: ${actualImmediateIncome.length} income records confirmed (sponsor + matrix will be created next)`);
        
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
          
          // DEFENSIVE: Check if BOTH user AND activation are fully completed (race condition guard)
          // Partial activations must continue to completion even if some steps already done
          // CRITICAL: Must check lockedActivation.status (not just user.isActivated) to handle all partial states
          if (activatedUser.isActivated && lockedActivation.status === 'completed') {
            console.log(`[ACTIVATION] User ${activatedUser.userId} already fully activated (user.isActivated=true AND activation.status='completed') - skipping duplicate run`);
            return; // Exit gracefully - another transaction already completed this
          }
          
          // RECOVERY MODE: Detect partial activation from historical bug
          const hasMatrixPlacement = !!(activatedUser.matrixParentId && activatedUser.matrixPath);
          const hasBinaryLeg = !!activatedUser.binaryLeg;
          const isPartialActivation = hasMatrixPlacement && !activatedUser.isActivated;
          if (isPartialActivation) {
            console.log(`[ACTIVATION-RECOVERY] User ${activatedUser.userId} has matrix placement (${activatedUser.matrixPath}) but isActivated=false - recovering from partial activation`);
          }
          
          // EDGE CASE RECOVERY: Activation marked 'completed' but user.isActivated still false
          // This inconsistency can occur from historical bugs - resync user flag and exit
          if (lockedActivation.status === 'completed' && !activatedUser.isActivated) {
            const now = new Date();
            console.warn(`[ACTIVATION-RECOVERY] INCONSISTENCY DETECTED: Activation ${activationId} status='completed' but user ${activatedUser.userId} isActivated=false - resyncing user flag`);
            
            // Resync user isActivated flag to match activation.status='completed'
            // Preserve existing binary leg and matrix placement
            await tx.update(users)
              .set({ 
                isActivated: true,
                activatedAt: now,
                requiresPostActivationProfileUpdate: true,
                updatedAt: now
              })
              .where(eq(users.userId, payerUserIdOrDbId));
            
            console.log(`[ACTIVATION-RECOVERY] User ${activatedUser.userId} isActivated flag resynced to true - activation already marked completed`);
            return; // Exit after resyncing - activation already processed
          }
          
          const now = new Date();
          
          console.log(`[ACTIVATION] Activating user ${activatedUser.userId}...`);
          
          // Determine binary PLACEMENT using new placement-based logic
          // Separate from sponsorship: sponsor relationship is for income, placement is for tree structure
          // findFirstAvailableBinarySlot() handles both empty tree (returns {null, null}) and populated tree
          const placement = await this.findFirstAvailableBinarySlot(activatedUser.sponsorId || undefined);
          
          if (!placement) {
            throw new Error(`Binary placement logic error - cannot activate ${activatedUser.userId}`);
          }
          
          const binaryPlacementParent = placement.parentId;
          const binaryPlacementLeg = placement.leg;
          
          if (binaryPlacementParent === null && binaryPlacementLeg === null) {
            console.log(`[ACTIVATION] ${activatedUser.userId} becomes BINARY TREE ROOT (first activated user)`);
          } else {
            console.log(`[ACTIVATION] Binary PLACEMENT: ${activatedUser.userId} placed in ${binaryPlacementParent}-${binaryPlacementLeg}`);
          }
          
          // Keep legacy binaryLeg for audit trail (sponsorRequestedLeg also set during signup)
          let assignedBinaryLeg = activatedUser.binaryLeg || activatedUser.sponsorRequestedLeg;
          if (!assignedBinaryLeg && activatedUser.sponsorId) {
            assignedBinaryLeg = await this.determineBestLeg(activatedUser.sponsorId);
          }
          
          console.log(`[ACTIVATION] Sponsor=${activatedUser.sponsorId}, RequestedLeg=${assignedBinaryLeg}, ActualPlacement=${binaryPlacementParent}-${binaryPlacementLeg}`);
          
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
          
          // Activate user with binary PLACEMENT assignment
          // userId already assigned at signup, only updating binary placement and activation status
          await tx.update(users)
            .set({ 
              // Legacy fields (for audit trail)
              binaryLeg: assignedBinaryLeg,
              sponsorRequestedLeg: assignedBinaryLeg,
              
              // NEW: Binary placement tree fields
              binaryParentId: binaryPlacementParent,
              binaryPlacementLeg: binaryPlacementLeg,
              
              // Activation flags
              isActivated: true,
              activatedAt: now,
              requiresPostActivationProfileUpdate: true,
              updatedAt: now
            })
            .where(eq(users.userId, payerUserIdOrDbId));
          
          console.log(`[ACTIVATION] User ${activatedUser.userId} activated with binary leg: ${assignedBinaryLeg}`);
          
          // ACTIVATION-SCOPED MATRIX: Assign this activation to next available matrix slot
          // Each activation gets a unique matrix position, enabling multi-cycle re-entry
          // This happens atomically within the activation transaction
          console.log(`[ACTIVATION-MATRIX] Placing activation ${activationId} (user ${activatedUser.userId}) in global matrix...`);
          await this.findAndAssignActivationMatrixSlot(activationId, tx);
          
          // Verify activation matrix placement succeeded
          const { activationMatrixPositions } = await import('@shared/schema');
          const matrixPosition = await tx.select()
            .from(activationMatrixPositions)
            .where(eq(activationMatrixPositions.activationId, activationId))
            .limit(1);
          
          if (matrixPosition.length === 0 || !matrixPosition[0].matrixLevel || !matrixPosition[0].matrixPath) {
            // Matrix placement failed - mark activation as failed before rolling back
            await tx.update(activations)
              .set({ 
                status: 'failed',
                completedAt: now,
                notes: 'Activation-scoped matrix placement failed - placement logic error'
              })
              .where(eq(activations.id, activationId));
            
            console.error(`[ACTIVATION-MATRIX] CRITICAL: Matrix placement failed for activation ${activationId} - activation marked as FAILED`);
            throw new Error(`Matrix placement failed for activation ${activationId} - activation marked as FAILED for manual investigation`);
          }
          
          const placedPosition = matrixPosition[0];
          console.log(`[ACTIVATION-MATRIX] ✓ Activation ${activationId} placed in matrix at ${placedPosition.matrixPath} (Level ${placedPosition.matrixLevel})`);
          
          // Get activation matrix ancestors (up to 5 levels) for payment routing
          const matrixAncestorActivations = await this.getActivationMatrixAncestors(activationId, 5, tx);
          console.log(`[ACTIVATION-MATRIX] Found ${matrixAncestorActivations.length} ancestor activations for ${activationId}:`, matrixAncestorActivations.map(a => a.activationId));
          
          // AUTO-DETECT MATRIX COMPLETION: Check if any upline ancestors just completed their 62-user matrix
          // NOTE: Re-entry eligibility is now per-activation, not per-user. Matrix completion is checked
          // against the activation's matrix downline (each cycle has separate 62-user requirement).
          // For now, we skip this auto-detection and rely on manual re-entry page checks.
          console.log(`[REENTRY] Skipping auto-completion check (now activation-scoped, handled on re-entry page)`);
          
          // STAGED RECEIVER ASSIGNMENT: Assign matrix payment receivers and change status from 'awaiting_assignment' to 'pending'
          // This prevents users from seeing/paying wrong receivers before matrix placement completes
          // Receivers were set to NULL with 'awaiting_assignment' status at activation creation
          // Now we assign actual uplines (or PB0 fallback) and make payments submittable
          const matrixUplines: Record<string, string> = {};
          for (let level = 1; level <= 5; level++) {
            const ancestorIndex = level - 1;
            const receiverUserId = ancestorIndex < matrixAncestorActivations.length ? matrixAncestorActivations[ancestorIndex].payerUserId : 'PB0';
            const slotIndex = level + 2; // Slot 3 = level 1, Slot 4 = level 2, etc.
            
            // Update payment receiver AND change status from 'awaiting_assignment' to 'pending'
            // This atomically assigns receiver and enables payment submission
            // Matrix payments always use receiverType='user' so receiver (even if PB0) confirms as user
            await tx.update(activationPayments)
              .set({
                receiverUserId,
                receiverType: 'user',
                status: 'pending', // Change from 'awaiting_assignment' to 'pending' (ready for payment)
                updatedAt: now
              })
              .where(and(
                eq(activationPayments.activationId, activationId),
                eq(activationPayments.slotIndex, slotIndex),
                eq(activationPayments.status, 'awaiting_assignment') // Only update if still awaiting
              ));
            
            // Track for activation record update
            matrixUplines[`matrixUpline${level}`] = receiverUserId;
            
            console.log(`[MATRIX] Slot ${slotIndex} (Level ${level}) receiver assigned: ${receiverUserId} (status → pending)`);
          }
          
          // Update activation record with matrix uplines
          await tx.update(activations)
            .set(matrixUplines)
            .where(eq(activations.id, activationId));
          
          // Create deferred income for matrix payments now that receivers are assigned correctly
          // This completes the deferred income creation that was skipped in confirmActivationPayment
          console.log(`[MATRIX] Creating deferred income for matrix payments with correct receivers...`);
          const { IncomeService } = await import('./income-service');
          const incomeService = new IncomeService(tx as any);
          
          // Fetch sponsor payment (deferred until activation completion)
          const sponsorPayment = await tx.select()
            .from(activationPayments)
            .where(and(
              eq(activationPayments.activationId, activationId),
              eq(activationPayments.paymentType, 'direct_sponsor'),
              eq(activationPayments.status, 'confirmed')
            ))
            .limit(1);
          
          if (sponsorPayment.length > 0) {
            // CRITICAL: Delete any legacy sponsor income for this payment (created prematurely)
            // This ensures the 8-income invariant holds and business rules are enforced
            const deletedLegacyIncome = await tx.delete(incomeTransactions)
              .where(and(
                eq(incomeTransactions.activationPaymentId, sponsorPayment[0].id),
                eq(incomeTransactions.incomeType, 'direct_sponsor')
              ))
              .returning();
            
            // DEFENSIVE: Assert at most 1 legacy record deleted per activation
            if (deletedLegacyIncome.length > 1) {
              console.error(`[SPONSOR ERROR] Unexpected: Deleted ${deletedLegacyIncome.length} sponsor income records (expected 0 or 1)`);
              throw new Error(`Data integrity violation: Multiple sponsor income records found for activation payment ${sponsorPayment[0].id}`);
            }
            
            if (deletedLegacyIncome.length > 0) {
              console.log(`[SPONSOR] Deleted ${deletedLegacyIncome.length} legacy sponsor income record created prematurely - will correct summary after recreation`);
            }
            
            // Create the correct sponsor income (deferred until activation)
            // This MUST succeed before we update summaries to avoid permanent double deduction
            console.log(`[SPONSOR] Creating sponsor income for ${sponsorPayment[0].paymentType} → ${sponsorPayment[0].receiverUserId} (₹${sponsorPayment[0].amountInr})`);
            await incomeService.createIncomesForPayment(sponsorPayment[0]);
            console.log(`[SPONSOR] ✓ Sponsor income created successfully`);
            
            // CRITICAL: Only update summary AFTER successful income creation
            // This prevents permanent double deduction if creation fails
            if (deletedLegacyIncome.length > 0) {
              const legacyIncome = deletedLegacyIncome[0];
              await tx.update(userIncomeSummaries)
                .set({
                  directSponsorIncome: sql`CAST(${userIncomeSummaries.directSponsorIncome} AS DECIMAL) - CAST(${legacyIncome.amountInr} AS DECIMAL)`,
                  totalEarnings: sql`CAST(${userIncomeSummaries.totalEarnings} AS DECIMAL) - CAST(${legacyIncome.amountInr} AS DECIMAL)`,
                  updatedAt: new Date()
                })
                .where(eq(userIncomeSummaries.userId, legacyIncome.userId));
              
              console.log(`[SPONSOR] Corrected income summary for ${legacyIncome.userId} (removed legacy ₹${legacyIncome.amountInr})`);
            }
          } else {
            console.warn(`[SPONSOR] WARNING: No confirmed sponsor payment found for activation ${activationId}`);
          }
          
          // Fetch all confirmed matrix payments for this activation
          // Use shared MATRIX_PAYMENT_TYPES constant to ensure consistency
          const matrixPayments = await tx.select()
            .from(activationPayments)
            .where(and(
              eq(activationPayments.activationId, activationId),
              inArray(activationPayments.paymentType, [...MATRIX_PAYMENT_TYPES]),
              eq(activationPayments.status, 'confirmed')
            ));
          
          console.log(`[MATRIX] Found ${matrixPayments.length} confirmed matrix payments to create income for`);
          
          for (const payment of matrixPayments) {
            // Create income for all matrix payments, including admin fallback (PB0)
            // Income records are needed for reconciliation even when payments go to admin
            console.log(`[MATRIX] Creating income for ${payment.paymentType} → ${payment.receiverUserId} (₹${payment.amountInr})`);
            await incomeService.createIncomesForPayment(payment);
          }
          
          console.log(`[MATRIX] ✓ Deferred income creation completed for sponsor and matrix payments`);
          
          // Final verification: Ensure all 8 income records now exist (3 non-matrix + 5 matrix)
          const allIncome = await tx.select()
            .from(incomeTransactions)
            .where(and(
              eq(incomeTransactions.activationId, activationId),
              eq(incomeTransactions.status, 'confirmed'),
              sql`${incomeTransactions.activationPaymentId} IS NOT NULL`
            ));
          
          if (allIncome.length !== 8) {
            console.error(`[ACTIVATION ERROR] Final income verification failed: Expected 8, Found ${allIncome.length}`);
            
            // Mark activation as failed
            await tx.update(activations)
              .set({ 
                status: 'failed',
                completedAt: new Date(),
                notes: 'Final income verification failed after deferred income creation'
              })
              .where(eq(activations.id, activationId));
            
            throw new Error(`Final income verification failed: Expected 8 income records, found ${allIncome.length}. Activation marked as FAILED.`);
          }
          
          console.log(`[ACTIVATION] ✓ Final income verification passed: All 8 income records confirmed`);
          
          // Step 4: Update ALL upline network statistics recursively NOW (only after activation)
          // BUBBLE PLACEMENT: This propagates counts up the BINARY PLACEMENT tree, not sponsor chain
          if (activatedUser.binaryParentId && activatedUser.binaryPlacementLeg) {
            console.log(`[ACTIVATION] Updating binary ancestor leg counts for ${activatedUser.userId} (binary leg: ${activatedUser.binaryPlacementLeg})`);
            
            // Get BINARY ancestor chain (not sponsor chain) - this is the key fix for bubble placement
            const binaryAncestors = await this.getBinaryAncestorChain(activatedUser.userId);
            console.log(`[ACTIVATION] Found ${binaryAncestors.length} binary ancestors (excluding PB0)`);
            
            // Update each binary ancestor's leg counts based on which leg the child occupies
            for (const ancestor of binaryAncestors) {
              if (ancestor.userId === activatedUser.userId) continue; // Skip self
              if (ancestor.userId === 'PB0') continue; // Skip admin
              
              const updateData: any = {
                updatedAt: now
              };
              
              // ALL binary ancestors get global count increment based on child's leg position
              // Personal counts ONLY updated if this ancestor is also the direct sponsor
              const isDirectSponsor = ancestor.userId === activatedUser.sponsorId;
              const childLeg = ancestor.legFromChild; // The leg this child occupies relative to this ancestor
              
              if (childLeg === 'left') {
                updateData.leftLegCount = sql`${users.leftLegCount} + 1`; // Global count for all
                if (isDirectSponsor) {
                  updateData.personalLeftCount = sql`${users.personalLeftCount} + 1`; // Personal only if also sponsor
                  updateData.totalReferrals = sql`${users.totalReferrals} + 1`; // Total referrals only for direct sponsor
                }
              } else if (childLeg === 'right') {
                updateData.rightLegCount = sql`${users.rightLegCount} + 1`; // Global count for all
                if (isDirectSponsor) {
                  updateData.personalRightCount = sql`${users.personalRightCount} + 1`; // Personal only if also sponsor
                  updateData.totalReferrals = sql`${users.totalReferrals} + 1`; // Total referrals only for direct sponsor
                }
              }
              
              await tx.update(users)
                .set(updateData)
                .where(eq(users.userId, ancestor.userId));
              
              const typeLabel = isDirectSponsor ? 'binary parent + direct sponsor' : 'binary ancestor';
              console.log(`[ACTIVATION] Updated ${typeLabel} ${ancestor.userId}: +1 to ${childLeg} leg (${isDirectSponsor ? 'personal + global' : 'global only'})`);
            }
            
            // Step 5: Check ALL binary ancestors for queue entry eligibility
            // Import QUEUE-BASED binary matching service
            const { BinaryMatchService } = await import('./binary-match-service');
            const binaryMatchService = new BinaryMatchService(tx as any);
            
            console.log(`[BINARY_MATCH_QUEUE] Checking binary ancestors for queue entry after ${activatedUser.userId} activation`);
            await binaryMatchService.processUplineForQueueEntry(activatedUser.userId);
            console.log(`[BINARY_MATCH_QUEUE] ✓ Binary ancestor queue check completed`);
          }
          
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
      
      // If this is a binary_match payment to a real user (not PB0 fallback), release the queue entry
      // Reset from 'reserved' back to 'waiting' so next activation can select it
      // PB0 fallback payments don't have queue entries (queue was empty)
      if (payment.paymentType === 'binary_match' && payment.receiverUserId !== 'PB0') {
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

  async assignMatrixPaymentReceiversForReentry(activationId: string, userId: string, tx: any): Promise<void> {
    // MUST be called within a transaction (no longer creates its own)
    // Get user's matrix position
    const userResult = await tx.select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    
    if (!userResult[0] || !userResult[0].matrixPath) {
      console.log(`[RE-ENTRY MATRIX] User ${userId} has no matrix position - skipping matrix assignment`);
      return;
    }
    
    const user = userResult[0];
    
    // Find the user's 5-level matrix upline (ancestors) using the same transaction
    const upline = await this.getMatrixUpline(userId, 5, tx);
    
    console.log(`[RE-ENTRY MATRIX] Found ${upline.length} matrix upline members for ${userId}`);
    
    // Update matrix payment slots (3-7) with receiver IDs
    for (let level = 1; level <= 5; level++) {
      const slotIndex = level + 2; // matrix_level_1 is slot 3, matrix_level_2 is slot 4, etc.
      const paymentType = `matrix_level_${level}`;
      
      const receiverUserId = upline[level - 1] || 'PB0'; // Fallback to PB0 if no upline at this level
      
      await tx.update(activationPayments)
        .set({
          receiverUserId,
          receiverType: 'user',
          status: 'pending', // Change from awaiting_assignment to pending
          updatedAt: new Date(),
        })
        .where(and(
          eq(activationPayments.activationId, activationId),
          eq(activationPayments.paymentType, paymentType as any)
        ));
      
      console.log(`[RE-ENTRY MATRIX] Assigned ${paymentType} receiver: ${receiverUserId}`);
    }
  }

  // Get matrix upline (ancestors) up to maxLevels
  private async getMatrixUpline(userId: string, maxLevels: number, txOrDb?: any): Promise<string[]> {
    const dbConn = txOrDb || db; // Use transaction if provided, otherwise global db
    
    const userResult = await dbConn.select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    
    if (!userResult[0]) {
      return [];
    }
    
    const user = userResult[0];
    
    // Walk up the matrix parent chain
    const upline: string[] = [];
    let currentParentId = user.matrixParentId;
    
    while (currentParentId && upline.length < maxLevels) {
      const parentResult = await dbConn.select()
        .from(users)
        .where(eq(users.userId, currentParentId))
        .limit(1);
      
      if (!parentResult[0]) {
        break;
      }
      
      upline.push(parentResult[0].userId);
      currentParentId = parentResult[0].matrixParentId;
    }
    
    return upline;
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
  
  // REMOVED: importDatabaseFromJSON - Catastrophic security vulnerability
  // This function allowed deleting ALL user data and was exposed via insecure endpoint
  // Database restoration must be done manually via direct database access tools
  // with proper backup procedures and administrator oversight
}

export const storage = new DbStorage();
