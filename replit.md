# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform that facilitates network marketing operations, including binary pairing income, multi-level matrix rewards, and a robust manual payment tracking system with administrator approval. The platform enables users to activate accounts, build referral networks, monitor earnings, and manage profiles. Administrators have comprehensive control over system configuration, payment approvals, and access to analytics, ensuring efficient operation and financial transparency.

**Custom Domain:** https://payback247.com

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Schema**:
    - `users`: Authentication, profile data, binary and matrix positions.
    - `activations`: Activation lifecycle, matrix uplines tracking.
    - `activation_payments`: Tracking 8 payment slots per activation.
    - `system_config`: Dynamic system configuration.
- **Migrations**: Drizzle Kit.
- **Validation**: Zod schemas for payment operations.
- **Transaction Guarantees**: Atomic creation of activations and payments.

### Object Storage
- **Provider**: Replit Object Storage (Google Cloud Storage-backed).
- **Service**: `ObjectStorageService` for presigned URLs, file serving, ACL management.
- **Uploader**: `ObjectUploader` (React component with Uppy) for file uploads (images, PDFs, max 10MB).
- **Use Cases**: Payment proof uploads, user documents, profile images.

### Authentication & Authorization
- **Authentication**: Email/password authentication with bcrypt hashing.
- **Session Management**: Express sessions with PostgreSQL store.
- **Role Detection**: Admin/user roles stored in database.
- **User IDs**: Auto-generated sequential IDs (PB10000+), admin is PB0.
- **Binary Leg Auto-Assignment**: Automatically assigns to the leg with fewer members for balanced tree growth if not specified.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 payments: Direct Sponsor (Slot 0), Binary Match (Slot 1), Creator Fee (Slot 2), Matrix Levels 1-5 (Slots 3-7).
- **Dynamic Configuration**: Payment amounts, binary matching rules, and matching ratio are admin-configurable.
- **Admin Fallback**: Payments automatically route to admin if eligible receiver is unavailable.
- **Payment Mode**: Manual INR payments via UPI with UTR/Transaction ID and optional proof upload.
- **Payment Flow**: User submits UTR/proof, receiver confirms/rejects (with reason), user can resubmit.
- **Payment Status Tracking**: Pending, Submitted, Confirmed, Rejected.
- **Profile Completion Enforcement**: Users must complete profile details before requesting activation.

### Key Application Pages

#### User Pages
- **Activation Page (`/user/activation`)**: Guides users through the 8-payment process, displaying admin payment details and payment submission options.
- **Confirmation Page (`/user/confirmation`)**: Displays payments pending user confirmation.
- **Profile Page (`/user/profile`)**: User profile management.
- **Global Matrix Page (`/user/global-matrix`)**: Visualizes user's position in the global 2x5 matrix system with interactive tree visualization and matrix statistics.
- **Income Dashboard (`/user/dashboard`)**: Provides an overview of total income, direct sponsor, binary match, and matrix income, with visual tree previews and clickable summaries leading to detailed income pages.
- **Income Details Page (`/user/income/:type`)**: Displays full tree visualization (BinaryTreeView or MatrixTreeView), matrix level breakdown, and income statistics for specific income types.

#### Admin Pages
- **Admin Dashboard (`/admin`)**: Overview of system metrics and quick access to admin functions.
- **Payment Confirmations (`/admin/payments`)**: Admin approval queue for offline payment proofs.
- **Payments Report (`/admin/payments-report`)**: Comprehensive confirmed payments report with summaries and detailed tables.
- **System Configuration (`/admin/config`)**: Dynamic configuration for payment amounts, binary matching rules, and admin UPI details.
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