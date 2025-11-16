# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform for network marketing. It features binary pairing income, multi-level matrix rewards, and a manual payment tracking system with administrator approval. The platform supports user account activation, referral network building, earnings monitoring, and profile management. Administrators can manage system configurations, approve payments, and access analytics. Key capabilities include multi-cycle re-entry for earning from subsequent matrix completions, with all administrative fees and fallback payments routed to the central administrator (PB0).

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **URL-Based Binary Placement with Spillover (2025-11-16)**: Implemented 3-tier placement strategy: (1) Try exact placement at sponsor's requested leg, (2) If taken, search sponsor's entire downline for first available slot (spillover), (3) If sponsor's downline full, search global tree. Users must sign up via referral links (?ref=PB10000&leg=left) which specify sponsor and placement preference.
- **Removed Manual Sponsor ID Input (2025-11-16)**: Removed the manual sponsor ID input field from signup page. Users can now only register through referral links with sponsor IDs in the URL (?ref=PB10000&leg=left). This ensures all registrations are properly tracked and prevents orphaned users.
- **Global Matrix Authorization Fix (2025-11-16)**: Fixed 403 Forbidden error when loading activation-scoped matrix trees. Changed authorization check from comparing `activation.payerWallet` to `rootUser.userId` (incompatible types) to comparing `activation.payerWallet` to `rootUser.id` (both UUIDs).
- **Activation List Query Fix (2025-11-16)**: Fixed critical bug in `getUserActivationsList()` where activations were not being fetched because the query was comparing `payer_wallet` to `userId` (PB10000) instead of `user.id` (UUID). Changed to use UUID for proper activation retrieval, enabling Global Matrix page cycle tabs to display correctly.
- **Admin Payment Confirmation Authorization Fix (2025-11-16)**: Fixed payment confirmation/rejection endpoints to properly handle `receiverType='admin'` payments. Previously, the validation was rejecting all admin payments with "Invalid receiver type" error. Now PB0 admin can successfully confirm/reject all admin-routed payments (sponsor fallback, binary match fallback, top reward, matrix fallback).
- **PB0 Payment Details from Config (2025-11-16)**: Updated `/api/users/payment-details/:userId` endpoint to fetch payment details from system configuration when userId is 'PB0'. This ensures all PB0 payments (sponsor fallback, binary match fallback, top reward, matrix fallback) display the admin's UPI ID, bank account, and QR code from the System Configuration page instead of the user profile.

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
- **Schema**: Users, activations, activation payments, system configuration, and `activation_matrix_positions` for multi-cycle matrix positioning.
- **Migrations**: Drizzle Kit.
- **Validation**: Zod schemas.
- **Transaction Guarantees**: Atomic creation of activations and payments with row-level locking.

### Object Storage
- **Provider**: Replit Object Storage (Google Cloud Storage-backed).
- **Service**: `ObjectStorageService` for presigned URLs, file serving, ACL management.
- **Uploader**: `ObjectUploader` (React component with Uppy) for file uploads (images, PDFs, max 10MB).

### Authentication & Authorization
- **Authentication**: Email/password authentication with bcrypt hashing.
- **Session Management**: Express sessions with PostgreSQL store.
- **Role Detection**: Admin/user roles stored in database.
- **User IDs**: Auto-generated sequential IDs (PB10000+).
- **Admin User**: PB0 (Root Admin) with environment-driven credentials.
- **Binary Leg Auto-Assignment**: Automatically assigns to the leg with fewer members if not specified during signup.
- **Default Sponsor Assignment**: New users without a sponsor ID are automatically assigned PB10000 as sponsor.
- **Payment Authorization**: Only the designated receiver can confirm or reject payments.

### Network Marketing Structure
- **Binary Tree & Global Matrix**: Both trees start from PB10000, excluding admin (PB0).
- **Root Node Handling**: First non-admin user to activate becomes the root.
- **Binary Matching**: Uses entire self team (spillover + personal recruitments) for 3:3 pair counting, with initial 1+1 qualification from personal counts.
- **Admin Role**: PB0 acts as payment receiver and system administrator only.
- **Matrix Growth**: Global matrix grows infinitely, accepting unlimited users. Each user earns from their 5-level downline (62 users maximum) independently per activation cycle.
- **Multi-Cycle Support**: Each re-entry cycle has its own separate 2x∞ global matrix tree with unique positioning and independent income streams.
- **Activation-Scoped Matrix Positioning**: Matrix positions are stored per activation.

### Binary Placement Architecture
- **Separation of Concerns**: Sponsorship (income tracking) is separate from binary placement (tree structure).
- **Unique Position Constraint**: Database enforces `UNIQUE(binaryParentId, binaryPlacementLeg)`.
- **URL-Based Placement with Spillover**: 3-tier priority system:
  1. **Exact Placement**: Try placing user at sponsor's requested leg (from referral link)
  2. **Sponsor Spillover (DEEP DOWN)**: If exact slot taken, use depth-first search in sponsor's downline - goes deep down left side first, then right side
  3. **Global Spillover (BFS)**: If sponsor's downline full, use breadth-first search across entire global tree
- **Referral Link Required**: Users must sign up via `?ref=PB10000&leg=left` URLs specifying sponsor and preferred leg.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 payments: Direct Sponsor (Slot 0), Binary Match (Slot 1), Top Reward Payment (Slot 2), Matrix Levels 1-5 (Slots 3-7).
- **Dynamic Configuration**: Payment amounts, binary matching rules, and matching ratio are admin-configurable.
- **Admin Fee Routing**: All admin fees and fallback payments route exclusively to PB0.
- **Payment Mode**: Manual INR payments via UPI with UTR/Transaction ID and optional proof upload.
- **Payment Flow**: User submits UTR/proof, receiver confirms/rejects, user can resubmit.
- **Payment Status Tracking**: Pending, Submitted, Confirmed, Rejected.
- **Manual Confirmation Required**: All payments require manual confirmation by PB0 admin.
- **Profile Completion Enforcement**: Users must complete profile details before requesting activation.
- **Deferred Income Creation**: Sponsor and matrix income are created only after full activation. Binary match and top reward incomes are created immediately.
- **Automatic Re-entry**: System automatically detects matrix completion (62 users) and marks users eligible for re-entry, initiating a new activation cycle.

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