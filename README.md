# PAYBACK247

A peer-to-peer MLM platform with binary tree structure, matrix rewards system, and manual payment tracking.

## Overview

PAYBACK247 is a full-stack web application that facilitates multi-level marketing operations with:

- **Binary Tree System**: Automatic leg assignment for balanced growth
- **8-Payment Activation**: ₹5,000 total activation fee distributed across sponsors and matrix levels
- **Matrix Rewards**: 5-level matrix placement system
- **Manual Payment Tracking**: UPI-based payments with admin approval workflow
- **Real-time Statistics**: Automatic sponsor statistics updates on activation

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- shadcn/ui components (Radix UI + Tailwind CSS)
- TanStack React Query for state management
- Wouter for routing

### Backend
- Express.js with TypeScript
- PostgreSQL (Neon serverless)
- Drizzle ORM
- Express sessions with PostgreSQL store
- bcrypt for password hashing

### Storage
- Replit Object Storage (Google Cloud Storage-backed)
- Uppy for file uploads

## Key Features

### User Features
- Email/password authentication
- Referral system with sponsor tracking
- Binary tree visualization
- 8-payment activation workflow with QR code generation
- Payment submission with proof upload
- Payment confirmation dashboard
- Profile management

### Admin Features
- Payment approval queue
- System-wide analytics
- User management
- Configuration controls

## Payment System

Each user activation requires 8 payments (₹625 each):
1. **Slot 0**: Direct Sponsor
2. **Slot 1**: Binary Match Partner
3. **Slot 2**: Creator Fee (admin)
4. **Slots 3-7**: Matrix Levels 1-5

Payments are made manually via UPI (Google Pay, Paytm, PhonePe) with:
- UTR/Transaction ID submission
- Optional proof upload
- Receiver confirmation/rejection
- Unlimited resubmission on rejection

## Database Schema

### Users Table
- Auto-generated sequential IDs (PB10000+)
- Email/password authentication
- Sponsor and binary leg tracking
- Activation status
- Referral statistics (total, left leg, right leg)

### Activations Table
- UUID-based activation IDs
- Payer wallet tracking
- Status lifecycle (pending → completed)

### Activation Payments Table
- 8 payment slots per activation
- Payment status tracking (pending → submitted → confirmed/rejected)
- UTR and proof storage
- Rejection reason tracking

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Replit Object Storage (or compatible service)

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGDATABASE=...
PGUSER=...
PGPASSWORD=...

# Session
SESSION_SECRET=your-secret-key

# Object Storage
DEFAULT_OBJECT_STORAGE_BUCKET_ID=...
PUBLIC_OBJECT_SEARCH_PATHS=...
PRIVATE_OBJECT_DIR=...
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Admin Setup

Default admin account:
- **Email**: payback2472000@gmail.com
- **Password**: admin
- **User ID**: PB0

## Project Structure

```
PAYBACK247/
├── client/                 # React frontend
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/        # Application pages
│       │   ├── auth/     # Login, signup, forgot password
│       │   ├── user/     # User dashboard, activation, confirmation
│       │   └── admin/    # Admin dashboard, payments, analytics
│       └── lib/          # Utilities, auth context, query client
├── server/                # Express backend
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database operations & business logic
│   ├── object-storage.ts # File upload/download service
│   └── index.ts          # Server entry point
├── shared/               # Shared types & schemas
│   └── schema.ts         # Drizzle database schema & Zod validators
└── replit.md            # Detailed project documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Users
- `GET /api/users/:userId` - Get user details
- `GET /api/users/:userId/downline` - Get user's downline

### Activations
- `POST /api/activations` - Create activation request
- `GET /api/activations/user/:userId` - Get user's activations
- `GET /api/activations/:activationId/payments` - Get activation payments

### Payments
- `POST /api/payments/:paymentId/submit` - Submit payment
- `POST /api/payments/:paymentId/confirm` - Confirm payment
- `POST /api/payments/:paymentId/reject` - Reject payment
- `GET /api/payments/pending-confirmation` - Get payments pending confirmation
- `GET /api/admin/payments/pending` - Admin: Get all pending payments

## Development

### Database Migrations

```bash
# Push schema changes to database
npm run db:push

# Force push (if data loss warning)
npm run db:push --force
```

### Testing

The application includes comprehensive e2e testing using Playwright for:
- Authentication flows
- Payment submission and confirmation
- Activation completion
- Sponsor statistics updates

## Security

- Passwords hashed with bcrypt
- Session-based authentication
- CSRF protection
- Strict authorization checks on all payment operations
- Object storage ACL for file access control

## Documentation

See `replit.md` for detailed architecture and implementation notes.

## License

Proprietary - All rights reserved
