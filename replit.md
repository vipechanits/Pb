# PAYBACK247 - P2P MLM Platform (Non-Blockchain)

## Overview
PAYBACK247 is a peer-to-peer MLM platform being converted from blockchain-based to traditional full-stack web application. The system supports binary pairing income, multi-level matrix rewards, and manual payment tracking with admin approval. The platform allows users to activate accounts, build referral networks, track earnings, and manage profiles, while administrators can configure the system, approve payments, and access analytics.

## Current Status (November 9, 2025)
**✅ PHASE 3 COMPLETE: Payment Activation & Confirmation System**
**✅ Landing Page & Referral System Complete**
**✅ Activation Request Flow: Transactional & Race-Condition Safe**

The application has been successfully converted from Web3 to traditional authentication with complete payment workflow:
- ✅ **Phase 1 Complete**: Removed blockchain dependencies (ethers.js, Web3Context, smart contract hooks)
- ✅ **Phase 2 Complete**: Traditional authentication system implemented with security features
  - Email/password authentication with bcrypt hashing
  - Session management with PostgreSQL store (connect-pg-simple)
  - CSRF protection using csurf middleware with automatic retry logic
  - Session secret validation (fails fast if missing)
  - Profile management with payment details and QR code generation
  - Admin user seeded (payback2472000@gmail.com / admin with userId PB0)
  - **User ID auto-generation**: New users get sequential IDs starting from PB10000
  - **Logout functionality**: Sidebar footer with logout button
  - **User Dashboard UI**: Stats cards, welcome message, referral links at top
- ✅ **Landing Page**: Public marketing page with hero, features, income streams, FAQ, footer
- ✅ **Referral System**: Left/right leg placement tracking, social sharing (WhatsApp, Telegram, Facebook, X)
- ✅ **Phase 3 Complete**: Payment activation and confirmation workflow
  - **8-Slot Payment System**: Direct Sponsor (₹1,000), Binary Match (₹1,000), Creator Fee (₹500), Matrix Levels 1-5 (₹500 each)
  - **Transactional Creation**: Activation + 8 payments created atomically in single database transaction
  - **Race Condition Prevention**: Unique constraint on `activations.payer_wallet` prevents duplicate requests
  - **Collision-Safe IDs**: UUID-based activation IDs (ACT-{userId}-{uuid}) prevent timestamp collisions
  - **Payment Submission**: Users submit UTR/Transaction ID with optional proof upload
  - **Payment Confirmation**: Receivers can confirm or reject payments with reasons
  - **Unlimited Resubmission**: Rejected payments can be resubmitted indefinitely
  - **Submission Tracking**: Tracks submission attempts and rejection reasons
  - **Secure Authorization**: All endpoints verify user permissions (payer, receiver, or admin)
  - **Object Storage Integration**: Payment proofs stored in Replit Object Storage
- 🔄 **Phase 4 In Progress**: Admin payment management and system configuration

**Authentication System:**
- ✅ Backend: API routes for signup, login, logout, profile management
- ✅ Frontend: Signup, login, forgot password, profile pages with proper UI
- ✅ Security: CSRF tokens, session persistence, protected routes
- ✅ User IDs: Auto-generated starting from PB10000 (admin is PB0)
- ✅ Testing: E2E auth flow tested and passing

**UI Improvements:**
- ✅ User dashboard: Clean stats-based UI with earnings, referrals, binary, matrix metrics
- ✅ Sidebar: Shows logged-in user ID, logout button in footer
- ✅ Removed all "Under Construction" placeholder messages

**Landing Page & Referral Links:**
- ✅ Public landing page: Hero section, benefits, income streams, 2+5 matrix info, FAQ
- ✅ Referral link generation: Separate links for left/right leg binary placement
- ✅ Social sharing: WhatsApp, Telegram, Facebook, X integration
- ✅ Signup flow: Auto-populate sponsor ID and leg from URL params (?ref=PB0&leg=left)
- ✅ Database: binary_leg enum column added to users table
- ✅ Profile page: Tabs for Profile Details and Referral Links

**Dashboard Pages Updated:**
- ✅ Admin Dashboard: Platform stats, system status, quick actions
- ✅ Admin Payments: Payment approval queue interface
- ✅ Admin Settings: Payment configuration, domain settings, admin wallet
- ✅ Admin Users: User management with search and detail view
- ✅ Direct Sponsoring: Referral tracking and sponsor income
- ✅ Binary Matching: Binary tree visualization info
- ✅ Matrix Income: Matrix levels and earnings tracking
- ✅ User Confirmation: Confirm/reject received payments with unlimited resubmission
- ✅ User Activation: 8-slot payment submission with proof upload and status tracking
- ✅ Reentry: Reentry system information
- ✅ Additional Reentry: Additional position purchase

