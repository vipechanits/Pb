import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, pgEnum, integer, jsonb, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paymentTypeEnum = pgEnum("payment_type", [
  "direct_sponsor",
  "binary_match",
  "top_reward",
  "matrix_level_1",
  "matrix_level_2",
  "matrix_level_3",
  "matrix_level_4",
  "matrix_level_5",
]);

export const receiverTypeEnum = pgEnum("receiver_type", ["user", "admin"]);

export const paymentModeEnum = pgEnum("payment_mode", ["offline"]);

export const activationStatusEnum = pgEnum("activation_status", ["pending", "partial", "completed", "failed"]);

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "awaiting_assignment", "submitted", "confirmed", "rejected"]);

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
  "system_fee", // For top reward and other admin system payments
]);

export const incomeStatusEnum = pgEnum("income_status", ["pending", "confirmed", "failed", "reversed"]);

export const triggeredByEnum = pgEnum("triggered_by", ["activation", "reentry", "adjustment"]);

export const reentryStatusEnum = pgEnum("reentry_status", ["pending", "in_progress", "completed", "failed"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "payment_received",      // You received a payment
  "payment_confirmed",     // Payment you made was confirmed
  "payment_rejected",      // Payment you made was rejected
  "income_earned",         // You earned income from downline
  "activation_complete",   // Your activation is complete
  "reentry_eligible",      // You're eligible for re-entry
  "new_referral",          // Someone joined under you
  "binary_match",          // Binary match income generated
  "profile_incomplete",    // Reminder to complete profile
]);

