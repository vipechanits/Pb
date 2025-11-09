# HybridP2P Rooted Web3 DApp

## Overview

PAYBACK247 is a hybrid peer-to-peer MLM platform built on the Polygon blockchain network. The application combines smart contract-based USDT transactions with traditional web application features to create a decentralized marketing platform. The system supports binary pairing income distribution, multi-level matrix rewards, and both on-chain and off-chain payment verification.

The platform enables users to activate accounts, build referral networks, track earnings across multiple income streams (direct sponsoring, binary matching, and matrix income), and manage their profiles. Administrators have access to system configuration, payment approval workflows, and platform-wide analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**Routing**: Wouter library for client-side routing, providing a lightweight alternative to React Router. The application uses declarative route definitions with separate paths for user and admin dashboards.

**State Management**: 
- React Context API for Web3 wallet connectivity and blockchain state (Web3Context)
- TanStack React Query for server state management, caching blockchain data queries, and handling asynchronous operations
- Local component state with React hooks for UI interactions

**UI Component Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design follows Material Design principles adapted for Web3 interfaces with emphasis on data density and financial information display.

**Web3 Integration**: 
- Ethers.js v6 for blockchain interactions
- MetaMask integration for wallet connectivity
- Custom hooks (useContract, useBlockchainData) to abstract smart contract calls
- Real-time blockchain data polling with automatic refetch intervals

**Design System**:
- Tailwind CSS with custom configuration extending the shadcn/ui theme
- CSS variables for theming with light/dark mode support
- Typography: Inter font family for general UI, JetBrains Mono for addresses and numerical data
- Spacing follows 8px grid system with Tailwind's spacing scale

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js.

**API Structure**: RESTful API design with routes prefixed under `/api`. The backend serves as a lightweight layer primarily for development tooling and potential future expansion for off-chain data storage.

**Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple) for persistent user sessions across server restarts.

**Development Tools**: 
- Vite middleware integration for hot module replacement during development
- Custom logging middleware for API request/response tracking
- Runtime error overlay for development debugging

### Data Storage

**Database**: PostgreSQL using Neon serverless database adapter for connection pooling and edge compatibility.

**ORM**: Drizzle ORM for type-safe database operations and schema management. Schema definitions use TypeScript for compile-time validation.

**Schema Design**: Currently minimal with a users table supporting username/password authentication. The schema is designed to be extended for storing off-chain user profile data, payment proof metadata, and transaction history.

**Migrations**: Drizzle Kit manages database migrations with schema definitions in `shared/schema.ts` and migration files generated in the `migrations/` directory.

### Object Storage

