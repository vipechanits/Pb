import { type User, type InsertUser, type FallbackPayment, type InsertFallbackPayment } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Fallback payment methods
  createFallbackPayment(payment: InsertFallbackPayment): Promise<FallbackPayment>;
  getFallbackPayment(id: string): Promise<FallbackPayment | undefined>;
  getFallbackPaymentsByUser(walletAddress: string): Promise<FallbackPayment[]>;
  getPendingFallbackPayments(): Promise<FallbackPayment[]>;
  confirmFallbackPaymentByAdmin(id: string, adminWalletAddress: string): Promise<FallbackPayment | undefined>;
  confirmFallbackPaymentByUser(id: string): Promise<FallbackPayment | undefined>;
  getAllFallbackPayments(): Promise<FallbackPayment[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private fallbackPayments: Map<string, FallbackPayment>;

  constructor() {
    this.users = new Map();
    this.fallbackPayments = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFallbackPayment(insertPayment: InsertFallbackPayment): Promise<FallbackPayment> {
    const id = randomUUID();
    const now = new Date();
    const payment: FallbackPayment = { 
      ...insertPayment, 
      id,
      adminConfirmed: insertPayment.adminConfirmed ?? false,
      userConfirmed: insertPayment.userConfirmed ?? false,
      createdAt: now,
      updatedAt: now,
      adminConfirmedAt: null,
      userConfirmedAt: null,
      adminWalletAddress: null,
      transactionId: insertPayment.transactionId ?? null,
      paymentProofUrl: insertPayment.paymentProofUrl ?? null,
      notes: insertPayment.notes ?? null,
    };
    this.fallbackPayments.set(id, payment);
    return payment;
  }

  async getFallbackPayment(id: string): Promise<FallbackPayment | undefined> {
    return this.fallbackPayments.get(id);
  }

  async getFallbackPaymentsByUser(walletAddress: string): Promise<FallbackPayment[]> {
    return Array.from(this.fallbackPayments.values()).filter(
      (payment) => payment.userWalletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async getPendingFallbackPayments(): Promise<FallbackPayment[]> {
    return Array.from(this.fallbackPayments.values()).filter(
      (payment) => !payment.adminConfirmed
    );
  }

  async confirmFallbackPaymentByAdmin(id: string, adminWalletAddress: string): Promise<FallbackPayment | undefined> {
    const payment = this.fallbackPayments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment: FallbackPayment = {
      ...payment,
      adminConfirmed: true,
      adminConfirmedAt: new Date(),
      adminWalletAddress,
      updatedAt: new Date(),
    };
    this.fallbackPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async confirmFallbackPaymentByUser(id: string): Promise<FallbackPayment | undefined> {
    const payment = this.fallbackPayments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment: FallbackPayment = {
      ...payment,
      userConfirmed: true,
      userConfirmedAt: new Date(),
      updatedAt: new Date(),
    };
    this.fallbackPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getAllFallbackPayments(): Promise<FallbackPayment[]> {
    return Array.from(this.fallbackPayments.values());
  }
}

export const storage = new MemStorage();
