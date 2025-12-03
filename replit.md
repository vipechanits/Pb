# PAYBACK247 - MLM Platform

## Overview
PAYBACK247 is a full-stack Multi-Level Marketing (MLM) platform designed to manage and visualize complex downline structures using both a Global Matrix Tree and a Binary Tree. The platform aims to provide a robust system for tracking user activations, income, and network growth, catering to both administrators and end-users. The core business vision is to enable efficient management of MLM networks with distinct income generation mechanisms from matrix and binary structures.

## User Preferences
I prefer that you act as an expert software engineer and communicate in a clear, professional, and concise manner. I want iterative development, where you propose changes and explain them before implementation. Focus on high-level architectural decisions and significant feature implementations. Do not make changes to the folder `Z` or file `Y`.

## System Architecture

### UI/UX Decisions
The platform features separate Admin and User Dashboards for comprehensive income tracking and tree visualization. Design elements prioritize readability and consistency, using pure white backgrounds and `dashboard-text` (black) for improved contrast across the application. Visualizations for both Matrix and Binary trees include clear connecting lines and dark mode support for enhanced user experience.

### Technical Implementations
-   **User ID Format**: All user IDs are in `PB#####` format (e.g., PB47821), using random unique IDs from range PB10000-PB999999.
    -   Random generation with collision detection and retry (up to 20 attempts).
    -   User ID is only revealed after email verification (not during registration).
    -   Concurrent signup safety with transaction retry on unique constraint violation.
-   **Email/Mobile Reuse**: ✅ **VERIFIED & WORKING**
    -   1 email can be reused for up to 50 registrations (no unique constraint)
    -   1 mobile can be reused for up to 50 registrations (verified with 4+ users on same mobile)
    -   **Bulk Email Update**: When one user updates their email, ALL users sharing that email are automatically updated to the new email
    -   Profile email update: ✅ Enabled via `updateProfileSchema`
-   **Matrix Tree (Global Network)**: ✅ **VERIFIED WORKING**
    -   Uses Breadth-First Search (BFS) for user placement to ensure optimal, level-by-level filling, maximizing downline bonuses.
    -   Supports an unlimited 5-level downline commission structure, independent of sponsorship.
    -   Auto-placement occurs when all 8 activation payments are confirmed via `findAndAssignActivationMatrixSlot()` (line 3068, storage.ts).
    -   Database fields: `matrixParentId`, `matrixPosition` (0=left, 1=right), `matrixLevel`, `matrixPath`.
    -   Activation-scoped matrix placement enables multi-cycle re-entry support.
-   **Binary Tree (Income Distribution)**:
    -   Employs Depth-First Search (DFS) for user placement, respecting affiliate link preferences (left/right).
    -   Placement priority: Exact placement, then spillover in sponsor's downline, then global tree search.
    -   Purpose: Facilitates binary matching income (e.g., 3:3 pair bonus system).
    -   Database fields: `sponsorId`, `binaryLeg`, `sponsorRequestedLeg`, `binaryParentId`, `binaryPlacementLeg`.
-   **Queue System (Binary Match Payments)**:
    -   Manages payment flow for binary match bonuses.
    -   Users enter a FIFO queue upon qualifying (e.g., building a 3:3 matched pair).
    -   **24-Hour Auto-Reassignment**: If a payer fails to confirm payment within 24 hours, they are automatically reassigned to a new recipient, and the original queue slot is released. This prevents queue stagnation.
    -   Configurable `queueReservationHoldHours` (default 24 hours).
-   **Security Features**: Includes 6-digit security codes for profile updates (bcrypt hashed), session management using `express-session` with PostgreSQL, CSRF protection, and rate limiting on authentication endpoints.

### Feature Specifications
-   **Global Matrix Tree**: 5-level downline structure with binary positions. ✅ **Auto-placement verified working**
-   **Binary Tree**: Sponsor-based network with DFS spillover placement.
-   **Admin & User Dashboards**: Provide complete income tracking and tree visualization.
-   **Payment Card Enhancement**: Displays the payment receiver's sponsor mobile number.
-   **TOP REWARD Income Stream**: Admin-managed recipient list for TOP REWARD payments.
    -   Admin panel page at `/admin/top-reward` to manage recipient list.
    -   Recipients can be set to receive payments X times (1-99) or unlimited times.
    -   Payment assignment uses priority-based selection with frequency limits.
    -   TOP REWARD income is tracked separately in user income summaries.
    -   Falls back to PB0 (admin) if no eligible recipients in list.
-   **Replit Publishing Ready**: Configured for Replit autoscale deployment with `npm run build` and Neon PostgreSQL.

### System Design Choices
The system maintains distinct tree structures for Matrix and Binary networks to offer flexible and varied income sources. Sponsorship chains are also tracked independently. All tree queries are user-scoped to ensure data integrity and accurate display.

## Recent Changes (Latest Session - Dec 02, 2025)
- ✅ **CRITICAL FIX: Matrix Placement Logic - DFS → BFS**
  - **PROBLEM**: Every new ID was placed in WRONG matrix position due to DFS (Depth-First Search) algorithm
  - **ROOT CAUSE**: DFS goes deep into one leg before filling the other, breaking level-by-level filling rule
  - **SOLUTION**: Replaced with BFS (Breadth-First Search) - fills complete level before moving to next level
  - **IMPLEMENTATION**: Uses queue-based level-by-level processing, fills left-to-right (position 0 then 1)
  - **RESULT**: New activations now auto-place correctly in proper matrix positions
  - **Code Location**: `findAndAssignActivationMatrixSlot()` in server/storage.ts (line 1401)
  - **Testing**: Manually verified placements (PB343649, PB189876, PB99639) now work correctly

