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

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "submitted", "confirmed", "rejected"]);

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const binaryLegEnum = pgEnum("binary_leg", ["left", "right"]);

export const incomeTypeEnum = pgEnum("income_type", [
  "direct_sponsor",
  "binary_match",
  "matrix_level_1",
  "matrix_level_2",
  "matrix_level_3",
  "matrix_level_4",
  "matrix_level_5",
]);

export const incomeStatusEnum = pgEnum("income_status", ["pending", "confirmed", "failed", "reversed"]);

export const triggeredByEnum = pgEnum("triggered_by", ["activation", "reentry", "adjustment"]);

export const reentryStatusEnum = pgEnum("reentry_status", ["pending", "in_progress", "completed", "failed"]);

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
  paymentQrUrl: text("payment_qr_url"), // User's uploaded UPI QR code
  
  // Security
  securityCode: varchar("security_code", { length: 6 }),
  
  // Referral link
  sponsorId: varchar("sponsor_id", { length: 20 }), // PB ID of sponsor
  binaryLeg: binaryLegEnum("binary_leg"), // Which leg (left/right) user was placed on
  
  // Network statistics (updated when downline members activate)
  leftLegCount: integer("left_leg_count").notNull().default(0), // Global left leg count (all downline)
  rightLegCount: integer("right_leg_count").notNull().default(0), // Global right leg count (all downline)
  personalLeftCount: integer("personal_left_count").notNull().default(0), // Personal left leg count (directly sponsored)
  personalRightCount: integer("personal_right_count").notNull().default(0), // Personal right leg count (directly sponsored)
  totalReferrals: integer("total_referrals").notNull().default(0),
  
  // Global matrix position (separate from binary sponsorship tree)
  matrixParentId: varchar("matrix_parent_id", { length: 20 }), // Parent in global matrix (nullable - root has none)
  matrixPosition: integer("matrix_position"), // 0 = left, 1 = right (nullable until placed)
  matrixLevel: integer("matrix_level"), // Level in global matrix: 1-5 (nullable until placed)
  matrixPath: text("matrix_path").unique(), // Materialized path (e.g., "PB10001.L.R") for efficient querying
  
  // Profile completion status
  isProfileComplete: boolean("is_profile_complete").notNull().default(false),
  requiresPostActivationProfileUpdate: boolean("requires_post_activation_profile_update").notNull().default(false),
  
  // Account status
  isActivated: boolean("is_activated").notNull().default(false),
  activatedAt: timestamp("activated_at"),
  
  // Re-entry tracking
  reentryCount: integer("reentry_count").notNull().default(0), // Number of times user has re-entered
  currentCycleNumber: integer("current_cycle_number").notNull().default(1), // Current cycle (1 = first activation)
  isEligibleForReentry: boolean("is_eligible_for_reentry").notNull().default(false), // Matrix completed
  lastReentryAt: timestamp("last_reentry_at"),
  
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
  mobile: z.string().optional().refine((val) => !val || val.length === 10, {
    message: "Mobile number must be exactly 10 digits"
  }),
  upiId: z.string().optional(),
  bankAccountHolder: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional().refine((val) => !val || val.length === 11, {
    message: "IFSC code must be exactly 11 characters"
  }),
  paymentQrUrl: z.string().optional(),
  securityCode: z.string().optional().refine((val) => !val || val.length === 6, {
    message: "Security code must be exactly 6 digits"
  }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export const activations = pgTable("activations", {
  id: varchar("id", { length: 100 }).primaryKey(),
  payerWallet: varchar("payer_wallet", { length: 42 }).notNull().unique(), // Unique constraint prevents duplicate activations
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
  slotIndex: integer("slot_index").notNull(), // 0-7 for the 8 payment slots
  payerUserId: varchar("payer_user_id", { length: 20 }).notNull(), // User ID of sender
  receiverUserId: varchar("receiver_user_id", { length: 20 }), // User ID of receiver (null if admin)
  paymentType: paymentTypeEnum("payment_type").notNull(),
  receiverType: receiverTypeEnum("receiver_type").notNull(),
  amountInr: decimal("amount_inr", { precision: 10, scale: 2 }).notNull(),
  paymentMode: paymentModeEnum("payment_mode"),
  offlineUtrId: text("offline_utr_id"),
  offlineProofUrl: text("offline_proof_url"),
  status: paymentStatusEnum("payment_status").notNull().default('pending'),
  submissionCount: integer("submission_count").notNull().default(0),
  confirmedAt: timestamp("confirmed_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertActivationPaymentSchema = createInsertSchema(activationPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertActivationPayment = z.infer<typeof insertActivationPaymentSchema>;
export type ActivationPayment = typeof activationPayments.$inferSelect;

// Schema for updating activation status
export const updateActivationStatusSchema = z.object({
  status: z.enum(['pending', 'partial', 'completed', 'failed']),
});

export type UpdateActivationStatus = z.infer<typeof updateActivationStatusSchema>;

// Schema for submitting payment proof
export const submitPaymentProofSchema = z.object({
  offlineUtrId: z.string().min(1, "UTR/Transaction ID is required"),
  offlineProofUrl: z.string().optional(),
});

export type SubmitPaymentProof = z.infer<typeof submitPaymentProofSchema>;

// Schema for confirming payment
export const confirmPaymentSchema = z.object({
  notes: z.string().optional(),
});

export type ConfirmPayment = z.infer<typeof confirmPaymentSchema>;

// Schema for rejecting payment
export const rejectPaymentSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export type RejectPayment = z.infer<typeof rejectPaymentSchema>;

// System configuration table (singleton pattern)
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default('default-config-singleton'),
  
  // Payment amounts (in INR)
  sponsorPaymentAmount: decimal("sponsor_payment_amount", { precision: 10, scale: 2 }).notNull().default('1000'),
  binaryMatchPaymentAmount: decimal("binary_match_payment_amount", { precision: 10, scale: 2 }).notNull().default('1000'),
  creatorFeeAmount: decimal("creator_fee_amount", { precision: 10, scale: 2 }).notNull().default('500'),
  matrixLevel1Amount: decimal("matrix_level_1_amount", { precision: 10, scale: 2 }).notNull().default('500'),
  matrixLevel2Amount: decimal("matrix_level_2_amount", { precision: 10, scale: 2 }).notNull().default('500'),
  matrixLevel3Amount: decimal("matrix_level_3_amount", { precision: 10, scale: 2 }).notNull().default('500'),
  matrixLevel4Amount: decimal("matrix_level_4_amount", { precision: 10, scale: 2 }).notNull().default('500'),
  matrixLevel5Amount: decimal("matrix_level_5_amount", { precision: 10, scale: 2 }).notNull().default('500'),
  
  // Binary matching configuration
  binaryLeftQualification: integer("binary_left_qualification").notNull().default(1),
  binaryRightQualification: integer("binary_right_qualification").notNull().default(1),
  binaryMatchingRatioLeft: integer("binary_matching_ratio_left").notNull().default(3),
  binaryMatchingRatioRight: integer("binary_matching_ratio_right").notNull().default(3),
  
  // Admin payment methods (single values)
  adminUpiId: text("admin_upi_id"),
  adminBankAccount: text("admin_bank_account"),
  adminIfscCode: text("admin_ifsc_code"),
  adminMobile: text("admin_mobile"),
  adminQrCodeUrl: text("admin_qr_code_url"),
  
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const updateSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type UpdateSystemConfig = z.infer<typeof updateSystemConfigSchema>;

// Income transactions table
export const incomeTransactions = pgTable("income_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 20 }).notNull(), // User receiving income
  activationId: varchar("activation_id", { length: 100 }), // Optional: activation that triggered this income
  activationPaymentId: varchar("activation_payment_id"), // Link to source payment
  incomeType: incomeTypeEnum("income_type").notNull(),
  amountInr: decimal("amount_inr", { precision: 10, scale: 2 }).notNull(),
  status: incomeStatusEnum("income_status").notNull().default('pending'),
  sourceUserId: varchar("source_user_id", { length: 20 }), // User who paid (payer)
  triggeredBy: triggeredByEnum("triggered_by").notNull().default('activation'),
  notes: text("notes"),
  metadata: text("metadata"), // JSON string for additional context
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIncomeTransactionSchema = createInsertSchema(incomeTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIncomeTransaction = z.infer<typeof insertIncomeTransactionSchema>;
export type IncomeTransaction = typeof incomeTransactions.$inferSelect;

// User income summaries for fast dashboard queries (denormalized)
export const userIncomeSummaries = pgTable("user_income_summaries", {
  userId: varchar("user_id", { length: 20 }).primaryKey(),
  totalEarnings: decimal("total_earnings", { precision: 15, scale: 2 }).notNull().default('0'),
  directSponsorIncome: decimal("direct_sponsor_income", { precision: 15, scale: 2 }).notNull().default('0'),
  binaryMatchIncome: decimal("binary_match_income", { precision: 15, scale: 2 }).notNull().default('0'),
  matrixLevel1Income: decimal("matrix_level_1_income", { precision: 15, scale: 2 }).notNull().default('0'),
  matrixLevel2Income: decimal("matrix_level_2_income", { precision: 15, scale: 2 }).notNull().default('0'),
  matrixLevel3Income: decimal("matrix_level_3_income", { precision: 15, scale: 2 }).notNull().default('0'),
  matrixLevel4Income: decimal("matrix_level_4_income", { precision: 15, scale: 2 }).notNull().default('0'),
  matrixLevel5Income: decimal("matrix_level_5_income", { precision: 15, scale: 2 }).notNull().default('0'),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserIncomeSummary = typeof userIncomeSummaries.$inferSelect;

// Re-entry tracking table
export const reentries = pgTable("reentries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 20 }).notNull(), // User re-entering
  cycleNumber: integer("cycle_number").notNull(), // Which cycle is this (2, 3, 4, etc.)
  previousActivationId: varchar("previous_activation_id", { length: 100 }).notNull(), // Reference to completed activation
  newActivationId: varchar("new_activation_id", { length: 100 }), // New activation created for this re-entry
  
  // Matrix completion snapshot (capture state at cycle end for auditing)
  completedMatrixLevel: integer("completed_matrix_level"), // Level when completed (usually 5)
  completedMatrixPath: text("completed_matrix_path"), // Matrix path snapshot
  completedMatrixParentId: varchar("completed_matrix_parent_id", { length: 20 }), // Parent in matrix when completed
  
  // Earnings snapshot from completed cycle
  totalMatrixEarnings: decimal("total_matrix_earnings", { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Timestamps
  eligibilityDetectedAt: timestamp("eligibility_detected_at").notNull().defaultNow(), // When eligibility was first detected
  matrixCompletedAt: timestamp("matrix_completed_at"), // When matrix was actually completed (nullable)
  
  // Re-entry payment tracking
  status: reentryStatusEnum("reentry_status").notNull().default('pending'),
  reentryInitiatedAt: timestamp("reentry_initiated_at"), // When user clicked "re-enter" (nullable until initiated)
  reentryCompletedAt: timestamp("reentry_completed_at"), // When new activation completed
  
  // Preserve genealogy
  originalSponsorId: varchar("original_sponsor_id", { length: 20 }).notNull(), // Keep original sponsor
  originalBinaryLeg: binaryLegEnum("original_binary_leg").notNull(), // Keep original leg placement
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReentrySchema = createInsertSchema(reentries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReentry = z.infer<typeof insertReentrySchema>;
export type Reentry = typeof reentries.$inferSelect;

// Matrix tree node for visualization
export interface MatrixNode {
  userId: string;
  name: string | null;
  email: string;
  isActivated: boolean;
  matrixLevel: number;
  matrixPosition: number;
  matrixPath: string;
  leftChild: MatrixNode | null;
  rightChild: MatrixNode | null;
}