export const notificationEntityTypeEnum = pgEnum("notification_entity_type", [
  "payment",
  "activation",
  "income",
  "user",
  "reentry",
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('user'),
  
  // Email verification
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  
  // Password reset
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  
  // User ID (PB1, PB2, etc.) - generated at registration
  userId: varchar("user_id", { length: 20 }).notNull().unique(),
  
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
  
  // Two-Factor Authentication (2FA)
  twoFactorSecret: text("two_factor_secret"), // TOTP secret for authenticator app
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorBackupCodes: jsonb("two_factor_backup_codes"), // Array of backup recovery codes
  
  // Referral/Sponsorship (for income calculations)
  sponsorId: varchar("sponsor_id", { length: 20 }), // PB ID of sponsor (who referred you)
  binaryLeg: binaryLegEnum("binary_leg"), // DEPRECATED: Use sponsorRequestedLeg (kept for migration)
  sponsorRequestedLeg: binaryLegEnum("sponsor_requested_leg"), // Original requested leg from sponsor
  
  // Binary Tree Placement (separate from sponsorship for true binary tree structure)
  binaryParentId: varchar("binary_parent_id", { length: 20 }), // Actual parent in binary tree (may differ from sponsor)
  binaryPlacementLeg: binaryLegEnum("binary_placement_leg"), // Actual leg you occupy in binary tree (left/right)
  // Note: (binaryParentId, binaryPlacementLeg) has unique constraint - only ONE user per position
  
  // Network statistics (updated when downline members activate)
  leftLegCount: integer("left_leg_count").notNull().default(0), // Global left leg count (all downline)
  rightLegCount: integer("right_leg_count").notNull().default(0), // Global right leg count (all downline)
  personalLeftCount: integer("personal_left_count").notNull().default(0), // Personal left leg count (directly sponsored)
  personalRightCount: integer("personal_right_count").notNull().default(0), // Personal right leg count (directly sponsored)
  totalReferrals: integer("total_referrals").notNull().default(0),
  
  // Binary match tracking (queue-based 3:3 matching system)
  binaryQualified: boolean("binary_qualified").notNull().default(false), // True when user has 1 personal left + 1 personal right
  binaryUnmatchedLeft: integer("binary_unmatched_left").notNull().default(0), // Unmatched left leg activations (carry forward)
  binaryUnmatchedRight: integer("binary_unmatched_right").notNull().default(0), // Unmatched right leg activations (carry forward)
  binaryMatchedPairs: integer("binary_matched_pairs").notNull().default(0), // Total 3:3 pairs matched (lifetime)
  binaryLastMatchedLeftCount: integer("binary_last_matched_left_count").notNull().default(0), // Last leftLegCount when matching was calculated
  binaryLastMatchedRightCount: integer("binary_last_matched_right_count").notNull().default(0), // Last rightLegCount when matching was calculated
  
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
}, (t) => ({
  // Index on binaryParentId for fast subtree queries
  binaryParentIdx: index("binary_parent_idx").on(t.binaryParentId),
  // NOTE: Unique constraint on (binaryParentId, binaryPlacementLeg) will be added after data migration
}));

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
  name: z.string().min(1, "Name is required"),
  mobile: z.string().length(10, "Mobile number must be exactly 10 digits").regex(/^[0-9]{10}$/, "Mobile number must contain only digits"),
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
}).refine(
  (data) => {
    // At least one payment method required: UPI or complete bank account details
    const hasUPI = data.upiId && data.upiId.trim().length > 0;
    const hasBankAccount = 
      data.bankAccountHolder && data.bankAccountHolder.trim().length > 0 &&
      data.bankAccountNumber && data.bankAccountNumber.trim().length > 0 &&
      data.ifscCode && data.ifscCode.trim().length > 0;
    return hasUPI || hasBankAccount;
  },
  {
    message: "At least one payment method is required: either UPI ID or complete bank account details (holder name, account number, and IFSC code)",
    path: ["upiId"], // Error shows on UPI field
  }
);

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
  payerUserId: varchar("payer_user_id", { length: 50 }).notNull(), // User database ID (UUID) or PB#### after activation
  receiverUserId: varchar("receiver_user_id", { length: 50 }), // User PB#### ID of receiver (null if admin)
  paymentType: paymentTypeEnum("payment_type").notNull(),
  receiverType: receiverTypeEnum("receiver_type").notNull(),
  amountInr: decimal("amount_inr", { precision: 10, scale: 2 }).notNull(),
  paymentMode: paymentModeEnum("payment_mode"),
  offlineUtrId: text("offline_utr_id"), // NOTE: Uniqueness enforced by backend validation (storage.submitPaymentProof)
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
  topRewardAmount: decimal("top_reward_amount", { precision: 10, scale: 2 }).notNull().default('500'),
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
  
  // Security features
  recaptchaSiteKey: text("recaptcha_site_key"), // Google reCAPTCHA v2 site key
  recaptchaSecretKey: text("recaptcha_secret_key"), // Google reCAPTCHA v2 secret key
  recaptchaEnabled: boolean("recaptcha_enabled").notNull().default(false),
  twoFactorRequired: boolean("two_factor_required").notNull().default(false), // Require all users to enable 2FA
  
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
}, (table) => ({
  // Unique constraint to prevent duplicate income entries for same payment + type
  uniquePaymentIncome: unique().on(table.activationPaymentId, table.incomeType),
}));

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

// Notification metadata discriminated union types
export type PaymentReceivedMetadata = {
  type: 'payment_received';
  amount: string;
  slotType: string;
  payerUserId: string;
  payerName: string;
  activationId: string;
};

export type PaymentConfirmedMetadata = {
  type: 'payment_confirmed';
  amount: string;
  slotType: string;
  receiverUserId: string;
  receiverName: string;
  activationId: string;
};

export type PaymentRejectedMetadata = {
  type: 'payment_rejected';
  amount: string;
  slotType: string;
  receiverUserId: string;
  receiverName: string;
  reason: string;
  activationId: string;
};

export type IncomeEarnedMetadata = {
  type: 'income_earned';
  amount: string;
  incomeType: string;
  sourceUserId: string;
  sourceName: string;
  level?: number;
};

export type ActivationCompleteMetadata = {
  type: 'activation_complete';
  activationId: string;
  totalAmount: string;
  completedAt: string;
};

export type ReentryEligibleMetadata = {
  type: 'reentry_eligible';
  cycleNumber: number;
  matrixLevel: number;
  totalEarnings: string;
};

