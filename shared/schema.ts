import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const activationPaymentConfirmations = pgTable("activation_payment_confirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activationId: varchar("activation_id", { length: 100 }).notNull(),
  payerWalletAddress: varchar("payer_wallet_address", { length: 42 }).notNull(),
  receiverWalletAddress: varchar("receiver_wallet_address", { length: 42 }).notNull(),
  receiverIndex: varchar("receiver_index", { length: 10 }).notNull(),
  amountUsdt: decimal("amount_usdt", { precision: 18, scale: 6 }).notNull(),
  paymentStage: varchar("payment_stage", { length: 30 }).notNull(),
  isAdminReceiver: boolean("is_admin_receiver").notNull().default(false),
  paymentMode: varchar("payment_mode", { length: 20 }).notNull(),
  transactionId: text("transaction_id"),
  transactionHash: text("transaction_hash"),
  paymentProofUrl: text("payment_proof_url"),
  confirmed: boolean("confirmed").notNull().default(false),
  confirmedAt: timestamp("confirmed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivationPaymentConfirmationSchema = createInsertSchema(activationPaymentConfirmations).omit({
  id: true,
  createdAt: true,
});

export type InsertActivationPaymentConfirmation = z.infer<typeof insertActivationPaymentConfirmationSchema>;
export type ActivationPaymentConfirmation = typeof activationPaymentConfirmations.$inferSelect;
