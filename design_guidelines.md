# Design Guidelines: HybridP2P Rooted Web3 DApp

## Design Approach

**System Selected:** Material Design with adaptations for Web3/Financial UI patterns
**Rationale:** Information-dense dashboard requiring clear data hierarchy, professional credibility for financial transactions, and strong component library for tables, cards, and data visualization.

## Typography

**Font Family:** 
- Primary: Inter (via Google Fonts) - excellent for data-heavy interfaces
- Monospace: JetBrains Mono - for wallet addresses, transaction hashes, numerical data

**Hierarchy:**
- Dashboard Headlines: text-3xl font-bold (36px)
- Section Headers: text-xl font-semibold (20px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base font-normal (16px)
- Data Labels: text-sm font-medium (14px)
- Captions/Helper Text: text-xs (12px)
- Financial Values: text-2xl font-bold with tabular-nums

## Layout System

**Spacing Scale:** Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistency
- Card padding: p-6
- Section spacing: mb-8
- Component gaps: gap-4 or gap-6
- Grid gutters: gap-6
- Button padding: px-6 py-3

**Grid Structure:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Max width container: max-w-7xl mx-auto px-4

## Component Library

### Navigation
- **Sidebar:** Fixed left navigation (w-64), collapsible on mobile
  - Role-based menu items with icons (Heroicons)
  - Active state with subtle background
  - Wallet address display at top (truncated: 0x1234...5678)
  - Network indicator badge

### Dashboard Cards
- **Stat Cards:** White background, rounded-lg, shadow-sm, border border-gray-200
  - Icon in top-left (48px, subtle accent background)
  - Label (text-sm text-gray-600)
  - Value (text-3xl font-bold)
  - Subtext for INR conversion (text-sm text-gray-500)
  - Trend indicator (up/down arrow with percentage)

### Data Tables
- **Transaction Tables:** Full-width, striped rows (bg-gray-50 alternate)
  - Sticky header row
  - Status badges: rounded-full px-3 py-1 (green for confirmed, yellow for pending, red for rejected)
  - Monospace for addresses/hashes
  - Action buttons in last column

### Forms & Inputs
- **Input Fields:** border border-gray-300, rounded-md, px-4 py-2
  - Focus state: ring-2 ring-blue-500
  - Error state: border-red-500 with error text below
- **File Upload:** Dashed border dropzone with drag-and-drop
- **Radio/Checkbox:** Material Design style with accent colors

### Buttons
- **Primary CTA:** bg-blue-600 text-white, rounded-md, px-6 py-3, font-medium
- **Secondary:** border-2 border-blue-600 text-blue-600
- **Connect Wallet:** Prominent placement, includes wallet icon
- **Transaction Buttons:** Loading states with spinner, disabled states clear

### Data Visualization
- **Binary Tree:** SVG-based tree with nodes showing user addresses
  - Left/right branches clearly distinguished
  - Color-coded by status (active/inactive)
  - Zoomable/pannable for deep trees
- **Matrix Grid:** 2xN grid showing position indices
  - Highlight current user position
  - Show parent connections with lines
- **Income Charts:** Recharts bar/line graphs
  - Tooltip on hover with detailed breakdown
  - Legend for multiple income types

### Modals & Overlays
- **Wallet Connect Modal:** Centered, max-w-md
  - List of wallet options with icons
  - Network selector
- **Payment Proof Modal:** Shows uploaded image, transaction details, confirmation status
- **Confirmation Dialogs:** Alert-style for destructive actions

## Web3-Specific Elements

- **Wallet Badge:** Rounded-full with jazzicon/blockie avatar
- **Transaction Status:** Toast notifications (react-hot-toast) with transaction hash link to PolygonScan
- **Network Warning:** Banner at top if wrong network detected
- **Gas Estimator:** Small helper text showing estimated transaction cost
- **USDT Balance:** Prominent display with refresh button

## Trust & Security Indicators

- **SSL Lock Icon:** In header
- **Contract Verification Badge:** Link to verified contract on PolygonScan
- **Admin Controls:** Clearly separated with warning borders (border-l-4 border-orange-500)
- **Payment Proof Thumbnails:** Image preview in table rows

## Responsive Behavior

- **Desktop (lg:):** Full sidebar, 4-column stat grid, side-by-side payment options
- **Tablet (md:):** Collapsible sidebar, 2-column grid, stacked sections
- **Mobile (base):** Hamburger menu, single column, simplified tree views with horizontal scroll

## Animations

Use sparingly for feedback only:
- Card hover: subtle shadow lift (transition-shadow duration-200)
- Button loading: Spinning loader icon
- Table row expand: slide-down animation (max-h transition)
- Toast notifications: Slide-in from top-right

## Images

**No hero images for this application.** This is a dashboard/utility app focused on data and functionality.

**Icons only:**
- Heroicons for navigation and UI elements
- Wallet provider logos (MetaMask, WalletConnect) via official assets
- USDT token icon from CoinGecko/official sources
- Status icons: check-circle, x-circle, clock