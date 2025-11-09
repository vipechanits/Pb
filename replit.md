# HybridP2P Rooted Web3 DApp

## Overview
PAYBACK247 is a hybrid peer-to-peer MLM platform built on the Polygon blockchain. It integrates smart contract-based USDT transactions with web application features to create a decentralized marketing platform. The system supports binary pairing income, multi-level matrix rewards, and both on-chain and off-chain payment verification. The platform allows users to activate accounts, build referral networks, track earnings, and manage profiles, while administrators can configure the system, approve payments, and access analytics.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **Routing**: Wouter for client-side routing.
- **State Management**: React Context API for Web3, TanStack React Query for server state, local component state for UI.
- **UI**: shadcn/ui (Radix UI + Tailwind CSS) following Material Design principles.
- **Web3 Integration**: Ethers.js v6, MetaMask, custom hooks for smart contract interaction, real-time blockchain data polling.
- **Design System**: Tailwind CSS, custom themes, Inter and JetBrains Mono fonts, 8px grid spacing.

### Backend
- **Server Framework**: Express.js with TypeScript (Node.js).
- **API Structure**: RESTful API (`/api` prefix) for development tooling and potential off-chain data.
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple).

### Data Storage
- **Database**: PostgreSQL (Neon serverless).
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema**: Minimal `users` table, extendable for profiles, payment proofs, and transactions.
- **Migrations**: Drizzle Kit.

### Object Storage
- **Provider**: Replit Object Storage (Google Cloud Storage-backed).
- **Service**: `ObjectStorageService` for presigned URLs, file serving, ACL management.
- **Uploader**: `ObjectUploader` (React component with Uppy) for file uploads (images, PDFs, max 10MB).
- **Use Cases**: Payment proof uploads, user documents (KYC), profile images.
- **File Access**: Public via `/objects/:objectPath`, private with ACL-based owner verification.

### Blockchain
- **Smart Contract**: HybridP2P Rooted on Polygon Amoy Testnet (0xE1eD8da387AcDF4BaB818f8Fc12cFc03314cDf7E).
- **Token**: USDT integration (0x3afb9f97834839d1E443A0322e110D8ec9F24cc7).
- **Core Features**: User activation (USDT fees), binary tree (3:3 pairing), five-level matrix, re-entry cycles, dual payment modes (Web3/offline).
- **Network**: Polygon Amoy Testnet (80002), planned Mainnet support (137).

### Authentication & Authorization
- **Authentication**: MetaMask wallet connection (Ethereum address as identity).
- **Role Detection**: Admin/user roles based on wallet address vs. smart contract config.
- **Session Persistence**: Express session storage in PostgreSQL.
- **Network Validation**: Enforces correct network connection.

### Payment Processing
- **Dual-Mode**:
    1. **Web3 Payments**: On-chain USDT transfers via smart contract.
    2. **Offline Payments**: Payment proof submission (UTR/transaction ID, documents) for admin verification.
- **Payment Flow**: Users select mode, Web3 involves USDT approval/payment, Offline involves proof submission and admin verification.
- **Fallback Payments**: Database schema for tracking payments that can't be distributed on-chain. Two-step confirmation (admin/user), object storage for proofs.

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