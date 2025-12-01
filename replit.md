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

## Recent Changes (Latest Session - Dec 01, 2025)
- ✅ **Matrix Placement System Verified**: Confirmed `findAndAssignActivationMatrixSlot()` executes automatically when all 8 payments confirmed
- ✅ **Live Matrix Tree Validated**: PB10000 (root) → 2 descendants at Level 2 → placements to Level 5-6
- ✅ **Auto-Placement Logic Working**: New users receive automatic matrix positioning
- ✅ **Legacy User Data Corrected**: PB10016 and other legacy users data integrity verified
- ✅ **Email/Mobile Reuse Verified**: Multiple users can share same mobile (4+ on single mobile confirmed)
- ✅ **Profile Email Update Added**: Email field added to `updateProfileSchema`
- ✅ **Bulk Email Update Implemented**: When one user (of 50 sharing same email) updates email, ALL 50 get updated to new email automatically

## External Dependencies
-   **Neon PostgreSQL**: Used as the primary production-grade database.
-   **express-session**: For managing user sessions.
-   **bcrypt**: For hashing security codes and passwords.

## Production Readiness Status
✅ **READY FOR DEPLOYMENT** - All core features verified and enhanced:
- Matrix auto-placement system fully functional with BFS algorithm
- Email/mobile reuse working (up to 50 per identifier)
- **Bulk email update capability** - automatic propagation when email changed
- Profile email update capability enabled
- Binary queue system with 24-hour auto-release operational
- Complete income tracking and tree visualization for admins and users
