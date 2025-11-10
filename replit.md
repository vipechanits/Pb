# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform that has been converted from a blockchain-based system to a traditional full-stack web application. Its core purpose is to facilitate network marketing operations, including binary pairing income, multi-level matrix rewards, and a robust manual payment tracking system with administrator approval. The platform enables users to activate accounts, build referral networks, monitor earnings, and manage profiles. Administrators have comprehensive control over system configuration, payment approvals, and access to analytics, ensuring efficient operation and financial transparency.

**Custom Domain:** https://payback247.com (configured for all referral links and permanent affiliate links)

## Recent Changes
- **November 10, 2025**: Added sponsor information display - users can now see their sponsor ID and binary leg placement on both dashboard and activation pages. Activation completion logic verified to correctly update sponsor's binary tree counts (leftLegCount, personalLeftCount, totalReferrals) when all 8 payments are confirmed
- **November 10, 2025**: Implemented sponsor-based Direct Sponsor payment confirmations - Direct Sponsor payments (slot 0) are now confirmed by actual sponsors, not admin. Admin queue only shows Direct Sponsor payments when receiver is NULL (no sponsor) or PB0 (explicit fallback)
- **November 10, 2025**: Added profile completion reminder system with AlertDialog pop-up and persistent warning banner to encourage users to complete payment details
- **November 10, 2025**: Added prominent Admin Payment Details card to activation page displaying account holder, UPI ID, bank account, IFSC code, mobile number, and QR code with copy-to-clipboard functionality
- **November 10, 2025**: Replaced "Admin Wallet" terminology with "Admin Account (PB0)" throughout activation flow
- **November 10, 2025**: Fixed QR upload visibility bug - added paymentQrUrl field normalization in storage layer
- **November 10, 2025**: Added user QR code upload feature (paymentQrUrl field) for peer-to-peer payments
- **November 10, 2025**: Simplified admin payment methods from JSON arrays to single values (1 UPI, 1 bank, 1 mobile, 1 QR upload)
- **November 10, 2025**: Created professional index.html landing page for GitHub Pages deployment
- **November 10, 2025**: Database reset (kept PB0 only), added permanent affiliate links to admin dashboard, configured custom domain https://payback247.com
- **November 10, 2025**: Fully responsive landing page optimized for mobile, tablet, and desktop
- **November 10, 2025**: Updated all payment amounts to ₹500 per slot (Creator Fee + Matrix Levels 1-5)
- **November 10, 2025**: Removed all "MLM" references, increased logo size to 80px, removed slogan

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack React Query for server state, local component state for UI.
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
- **Schema**: 
  - `users` table: Authentication (auto-generated IDs starting from PB10000, admin is PB0), profile data, personal binary counts (`personalLeftCount`, `personalRightCount`), profile completion flag
  - `activations` table: Activation lifecycle (UUID-based IDs `ACT-{userId}-{uuid}`, unique `payer_wallet`)
  - `activation_payments` table: Tracking 8 payment slots per activation (status: pending, submitted, confirmed, rejected)
  - `system_config` table: Dynamic system configuration (singleton pattern with id='default-config-singleton') for payment amounts, binary matching rules, admin UPI details
- **Migrations**: Drizzle Kit.
- **Validation**: Zod schemas for all payment operations.
- **Transaction Guarantees**: Atomic creation of activations and payments.
- **Server Initialization**: Auto-creates system configuration singleton on startup if missing.

### Object Storage
- **Provider**: Replit Object Storage (Google Cloud Storage-backed).
- **Service**: `ObjectStorageService` for presigned URLs, file serving, ACL management.
- **Uploader**: `ObjectUploader` (React component with Uppy) for file uploads (images, PDFs, max 10MB).
- **Use Cases**: Payment proof uploads, user documents (KYC), profile images.
- **File Access**: Public via `/objects/:objectPath`, private with ACL-based owner verification.

