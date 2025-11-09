import { 
  type User, 
  type InsertUser,
  type Activation,
  type InsertActivation,
  type ActivationPayment,
  type InsertActivationPayment,
  users,
  activations,
  activationPayments
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createActivation(activation: InsertActivation): Promise<Activation>;
  getActivation(id: string): Promise<Activation | undefined>;
  getActivationsByPayer(payerWallet: string): Promise<Activation[]>;
  updateActivationStatus(id: string, status: string): Promise<Activation | undefined>;
  
  createActivationPayment(payment: InsertActivationPayment): Promise<ActivationPayment>;
  getActivationPayment(id: string): Promise<ActivationPayment | undefined>;
  getActivationPaymentsByActivationId(activationId: string): Promise<ActivationPayment[]>;
  getActivationPaymentsByReceiver(receiverWallet: string): Promise<ActivationPayment[]>;
  getActivationPaymentsPendingConfirmation(receiverWallet: string): Promise<ActivationPayment[]>;
  confirmActivationPayment(id: string, confirmedBy: string): Promise<ActivationPayment | undefined>;
  updateActivationPaymentMode(id: string, mode: string, txHash?: string, utrId?: string, proofUrl?: string): Promise<ActivationPayment | undefined>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createActivation(activation: InsertActivation): Promise<Activation> {
    const result = await db.insert(activations).values(activation).returning();
    return result[0];
  }

  async getActivation(id: string): Promise<Activation | undefined> {
    const result = await db.select().from(activations).where(eq(activations.id, id)).limit(1);
    return result[0];
  }

  async getActivationsByPayer(payerWallet: string): Promise<Activation[]> {
    return db.select().from(activations).where(eq(activations.payerWallet, payerWallet.toLowerCase()));
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

  async getActivationPayment(id: string): Promise<ActivationPayment | undefined> {
    const result = await db.select().from(activationPayments).where(eq(activationPayments.id, id)).limit(1);
    return result[0];
  }

  async getActivationPaymentsByActivationId(activationId: string): Promise<ActivationPayment[]> {
    return db.select().from(activationPayments).where(eq(activationPayments.activationId, activationId));
  }

  async getActivationPaymentsByReceiver(receiverWallet: string): Promise<ActivationPayment[]> {
    return db.select().from(activationPayments).where(eq(activationPayments.receiverWallet, receiverWallet.toLowerCase()));
  }

  async getActivationPaymentsPendingConfirmation(receiverWallet: string): Promise<ActivationPayment[]> {
    return db.select().from(activationPayments).where(
      and(
        eq(activationPayments.receiverWallet, receiverWallet.toLowerCase()),
        eq(activationPayments.confirmed, false)
      )
    );
  }

  async confirmActivationPayment(id: string, confirmedBy: string): Promise<ActivationPayment | undefined> {
    const result = await db.update(activationPayments)
      .set({ 
        confirmed: true, 
        confirmedAt: new Date(),
        confirmedBy: confirmedBy.toLowerCase()
      })
      .where(eq(activationPayments.id, id))
      .returning();
    return result[0];
  }

  async updateActivationPaymentMode(
    id: string, 
    mode: string, 
    txHash?: string, 
    utrId?: string, 
    proofUrl?: string
  ): Promise<ActivationPayment | undefined> {
    const result = await db.update(activationPayments)
      .set({ 
        paymentMode: mode as any,
        blockchainTxHash: txHash,
        offlineUtrId: utrId,
        offlineProofUrl: proofUrl
      })
      .where(eq(activationPayments.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