export type NewReferralMetadata = {
  type: 'new_referral';
  referralUserId: string;
  referralName: string;
  referralEmail: string;
  binaryLeg: 'left' | 'right';
};

export type BinaryMatchMetadata = {
  type: 'binary_match';
  amount: string;
  leftCount: number;
  rightCount: number;
  pairsMatched: number;
};

export type ProfileIncompleteMetadata = {
  type: 'profile_incomplete';
  missingFields: string[];
};

export type NotificationMetadata =
  | PaymentReceivedMetadata
  | PaymentConfirmedMetadata
  | PaymentRejectedMetadata
  | IncomeEarnedMetadata
  | ActivationCompleteMetadata
  | ReentryEligibleMetadata
  | NewReferralMetadata
  | BinaryMatchMetadata
  | ProfileIncompleteMetadata;

// Zod validation schema for notification metadata (discriminated union)
const notificationMetadataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('payment_received'), amount: z.string(), slotType: z.string(), payerUserId: z.string(), payerName: z.string(), activationId: z.string() }),
  z.object({ type: z.literal('payment_confirmed'), amount: z.string(), slotType: z.string(), receiverUserId: z.string(), receiverName: z.string(), activationId: z.string() }),
  z.object({ type: z.literal('payment_rejected'), amount: z.string(), slotType: z.string(), receiverUserId: z.string(), receiverName: z.string(), reason: z.string(), activationId: z.string() }),
  z.object({ type: z.literal('income_earned'), amount: z.string(), incomeType: z.string(), sourceUserId: z.string(), sourceName: z.string(), level: z.number().optional() }),
  z.object({ type: z.literal('activation_complete'), activationId: z.string(), totalAmount: z.string(), completedAt: z.string() }),
  z.object({ type: z.literal('reentry_eligible'), cycleNumber: z.number(), matrixLevel: z.number(), totalEarnings: z.string() }),
  z.object({ type: z.literal('new_referral'), referralUserId: z.string(), referralName: z.string(), referralEmail: z.string(), binaryLeg: z.enum(['left', 'right']) }),
  z.object({ type: z.literal('binary_match'), amount: z.string(), leftCount: z.number(), rightCount: z.number(), pairsMatched: z.number() }),
  z.object({ type: z.literal('profile_incomplete'), missingFields: z.array(z.string()) }),
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 20 }).notNull(), // Recipient of notification
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(), // Short summary (e.g., "Payment Received")
  message: text("message").notNull(), // Detailed message
  
  // Related entity tracking (optional - for linking to payments, activations, etc.)
  relatedEntityType: notificationEntityTypeEnum("related_entity_type"), // Nullable by default
  relatedEntityId: varchar("related_entity_id", { length: 100 }), // Nullable by default
  
  // Metadata for additional context (structured JSON object with discriminant type)
  metadata: jsonb("metadata").$type<NotificationMetadata>().notNull(),
  
  // Read status
  isRead: boolean("is_read").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    metadata: notificationMetadataSchema,
  });

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 100 }).notNull().unique(), // Secure random token
  userId: varchar("user_id", { length: 20 }).notNull(), // User requesting reset
  email: text("email").notNull(), // Email associated with reset
  expiresAt: timestamp("expires_at").notNull(), // Token expiry (typically 1 hour)
  usedAt: timestamp("used_at"), // When token was used (null if not used yet)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Database backups table for backup/restore functionality
export const backupTypeEnum = pgEnum("backup_type", ["manual", "automatic"]);