**Replit Object Storage**: Google Cloud Storage-backed object storage for file uploads and serving. Configured through environment variables:
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`: Unique bucket identifier
- `PUBLIC_OBJECT_SEARCH_PATHS`: Comma-separated paths for public assets
- `PRIVATE_OBJECT_DIR`: Directory for private user-uploaded files

**ObjectStorageService** (`server/objectStorage.ts`): Core service for interacting with object storage:
- Presigned URL generation for direct client-to-storage uploads
- File serving with automatic content-type detection
- ACL (Access Control List) policy management for private files
- Object path normalization and validation

**ObjectUploader Component** (`client/src/components/ObjectUploader.tsx`): React component providing file upload UI:
- Uppy-powered modal interface for file selection and upload
- Support for images and PDFs (max 10MB per file)
- Direct-to-storage uploads using presigned URLs
- Progress tracking and upload status display

**Use Cases**:
- Payment proof uploads for offline activation payments
- User-submitted documentation and verification files
- Future: profile images, KYC documents, transaction receipts

**File Access**:
- Public files: Accessible via `/objects/:objectPath` route with public ACL policy
- Private files: ACL-based access control with owner verification
- Metadata stored in object custom properties for authorization

### Blockchain Architecture

**Smart Contract**: HybridP2P Rooted contract deployed on Polygon Amoy Testnet (contract address: 0xE1eD8da387AcDF4BaB818f8Fc12cFc03314cDf7E).

**Token**: USDT token integration for activation fees and income distributions (contract address: 0x3afb9f97834839d1E443A0322e110D8ec9F24cc7).

**Core Features**:
- User activation system with USDT-based fees
- Binary tree structure for pairing income (FIFO 3:3 matching)
- Five-level matrix income distribution
- Manual and automatic re-entry cycles
- Dual payment modes: Web3 (on-chain) and offline (proof-based)

**Network Configuration**: 
- Primary: Polygon Amoy Testnet (Chain ID: 80002)
- Planned: Polygon Mainnet support (Chain ID: 137)
- Network switching handled through MetaMask wallet with automatic chain detection

### Authentication & Authorization

**Wallet-Based Authentication**: Primary authentication through MetaMask wallet connection. User identity is derived from connected Ethereum address.

**Role Detection**: Admin vs. user roles determined by checking wallet address against smart contract admin configuration.

**Session Persistence**: Express session storage maintains authentication state across page refreshes. Sessions stored in PostgreSQL for production persistence.

**Network Validation**: Application enforces correct network connection before allowing interactions, with automatic network switching prompts.

### Payment Processing

**Dual-Mode System**:
1. **Web3 Payments**: Direct on-chain USDT transfers through smart contract with automatic token approval workflow
2. **Offline Payments**: Traditional payment proof submission with UTR/transaction ID and supporting documentation uploaded for admin verification

**Payment Flow**:
- Users select payment mode (web3/offline)
- Web3: USDT approval transaction → activation payment transaction
- Offline: Submit payment proof → admin verification → manual on-chain confirmation

**Transaction Tracking**: Real-time querying of blockchain events for payment confirmation and income distribution verification.

## External Dependencies

### Blockchain Services

**Polygon Network**: 
- RPC endpoint: https://rpc-amoy.polygon.technology/
- Block explorer: https://www.oklink.com/amoy/
- Network serves as the execution layer for all smart contract interactions

**MetaMask Wallet**: Required browser extension for wallet connectivity, transaction signing, and network management.

### UI Component Libraries

**Radix UI**: Unstyled, accessible component primitives for complex UI patterns (dialogs, dropdowns, tooltips, navigation menus, etc.). Provides keyboard navigation and ARIA compliance.

**shadcn/ui**: Pre-built component library combining Radix UI primitives with Tailwind CSS styling. Components are copied into the project rather than imported as dependencies.

**Lucide React**: Icon library providing consistent SVG icons throughout the application.

### Database

**Neon Database**: Serverless PostgreSQL provider with connection pooling and edge compatibility. Database URL configured through environment variable `DATABASE_URL`.

**Connection Pooling**: @neondatabase/serverless adapter optimizes connection management for serverless and edge deployments.

### Development Tools

**Vite**: Build tool and development server with features:
- Hot module replacement for React components
- TypeScript compilation
- Asset optimization and bundling
- Development mode middleware integration

**Replit-specific plugins**:
- Runtime error modal overlay
- Cartographer for code navigation
- Development banner for debugging

### Form & Validation

**React Hook Form**: Form state management with performance optimizations through uncontrolled components.

**Zod**: TypeScript-first schema validation library integrated with Drizzle ORM for runtime type checking.

**@hookform/resolvers**: Bridge between React Hook Form and Zod for form validation.

### Data Fetching & Caching

**TanStack React Query**: Async state management with intelligent caching, background refetching, and request deduplication. Configured with custom query client for API interactions and blockchain data polling.

### Styling

**Tailwind CSS**: Utility-first CSS framework with custom configuration extending the base theme.

**PostCSS**: CSS processor with Autoprefixer for cross-browser compatibility.

**class-variance-authority**: Utility for creating type-safe component variants.

**clsx & tailwind-merge**: Class name utilities for conditional and merged Tailwind classes.

### Third-Party Integrations

**Google Fonts**: 
- Inter font family for general UI
- JetBrains Mono for monospace display of addresses and code

**Date-fns**: Date manipulation and formatting library for transaction timestamps and UI date displays.

## Recent Changes

### Mock Data Removal (November 2025)

All mock/placeholder data has been removed from the income tracking pages to display real blockchain data exclusively:

**Pages Updated:**
- `client/src/pages/direct-sponsoring.tsx`: Now displays real-time direct referral counts from binary report
- `client/src/pages/matrix-income.tsx`: Now displays real-time matrix position data from smart contract
- `client/src/pages/binary-matching.tsx`: Now displays real-time binary matching statistics and qualification status

**Data Sources:**
- All pages use custom React Query hooks (`useBinaryReport`, `useMatrixPosition`, `useBinaryMatchingCriteria`) to fetch live blockchain data
- Data refreshes automatically every 30-60 seconds via configured refetch intervals
- Proper loading states with Skeleton components during data fetching
- Wallet connection guards to ensure users are connected before displaying data

**Current Limitations:**
- Historical transaction data (transaction logs, payout history) is not yet available
- Smart contract provides current-state snapshots but not historical event data
- Transaction tables replaced with "coming soon" messaging

**Future Enhancement - Event Indexer:**
Planned backend service to enable historical transaction views:
- Listen to blockchain events (ActivationCreated, BinaryPairsMatched, BinaryMatchEarningUpdated, BinaryUnitsBubbled)
- Store event data in PostgreSQL database for efficient querying
- Create API endpoints for historical transaction queries
- Re-enable transaction history tables with real historical data
- Provide full binary tree visualization with all downline members

This two-phase approach prioritizes displaying accurate real-time data immediately while scheduling comprehensive historical data features for future implementation.

### Activation Payment System (November 2025)

Restored comprehensive tab-based activation dialog with three payment options and fallback support:

**Payment Options:**
1. **One-Shot Online Payment**: Web3/USDT on-chain payment for the entire activation fee in a single transaction. Uses `PaymentModeSelector` component to handle approval and payment.

2. **Individual Online Payments**: Users can pay each of the 8 receivers individually on-chain. Each payment requires a separate USDT approval and transfer transaction. Includes fallback UI when receivers are not yet assigned by smart contract.

3. **Offline Payments**: Traditional payment proof submission system with file uploads:
   - Users submit UTR/transaction ID for each of 8 payments
   - Upload payment proof images/documents via `ObjectUploader` component (max 10MB)
   - Files stored in Replit Object Storage with ACL-based access control
   - Admin verification workflow for approval
   - Support for resubmission if proof is rejected

**Fallback Handling:**
- When activation receivers are not yet assigned (`activationData.receivers` is empty):
  - Shows informative Alert explaining automatic receiver assignment
  - Displays 8 payment slots with estimated amounts
  - Disables payment buttons until receivers are assigned by smart contract
  - Provides clear user guidance on the activation process

**Technical Implementation:**
- Tab-based UI using shadcn Tabs component
- State management for payment proofs (transactionId, proofUrl, status)
- Integration with `useCreatorCards` hook for offline payment bank details
- Object storage integration for payment proof uploads
- Dual currency display (USDT/INR at 1:100 ratio) throughout payment flows