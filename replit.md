# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform designed for network marketing, featuring binary pairing income, multi-level matrix rewards, and a manual payment tracking system with administrator approval. It enables users to activate accounts, build referral networks, monitor earnings, and manage profiles. Administrators can control system configurations, approve payments, and access analytics for efficient operation and financial transparency.

## User Preferences
Preferred communication style: Simple, everyday language.

## Production Deployment
📋 **See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for complete deployment instructions**

**Required Deployment Secrets**:
- `SESSION_SECRET` - Session encryption key (already configured)
- `ADMIN_DEFAULT_PASSWORD` - Default admin password (12+ chars, mixed case, symbols) ⚠️ REQUIRED
- `DATABASE_URL` - Production PostgreSQL connection (already configured via Replit PostgreSQL)

**Server validates all required secrets at startup** and will fail fast with clear error messages if any are missing.

## Recent Changes

### November 14, 2025 - Production Deployment & Payment Confirmation Fixes

**Fix: Payment Confirmation Authorization (CRITICAL)**
- **Issue**: All payments except sponsoring payments were going to admin for confirmation instead of the receiver account
- **Impact**: Binary match, matrix payments, and creator fee payments were all being confirmed by admin panel instead of by the actual receiver
- **Root Cause**: When payments fallback to PB0 (admin), `receiverType` was set to `'admin'`, allowing any admin to confirm
- **Fix**: Changed payment confirmation system so **ALL payments are confirmed by receiver account only**:
  1. **All payment types** now use `receiverType = 'user'` (no more admin type)
  2. Sponsor payment fallback to PB0: Changed to `receiverType = 'user'`
  3. Binary match fallback to PB0: Changed to `receiverType = 'user'`
  4. Matrix payment fallback to PB0: Changed to `receiverType = 'user'`
  5. Creator fee to PB0: Changed to `receiverType = 'user'`
  6. Payment confirmation route: Simplified to only allow receiver to confirm (no admin override)
- **Technical Details**:
  - Modified `createActivationWithPayments`: ALL payments set `receiverType = 'user'` regardless of receiver
  - Modified `checkAndCompleteActivation`: Matrix placement always sets `receiverType = 'user'`
  - Modified `getAdminPendingConfirmations`: Simplified to only show payments where admin is the receiver
  - Modified confirmation/rejection routes: Removed admin override logic, only receiver can confirm/reject
  - Updated queue management: Only real users (not PB0) have queue entries to mark as paid
- **Impact - ALL payments confirmed by receiver only**: 
  - ✅ **Sponsor payment to user**: Sponsor user confirms
  - ✅ **Sponsor payment to PB0**: PB0 confirms (not any admin)
  - ✅ **Binary payment to user**: User confirms
  - ✅ **Binary payment to PB0**: PB0 confirms (not any admin)
  - ✅ **Matrix payment to upline**: Upline confirms
  - ✅ **Matrix payment to PB0**: PB0 confirms (not any admin)
  - ✅ **Creator fee to PB0**: PB0 confirms (not any admin)

**Enhancement: Production Deployment Validation (CRITICAL)**
- **Issue**: Deployment failed with missing `ADMIN_DEFAULT_PASSWORD` secret and connection error to 'helium' hostname
- **Impact**: Server crash loop in production due to missing required secrets and local database usage
- **Fix**: Added comprehensive startup validation in `server/index.ts`:
  1. Early validation for `ADMIN_DEFAULT_PASSWORD` - fails fast with clear error message if missing in production
  2. Database validation - prevents production from using local helium database
  3. Environment detection - uses `NODE_ENV` and `REPL_DEPLOYMENT` to determine environment
  4. Clear error messages with step-by-step resolution instructions
- **Technical Details**:
  - Validation runs before database initialization to fail fast
  - Production requires: `SESSION_SECRET`, `ADMIN_DEFAULT_PASSWORD`, valid `DATABASE_URL`
  - Development mode (NODE_ENV=development) allows fallback passwords for testing
  - Server checks DATABASE_URL doesn't contain 'helium' in production
  - All validation errors include actionable fixes in error messages
- **Documentation**:
  - Created `DEPLOYMENT_SETUP.md` with complete deployment instructions
  - Added deployment section to `replit.md` with quick reference
  - Includes security best practices and troubleshooting guide
- **Status**: ✅ Ready for production deployment after setting `ADMIN_DEFAULT_PASSWORD` secret

