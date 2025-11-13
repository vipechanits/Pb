# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform designed for network marketing, featuring binary pairing income, multi-level matrix rewards, and a manual payment tracking system with administrator approval. It enables users to activate accounts, build referral networks, monitor earnings, and manage profiles. Administrators can control system configurations, approve payments, and access analytics for efficient operation and financial transparency.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### November 13, 2025 - Critical Bug Fixes

**Bug Fix: Matrix Payment Routing (CRITICAL) - Deferred Income Creation**
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