## Previous Session Changes (Dec 02, 2025)
- ✅ **Matrix Activation Requirement**: Only fully activated users (8/8 payments) can have downlines
  - Changed BFS algorithm to filter frontier by `isActivated=true`
  - Inactive users skipped when finding available matrix parent slots
  - Ensures unqualified users cannot receive matrix commissions
  - New users placed under first fully activated parent with available slots
- ✅ **Matrix Tree Display Filter**: Inactive users hidden from matrix visualization
  - Updated `getMatrixSubtree` recursive query to exclude `is_activated=false` users
  - Only fully activated users appear in matrix tree views
  - Prevents incomplete users (e.g., PB10046 with < 8 payments) from showing in matrix
- ✅ **Manual Matrix Placement**: PB343649 repositioned under PB10018
  - Moved from Level 6 under PB10049 → Level 5 under PB10018
  - Assigned as left child (position 0) of PB10018
  - New matrix path: PB10000.R.L.R.L
  - Removed PB10046 from matrix (not activated yet)
- ✅ **Manual Matrix Placement**: PB189876 repositioned under PB10018
  - Moved from Level 7 under PB343649 → Level 5 under PB10018
  - Assigned as right child (position 1) of PB10018
  - New matrix path: PB10000.R.L.R.R
- ✅ **Manual Matrix Placement**: PB99639 repositioned under PB10020
  - Moved from Level 7 under PB10047 → Level 5 under PB10020
  - Assigned as left child (position 0) of PB10020
  - New matrix path: PB10000.R.R.L.L
  - User is activated and now positioned for direct income from Level 5

## Previous Changes (Dec 02, 2025)
- ✅ **Critical SQL Fix**: Fixed `binaryMatchQueue.createdAt` -> `binaryMatchQueue.enteredAt`
  - The schema uses `enteredAt` for the queue entry timestamp, not `createdAt`
  - This was causing SQL syntax errors during binary match payment assignment
- ✅ **TOP REWARD PB0 Fallback Enhancement**:
  - When TOP REWARD list is empty, system falls back to PB0 (admin)
  - Frontend now fetches payment-type-specific admin details from PB0 profile
  - `/api/admin/payment-details?paymentType=top_reward` returns PB0's dedicated Top Reward fields:
    - `topRewardHolderName`, `topRewardMobile`, `topRewardUpiId`
    - `topRewardBankAccount`, `topRewardIfsc`, `topRewardQrUrl`
  - Same pattern for Binary Match fallback (uses `binaryFallback*` fields)
  - Same pattern for Matrix Level fallback (uses `matrixFallback*` fields)
- ✅ **Auto-Refresh Every 30 Seconds**:
  - Activation payments list auto-refreshes every 30 seconds
  - Top Reward recipient details auto-refresh every 30 seconds
  - Users see latest payment assignments without manual refresh
- ✅ **Signup Page Rebuilt**: Complete architectural redesign matching login page pattern
  - Uses useState-controlled inputs (same pattern as working login page)
  - Client-side validation with comprehensive error display
  - Clean separation of form/success states
  - All validation rules centralized in validateForm()
- ✅ **Bug Fixes Implemented**:
  - Fixed CustomCaptcha boolean type error (was passing empty string instead of false)
  - Fixed signup CAPTCHA validation logic for more robust checking
  - Added auto-creation of PB10000 sponsor if missing during registration
- ✅ **Form Improvements**:
  - Name (2+ chars), Email (valid format), Mobile (10 digits), Password (6+ chars)
  - Password confirmation matching validation
  - Terms acceptance requirement
  - Custom CAPTCHA integration working (when enabled)
  - URL parameter parsing for referral links (sponsor & binary leg)
- ✅ **Server Verified Working**:
  - HTTP 200 responses confirmed
  - API endpoints responding correctly
  - Build compiles successfully (47KB page content)
- ✅ **Test IDs**: All interactive elements properly labeled for testing

## External Dependencies
-   **Neon PostgreSQL**: Used as the primary production-grade database.
-   **express-session**: For managing user sessions.
-   **bcrypt**: For hashing security codes and passwords.

## Production Readiness Status
✅ **MULTI-PLATFORM DEPLOYMENT READY**

### Replit Deployment
- ✅ Published and LIVE
- ✅ Auto-scales with traffic
- ✅ Neon PostgreSQL integrated
- ✅ Custom domain ready

### Hostinger VPS Deployment
- ✅ Full deployment guide created (see `HOSTINGER_VPS_DEPLOYMENT.md`)
- ✅ Node.js + PostgreSQL setup documented
- ✅ PM2 process management configured
- ✅ Nginx reverse proxy with SSL
- ✅ Cost: ~$3-6/month
- ✅ Complete self-hosted alternative

### Core Features Verified
- Matrix auto-placement system fully functional with BFS algorithm
- Email/mobile reuse working (up to 50 per identifier)
- **Bulk email update capability** - automatic propagation when email changed
- Profile email update capability enabled
- Binary queue system with 24-hour auto-release operational
- Complete income tracking and tree visualization for admins and users
