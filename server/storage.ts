import { 
  type User, 
  type InsertUser,
  type UpdateProfile,
  type Activation,
  type InsertActivation,
  type ActivationPayment,
  type InsertActivationPayment,
  users,
  activations,
  activationPayments
} from "@shared/schema";
import { SLOT_TO_PAYMENT_TYPE, PAYMENT_TYPE_AMOUNTS } from "@shared/constants";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  updateUserProfile(id: string, profile: UpdateProfile): Promise<User | undefined>;
  getLastUser(): Promise<User | undefined>;
  
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
  submitPaymentProof(id: string, utrId: string, proofUrl?: string): Promise<ActivationPayment | undefined>;
  confirmActivationPayment(id: string, notes?: string): Promise<ActivationPayment | undefined>;
  rejectActivationPayment(id: string, rejectionReason: string): Promise<ActivationPayment | undefined>;
}

export class DbStorage implements IStorage {
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
    const result = await db.update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getLastUser(): Promise<User | undefined> {
    const result = await db.select().from(users)
      .orderBy(desc(users.createdAt))
      .limit(1);
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
      // Insert activation first
      const activationResult = await tx.insert(activations).values(activation).returning();
      const createdActivation = activationResult[0];
      
      // Generate all 8 payment slots
      const paymentsToCreate: InsertActivationPayment[] = [];
      
      for (let slotIndex = 0; slotIndex < SLOT_TO_PAYMENT_TYPE.length; slotIndex++) {
        const paymentType = SLOT_TO_PAYMENT_TYPE[slotIndex];
        const amount = PAYMENT_TYPE_AMOUNTS[paymentType];
        
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
          amountInr: amount.toString(),
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
    // Admin sees ALL submitted payments regardless of receiver
    return db.select().from(activationPayments).where(
      eq(activationPayments.status, 'submitted')
    ).orderBy(desc(activationPayments.updatedAt));
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
          await tx.update(users)
            .set({ 
              isActivated: true,
              activatedAt: now,
              updatedAt: now
            })
            .where(eq(users.userId, payerUserId));
          
          // Update sponsor's network statistics if user has a sponsor
          if (activatedUser.sponsorId && activatedUser.binaryLeg) {
            const sponsorId = activatedUser.sponsorId;
            const binaryLeg = activatedUser.binaryLeg;
            
            // Increment sponsor's referral count and leg count
            const updateData: any = {
              totalReferrals: sql`${users.totalReferrals} + 1`,
              updatedAt: now
            };
            
            if (binaryLeg === 'left') {
              updateData.leftLegCount = sql`${users.leftLegCount} + 1`;
            } else if (binaryLeg === 'right') {
              updateData.rightLegCount = sql`${users.rightLegCount} + 1`;
            }
            
            await tx.update(users)
              .set(updateData)
              .where(eq(users.userId, sponsorId));
            
            console.log(`[ACTIVATION] Updated sponsor ${sponsorId} stats: +1 total, +1 to ${binaryLeg} leg`);
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
