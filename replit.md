# PAYBACK247 - P2P MLM Platform (Non-Blockchain)

## Overview
PAYBACK247 is a peer-to-peer MLM platform being converted from blockchain-based to traditional full-stack web application. The system supports binary pairing income, multi-level matrix rewards, and manual payment tracking with admin approval. The platform allows users to activate accounts, build referral networks, track earnings, and manage profiles, while administrators can configure the system, approve payments, and access analytics.

## Current Status (November 9, 2025)
**✅ PHASE 2 COMPLETE: Authentication System Implemented**

The application has been successfully converted from Web3 to traditional authentication:
- ✅ **Phase 1 Complete**: Removed blockchain dependencies (ethers.js, Web3Context, smart contract hooks)
- ✅ **Phase 2 Complete**: Traditional authentication system implemented with security features
  - Email/password authentication with bcrypt hashing
  - Session management with PostgreSQL store (connect-pg-simple)
  - CSRF protection using csurf middleware
  - Session secret validation (fails fast if missing)
  - Profile management with payment details and QR code generation
  - Admin user seeded (payback2472000@gmail.com / admin)
- 🔄 **Phase 3 In Progress**: Rebuild dashboard pages with activation/MLM system
- ⏳ **Phase 4 Pending**: Implement admin approval workflow for manual payments

**Authentication System:**
- ✅ Backend: API routes for signup, login, logout, profile management
- ✅ Frontend: Signup, login, forgot password, profile pages
- ✅ Security: CSRF tokens, session persistence, protected routes
- ✅ Testing: Core auth flow tested successfully

**Files Stubbed (Need Rebuilding for MLM System):**
- Pages: user-dashboard, binary-matching, matrix-income, direct-sponsoring, admin-payments, reentry, additional-reentry, admin-dashboard
- Components: WalletButton (can be removed), NetworkBadge, PaymentModeSelector

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
  - `users` table for authentication
  - `activations` table tracking activation lifecycle (payer, sponsor, binary match, 5 matrix uplines)
  - `activation_payments` table tracking individual payment obligations (8 payments per activation)
- **Migrations**: Drizzle Kit with `npm run db:push` for schema synchronization.
- **Validation**: Zod schemas enforce enum types (payment_type, receiver_type, payment_mode, activation_status) and required fields.

### Object Storage
- **Provider**: Replit Object Storage (Google Cloud Storage-backed).
- **Service**: `ObjectStorageService` for presigned URLs, file serving, ACL management.
- **Uploader**: `ObjectUploader` (React component with Uppy) for file uploads (images, PDFs, max 10MB).
- **Use Cases**: Payment proof uploads, user documents (KYC), profile images.
- **File Access**: Public via `/objects/:objectPath`, private with ACL-based owner verification.

### Authentication & Authorization (To Be Implemented)
- **Authentication**: Email/password authentication with bcrypt password hashing.
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple).
- **Role Detection**: Admin/user roles stored in database user table.
- **User IDs**: Auto-incrementing integer IDs (PB1, PB2, etc.) replacing wallet addresses.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 separate payments:
  1. **Direct Sponsor** (Slot 0): Payment to user's sponsor
  2. **Binary Match** (Slot 1): Payment to matched binary user in global FIFO
  3. **Creator Fee** (Slot 2): Platform creator fee
  4. **Matrix Levels 1-5** (Slots 3-7): Payments to 5 matrix upline levels
  
- **Admin Fallback**: When eligible receiver is unavailable (no sponsor, no binary match, no matrix upline), payment automatically goes to admin wallet (displayed as "Admin Wallet" with grey badge in UI).

- **Payment Mode** (Manual Only):
    - **Offline Payments**: UTR/Transaction ID + optional proof upload
    - User initiates payment → enters UTR → uploads proof → admin approves
    
- **Payment Flow**:
  - User views 8-payment checklist showing receivers, amounts (USDT/INR), and status
  - Each unpaid slot has "Pay Now" button opening payment dialog
  - User selects Web3 or Offline mode
  - Web3: USDT approval → on-chain payment → immediate verification
  - Offline: UTR entry → proof upload (optional) → admin verification required
  
- **Payment Tracking**: 
  - Smart contract stores: receivers[8], amounts[8], paid[8], verifiedOnchain[8], modes[8], proofs[8]
  - Database mirrors activation data for off-chain analytics
  - Real-time status updates from blockchain via `getUserActivationData()`

## Key Application Pages

### Activation Page (`/user/activation`)
**Purpose**: Guide users through 8-payment activation process

**Features**:
- **Summary Dashboard**: Shows total payments (8), completed count, pending count
- **Payment Checklist**: Lists all 8 payment slots with:
  - Payment label (Direct Sponsor, Binary Match, Creator Fee, Matrix Levels 1-5)
  - Receiver wallet address or "Admin Wallet" badge (when receiver unavailable)
  - Amount in USDT and INR (1:100 conversion ratio)
  - Payment status: Completed ✅, Pending Verification ⚠️, Pending ⭕
  - "Pay Now" button for unpaid slots
  
- **Payment Dialog**: 
  - Radio selection: Web3 Payment (on-chain) or Offline Payment (with proof)
  - Web3 mode: Approve USDT → Execute payment
  - Offline mode: Enter UTR → Upload proof (optional) → Submit
  - Real-time amount display in dual currency
  
- **Object Storage Integration**: 
  - File upload via Uppy/ObjectUploader component
  - Supports images and PDFs up to 10MB
  - Stores proofs in Replit Object Storage
  - Returns public URL for admin verification
  
- **Smart Contract Integration**:
  - Fetches activation data: `contract.getActivation(address)`
  - Fetches activation fee: `contract.activationFeeUSDT()`
  - Web3 payment: `contract.payIndividuallyWeb3(slotIndex)`
  - Offline proof: `contract.submitOfflineProof(slotIndex, utr, proofUrl)`
  
- **Test IDs**: All interactive elements tagged for automated testing (payment-slot-{0-7}, button-pay-{0-7}, radio-web3, radio-offline, etc.)

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