**Components Needing Implementation:**
- NetworkBadge, PaymentModeSelector (for future payment functionality)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack React Query for server state, local component state for UI.
- **UI**: shadcn/ui (Radix UI + Tailwind CSS) following Material Design principles.
- **Authentication** (To Be Implemented): Email/password login with session management.
- **Design System**: Tailwind CSS, custom themes, Inter and JetBrains Mono fonts, 8px grid spacing.

### Backend
- **Server Framework**: Express.js with TypeScript (Node.js).
- **API Structure**: RESTful API (`/api` prefix) for development tooling and potential off-chain data.
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple).

### Data Storage
- **Database**: PostgreSQL (Neon serverless).
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema**: 
  - `users` table for authentication with user IDs (PB10000+)
    - Unique constraints: `email`, `user_id`
  - `activations` table tracking activation lifecycle (payer, sponsor, binary match, 5 matrix uplines)
    - Unique constraint: `payer_wallet` (prevents duplicate activations)
    - ID format: ACT-{userId}-{uuid}
  - `activation_payments` table tracking individual payment obligations with:
    - 8 payment slots per activation (slot_index 0-7)
    - Payment status enum (column: `payment_status`): pending, submitted, confirmed, rejected
    - Payer and receiver user IDs
    - UTR/Transaction ID and proof URL
    - Submission count and rejection tracking
    - Timestamps for submission, confirmation, and rejection
- **Migrations**: Drizzle Kit with `npm run db:push --force` for schema synchronization.
- **Validation**: Zod schemas enforce enum types and required fields for all payment operations.
- **Transaction Guarantees**: `createActivationWithPayments()` ensures atomic activation + payment creation.

### Object Storage
- **Provider**: Replit Object Storage (Google Cloud Storage-backed).
- **Service**: `ObjectStorageService` for presigned URLs, file serving, ACL management.
- **Uploader**: `ObjectUploader` (React component with Uppy) for file uploads (images, PDFs, max 10MB).
- **Use Cases**: Payment proof uploads, user documents (KYC), profile images.
- **File Access**: Public via `/objects/:objectPath`, private with ACL-based owner verification.

### Authentication & Authorization
- **Authentication**: Email/password authentication with bcrypt password hashing.
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple).
- **Role Detection**: Admin/user roles stored in database user table.
- **User IDs**: Auto-generated sequential IDs (PB10000, PB10001, etc.). Admin user has PB0.
- **Logout**: Available in sidebar footer, destroys session and redirects to login page.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 separate payments:
  1. **Direct Sponsor** (Slot 0): Payment to user's sponsor
  2. **Binary Match** (Slot 1): Payment to matched binary user in global FIFO
  3. **Creator Fee** (Slot 2): Platform creator fee
  4. **Matrix Levels 1-5** (Slots 3-7): Payments to 5 matrix upline levels
  
- **Admin Fallback**: When eligible receiver is unavailable (no sponsor, no binary match, no matrix upline), payment automatically goes to admin (receiverType: 'admin', receiverUserId: null).

- **Payment Mode** (Offline Only):
    - **Manual INR Payments**: Google Pay, Paytm, PhonePe via UPI
    - UTR/Transaction ID required, payment proof optional
    
- **Payment Flow**:
  1. **Submit**: User enters UTR and optionally uploads payment screenshot (status: pending → submitted)
  2. **Review**: Receiver views submission in confirmation page
  3. **Confirm**: Receiver confirms payment (status: submitted → confirmed)
  4. **Reject**: Receiver rejects with reason (status: submitted → rejected)
  5. **Resubmit**: User can resubmit unlimited times if rejected (submissionCount increments)
  
- **Payment Status Tracking**: 
  - **Pending**: Payment slot created, no submission yet
  - **Submitted**: User submitted UTR and proof, awaiting receiver confirmation
  - **Confirmed**: Receiver confirmed payment receipt
  - **Rejected**: Receiver rejected with reason, can resubmit
  
- **Security**:
  - Users can only submit proofs for their own payments (payer check)
  - Only receivers or admins can confirm/reject payments
  - Users can only view their own payment lists (except admins)