**Enhancement: Rate Limit Adjustments**
- Increased login rate limit from 10 to 100 attempts per 15 minutes
- Increased all other endpoint limits to 20 requests per time window
- Prevents 429 errors during normal usage and testing

### November 13, 2025 - Critical Bug Fixes

**Bug Fix #1: Matrix Payment Routing (CRITICAL) - Deferred Income Creation**
- **Issue**: Matrix upline payments (slots 3-7) were creating income for PB0 instead of actual parent nodes in the matrix tree
- **Root Cause**: Income was created at payment confirmation time when receiver_user_id was still PB0 (placeholder). Matrix placement only happened AFTER all payments were confirmed, so income went to the wrong receiver.
- **Impact**: All matrix level payments created income for admin (PB0) instead of actual uplines (e.g., PB10002, PB10000)
- **Fix**: Implemented deferred income creation for matrix payments:
  1. Modified `confirmActivationPayment`: Skip income creation for matrix_level_* payments
  2. Modified `checkAndCompleteActivation`: After matrix placement and receiver assignment, create income for matrix payments with correct receivers
  3. Income now created for actual uplines (or PB0 admin fallback when no upline exists)
- **Technical Details**:
  - Matrix payment confirmation sets status='confirmed' but defers income creation
  - After all 8 payments confirmed, matrix placement discovers actual uplines
  - Receivers updated from PB0 placeholder to actual uplines (PB10002, PB10000, etc.)
  - Deferred income created within same transaction with correct receivers
  - Maintains idempotency and reconciliation for all payment types including admin fallback
- **Architect Reviewed**: ✅ PASS - No edge cases, data integrity maintained, safe for production

**Bug Fix #2: Income Verification Timing (CRITICAL) - Two-Phase Verification**
- **Issue**: Income verification was checking for all 8 income records BEFORE deferred matrix income was created, causing false failures
- **Root Cause**: Verification ran before matrix placement and deferred income creation, finding only 3 records (direct_sponsor, binary_match, creator_fee) instead of expected 8
- **Impact**: All activations failed with "Income verification failed: Expected 8, found 3" error
- **Fix**: Implemented two-phase income verification:
  1. Early verification (before matrix placement): Verify only 3 non-matrix income records exist
  2. Final verification (after deferred income): Verify all 8 income records exist
  3. Uses explicit IN-list for payment types to avoid SQL wildcard collisions
- **Technical Details**:
  - Early verification: `paymentType IN ('direct_sponsor', 'binary_match', 'creator_fee')` expects 3 records
  - Final verification: After matrix income creation, expects all 8 records
  - SQL query uses explicit payment type constants instead of LIKE patterns
  - Prevents wildcard collisions (underscore is SQL single-char wildcard)
- **Architect Reviewed**: ✅ PASS - Corrected SQL filter, two-phase verification sound, safe for production

**Bug Fix #3: SQL LIKE Operator Type Error (CRITICAL) - Matrix Payment Query**
- **Issue**: Deferred income creation failed with PostgreSQL error: "operator does not exist: payment_type ~~ unknown"
- **Root Cause**: Raw SQL `LIKE 'matrix_level_%'` query caused PostgreSQL to not recognize the column type during matrix payment fetching
- **Impact**: All activations failed when trying to create deferred income for matrix payments after successful matrix placement
- **Fix**: Replaced SQL LIKE with Drizzle ORM `inArray()` and shared constants:
  1. Created `MATRIX_PAYMENT_TYPES` constant in `shared/constants.ts` listing all 5 matrix payment types
  2. Imported `inArray` from drizzle-orm
  3. Replaced `sql\`LIKE 'matrix_level_%'\`` with `inArray(activationPayments.paymentType, [...MATRIX_PAYMENT_TYPES])`
  4. Added inline documentation referencing shared constant
- **Technical Details**:
  - New constant: `export const MATRIX_PAYMENT_TYPES = ['matrix_level_1', 'matrix_level_2', 'matrix_level_3', 'matrix_level_4', 'matrix_level_5'] as const`
  - Query now uses type-safe Drizzle ORM functions instead of raw SQL
  - Spread operator `[...]` converts readonly tuple to mutable array for inArray compatibility
  - More maintainable: Adding new matrix levels only requires updating the constant in one place
- **Architect Reviewed**: ✅ PASS - Scalable solution, centralized constant prevents future drift, efficient query pattern

