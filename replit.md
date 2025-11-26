# PAYBACK247 - MLM Platform with Matrix & Binary Trees

## Project Overview
Full-stack MLM platform featuring:
- **Global Matrix Tree**: 5-level downline structure with binary positions
- **Binary Tree**: Sponsor-based network with DFS spillover placement  
- **Admin & User Dashboards**: Complete income tracking and tree visualization
- **User ID Format**: PB#### format (PB10000, PB10001, etc.) - NO UUID exposure anywhere

## Recent Updates (November 26, 2025)

### ✅ COMPLETED THIS SESSION
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

## Development Guidelines
- Keep PB ID format consistent throughout - NEVER expose UUIDs to users
- Matrix and Binary are separate tree structures - don't conflate them
- All tree queries are user-scoped (query `users` table directly)
- Never use activation-scoped queries for tree display
- DFS for binary placement respects affiliate link preferences
- BFS for matrix ensures optimal downline structure

## Next Steps (Post-MVP)
- [ ] Implement payment processing for commissions
- [ ] Add binary matching queue system
- [ ] Notification system for income events
- [ ] Re-entry cycle management
- [ ] Advanced reporting dashboards
