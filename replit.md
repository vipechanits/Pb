# PAYBACK247 - P2P Income Platform

## Overview
PAYBACK247 is a peer-to-peer income platform for network marketing, featuring binary pairing income, multi-level matrix rewards, and a manual payment tracking system with administrator approval. The platform supports user account activation, referral network building, earnings monitoring, and profile management. Administrators can manage configurations, approve payments, and access analytics. Key capabilities include multi-cycle re-entry and routing of administrative fees and fallback payments to a central administrator (PB0). The platform is designed with a modular SaaS architecture, allowing for scalable and flexible feature management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend**: React with TypeScript (Vite)
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI**: shadcn/ui (Radix UI + Tailwind CSS) following Material Design, with custom themes.
- **Design System**: Tailwind CSS, Inter and JetBrains Mono fonts.
- **Mobile-First Design**: Responsive UI with mobile bottom navigation and quick actions.
- **Notification Sounds**: Web Audio API with double-chime for success and triple-chime for alerts.

### Technical Implementations
- **Backend**: Express.js with TypeScript (Node.js)
- **API Structure**: RESTful API (`/api` prefix)
- **Session Management**: Express sessions with PostgreSQL store.
- **Security Hardening**: Helmet.js, CSRF protection, rate limiting, DDoS protection, IP blocking, threat detection.
- **Authorization Model**: Row-level access control for sensitive data.
- **Authentication**: Email/password with bcrypt hashing and session management.
- **Role Detection**: Admin/user roles with PB0 as the root admin.
- **Object Storage**: Replit Object Storage (Google Cloud Storage-backed) for file serving and ACL management.
- **Multi-Cycle Support**: Each re-entry cycle has its own separate global matrix tree with unique positioning and independent income streams, stored per activation.
- **Binary Placement**: Supports exact placement, sponsor spillover (deep down), and global spillover (BFS), with a `UNIQUE(binaryParentId, binaryPlacementLeg)` constraint. Referral links are required for signup.
- **Payment Processing**: 8-payment activation system with dynamic, admin-configurable amounts. Manual INR payments via UPI with UTR/Transaction ID and optional proof upload. All payments require manual admin confirmation. Admin fees and fallback payments route to PB0.
- **Data Integrity**: Uses SERIALIZABLE transaction isolation, row-level locking, unique constraints, and advisory locks for payment and activation operations.
- **Backup & Restore**: Complete platform backup and restore capability for all database tables, with versioned backups and configurable auto-backup scheduling.
- **Payment Reports & Analytics**: Daily/weekly/monthly reports with receiver type filtering and CSV export.
- **Real-time Notifications**: WebSockets for instant notifications on payment submission, rejection, and confirmation.

### System Design Choices
- **Modular SaaS Architecture**: 8 independent modules (Registration, Activation, Binary, Matrix, Re-entry, Admin, Backup, Common) that can be enabled/disabled at runtime via an admin panel. This enhances scalability, allows independent development, optimizes performance, and enables SaaS tiers.
- **Network Marketing Structure**: Binary tree and global matrix starting from PB10000 (excluding admin PB0). Global matrix grows infinitely, with users earning from a 5-level downline (62 users maximum) per activation cycle.
- **Binary Placement Architecture**: Sponsorship (income tracking) is separate from binary placement (tree structure).
- **Comprehensive Security**: Implemented with strict CSP, HSTS, XSS protection, clickjacking prevention, tiered rate limiting, and DDoS protection.
- **Audit Logging**: Security audit logging for authentication attempts, admin actions, and payment operations.

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

## Deployment & Cost Optimization

### Replit Services (Paid)
1. **Autoscale Deployment**
   - Base fee: $1/month
   - Compute Units: $3.20 per million units (1 CPU second = 18 units, 1 RAM second = 2 units)
   - Requests: $1.20 per million requests
   - Billing: Only when app is actively serving requests (idle = $0)

2. **Object Storage** (Google Cloud Storage-backed)
   - Currently: 56 files in attached_assets/
   - Costs: Storage capacity, data transfer, basic/advanced operations

3. **External Services**
   - Neon PostgreSQL Database (external billing, not through Replit)

### Cost Optimization Strategies
1. **Polling Removed from Admin Pages** (November 2025)
   - Completely removed auto-refresh polling from admin pages for maximum cost savings
   - NotificationBell: No auto-refresh (manual refresh only)
   - Admin Dashboard: No auto-refresh (manual refresh only)
   - Admin Analytics: No auto-refresh (manual refresh only)
   - Sidebar: 30s refresh for user count updates

2. **Database Index Optimization** (November 2025)
   - Added 11 performance indexes to reduce query time and database active hours
   - **Users table**: userId, sponsorId, email, binaryParentId
   - **Activation Payments table**: payerUserId, receiverUserId, status, activationId
   - **Activations table**: payerWallet, status
   - **Notifications table**: userId, isRead, composite (userId+isRead)
   - **Expected Impact**: 30-50% reduction in database compute hours
   
2. **Request Optimization**
   - Leverage TanStack Query caching to minimize redundant API calls
   - Autoscale deployment only charges for actual requests served
   - Idle periods incur no compute costs

3. **Database Cost Management**
   - Using external Neon database (avoids Replit database billing)
   - Database enters idle state after 5 minutes of inactivity
   - Reactivates instantly on next query

4. **Best Practices**
   - Monitor usage via Replit's usage dashboard
   - Set up budget alerts in account settings
   - Review compute unit consumption monthly
   - Consider disabling auto-backup during development to reduce database activity