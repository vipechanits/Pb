# PAYBACK247 - P2P Income Platform

A comprehensive multi-level marketing platform featuring binary tree sponsorship, global F IFO matrix placement, peer-to-peer activation payments, and multiple income streams.

**Live Site**: https://payback247.com

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [GitHub Setup](#github-setup)
- [Deployment](#deployment)
- [Income Streams](#income-streams)
- [Database Management](#database-management)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development vs Production](#development-vs-production)
- [Contributing](#contributing)

## Overview

PAYBACK247 is a peer-to-peer income platform that enables users to build networks, activate accounts through an 8-payment system, and earn through multiple income streams including binary pairing, matrix rewards, and direct sponsoring commissions.

### Core Concepts

- **Binary Tree**: Build left and right leg teams with automatic balanced placement
- **Global 2×5 Matrix**: FIFO placement system generating ₹31,000 per cycle (62 positions × ₹500)
- **8-Payment Activation**: Transparent payment tracking with admin approval workflow
- **Delayed ID Assignment**: Users receive PB#### IDs only after completing activation
- **Multiple Income Streams**: Earn from sponsoring, binary matching, matrix positions, and re-entries

## Key Features

### User Features

✅ **Social Media Sharing** - One-click referral sharing on WhatsApp, Facebook, Twitter, Telegram, LinkedIn  
✅ **Real-time Notifications** - Sound alerts for payment confirmations and approvals  
✅ **Binary Tree Visualization** - Interactive tree showing your network structure  
✅ **Global Matrix View** - See your position in the 2×5 matrix system  
✅ **Income Dashboard** - Track all income streams with detailed breakdowns  
✅ **Payment Tracking** - Submit and track all 8 activation payments  
✅ **Profile Management** - Complete profile with avatar and details  
✅ **Re-entry System** - Automatic re-entry after matrix completion  

### Admin Features

✅ **Payment Approval System** - Manage offline payment confirmations with UTR tracking  
✅ **System Configuration** - Dynamic configuration of payment amounts and matching rules  
✅ **User Management** - Comprehensive admin panel for user oversight  
✅ **Analytics Dashboard** - Track platform growth, payments, and network metrics  
✅ **Database Backup/Restore** - Full database export/import with safety features (**PB1 only**)  
✅ **Payments Reporting** - Detailed confirmed payments reports with summaries  

### Technical Features

✅ **Transactional Safety** - Atomic database operations ensuring data consistency  
✅ **Object Storage** - File uploads for payment proofs using Replit Object Storage  
✅ **Session Management** - Secure PostgreSQL-backed sessions  
✅ **Email Notifications** - Automated emails for important events  
✅ **Responsive Design** - Works seamlessly on mobile and desktop  
✅ **Professional Branding** - Custom logo and modern UI/UX  

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Wouter** for client-side routing
- **TanStack React Query v5** for server state management
- **shadcn/ui** components (Radix UI + Tailwind CSS)
- **Lucide React** for icons
- **Framer Motion** for animations
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **PostgreSQL 16** (Neon serverless)
- **Drizzle ORM** for type-safe database operations
- **Express Sessions** with PostgreSQL store (connect-pg-simple)
- **Bcrypt** for password hashing
- **CSRF protection**
- **Zod** for validation

### Infrastructure
- **Replit** for hosting and deployment
- **Replit Object Storage** (Google Cloud Storage backed)
- **Neon Database** for PostgreSQL
- **Custom domain support**: payback247.com
- **Autoscale deployment** for cost efficiency

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (provided by Replit)
- SMTP credentials for email notifications

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/payback247.git
cd payback247
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file or configure Replit Secrets:
```env
# Database (automatically provided by Replit)
DATABASE_URL=postgresql://...

# Session (REQUIRED - generate a secure random string)
SESSION_SECRET=your-secure-random-string-here

# Email Configuration (REQUIRED for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=PAYBACK247 <noreply@payback247.com>
```

4. **Push database schema:**
```bash
npm run db:push
```

5. **Start development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## GitHub Setup

### First-Time Setup

#### 1. Create GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/your-username/payback247.git

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Complete PAYBACK247 platform"

# Push to GitHub
git push -u origin main
```

#### 2. Connect Replit to GitHub

1. Open your Replit workspace
2. Click the **Git** icon in the left sidebar
3. Click **Connect to GitHub**
4. Authorize Replit to access your GitHub account
5. Select your repository
6. Click **Connect**

#### 3. Automatic Deployments

Once connected, every push to GitHub will trigger automatic deployment:

```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push origin main
```

Replit will automatically:
- Pull the latest code
- Run `npm install`
- Run build process
- Deploy to production

### Importing Existing GitHub Repository to Replit

#### Method 1: Rapid Import (Public Repositories)

Visit: `https://replit.com/github/your-username/payback247`

This automatically:
- Imports the repository
- Sets up the environment
- Configures workflows
- Starts the application

#### Method 2: Guided Import (Public or Private)

1. Go to https://replit.com/import
2. Select **GitHub**
3. Connect your GitHub account (if not already connected)
4. Search for `payback247` repository
5. Click **Import**
6. Replit will configure everything automatically

### Best Practices

1. **Use Branches for Features**
```bash
git checkout -b feature/new-income-stream
# Make changes
git commit -m "Add new income calculation"
git push origin feature/new-income-stream
# Create Pull Request on GitHub
```

2. **Keep Production Stable**
```bash
# Only merge to main when features are tested
git checkout main
git merge feature/new-income-stream
git push origin main
```

3. **Use Meaningful Commit Messages**
```bash
# Good
git commit -m "Fix binary tree placement algorithm"
git commit -m "Add WhatsApp share button to referral links"

# Bad
git commit -m "fix"
git commit -m "update"
```

## Deployment

### Deploy to Replit (Recommended)

#### 1. Configure Deployment

The `.replit` file is already configured for autoscale deployment:
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "start"]
```

#### 2. Deploy

1. Click **"Deploy"** button at top of Replit workspace
2. Choose **"Autoscale Deployment"**
3. Review settings
4. Click **"Deploy"**

Your app will be live at: `https://your-app-name.replit.app`

#### 3. Set Up Custom Domain

1. Go to deployment settings
2. Click **"Add Custom Domain"**
3. Enter `payback247.com`
4. Update DNS records:
```
Type: CNAME
Name: www
Value: your-app-name.replit.app

Type: A
Name: @
Value: [IP provided by Replit]
```

5. Wait for DNS propagation (up to 48 hours)

### Environment Variables for Production

Ensure these secrets are set in your deployment:

**Required:**
- `SESSION_SECRET` - Secure random string for sessions
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` - Email configuration

**Automatic:**
- `DATABASE_URL` - Production database connection (automatically set by Replit)

### First-Time Production Setup

1. **Visit your production URL**: `https://payback247.com`
2. **Root admin account** (PB0):
   - Auto-created on first server start
   - Email: admin@payback247.com
   - **Change default password immediately after first login**
3. **Configure system settings** at `/admin/config`:
   - Payment amounts
   - Binary matching rules
   - Admin UPI details for payments

## Income Streams

### 1. Direct Sponsor Income
- **₹1,000** per direct referral (default, configurable)
- Paid to the person who recruited the user
- Instant credit upon activation completion

### 2. Binary Matching Income
- Earned when both left and right legs have activations
- Amount configurable by admin (default ₹1,000)
- Encourages balanced team building
- Matching ratio configurable (e.g., 1:1, 1:2, etc.)

### 3. Matrix Income (2×5 Global Matrix)
- **62 positions** per cycle:
  - Level 1: 2 positions
  - Level 2: 4 positions
  - Level 3: 8 positions
  - Level 4: 16 positions
  - Level 5: 32 positions
- **₹500 per position** = **₹31,000 total per cycle**
- First-in-first-out (FIFO) placement
- Automatic spillover to upline
- Re-entry available after cycle completion

### 4. Re-entry Income
- Earn from downline re-entries in the matrix
- Maintain passive income stream
- Automatic re-entry or manual trigger

## 8-Payment Activation System

Each activation requires 8 payments to different receivers:

| Slot | Payment Type | Default Amount | Receiver | Notes |
|------|-------------|----------------|----------|-------|
| 0 | Direct Sponsor | ₹1,000 | Your sponsor | Person who referred you |
| 1 | Binary Match | ₹1,000 | Admin/Matcher | Admin or binary match partner |
| 2 | Creator Fee | ₹625 | Admin (PB0) | Platform maintenance |
| 3 | Matrix Level 1 | ₹500 | Level 1 upline | Immediate upline in matrix |
| 4 | Matrix Level 2 | ₹500 | Level 2 upline | 2nd level upline |
| 5 | Matrix Level 3 | ₹500 | Level 3 upline | 3rd level upline |
| 6 | Matrix Level 4 | ₹500 | Level 4 upline | 4th level upline |
| 7 | Matrix Level 5 | ₹500 | Level 5 upline | 5th level upline |

**Total Activation Cost**: ₹5,125 (configurable by admin)

### Payment Process

1. User requests activation
2. System creates 8 payment slots with receivers
3. User submits each payment with:
   - UTR/Transaction ID
   - Optional proof upload (image/PDF)
4. Receiver confirms or rejects
5. If rejected, user can resubmit
6. After all 8 payments confirmed:
   - User receives PB#### ID (e.g., PB10000)
   - Placed in binary tree
   - Placed in global matrix
   - Income streams activated

## Database Management

**Root Admin Access (PB0 and PB1)**

### Database Backup

1. Go to `/admin/database`
2. Click **"Download Backup"**
3. System exports complete database as JSON
4. Includes:
   - All users and activation data
   - All payment records
   - System configuration
   - Metadata (timestamp, version, counts)

### Database Restore

1. Select backup JSON file
2. System automatically creates **pre-restore backup**
3. Confirmation dialog shows:
   - Backup date
   - Tables count
   - Users count
   - Payments count
4. Click **"Restore Database"**
5. Pre-restore backup automatically downloads
6. Database replaced with backup data

**Safety Features:**
- Automatic pre-restore backups
- Backup history tracking
- Validation before restore
- PB0 and PB1 admin access restriction
- Pre-restore backup download to prevent data loss

### Backup History

View all backups with:
- Filename
- File size
- Created by (user ID)
- Backup type (manual, pre-restore)
- Date created
- Notes

## Project Structure

```
payback247/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # shadcn/ui base components
│   │   │   ├── dashboard/      # Dashboard-specific components (7 files)
│   │   │   ├── app-sidebar.tsx # Main application sidebar
│   │   │   ├── ThemeToggle.tsx # Dark/light mode toggle
│   │   │   ├── BinaryTreeView.tsx
│   │   │   ├── MatrixTreeView.tsx
│   │   │   └── ObjectUploader.tsx
│   │   ├── pages/              # Page components
│   │   │   ├── auth/           # Authentication pages (login, signup, etc.)
│   │   │   ├── admin/          # Admin panel pages
│   │   │   │   └── database.tsx # Database backup/restore page
│   │   │   ├── user-dashboard.tsx
│   │   │   ├── user-activation.tsx
│   │   │   ├── user-binary-tree.tsx
│   │   │   ├── user-global-matrix.tsx
│   │   │   ├── user-income-details.tsx
│   │   │   └── landing.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── use-notification-sound.ts # Sound notifications
│   │   │   └── use-toast.ts
│   │   ├── lib/                # Utilities and helpers
│   │   │   ├── queryClient.ts  # React Query configuration
│   │   │   └── utils.ts
│   │   └── index.css           # Global styles and Tailwind config
│   └── index.html
├── server/                     # Backend Express application
│   ├── auth.ts                 # Authentication logic
│   ├── storage.ts              # Database operations (1300+ lines)
│   ├── routes.ts               # API routes (1780+ lines)
│   ├── income-service.ts       # Income calculation logic
│   ├── objectStorage.ts        # File upload/download service
│   ├── objectAcl.ts            # Object storage ACL management
│   └── index.ts                # Server entry point
├── shared/                     # Shared code between frontend and backend
│   └── schema.ts               # Database schema and Zod types
├── db/                         # Database migrations
│   └── migrations/
├── attached_assets/            # Static assets
│   └── payback247-logo.png    # Application logo
├── .replit                     # Replit configuration
├── replit.md                   # Detailed technical documentation
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## API Documentation

### Public Endpoints

```
GET  /api/system-config        # Get public system configuration
POST /api/auth/signup          # User registration
POST /api/auth/login           # User login
POST /api/auth/logout          # User logout
GET  /api/csrf-token           # Get CSRF token
```

### Authenticated User Endpoints

```
GET    /api/auth/me                      # Get current user
PATCH  /api/auth/profile                 # Update profile
GET    /api/activation                   # Get user activation status
POST   /api/activation/request           # Request activation
PATCH  /api/activation-payments/:id/submit # Submit payment proof
PATCH  /api/activation-payments/:id/confirm # Confirm payment (receiver)
PATCH  /api/activation-payments/:id/reject  # Reject payment (receiver)
GET    /api/payments/pending-confirmation # Get payments pending confirmation
GET    /api/binary-tree                  # Get binary tree data
GET    /api/matrix-tree                  # Get global matrix data
GET    /api/income/:type                 # Get income data by type
GET    /api/notifications                # Get user notifications
POST   /api/notifications/:id/read       # Mark notification as read
```

### Admin Endpoints

```
GET    /api/admin/payments               # Get pending payments
GET    /api/admin/payments-report        # Get confirmed payments report
PATCH  /api/admin/payments/:id/confirm   # Confirm payment (admin)
PATCH  /api/admin/payments/:id/reject    # Reject payment (admin)
GET    /api/admin/users                  # Get all users
PATCH  /api/admin/users/:id              # Update user
GET    /api/admin/config                 # Get system configuration
PATCH  /api/admin/config                 # Update system configuration
GET    /api/admin/analytics              # Get platform analytics
```

### Root Admin Endpoints (PB0 and PB1 Only)

```
GET    /api/admin/database/backup        # Create database backup (download)
POST   /api/admin/database/restore       # Restore database from backup
GET    /api/admin/database/backups       # Get backup history
DELETE /api/admin/database/backups/:id   # Delete backup metadata
```

## Development vs Production

### Development Environment

**Database:**
- Visible in Replit Database pane
- Use for testing and development
- Accessible through workspace

**Access:**
- Run locally: `npm run dev`
- Available at: `http://localhost:5000`

**Testing:**
- Test all features before pushing to production
- Use different test user accounts
- Verify payment flows and income calculations

### Production Environment

**Database:**
- Separate production database instance
- Automatically created by Replit deployment
- Access through:
  - Admin panel UI (`/admin`)
  - Direct database client (pgAdmin, TablePlus)
  - Production DATABASE_URL credentials

**Important Notes:**
- **Cannot see production DB in workspace database pane** (by design)
- Use admin panel at `/admin/users` to view production users
- Production data is completely separate from development
- User IDs start from PB10000 automatically

**Access Production Data:**
1. Visit production URL (`https://payback247.com`)
2. Log in as admin
3. Use admin panel to view all data
4. Use `/admin/database` for backup/restore (PB0 and PB1 only)

### User ID System

- **Root Admin**: PB0 (primary admin, database management access)
- **Secondary Admin**: PB1 (backup admin, database management access)
- **Regular Users**: PB10000, PB10001, PB10002...

**Delayed ID Assignment:**
- Users register with email/password
- Receive UUID during registration (internal tracking)
- Get PB#### ID only after completing all 8 activation payments
- Binary placement happens after activation (prevents premature placement)

## Development

### Database Migrations

```bash
# Push schema changes to database
npm run db:push

# Generate migration files (if needed)
npm run db:generate

# View current schema
npm run db:studio
```

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push database schema
npm run db:studio    # Open Drizzle Studio
```

## Contributing

1. **Fork the repository** on GitHub
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** and commit:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** on GitHub

### Development Guidelines

- Follow existing code style (TypeScript, React best practices)
- Add comments for complex logic
- Test all features before submitting PR
- Update documentation if adding new features

## Security

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: PostgreSQL-backed sessions
- **CSRF Protection**: Enabled on all state-changing requests
- **Authorization**: Strict checks on all payment and admin operations
- **Object Storage ACL**: File access control for payment proofs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Protection**: React's automatic escaping + input validation

## Support

**For Technical Support:**
- Email: support@payback247.com
- Website: https://payback247.com

**For Business Inquiries:**
- Email: admin@payback247.com

## License

This project is proprietary software. All rights reserved.

© 2025 PAYBACK247. All rights reserved.

## Changelog

### November 2025 - Major Updates

**New Features:**
- ✅ Social media sharing buttons (WhatsApp, Facebook, X, Telegram, LinkedIn)
- ✅ Notification sound system for payment events
- ✅ Updated professional logo and branding
- ✅ Comprehensive database backup/restore system (PB1 only)
- ✅ Enhanced dashboard with modular components (7 components)
- ✅ Unified income reporting at `/user/income/:type`

**Technical Improvements:**
- ✅ Centralized payment configuration (all amounts from system config)
- ✅ Delayed user ID assignment (prevents premature tree placement)
- ✅ Transactional database operations for data consistency
- ✅ Improved binary tree and matrix visualization
- ✅ Object storage integration for payment proofs

**Performance:**
- ✅ Optimized database queries
- ✅ Lazy loading of components
- ✅ Efficient React Query caching

### Previous Releases
- Initial release with binary tree and matrix systems
- Payment approval workflow implementation
- Admin analytics dashboard
- Email notification system
- Profile management system

---

**Built with ❤️ using React, TypeScript, Express, and PostgreSQL**
