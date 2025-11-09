import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paymentTypeEnum = pgEnum("payment_type", [
  "direct_sponsor",
  "binary_match",
  "creator_fee",
  "matrix_level_1",
  "matrix_level_2",
  "matrix_level_3",
  "matrix_level_4",
  "matrix_level_5",
]);

export const receiverTypeEnum = pgEnum("receiver_type", ["user", "admin"]);

export const paymentModeEnum = pgEnum("payment_mode", ["offline"]);

export const activationStatusEnum = pgEnum("activation_status", ["pending", "partial", "completed", "failed"]);

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('user'),
  
  // User ID (PB1, PB2, etc.) - generated after activation
  userId: varchar("user_id", { length: 20 }).unique(),
  
  // Profile information
  name: text("name"),
  mobile: varchar("mobile", { length: 15 }),
  
  // Payment details - for receiving payments
  upiId: text("upi_id"),
  bankAccountHolder: text("bank_account_holder"),
  bankAccountNumber: varchar("bank_account_number", { length: 20 }),
  ifscCode: varchar("ifsc_code", { length: 11 }),
  
  // Security
  securityCode: varchar("security_code", { length: 6 }),
  
  // Referral link
  sponsorId: varchar("sponsor_id", { length: 20 }), // PB ID of sponsor
  
  // Account status
  isActivated: boolean("is_activated").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schema for signup
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(6),
});

// Update profile schema
export const updateProfileSchema = z.object({
  name: z.string().optional(),
  mobile: z.string().length(10).optional(),
  upiId: z.string().optional(),
  bankAccountHolder: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().length(11).optional(),
  securityCode: z.string().length(6).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export const activations = pgTable("activations", {
  id: varchar("id", { length: 100 }).primaryKey(),
  payerWallet: varchar("payer_wallet", { length: 42 }).notNull(),
  sponsorWallet: varchar("sponsor_wallet", { length: 42 }),
  binaryMatchId: varchar("binary_match_id", { length: 100 }),
  matrixUpline1: varchar("matrix_upline_1", { length: 42 }),
  matrixUpline2: varchar("matrix_upline_2", { length: 42 }),
  matrixUpline3: varchar("matrix_upline_3", { length: 42 }),
  matrixUpline4: varchar("matrix_upline_4", { length: 42 }),
  matrixUpline5: varchar("matrix_upline_5", { length: 42 }),
  status: activationStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertActivationSchema = createInsertSchema(activations).omit({
  createdAt: true,
});

export type InsertActivation = z.infer<typeof insertActivationSchema>;
export type Activation = typeof activations.$inferSelect;

export const activationPayments = pgTable("activation_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activationId: varchar("activation_id", { length: 100 }).notNull(),
  paymentType: paymentTypeEnum("payment_type").notNull(),
  receiverWallet: varchar("receiver_wallet", { length: 42 }).notNull(),
  receiverType: receiverTypeEnum("receiver_type").notNull(),
  amountInr: decimal("amount_inr", { precision: 10, scale: 2 }).notNull(),
  paymentMode: paymentModeEnum("payment_mode"),
  offlineUtrId: text("offline_utr_id"),
  offlineProofUrl: text("offline_proof_url"),
  confirmed: boolean("confirmed").notNull().default(false),
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: varchar("confirmed_by", { length: 42 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivationPaymentSchema = createInsertSchema(activationPayments).omit({
  id: true,
  createdAt: true,
});

export type InsertActivationPayment = z.infer<typeof insertActivationPaymentSchema>;
export type ActivationPayment = typeof activationPayments.$inferSelect;

// Schema for updating activation status
export const updateActivationStatusSchema = z.object({
  status: z.enum(['pending', 'partial', 'completed', 'failed']),
});

export type UpdateActivationStatus = z.infer<typeof updateActivationStatusSchema>;
