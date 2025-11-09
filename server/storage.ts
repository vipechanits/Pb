import { 
  type User, 
  type InsertUser, 
  type ActivationPaymentConfirmation, 
  type InsertActivationPaymentConfirmation,
  users,
  activationPaymentConfirmations
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createActivationPaymentConfirmation(confirmation: InsertActivationPaymentConfirmation): Promise<ActivationPaymentConfirmation>;
  getActivationPaymentConfirmation(id: string): Promise<ActivationPaymentConfirmation | undefined>;
  getActivationPaymentConfirmationsByPayer(payerWalletAddress: string): Promise<ActivationPaymentConfirmation[]>;
  getActivationPaymentConfirmationsByReceiver(receiverWalletAddress: string): Promise<ActivationPaymentConfirmation[]>;
  getPendingActivationPaymentConfirmations(): Promise<ActivationPaymentConfirmation[]>;
  confirmActivationPayment(id: string): Promise<ActivationPaymentConfirmation | undefined>;
  getAllActivationPaymentConfirmations(): Promise<ActivationPaymentConfirmation[]>;
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

  async createActivationPaymentConfirmation(confirmation: InsertActivationPaymentConfirmation): Promise<ActivationPaymentConfirmation> {
    const result = await db.insert(activationPaymentConfirmations).values(confirmation).returning();
    return result[0];
  }

  async getActivationPaymentConfirmation(id: string): Promise<ActivationPaymentConfirmation | undefined> {
    const result = await db.select().from(activationPaymentConfirmations).where(eq(activationPaymentConfirmations.id, id)).limit(1);
    return result[0];
  }

  async getActivationPaymentConfirmationsByPayer(payerWalletAddress: string): Promise<ActivationPaymentConfirmation[]> {
    return db.select().from(activationPaymentConfirmations).where(eq(activationPaymentConfirmations.payerWalletAddress, payerWalletAddress.toLowerCase()));
  }

  async getActivationPaymentConfirmationsByReceiver(receiverWalletAddress: string): Promise<ActivationPaymentConfirmation[]> {
    return db.select().from(activationPaymentConfirmations).where(eq(activationPaymentConfirmations.receiverWalletAddress, receiverWalletAddress.toLowerCase()));
  }

  async getPendingActivationPaymentConfirmations(): Promise<ActivationPaymentConfirmation[]> {
    return db.select().from(activationPaymentConfirmations).where(eq(activationPaymentConfirmations.confirmed, false));
  }

  async confirmActivationPayment(id: string): Promise<ActivationPaymentConfirmation | undefined> {
    const result = await db.update(activationPaymentConfirmations)
      .set({ 
        confirmed: true, 
        confirmedAt: new Date() 
      })
      .where(eq(activationPaymentConfirmations.id, id))
      .returning();
    return result[0];
  }

  async getAllActivationPaymentConfirmations(): Promise<ActivationPaymentConfirmation[]> {
    return db.select().from(activationPaymentConfirmations);
  }
}

export const storage = new DbStorage();
