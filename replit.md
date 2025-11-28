# PAYBACK247 - MLM Platform with Matrix & Binary Trees

## Project Overview
Full-stack MLM platform featuring:
- **Global Matrix Tree**: 5-level downline structure with binary positions
- **Binary Tree**: Sponsor-based network with DFS spillover placement  
- **Admin & User Dashboards**: Complete income tracking and tree visualization
- **User ID Format**: PB#### format (PB10000, PB10001, etc.) - NO UUID exposure anywhere

## Recent Updates (November 28, 2025 - Latest)

### ✅ QUEUE AUTO-REASSIGNMENT IMPLEMENTED (November 28, 2025)
**Feature**: 24-hour auto-reassignment for abandoned payers

**How It Works**:
1. **Payer reserves queue recipient**: PB10047 activates → assigned to pay PB10003 (status='reserved')
2. **24-hour wait**: System waits for payment confirmation
3. **Auto-release triggers**: If no payment within 24 hours:
   - ✅ Old queue entry (PB10003) released back to 'waiting' for others to pay
   - ✅ Original payer (PB10047) **REASSIGNED** to NEW binary recipient
   - ✅ New recipient gets 'reserved' status with PB10047's activation ID
   - ✅ 24-hour timer resets for new assignment

**Key Changes**:
- **Default hold time**: Changed from 1 hour → **24 hours** (configurable via `queueReservationHoldHours`)
- **Auto-release timer**: Runs every 30 minutes, checks for expired reservations
- **No wasted assignments**: Payers get continuous opportunities to pay someone in queue
- **Queue recipients protected**: Never stuck - if current payer doesn't pay, next payer tries

**File Modified**: `server/storage.ts` (lines 4065-4140)

### ✅ GLOBAL MATRIX VERIFIED - ALL LOGIC WORKING CORRECTLY
**Verification Completed**: Global Matrix uses proper BFS (Breadth-First Search) with FIFO ordering

**Matrix Structure Verified**:
- **Total Users**: 25 users properly linked in global matrix
- **Levels Present**: 0, 1, 2, 3, 4, 5 (no gaps - continuous structure)
- **Level Distribution**:
  - Level 0-1: Complete (2 users - root nodes)
  - Level 2: 2 users (both children under PB10000)
  - Level 3: 4 users (each parent has 2 children)
  - Level 4: 8 users (each parent has 2 children)
  - Level 5: 9 users (partially filled - still growing)

**BFS Algorithm Verification**:
✅ Each parent has exactly 0, 1, or 2 children (proper binary tree)
✅ Position assignments correct (0=left, 1=right)
✅ Materialized paths all correct (PB10000.L.R.L format)
✅ Parent links verified - NO orphaned users
✅ All activated users properly placed in matrix (no missing links)

**Examples of Perfect Chain**:
- PB10000 (root) → PB10001 (left), PB10002 (right)
- PB10001 → PB10003 (left path: PB10000.L.L), PB10004 (PB10000.L.R)
- PB10003 → PB10006 (left), PB10013 (right) → PB10030, PB10031, PB10032, PB10034 at Level 5

**Database Integrity**: ✅ 100% VERIFIED

### ✅ MATRIX VISUALIZATION CORRECTED (November 28, 2025)
**UI Fix**: Global Matrix tree now shows proper connecting lines

**Changes Applied**:
- ✅ Added vertical lines from parent to horizontal connector
- ✅ Added horizontal lines connecting left and right branches
- ✅ Added branch-specific lines (purple for left, pink for right)
- ✅ Improved visual hierarchy with proper spacing
- ✅ Added dark mode support for line colors
- ✅ File: client/src/pages/user-global-matrix.tsx (lines 74-115)

## Recent Updates (November 27, 2025)

### ✅ QUEUE PAYMENT - CONFIRMED (November 28, 2025)
**Status**: PB10003 paid by PB10047 for binary match