**Feature: Direct Sponsoring Page**
- Added comprehensive Direct Sponsoring page showing all direct referrals with statistics dashboard
- Displays total referrals, activation rate, binary leg distribution, and detailed referral list
- Backend API endpoint: `/api/users/:userId/direct-referrals`
- Route: `/user/direct-sponsoring` with sidebar navigation

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack React Query for server state.
- **UI**: shadcn/ui (Radix UI + Tailwind CSS) following Material Design principles, with custom themes and an 8px grid spacing.
- **Authentication**: Email/password login with session management.
- **Design System**: Tailwind CSS, Inter and JetBrains Mono fonts.

### Backend
- **Server Framework**: Express.js with TypeScript (Node.js).
- **API Structure**: RESTful API (`/api` prefix).
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple).

### Data Storage
- **Database**: PostgreSQL (Neon serverless).
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema**: Users, activations, activation payments, and system configuration.
- **Migrations**: Drizzle Kit.
- **Validation**: Zod schemas for payment operations.
- **Transaction Guarantees**: Atomic creation of activations and payments with row-level locking for idempotency and concurrency control.

#### Database Environment Configuration (Dev/Prod Separation)

The application supports **separate development and production databases** for data isolation and safety:

**Environment Detection** (`server/db-config.ts`):
- **Production Mode**: Detected when `REPL_DEPLOYMENT=1` (Replit deployment)
- **Development Mode**: Default when running in workspace

**Database URL Selection**:
- **Production**: Always uses `DATABASE_URL` (Replit-managed Neon database)
- **Development**: 
  - Prefers `DEV_DATABASE_URL` if set (recommended for dev data isolation)
  - Falls back to `DATABASE_URL` if `DEV_DATABASE_URL` not set (⚠️ uses production data)

**Setup Instructions**:

1. **Production Database** (Already Configured ✅):
   - Replit PostgreSQL/Neon database automatically provisioned
   - `DATABASE_URL` → `postgresql://neondb_owner:...@ep-round-hall-afz77jrn.c-2.us-west-2.aws.neon.tech/neondb`
   - Schema migrated with `npm run db:push`

2. **Development Database** (Choose One):
   
   **Option A: Local Database (Recommended)**
   - Add to Replit Secrets: `DEV_DATABASE_URL=postgresql://postgres:password@helium/heliumdb?sslmode=disable`
   - Keeps dev data local and separate from production
   - Fast local access during development
   
   **Option B: Separate Neon Database**
   - Create free Neon account at https://neon.tech
   - Add to Replit Secrets: `DEV_DATABASE_URL=postgresql://user:pass@your-dev-instance.neon.tech/devdb`
   - Cloud-based dev database with same infrastructure as production

**How It Works**:
```typescript
// server/db-config.ts
const isProduction = process.env.REPL_DEPLOYMENT === '1';

getDatabaseUrl(): string {
  if (isProduction) {
    return process.env.DATABASE_URL; // Production DB
  } else {
    return process.env.DEV_DATABASE_URL || process.env.DATABASE_URL; // Dev DB or fallback
  }
}
```

**Benefits**:
- ✅ Safe testing without affecting production data
- ✅ Separate data for development and production
- ✅ Automatic environment switching on deployment
- ✅ No code changes needed between environments

### Object Storage
- **Provider**: Replit Object Storage (Google Cloud Storage-backed).
- **Service**: `ObjectStorageService` for presigned URLs, file serving, ACL management.
- **Uploader**: `ObjectUploader` (React component with Uppy) for file uploads (images, PDFs, max 10MB).
- **Use Cases**: Payment proof uploads, user documents, profile images.

### Authentication & Authorization
- **Authentication**: Email/password authentication with bcrypt hashing.
- **Session Management**: Express sessions with PostgreSQL store.
- **Role Detection**: Admin/user roles stored in database.
- **User IDs**: Auto-generated sequential IDs (PB10000+).
- **Admin Hierarchy**: PB0 (Root Administrator) and PB1 (Secondary Administrator) with database management access. Admin credentials are environment-driven secrets.
- **Binary Leg Auto-Assignment**: Automatically assigns to the leg with fewer members for balanced tree growth if not specified during signup.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 payments: Direct Sponsor (Slot 0), Binary Match (Slot 1), Creator Fee (Slot 2), Matrix Levels 1-5 (Slots 3-7).
- **Dynamic Configuration**: Payment amounts, binary matching rules, and matching ratio are admin-configurable via a centralized system configuration.
- **Admin Fallback**: Payments automatically route to admin (PB0/PB1) if an eligible receiver is unavailable.
- **Payment Mode**: Manual INR payments via UPI with UTR/Transaction ID and optional proof upload.
- **Payment Flow**: User submits UTR/proof, receiver confirms/rejects (with reason), user can resubmit.
- **Payment Status Tracking**: Pending, Submitted, Confirmed, Rejected.
- **Profile Completion Enforcement**: Users must complete profile details before requesting activation.

