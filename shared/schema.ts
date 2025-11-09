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

export const fallbackPayments = pgTable("fallback_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentType: varchar("payment_type", { length: 20 }).notNull(), // 'binary' or 'matrix'
  userWalletAddress: varchar("user_wallet_address", { length: 42 }).notNull(),
  amountUsdt: decimal("amount_usdt", { precision: 18, scale: 6 }).notNull(),
  amountInr: decimal("amount_inr", { precision: 18, scale: 2 }).notNull(),
  transactionId: text("transaction_id"),
  paymentProofUrl: text("payment_proof_url"),
  adminConfirmed: boolean("admin_confirmed").notNull().default(false),
  adminConfirmedAt: timestamp("admin_confirmed_at"),
  adminWalletAddress: varchar("admin_wallet_address", { length: 42 }),
  userConfirmed: boolean("user_confirmed").notNull().default(false),
  userConfirmedAt: timestamp("user_confirmed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFallbackPaymentSchema = createInsertSchema(fallbackPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFallbackPayment = z.infer<typeof insertFallbackPaymentSchema>;
export type FallbackPayment = typeof fallbackPayments.$inferSelect;
