# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform for network marketing, featuring binary pairing income, multi-level matrix rewards, and a manual payment tracking system with administrator approval. The platform enables user account activation, referral network building, earnings monitoring, and profile management. Administrators can manage configurations, approve payments, and access analytics. A key capability is multi-cycle re-entry, allowing users to earn from subsequent matrix completions, with all administrative fees and fallback payments routed to the central administrator (PB0).

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **Routing**: Wouter.
- **State Management**: TanStack React Query.
- **UI**: shadcn/ui (Radix UI + Tailwind CSS) following Material Design, with custom themes.
- **Authentication**: Email/password login with session management.
- **Design System**: Tailwind CSS, Inter and JetBrains Mono fonts.
- **Mobile-First Design**: Responsive UI with mobile bottom navigation and quick actions.
- **Notification Sounds**: Web Audio API with double-chime for success and triple-chime for alerts.

### Backend
- **Server Framework**: Express.js with TypeScript (Node.js).
- **API Structure**: RESTful API (`/api` prefix).
- **Session Management**: Express sessions with PostgreSQL store.
- **Security Hardening**: Helmet.js, CSRF protection, rate limiting, DDoS protection.
- **Authorization Model**: Row-level access control for payments, binary trees, and income data.

### Data Storage
- **Database**: PostgreSQL (Neon serverless).
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema**: Users, activations, activation payments, system configuration, and `activation_matrix_positions` for multi-cycle matrix positioning.
- **Migrations**: Drizzle Kit with safe migrations (`npm run db:push`).
- **Validation**: Zod schemas.
- **Transaction Guarantees**: Atomic creation of activations and payments with SERIALIZABLE isolation and row-level locking to prevent race conditions.

### Object Storage
- **Provider**: Replit Object Storage (Google Cloud Storage-backed).
- **Service**: `ObjectStorageService` for presigned URLs, file serving, ACL management.

### Authentication & Authorization
- **Authentication**: Email/password with bcrypt hashing.
- **Session Management**: Express sessions with PostgreSQL store.
- **Role Detection**: Admin/user roles.
- **User IDs**: Auto-generated sequential IDs (PB10000+).
- **Admin User**: PB0 (Root Admin) with environment-driven credentials.
- **Payment Authorization**: Only the designated receiver can confirm or reject payments.
- **Data Access Authorization**: Users can only view their own payment details; admins can view any user's details.

### Network Marketing Structure
- **Binary Tree & Global Matrix**: Both trees start from PB10000, excluding admin (PB0).
- **Root Node Handling**: First non-admin user to activate becomes the root.
- **Binary Matching**: Uses entire self team for 3:3 pair counting, with initial 1+1 qualification from personal counts.
- **Admin Role**: PB0 acts as payment receiver and system administrator only.
- **Matrix Growth**: Global matrix grows infinitely, with users earning from their 5-level downline (62 users maximum) independently per activation cycle.
- **Multi-Cycle Support**: Each re-entry cycle has its own separate 2x∞ global matrix tree with unique positioning and independent income streams.
- **Activation-Scoped Matrix Positioning**: Matrix positions are stored per activation.

### Binary Placement Architecture
- **Separation of Concerns**: Sponsorship (income tracking) separate from binary placement (tree structure).
- **Unique Position Constraint**: Database enforces `UNIQUE(binaryParentId, binaryPlacementLeg)`.
- **URL-Based Placement with Spillover**: 3-tier priority system:
  1. Exact Placement at sponsor's requested leg.
  2. Sponsor Spillover (DEEP DOWN): Depth-first search in sponsor's downline.
  3. Global Spillover (BFS): Breadth-first search across entire global tree.
- **Referral Link Required**: Users must sign up via `?ref=PB10000&leg=left` URLs.
- **Binary Leg Auto-Assignment**: Automatically assigns to the leg with fewer members if not specified during signup.
- **Default Sponsor Assignment**: New users without a sponsor ID are automatically assigned PB10000 as sponsor.

