# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform for network marketing, featuring binary pairing income, multi-level matrix rewards, and a manual payment tracking system with administrator approval. It allows users to activate accounts, build referral networks, monitor earnings, and manage profiles. Administrators can manage system configurations, approve payments, and access analytics for efficient operation and financial transparency.

## Recent Changes
- **Payment Archive Integrated in Activation Page**: Standalone payment archive page removed. Activation page now features tabbed interface with "Current Activation" and "Payment Archive" tabs, consolidating all payment viewing in one location
- **Enhanced Payment Details with Bank Information**: Payment details now display receiver's UPI ID, bank account number, IFSC code, and account holder name for both admin (PB0) and user receivers, making payment submission easier
- **Expandable Payment Details**: Users can expand each payment card to see comprehensive details including receiver banking information, UTR/Transaction ID, submission count, payment timeline (created, confirmed, rejected dates), rejection reasons, admin notes, and payment proof links
- **Enhanced Confirmed Payments Report**: Comprehensive payment details with advanced filtering (search, slot type, receiver type), slot breakdown statistics, and full payer/receiver information including email, mobile, UPI ID
- **Admin User Management Page**: Advanced filtering by activation status, role, binary leg, sponsor, matrix level, re-entry eligibility, and binary qualification
- **Global matrix unlimited growth enabled**: Removed level 5 cap, matrix now grows infinitely while maintaining individual 5-level (62 user) downline income limit per user
- **Automatic re-entry detection**: System automatically detects when users complete their 62-user matrix cycle and marks them eligible for re-entry
- **Re-entry page fully implemented**: Users can view their matrix completion status, cycle history, and initiate re-entry when eligible

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Schema**: Users, activations, activation payments, and system configuration.
- **Migrations**: Drizzle Kit.
- **Validation**: Zod schemas for payment operations.
- **Transaction Guarantees**: Atomic creation of activations and payments with row-level locking.
- **Database Environment Configuration**: Supports separate development and production databases, with `REPL_DEPLOYMENT=1` for production using `DATABASE_URL` and development using `DEV_DATABASE_URL` (or falling back to `DATABASE_URL`).

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
- **Default Sponsor Assignment**: New users without a sponsor ID are automatically assigned PB0 as sponsor, ensuring all admin fees flow to PB0.
- **Payment Authorization**: Only the designated receiver can confirm or reject payments. Attempts by non-receivers return HTTP 403 Forbidden.

### Network Marketing Structure
- **Binary Tree & Global Matrix**: Both trees start from PB10000 (first regular user), with admin account (PB0) completely excluded from tree structures.
- **Root Node Handling**: The first non-admin user to activate becomes the root of both binary tree and global matrix (matrixLevel=1, no parent).
- **Binary Matching**: Uses entire self team (spillover + personal recruitments) for 3:3 pair counting, with initial 1+1 qualification from personal counts.
- **Admin Role**: PB0 exists as payment receiver and system administrator only, not as network participant.
- **Matrix Growth**: Global matrix grows infinitely (unlimited levels), accepting unlimited users. Each user earns from their 5-level downline (62 users maximum) regardless of the user's position in the matrix.

#### Binary Placement Architecture
- **Separation of Concerns**: Sponsorship (income tracking) is completely separate from binary placement (tree structure).
  - **Sponsorship Fields**: `sponsorId`, `sponsorRequestedLeg` - Used for income distribution and referral tracking.
  - **Placement Fields**: `binaryParentId`, `binaryPlacementLeg` - Used for binary tree structure and spillover management.
- **Unique Position Constraint**: Database enforces `UNIQUE(binaryParentId, binaryPlacementLeg)` to ensure each position has exactly ONE user.
- **Breadth-First Placement**: New activations use breadth-first search to find first available slot in binary placement tree, independent of sponsorship.
- **Spillover Handling**: Users are automatically placed in the first available position, even if it's under a different sponsor's downline.
- **First-User Edge Case**: First activated user becomes binary tree root with `binaryParentId=NULL` and `binaryPlacementLeg=NULL`.
- **Example**: User PB10007 (sponsored by PB10000) may be placed under PB10003's left leg if that's the first available position.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 payments: Direct Sponsor (Slot 0), Binary Match (Slot 1), Top Reward Payment (Slot 2), Matrix Levels 1-5 (Slots 3-7).
- **Dynamic Configuration**: Payment amounts, binary matching rules, and matching ratio are admin-configurable.
- **Admin Fee Routing**: ALL admin fees and fallback payments route exclusively to PB0. This includes: top reward (always), binary match fallbacks (queue empty), matrix fallbacks (no upline), and sponsor payments (for users sponsored by PB0).
- **Payment Mode**: Manual INR payments via UPI with UTR/Transaction ID and optional proof upload.
- **Payment Flow**: User submits UTR/proof, receiver confirms/rejects, user can resubmit.
- **Payment Status Tracking**: Pending, Submitted, Confirmed, Rejected.
- **Manual Confirmation Required**: All payments require manual confirmation by PB0 admin. No auto-confirmation exists in the system.
- **Profile Completion Enforcement**: Users must complete profile details before requesting activation.
- **Deferred Income Creation**: Sponsor income and matrix income are created ONLY after full activation (all 8 payments confirmed), not when individual payments are confirmed. Only binary_match and top_reward incomes are created immediately upon payment confirmation.
- **Legacy Income Cleanup**: Activation completion automatically detects and removes any prematurely created sponsor income records, then recreates them correctly with proper summary adjustments.

### Key Application Pages
- **User Pages**: Dashboard, Activation (with integrated Payment Archive tab), Confirmation, Binary Tree, Global Matrix, Profile, Re-entry, Unified Income Details, Binary Match Queue History, Binary Pair Matching History, Matrix Income History, Direct Sponsoring.
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