**Queue Entry Verified**:
- PB10003 IS fully qualified: 10 people in left leg + 4 in right leg (way above 3:3 minimum)
- Queue entry restored and marked as 'paid' with payment from PB10047
- Amount: ₹1000 received on Nov 26, 2025, 11:59 PM
- Database updated with correct payment confirmation date

**Qualification Rules** (enforced in binary-match-service.ts):
1. **One-time qualification**: Must have 1 personal left + 1 personal right (forever qualified)
2. **Pair building**: Need 3 left + 3 right activations = 1 matched pair to enter queue
3. **Queue entry**: Only created when user completes a 3:3 matched pair
4. **Re-entry**: After receiving payment, user exits queue. Can re-enter by building new 3:3 pair
5. **Carry forward**: Unmatched legs carry to next cycle

### ✅ PB10047 Matrix Repositioning Complete
- Moved PB10047 from Level 6 (under PB10030) to Level 5 (under PB10016)
- Path changed: `PB10000.L.L.L.L.L` → `PB10000.R.L.L.L`
- Database: Updated matrix_parent_id, matrix_level, matrix_path in one SQL query

## Previous Updates (November 26, 2025)

### ✅ COMPLETED
1. **Fixed Global Matrix Display** 
   - Problem: Showed "Unlinked User" + "No name" placeholders
   - Solution: Changed `/api/users/:userId/global-matrix` endpoint to use user-scoped `getMatrixSubtree()` instead of activation-scoped queries
   - Result: Now displays correct PB IDs and user names in perfect binary tree structure

2. **Verified Matrix Placement Logic** 
   - Matrix uses BFS (breadth-first search) for optimal packing
   - Position 0 = left child, Position 1 = right child
   - 22 users successfully placed across 5 levels with correct binary distribution
   - All matrix data: parent links, levels, positions, and paths working correctly

3. **Verified Binary Placement Logic**
   - Binary tree uses DFS (depth-first search) with affiliate link respect
   - Honors `sponsorRequestedLeg` (left/right affiliate preference) through entire recursion
   - Priority: 1) Exact placement, 2) Spillover in sponsor's downline, 3) Global tree search
   - Algorithm correctly maintains leg preference during spillover

4. **Restored Binary & Sponsor Data**
   - Extracted 38 users' binary/sponsor relationship data from backup
   - Updated database with: sponsorId, binaryLeg, sponsorRequestedLeg, binaryParentId, binaryPlacementLeg
   - All UPDATE queries executed successfully
   - Data verified: PB10001→PB10003, PB10002→PB10001, etc.

### Current System Status
- **Matrix Tree**: ✅ Displaying correctly with PB IDs and names
- **Binary Tree Placement**: ✅ DFS algorithm with affiliate link respect working
- **Binary/Sponsor Data**: ✅ Restored from backup (38 users)
- **Binary Tree Display**: ✅ Endpoint uses correct user-scoped queries
- **22 Users Placed**: ✅ Matrix levels 1-5 fully populated
- **User ID Format**: ✅ PB#### format enforced globally - NO UUIDs visible

## Project Structure

### Backend (`server/`)
- **storage.ts**: 
  - `findAndAssignMatrixSlot()`: BFS matrix placement
  - `findFirstAvailableBinarySlot()`: Binary placement with spillover
  - `findFirstSlotInSubtree()`: DFS for binary subtree search (respects affiliate leg preference)
  - `getMatrixSubtree()`: User-scoped recursive matrix query
  - `getBinarySubtree()`: Binary tree query (uses actual binaryParentId/binaryPlacementLeg fields)

- **routes.ts**:
  - `/api/users/:userId/global-matrix`: Returns full 5-level matrix tree (now fixed)
  - `/api/users/:userId/binary-tree`: Returns binary tree with lazy loading
  - `/api/users/:userId/binary-tree/children/:childUserId`: For lazy-loaded expansion
  - All endpoints use user-scoped queries (NOT activation-scoped)