### Payment Processing
- **8-Payment Activation System**: Each user activation requires 8 payments: Direct Sponsor (Slot 0), Binary Match (Slot 1), Top Reward Payment (Slot 2), Matrix Levels 1-5 (Slots 3-7).
- **Dynamic Configuration**: Payment amounts, binary matching rules, and matching ratio are admin-configurable.
- **Admin Fee Routing**: All admin fees and fallback payments route exclusively to PB0.
- **Payment Mode**: Manual INR payments via UPI with UTR/Transaction ID and optional proof upload.
- **Payment Flow**: User submits UTR/proof, receiver confirms/rejects, user can resubmit.
- **Payment Status Tracking**: Pending, Submitted, Confirmed, Rejected.
- **Manual Confirmation Required**: All payments require manual confirmation by PB0 admin.
- **Profile Completion Enforcement**: Users must complete profile details before requesting activation.
- **Deferred Income Creation**: Sponsor and matrix income created after full activation; binary match and top reward incomes created immediately.
- **Automatic Re-entry**: System automatically detects matrix completion (62 users) and marks users eligible for re-entry.
- **Sound Feedback**: Double-chime plays on payment confirmation; triple-chime on payment rejection.

### Security
- **Hardening**: Helmet.js with strict CSP, HSTS, XSS protection, clickjacking prevention.
- **Rate Limiting**: Tiered rate limiting for auth, payment, admin, and general API endpoints.
- **DDoS Protection**: `express-slow-down`.
- **IP Blocking**: IP-based blocking system with suspicious activity tracking.
- **Threat Detection**: Smart pattern detection for SQL injection, XSS, path traversal.
- **Validation**: Request size limits and payload validation.
- **Auditing**: Security audit logging for auth attempts, admin actions, and payment operations.
- **Data Integrity Protection** (2025-11-19):
  - SERIALIZABLE transaction isolation for all financial operations
  - Row-level locking (SELECT FOR UPDATE) to prevent race conditions
  - Unique constraints on binary positions: `UNIQUE(binaryParentId, binaryPlacementLeg)`
  - Advisory locks with timeout protection for duplicate UTR prevention
  - Atomic binary placement with slot finding inside transactions
  - Duplicate income prevention checks in payment workflows
- **Access Control** (2025-11-21):
  - Users can only view their own payment details
  - Admins can view any user's payment details
  - Payment authorization verified before confirmation/rejection
  - No sensitive data exposure in error messages

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
- **TypeScript**: Static typing.

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

## Recent Updates (2025-11-21)

### Security & Quality Fixes
1. **Fixed all TypeScript errors** (7 diagnostics resolved):
   - Fixed null type safety in profile updates (routes.ts:1612)
   - Fixed implicit `any` type in reducer functions (storage.ts:3015)
   - Fixed database reference errors in notification methods (storage.ts:3835-3857)
   - Fixed null coalescing in notification names (storage.ts:2407)

2. **Enhanced API Security**:
   - Added authorization layer to `/api/users/payment-details/:userId`
   - Only admins or the user themselves can view payment details
   - Returns 403 Forbidden for unauthorized access attempts

3. **Improved Error Handling**:
   - Payment rejection returns actual validation error messages with 400 status
   - No internal error details exposed in 500 responses

4. **Sound Feedback System**:
   - Implemented `playSuccessSound()` (double-chime) for confirmations
   - Implemented `playAlertSound()` (triple-chime) for rejections
   - Sound muting preference stored in localStorage
   - Web Audio API with proper envelope design

### Deployment Configuration
- Configured for autoscale deployment on Replit
- Build: `npm run build`
- Run: `npm run start`
- Ready for production publishing

## Deployment Status
✅ **PRODUCTION READY**
- All security vulnerabilities resolved
- TypeScript compilation errors fixed
- API authorization properly implemented
- Payment confirmation/rejection fully functional
- Real-time WebSocket notifications active
- Deployment configuration set for autoscale