export const databaseBackups = pgTable("database_backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(), // Backup filename
  fileSize: integer("file_size").notNull(), // Size in bytes
  createdBy: varchar("created_by", { length: 20 }).notNull(), // Admin userId who created backup
  backupType: backupTypeEnum("backup_type").notNull().default("manual"),
  notes: text("notes"), // Optional notes about the backup
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDatabaseBackupSchema = createInsertSchema(databaseBackups).omit({
  id: true,
  createdAt: true,
});

export type InsertDatabaseBackup = z.infer<typeof insertDatabaseBackupSchema>;
export type DatabaseBackup = typeof databaseBackups.$inferSelect;

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

// Binary tree node for visualization with sponsor and spillover info
export interface SponsorInfo {
  userId: string;
  name: string | null;
  email: string;
  isActivated: boolean;
}

export interface BinaryTreeNode {
  userId: string;
  name: string | null;
  email: string;
  isActivated: boolean;
  leftLegCount: number;
  rightLegCount: number;
  personalLeftCount: number;
  personalRightCount: number;
  totalReferrals: number;
  binaryMatchedPairs: number;
  
  // Sponsor and placement info
  sponsorId: string | null;
  directSponsor: SponsorInfo | null; // Only populated for root node
  placementType: 'direct' | 'spillover'; // Direct referral vs spillover from upline
  binaryLeg: 'left' | 'right' | null; // Which leg this user is on under their binary parent
  
  // Lazy loading support
  hasLeftChild: boolean;
  hasRightChild: boolean;
  leftChild?: BinaryTreeNode | null; // Optional for lazy loading
  rightChild?: BinaryTreeNode | null; // Optional for lazy loading
}

// Password reset request schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const manualActivationCompletionSchema = z.object({
  activationId: z.string().min(1, "Activation ID is required"),
  userId: z.string().min(1, "User ID is required").regex(/^PB\d+$/, "User ID must be in format PB####"),
});

// Update email schema (requires security code for verification)
export const updateEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  securityCode: z.string()
    .length(6, "Security code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Security code must contain only digits"),
});

// Update password schema (requires security code instead of old password)
export const updatePasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  securityCode: z.string()
    .length(6, "Security code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Security code must contain only digits"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type UpdateEmailRequest = z.infer<typeof updateEmailSchema>;
export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;
export type ManualActivationCompletionRequest = z.infer<typeof manualActivationCompletionSchema>;

// Binary Match Queue - FIFO queue for 3:3 matched pairs
// When user builds 3:3 pair → enters queue
// Each new activation pays FIRST person in queue (₹1000)
// Person receives payment → exits queue → can re-enter with new 3:3 pair
export const binaryMatchQueue = pgTable("binary_match_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 20 }).notNull(), // User in queue
  queuePosition: integer("queue_position").notNull(), // Position in queue (1 = first)
  enteredAt: timestamp("entered_at").notNull().defaultNow(), // When user entered queue
  paidAt: timestamp("paid_at"), // When user received payment (null = still waiting)
  paidByActivationId: varchar("paid_by_activation_id", { length: 100 }), // Activation that paid this user
  amountInr: decimal("amount_inr", { precision: 10, scale: 2 }).notNull().default('1000'), // Always ₹1000 per pair
  status: text("status").notNull().default('waiting'), // 'waiting' | 'paid'
});

export const insertBinaryMatchQueueSchema = createInsertSchema(binaryMatchQueue).omit({
  id: true,
  enteredAt: true,
});

export type InsertBinaryMatchQueue = z.infer<typeof insertBinaryMatchQueueSchema>;
export type BinaryMatchQueue = typeof binaryMatchQueue.$inferSelect;

// Two-Factor Authentication (2FA) schemas
export const setup2FASchema = z.object({
  token: z.string().length(6, "Token must be 6 digits").regex(/^\d{6}$/, "Token must contain only digits"),
});

export const verify2FASchema = z.object({
  token: z.string().length(6, "Token must be 6 digits").regex(/^\d{6}$/, "Token must contain only digits"),
});

export const disable2FASchema = z.object({
  token: z.string().length(6, "Token must be 6 digits").regex(/^\d{6}$/, "Token must contain only digits"),
});

export const verifyRecaptchaSchema = z.object({
  recaptchaToken: z.string().min(1, "reCAPTCHA verification is required"),
});

export type Setup2FA = z.infer<typeof setup2FASchema>;
export type Verify2FA = z.infer<typeof verify2FASchema>;
export type Disable2FA = z.infer<typeof disable2FASchema>;
export type VerifyRecaptcha = z.infer<typeof verifyRecaptchaSchema>;
