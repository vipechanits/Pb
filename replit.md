# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform for network marketing, featuring binary pairing income, multi-level matrix rewards, and a manual payment tracking system with administrator approval. It enables users to activate accounts, build referral networks, monitor earnings, and manage profiles. Administrators can manage system configurations, approve payments, and access analytics for efficient operation and financial transparency. The platform supports multi-cycle re-entry, allowing users to earn from subsequent matrix completions, and ensures all administrative fees and fallback payments are routed to the central administrator (PB0).

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **Email Configuration in Admin Panel (2025-11-16)**: Implemented database-backed email configuration in admin panel. Administrators can now configure SMTP settings (host, port, user, password, from address, SSL/TLS, enable/disable) through the system configuration page. Email service uses database config with environment variable fallback (only when no database config exists). Changes take effect immediately without server restart. Fixed critical bugs: email disable toggle now properly disables email even when environment variables are present, and partial config updates retain email settings.
- **Global Matrix Ownership Fix (2025-11-16)**: Fixed 403 Forbidden error in global matrix route where activation ownership verification was comparing `activation.payerWallet` to `rootUser.id` (UUID) instead of `rootUser.userId` (PB10000). Changed to use `userId` for proper ownership verification, allowing users to view their cycle-specific matrix trees.
- **Activation List Query Fix (2025-11-16)**: Fixed critical bug in `getUserActivationsList()` where activations were not being fetched because the query was comparing `payer_wallet` to `user.id` (UUID) instead of `userId` (PB10000). Changed to use `userId` directly for proper activation retrieval.
- **Cycle Number Calculation Fix (2025-11-16)**: Fixed `getUserActivationsList()` to correctly calculate cycle numbers. First activation is Cycle #1, and re-entries increment from the previous cycle number (reentries.cycle_number represents the PREVIOUS cycle, so new activation is cycle_number + 1). This ensures Cycle #2 re-entry displays correctly as "Cycle #2" instead of showing duplicate "Cycle #1" labels.
- **Global Matrix Cycle Tabs (2025-11-16)**: Enhanced global matrix page to display each cycle (Cycle #1, Cycle #2, etc.) in separate tabs, showing unique matrix positions for each re-entry cycle. Created `CycleMatrixView` component that fetches and displays cycle-specific matrix trees with independent stats (matrix level, path, team count). Each tab shows the user's unique position in that cycle's 2×∞ matrix tree.
- **Global Matrix Serialization Fix (2025-11-16)**: Fixed circular structure error in global matrix API endpoint by implementing proper tree serialization. Added `serializeMatrixTree()` helper function that maintains a shared visited Set across entire tree traversal to break circular references. Both activation-scoped and legacy matrix endpoints now serialize trees before sending to client, preventing JSON.stringify() errors. Function creates fresh plain objects instead of reusing original node references.
- **Re-entry Activation Bug Fix (2025-11-16)**: Fixed critical bug in `reentry-service.ts` where re-entry activations were using UUID (`userData.id`) instead of user ID (`userData.userId`) for `payer_wallet`, causing activation page to not find activations for re-entry cycles. Changed line 199 to use `userData.userId`. Also cleaned up PB10000's broken data: updated 3 existing activations from UUID to 'PB10000', deleted duplicate Cycle 2 pending reentry record, and removed accidentally initiated Cycle #3 (deleted 1 activation, 8 payments, and 1 re-entry record).
- **Re-entry System Lockdown (2025-11-16)**: Implemented strict 62-user matrix completion check before allowing re-entry. Users cannot initiate re-entry until their matrix has exactly 62 active downline members. This prevents duplicate activations and ensures proper cycle progression.
- **Activation Page Auto-Cycle Selection (2025-11-16)**: Activation page now automatically selects and displays the active/current cycle by default instead of Cycle #1, improving UX for users with multiple cycles. Uses `effectiveTab` to prevent UI flashing and ensures all components (tabs, card title, checklist) stay synchronized.
- **Cycle Number Correction (2025-11-16)**: Fixed re-entry cycle numbering to display correctly as Cycle 2, Cycle 3, etc. Previously showed duplicate Cycle #1 tabs due to incorrect mapping of re-entry cycle numbers.
- **Logo Update (2025-11-16)**: Replaced old logo with new handshake design across all pages (landing header/footer, sidebar). Updated sizing to w-32 h-32 with proper margins (my-2/my-3) and justify-between alignment.
- **Activation Page Cycle Filtering Fix (2025-11-16)**: Fixed critical bug where Cycle #2 tab was showing Cycle #1 payments. Changed cyclePayments logic from `currentCycle?.payments || payments || []` to `currentCycle?.payments || []` to prevent fallback to all payments when a cycle doesn't exist yet.
- **Re-entry Section Removed from Dashboard**: "Initiate Re-entry" button section completely removed from dashboard - users can only initiate re-entry from the dedicated Re-entry page.
- **Referral Links Restored**: Yellow affiliate referral links bar (Left Leg/Right Leg) restored on dashboard after activation.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **Routing**: Wouter.
- **State Management**: TanStack React Query.
- **UI**: shadcn/ui (Radix UI + Tailwind CSS) following Material Design, with custom themes and 8px grid spacing.
- **Authentication**: Email/password login with session management.
- **Design System**: Tailwind CSS, Inter and JetBrains Mono fonts.

### Backend
- **Server Framework**: Express.js with TypeScript (Node.js).
- **API Structure**: RESTful API (`/api` prefix).
- **Session Management**: Express sessions with PostgreSQL store.

### Data Storage
- **Database**: PostgreSQL (Neon serverless).
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema**: Users, activations, activation payments, and system configuration, including `activation_matrix_positions` for multi-cycle matrix positioning.
- **Migrations**: Drizzle Kit.
- **Validation**: Zod schemas for payment operations.
- **Transaction Guarantees**: Atomic creation of activations and payments with row-level locking.
- **Database Environment Configuration**: Supports separate development and production databases.

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
- **Admin User**: PB0 (Root Admin) with environment-driven credentials.
- **Binary Leg Auto-Assignment**: Automatically assigns to the leg with fewer members if not specified during signup.
- **Default Sponsor Assignment**: New users without a sponsor ID are automatically assigned PB0 as sponsor.
- **Payment Authorization**: Only the designated receiver can confirm or reject payments.

### Network Marketing Structure
- **Binary Tree & Global Matrix**: Both trees start from PB10000 (first regular user), with admin account (PB0) excluded from tree structures.
- **Root Node Handling**: The first non-admin user to activate becomes the root of both binary tree and global matrix.
- **Binary Matching**: Uses entire self team (spillover + personal recruitments) for 3:3 pair counting, with initial 1+1 qualification from personal counts.
- **Admin Role**: PB0 acts as payment receiver and system administrator only, not as network participant.
- **Matrix Growth**: Global matrix grows infinitely, accepting unlimited users. Each user earns from their 5-level downline (62 users maximum) independently per activation cycle.
- **Multi-Cycle Support**: Each re-entry cycle has its own separate 2x∞ global matrix tree with unique positioning and independent income streams.
- **Activation-Scoped Matrix Positioning**: Matrix positions are stored per activation, allowing multiple cycles for a single user.

### Binary Placement Architecture
- **Separation of Concerns**: Sponsorship (income tracking) is separate from binary placement (tree structure).
- **Unique Position Constraint**: Database enforces `UNIQUE(binaryParentId, binaryPlacementLeg)` to ensure each position has exactly one user.
- **Breadth-First Placement**: New activations use breadth-first search to find the first available slot in the binary placement tree, independent of sponsorship.
- **Spillover Handling**: Users are automatically placed in the first available position.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 payments: Direct Sponsor (Slot 0), Binary Match (Slot 1), Top Reward Payment (Slot 2), Matrix Levels 1-5 (Slots 3-7).
- **Dynamic Configuration**: Payment amounts, binary matching rules, and matching ratio are admin-configurable.
- **Admin Fee Routing**: All admin fees and fallback payments route exclusively to PB0.
- **Payment Mode**: Manual INR payments via UPI with UTR/Transaction ID and optional proof upload.
- **Payment Flow**: User submits UTR/proof, receiver confirms/rejects, user can resubmit.
- **Payment Status Tracking**: Pending, Submitted, Confirmed, Rejected.
- **Manual Confirmation Required**: All payments require manual confirmation by PB0 admin.
- **Profile Completion Enforcement**: Users must complete profile details before requesting activation.
- **Deferred Income Creation**: Sponsor and matrix income are created only after full activation (all 8 payments confirmed). Binary match and top reward incomes are created immediately.
- **Automatic Re-entry**: System automatically detects matrix completion (62 users) and marks users eligible for re-entry, initiating a new activation cycle with 8 payment slots.

### Key Application Pages
- **User Pages**: Dashboard, Activation, Confirmation, Binary Tree, Global Matrix, Profile, Re-entry, Unified Income Details, Binary Match Queue History, Binary Pair Matching History, Matrix Income History, Direct Sponsoring.
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
- **Google reCAPTCHA v2**: For enhanced security on login and signup pages.