### Authentication & Authorization
- **Authentication**: Email/password authentication with bcrypt hashing.
- **Session Management**: Express sessions with PostgreSQL store.
- **Role Detection**: Admin/user roles stored in database.
- **User IDs**: Auto-generated sequential IDs (PB10000+), admin is PB0.
- **Binary Leg Auto-Assignment**: If user signs up with a sponsor but no leg specified, automatically assigns to the leg with fewer members for balanced tree growth.
- **Logout**: Destroys session and redirects to login.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 payments: Direct Sponsor (Slot 0), Binary Match (Slot 1), Creator Fee (Slot 2), Matrix Levels 1-5 (Slots 3-7).
- **Dynamic Configuration**: Payment amounts, binary matching qualification (left/right counts), and matching ratio are admin-configurable via system_config table (default: ₹1000 sponsor, ₹1000 binary match, ₹625 per matrix level, 1:1 qualification, 3:3 ratio).
- **Admin Fallback**: Payments automatically route to admin if eligible receiver is unavailable.
- **Payment Mode**: Manual INR payments via UPI (Google Pay, Paytm, PhonePe) with UTR/Transaction ID and optional proof upload.
- **Payment Flow**: User submits UTR/proof, receiver confirms/rejects (with reason), user can resubmit indefinitely if rejected.
- **Payment Status Tracking**: Pending, Submitted, Confirmed, Rejected.
- **Security**: Strict authorization for submitting, confirming, and viewing payments.
- **Profile Completion Enforcement**: Users must complete name, mobile, payment details (UPI or bank), and security code before requesting activation.

### Key Application Pages

#### User Pages
- **Activation Page (`/user/activation`)**: Guides users through the 8-payment process with:
  - **Admin Payment Details Card**: Prominently displays admin's account holder name, UPI ID, bank account, IFSC code, mobile number, and QR code at the top with copy-to-clipboard buttons for easy payment
  - Summary dashboard showing total fee and payment status
  - 8-payment slots checklist (Direct Sponsor, Binary Match, Creator Fee, Matrix 1-5)
  - Payment submission dialog with QR code generation for UPI payments
  - All admin payments labeled as "Admin Account (PB0)"
- **Confirmation Page (`/user/confirmation`)**: Displays payments pending user confirmation.
- **Profile Page (`/user/profile`)**: User profile management with completion enforcement before activation.

#### Admin Pages
- **Admin Dashboard (`/admin`)**: Overview of system metrics and quick access to admin functions.
- **Payment Confirmations (`/admin/payments`)**: Admin approval queue for offline payment proofs with confirm/reject actions.
- **Payments Report (`/admin/payments-report`)**: Comprehensive confirmed payments report with:
  - Summary cards: Total payments count, total amount (INR), unique payers count
  - Detailed table: Date, payer (ID + name), receiver (ID + name), slot type, amount, UTR/Transaction ID, submission count, proof link, notes
  - Slot type labels: Direct Sponsor, Binary Match, Creator Fee, Matrix Levels 1-5
  - Export CSV placeholder for future implementation
- **System Configuration (`/admin/config`)**: Dynamic configuration page for:
  - Payment amounts (all 8 slots individually configurable)
  - Binary matching rules (left/right qualification counts, matching ratio)
  - Admin UPI details (for QR code generation)
  - Real-time total activation fee calculation
- **User Management (`/admin/users`)**: User administration and management.

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
- **Replit-specific plugins**: Runtime error overlay, Cartographer, development banner.

### Form & Validation
- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.
- **@hookform/resolvers**: Integration with React Hook Form.

### Data Fetching & Caching
- **TanStack React Query**: Async state management, caching.

### Styling
- **Tailwind CSS**: Utility-first CSS framework.
- **PostCSS**: CSS processor.
- **class-variance-authority**: Type-safe component variants.
- **clsx & tailwind-merge**: Class name utilities.

### Third-Party Integrations
- **Google Fonts**: Inter, JetBrains Mono.
- **Date-fns**: Date manipulation and formatting.