## Key Application Pages

### Activation Page (`/user/activation`)
**Purpose**: Guide users through 8-payment activation process

**Features**:
- **Summary Dashboard**: Shows total payments (8), completed count, pending count
- **Payment Checklist**: Lists all 8 payment slots with:
  - Payment label (Direct Sponsor, Binary Match, Creator Fee, Matrix Levels 1-5)
  - Receiver user ID or "Admin Wallet" badge (when receiver unavailable)
  - Amount in INR (₹1,000 / ₹500)
  - Payment status: Confirmed ✅, Pending Review ⚠️, Rejected ❌, Not Paid ⭕
  - "Pay Now" button for unpaid slots
  
- **Payment Submission Dialog**: 
  - **Receiver Payment Details** (displayed in card):
    - Account Holder Name (with copy-to-clipboard)
    - Mobile Number (with copy-to-clipboard)
    - UPI ID (with copy-to-clipboard)
    - IFSC Code (with copy-to-clipboard)
    - Bank Account Holder
    - **QR Code**: Auto-generated UPI QR code for scanning with payment apps
  - **UTR Entry**: Enter transaction ID from payment app (required)
  - **Proof Upload**: Upload payment screenshot or PDF (optional, max 10MB)
  - **Resubmission**: Rejected payments can be resubmitted with new UTR/proof
  
- **Object Storage Integration**: 
  - File upload for payment proofs
  - Supports images and PDFs up to 10MB
  - Stores proofs in Replit Object Storage
  - Returns public URL for receiver verification
  
- **API Endpoint**: `GET /api/users/payment-details/:userId` - Fetches receiver's payment info and generates QR code
  
- **Test IDs**: All interactive elements tagged for automated testing (payment-slot-{0-7}, button-pay-{0-7}, input-utr, input-proof-file, etc.)

### Confirmation Page (`/user/confirmation`)
**Purpose**: Shows payments pending user confirmation

### Admin Payments Page (`/admin/payments`)
**Purpose**: Admin approval queue for offline payment proofs

## API Endpoints

### Activation Management
- `POST /api/activations` - Create activation record (validated with Zod)
- `GET /api/activations/:id` - Get activation details
- `GET /api/activations/payer/:walletAddress` - Get activations by payer
- `PATCH /api/activations/:id/status` - Update activation status

### Payment Tracking
- `POST /api/activation-payments` - Create payment record (validated with Zod)
- `GET /api/activation-payments/activation/:activationId` - Get all 8 payments for activation
- `GET /api/activation-payments/receiver/:walletAddress` - Get payments for receiver
- `GET /api/activation-payments/receiver/:walletAddress/pending` - Get pending confirmations
- `POST /api/activation-payments/:id/confirm` - Confirm payment receipt
- `PATCH /api/activation-payments/:id/mode` - Update payment mode (web3/offline)

### Object Storage
- `POST /api/objects/upload` - Get presigned upload URL
- `PUT /api/payment-proofs` - Set ACL policy for uploaded proof

## External Dependencies

### Blockchain Services
- **Polygon Network**: RPC endpoint (https://rpc-amoy.polygon.technology/), block explorer (https://www.oklink.com/amoy/).
- **MetaMask Wallet**: Browser extension for wallet connectivity.

### UI Component Libraries
- **Radix UI**: Accessible, unstyled component primitives.
- **shadcn/ui**: Pre-built components combining Radix UI and Tailwind CSS.
- **Lucide React**: SVG icon library.

### Database
- **Neon Database**: Serverless PostgreSQL provider.
- **@neondatabase/serverless**: Connection pooling adapter.

### Development Tools
- **Vite**: Build tool and dev server (HMR, TypeScript, asset bundling).
- **Replit-specific plugins**: Runtime error overlay, Cartographer, development banner.

### Form & Validation
- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.
- **@hookform/resolvers**: Integration with React Hook Form.

### Data Fetching & Caching
- **TanStack React Query**: Async state management, caching, background refetching.

### Styling
- **Tailwind CSS**: Utility-first CSS framework.
- **PostCSS**: CSS processor (Autoprefixer).
- **class-variance-authority**: Type-safe component variants.
- **clsx & tailwind-merge**: Class name utilities.

### Third-Party Integrations
- **Google Fonts**: Inter, JetBrains Mono.
- **Date-fns**: Date manipulation and formatting.