### Key Application Pages
- **User Pages**: Dashboard, Activation, Confirmation, Binary Tree, Global Matrix, Profile, Re-entry, Unified Income Details, Binary Match Queue History, Binary Pair Matching History, Matrix Income History.
- **Admin Pages**: Admin Dashboard, Payment Confirmations, Payments Report, System Configuration, User Management, Database Backup/Restore.

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL provider.
- **@neondatabase/serverless**: Connection pooling adapter.

### UI Component Libraries
- **Radix UI**: Accessible, unstyled component primitives.
- **shadcn/ui**: Pre-built components combining Radix UI and Tailwind CSS.
- **Lucide React**: SVG icon library.

### Development Tools
- **Vite**: Build tool and dev server.

### Form & Validation
- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.
- **@hookform/resolvers**: Integration with React Hook Form.

### Data Fetching & Caching
- **TanStack React Query**: Async state management, caching.

### Styling
- **Tailwind CSS**: Utility-first CSS framework.
- **PostCSS**: CSS processor.

### Third-Party Integrations
- **Google Fonts**: Inter, JetBrains Mono.
- **Date-fns**: Date manipulation and formatting.

## Future Enhancements

### Activation State Machine Refactor (Priority: HIGH, Estimated: 5-9 hours)

**Current Limitation:**  
The activation system creates income immediately upon payment confirmation. If activation later fails (e.g., matrix placement error), payments are confirmed and income is created, but the activation is marked as 'failed'. This creates a temporary inconsistency requiring manual investigation.

**Proposed Solution:**  
Implement a proper state machine for activation lifecycle with atomic income creation:

**New Activation States:**
- `awaiting_payments` → Initial state, waiting for all 8 payments
- `payments_verified` → All 8 payments receiver-confirmed, ready to activate  
- `activation_in_progress` → Currently processing (matrix placement, income creation)
- `active` → Successfully activated (all income created atomically)
- `failed` → Activation failed (no income created, payments stay 'verified' for retry)

**New Payment States:**
- `pending_submission` → User hasn't submitted proof yet
- `awaiting_verification` → Submitted, waiting for receiver confirmation
- `verified` → Receiver confirmed, waiting for activation to complete
- `applied_to_activation` → Income successfully created during activation
- `blocked` → Blocked due to activation failure (retriable)
- `rejected` → Receiver rejected the payment

**Key Changes Required:**
1. **Schema Migration:** Safe two-stage PostgreSQL enum migration (create v2 enums, backfill, swap columns, drop old enums)
2. **Payment Confirmation:** Change to mark payments as 'verified' instead of immediately creating income
3. **Activation Processing:** Create ALL 8 income records atomically in single transaction during activation
4. **Retry Mechanism:** Add admin interface to retry failed activations (reprocess matrix placement + income creation)
5. **Failure Tracking:** Add `failure_reason`, `retry_count`, `last_transition_at` fields for audit trail

**Benefits:**
- Atomic income creation (all-or-nothing)
- Clean rollback on failure (no orphaned income)
- Clear audit trail of activation lifecycle
- Admin retry capability for failed activations
- Prevents "confirmed but unpaid" states

**Migration Strategy:**
1. Create migration SQL script with new enum types
2. Backfill existing data with deterministic mappings (pending→awaiting_payments, completed→active, etc.)
3. Update Zod schemas and validation
4. Refactor confirmActivationPayment to use 'verified' status
5. Refactor checkAndCompleteActivation to create income atomically
6. Add admin retry interface
7. Comprehensive testing

**Defensive Mitigations (Current):**
- ✅ Income verification check added (Bug #2 fix) - validates income exists before completing activation
- ✅ Activation marked as 'failed' if income missing for manual investigation
- ✅ SELECT FOR UPDATE locking prevents race conditions
- ✅ 8-payment enforcement validates all slots exist

**Decision Rationale:**
Deferred to future sprint in favor of pragmatic targeted fixes (Bugs #2-#5). Current defensive checks provide adequate protection for production deployment while comprehensive state machine refactor requires dedicated 5-9 hour implementation window.