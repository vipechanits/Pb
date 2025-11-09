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

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// Main users table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Will be hashed
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").notNull().default('user'),
  userId: varchar("user_id", { length: 20 }).unique(), // PB12345 format
  sponsorId: varchar("sponsor_id", { length: 100 }), // Reference to sponsor's user.id
  binaryPosition: varchar("binary_position", { length: 10 }), // 'left' or 'right' under sponsor
  binaryParentId: varchar("binary_parent_id", { length: 100 }), // For binary tree FIFO
  activated: boolean("activated").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  activated: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Activations table tracking user activation process
export const activations = pgTable("activations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull(), // Reference to users.id
  sponsorId: varchar("sponsor_id", { length: 100 }), // Reference to sponsor's users.id
  binaryMatchId: varchar("binary_match_id", { length: 100 }), // Matched binary user's users.id
  matrixUpline1: varchar("matrix_upline_1", { length: 100 }), // Matrix level 1 user.id
  matrixUpline2: varchar("matrix_upline_2", { length: 100 }),
  matrixUpline3: varchar("matrix_upline_3", { length: 100 }),
  matrixUpline4: varchar("matrix_upline_4", { length: 100 }),
  matrixUpline5: varchar("matrix_upline_5", { length: 100 }),
  status: activationStatusEnum("status").notNull().default('pending'),
  activationFee: decimal("activation_fee", { precision: 10, scale: 2 }).notNull(), // In INR
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertActivationSchema = createInsertSchema(activations).omit({
  id: true,
  createdAt: true,
});

export type InsertActivation = z.infer<typeof insertActivationSchema>;
export type Activation = typeof activations.$inferSelect;

// Payment records for each of the 8 payments in activation
export const activationPayments = pgTable("activation_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activationId: varchar("activation_id", { length: 100 }).notNull(),
  paymentType: paymentTypeEnum("payment_type").notNull(),
  payerUserId: varchar("payer_user_id", { length: 100 }).notNull(), // Who is paying
  receiverUserId: varchar("receiver_user_id", { length: 100 }), // Who receives (null = admin)
  receiverType: receiverTypeEnum("receiver_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // In INR
  paymentMode: paymentModeEnum("payment_mode").default('offline'),
  utrId: text("utr_id"), // Transaction reference number
  proofUrl: text("proof_url"), // Payment proof uploaded to object storage
  notes: text("notes"),
  // User confirmation (receiver confirms they received payment)
  userConfirmed: boolean("user_confirmed").notNull().default(false),
  userConfirmedAt: timestamp("user_confirmed_at"),
  // Admin confirmation (admin approves payment to admin)
  adminConfirmed: boolean("admin_confirmed").notNull().default(false),
  adminConfirmedAt: timestamp("admin_confirmed_at"),
  adminConfirmedBy: varchar("admin_confirmed_by", { length: 100 }), // Admin user.id who confirmed
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
