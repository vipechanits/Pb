# PAYBACK247 - P2P MLM Platform

## Overview
PAYBACK247 is a peer-to-peer MLM platform that has been converted from a blockchain-based system to a traditional full-stack web application. Its core purpose is to facilitate multi-level marketing operations, including binary pairing income, multi-level matrix rewards, and a robust manual payment tracking system with administrator approval. The platform enables users to activate accounts, build referral networks, monitor earnings, and manage profiles. Administrators have comprehensive control over system configuration, payment approvals, and access to analytics, ensuring efficient operation and financial transparency.

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
- **Schema**: `users` table for authentication (auto-generated IDs starting from PB10000, admin is PB0), `activations` table for activation lifecycle (UUID-based IDs `ACT-{userId}-{uuid}`, unique `payer_wallet`), and `activation_payments` table for tracking 8 payment slots per activation (status: pending, submitted, confirmed, rejected).
- **Migrations**: Drizzle Kit.
- **Validation**: Zod schemas for all payment operations.
- **Transaction Guarantees**: Atomic creation of activations and payments.

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
- **Admin Fallback**: Payments automatically route to admin if eligible receiver is unavailable.
- **Payment Mode**: Manual INR payments via UPI (Google Pay, Paytm, PhonePe) with UTR/Transaction ID and optional proof upload.
- **Payment Flow**: User submits UTR/proof, receiver confirms/rejects (with reason), user can resubmit indefinitely if rejected.
- **Payment Status Tracking**: Pending, Submitted, Confirmed, Rejected.
- **Security**: Strict authorization for submitting, confirming, and viewing payments.

### Key Application Pages
- **Activation Page (`/user/activation`)**: Guides users through the 8-payment process with a summary dashboard, checklist, and submission dialog, including QR code generation for UPI payments.
- **Confirmation Page (`/user/confirmation`)**: Displays payments pending user confirmation.
- **Admin Payments Page (`/admin/payments`)**: Provides an admin approval queue for offline payment proofs.

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