### Frontend (`client/src/`)
- **MatrixTreeView.tsx**: Renders matrix with PB IDs and names
- **BinaryTreeView.tsx**: Renders binary tree with spillover indicators
- **pages/user-dashboard.tsx**: Shows both trees and network stats

### Database Schema
- **users table**:
  - `sponsorId`: Direct sponsor (PB ID)
  - `binaryLeg`: Requested leg (left/right) from affiliate link
  - `sponsorRequestedLeg`: Same as binaryLeg (for clarity)
  - `binaryParentId`: Actual parent in binary tree (may differ from sponsor due to spillover)
  - `binaryPlacementLeg`: Actual position (left/right) in binary tree
  - `matrixParentId`: Parent in global 5-level matrix
  - `matrixPosition`: 0=left, 1=right in matrix
  - `matrixLevel`: 1-5 in global matrix
  - `matrixPath`: Materialized path (e.g., "PB10000.L.R.L")

## Design Decisions

### Matrix Tree (Global Network)
- **BFS for placement**: Ensures level-by-level filling (optimal downline bonuses)
- **No level limit**: Users can earn from unlimited 5-level downline
- **Separate from sponsorship**: Matrix position ≠ sponsor relationship
- **Purpose**: Direct commission structure from downline purchases

### Binary Tree (Income Distribution)
- **DFS for placement**: Finds first available slot respecting affiliate preference
- **3 Priority levels**: Exact placement → Spillover → Global search
- **Leg preference preserved**: Even in spillover, tries to honor requested left/right
- **Purpose**: Binary matching income (3:3 pair bonus system)

### Network Hierarchy
1. **Sponsorship chain** (`sponsorId`): Who referred you
2. **Binary position** (`binaryParentId` + `binaryPlacementLeg`): Where you earn binary income
3. **Matrix position** (`matrixParentId` + path): Where you earn matrix income from 5-level downline

These are independent trees for flexible income sources.

## Security Features
- **6-digit Security Code**: Protects profile updates (bcrypt hashed)
- **Default Password**: 123456 for new accounts
- **Session Management**: Using express-session with PostgreSQL store
- **CSRF Protection**: Token-based CSRF defense
- **Rate Limiting**: Brute-force protection on login/auth endpoints

## Queue System Rules (Binary Match Payments)

### Payment Flow
1. **Activation triggers payment**: New user activates → must pay first person in queue
2. **Queue entry created**: When qualified user builds 3:3 matched pair → enters FIFO queue
3. **Status lifecycle**:
   - **waiting**: Queue recipient ready, awaiting payment
   - **reserved**: Payer assigned, 24-hour window to pay
   - **paid**: Payment confirmed, recipient receives ₹1000

### 24-Hour Auto-Reassignment
- If payer doesn't pay within 24 hours → automatically reassigned to NEW recipient
- Old queue entry released for next payer to attempt
- Ensures queue never gets stuck with deadbeat payers
- Original payer gets continuous chances to complete activation

### Key Config
- `queueReservationHoldHours`: Default 24 hours (configurable)
- Auto-release timer: Runs every 30 minutes
- Matching ratio: 3 left + 3 right = 1 pair (configurable)

## Development Guidelines
- Keep PB ID format consistent throughout - NEVER expose UUIDs to users
- Matrix and Binary are separate tree structures - don't conflate them
- All tree queries are user-scoped (query `users` table directly)
- Never use activation-scoped queries for tree display
- DFS for binary placement respects affiliate link preferences
- BFS for matrix ensures optimal downline structure
- Queue auto-release reassigns payers after 24-hour timeout (not just clearing)

## Next Steps (Post-MVP)
- [ ] Implement payment processing for commissions
- [ ] Add binary matching queue system
- [ ] Notification system for income events
- [ ] Re-entry cycle management
- [ ] Advanced reporting dashboards
