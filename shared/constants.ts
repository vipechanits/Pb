/**
 * PAYBACK247 Platform Constants
 * Updated payment structure for non-blockchain version
 */

// Payment amounts in INR
export const PAYMENT_AMOUNTS = {
  SPONSOR: 1000,           // Slot 0: Direct sponsor
  BINARY_MATCH: 1000,      // Slot 1: Binary matching
  TOP_REWARD: 500,         // Slot 2: Admin Top Reward
  MATRIX_L1: 500,          // Slot 3: Matrix Level 1
  MATRIX_L2: 500,          // Slot 4: Matrix Level 2
  MATRIX_L3: 500,          // Slot 5: Matrix Level 3
  MATRIX_L4: 500,          // Slot 6: Matrix Level 4
  MATRIX_L5: 500,          // Slot 7: Matrix Level 5
} as const;

// Total activation cost (8 payments)
export const TOTAL_ACTIVATION_COST = 
  PAYMENT_AMOUNTS.TOP_REWARD +
  PAYMENT_AMOUNTS.SPONSOR +
  PAYMENT_AMOUNTS.BINARY_MATCH +  // Now pays first person in queue (not admin)
  PAYMENT_AMOUNTS.MATRIX_L1 +
  PAYMENT_AMOUNTS.MATRIX_L2 +
  PAYMENT_AMOUNTS.MATRIX_L3 +
  PAYMENT_AMOUNTS.MATRIX_L4 +
  PAYMENT_AMOUNTS.MATRIX_L5;
// Total: ₹5,000

// Payment type labels
export const PAYMENT_LABELS = {
  direct_sponsor: 'Direct Sponsor',
  binary_match: 'Binary Match',
  top_reward: 'Top Reward',
  matrix_level_1: 'Matrix Level 1',
  matrix_level_2: 'Matrix Level 2',
  matrix_level_3: 'Matrix Level 3',
  matrix_level_4: 'Matrix Level 4',
  matrix_level_5: 'Matrix Level 5',
} as const;

// Payment type to amount mapping
export const PAYMENT_TYPE_AMOUNTS: Record<string, number> = {
  direct_sponsor: PAYMENT_AMOUNTS.SPONSOR,
  binary_match: PAYMENT_AMOUNTS.BINARY_MATCH,
  top_reward: PAYMENT_AMOUNTS.TOP_REWARD,
  matrix_level_1: PAYMENT_AMOUNTS.MATRIX_L1,
  matrix_level_2: PAYMENT_AMOUNTS.MATRIX_L2,
  matrix_level_3: PAYMENT_AMOUNTS.MATRIX_L3,
  matrix_level_4: PAYMENT_AMOUNTS.MATRIX_L4,
  matrix_level_5: PAYMENT_AMOUNTS.MATRIX_L5,
};

// Slot index to payment type mapping (8 payment slots)
// Binary match (slot 1) now pays FIRST person in queue instead of admin
export const SLOT_TO_PAYMENT_TYPE = [
  'direct_sponsor',    // Slot 0: Direct sponsor
  'binary_match',      // Slot 1: FIRST person in binary match queue (fallback to admin if empty)
  'top_reward',        // Slot 2: Admin Top Reward
  'matrix_level_1',    // Slot 3: Matrix Level 1
  'matrix_level_2',    // Slot 4: Matrix Level 2
  'matrix_level_3',    // Slot 5: Matrix Level 3
  'matrix_level_4',    // Slot 6: Matrix Level 4
  'matrix_level_5',    // Slot 7: Matrix Level 5
] as const;

// Matrix payment types derived from SLOT_TO_PAYMENT_TYPE (slots 3-7)
// Used for filtering matrix payments during deferred income creation
export const MATRIX_PAYMENT_TYPES = [
  'matrix_level_1',
  'matrix_level_2',
  'matrix_level_3',
  'matrix_level_4',
  'matrix_level_5',
] as const;

// Matrix structure
export const MATRIX_STRUCTURE = {
  LEVEL_1: { positions: 2, income_per_person: 500, total_potential: 1000 },
  LEVEL_2: { positions: 4, income_per_person: 500, total_potential: 2000 },
  LEVEL_3: { positions: 8, income_per_person: 500, total_potential: 4000 },
  LEVEL_4: { positions: 16, income_per_person: 500, total_potential: 8000 },
  LEVEL_5: { positions: 32, income_per_person: 500, total_potential: 16000 },
} as const;

// Total matrix income potential
export const TOTAL_MATRIX_POTENTIAL = 
  MATRIX_STRUCTURE.LEVEL_1.total_potential +
  MATRIX_STRUCTURE.LEVEL_2.total_potential +
  MATRIX_STRUCTURE.LEVEL_3.total_potential +
  MATRIX_STRUCTURE.LEVEL_4.total_potential +
  MATRIX_STRUCTURE.LEVEL_5.total_potential;
// Total: ₹31,000

// Binary tree rules
export const BINARY_RULES = {
  QUALIFICATION: {
    SELF_SPONSORED_LEFT: 1,    // Must have 1 self-sponsored on left
    SELF_SPONSORED_RIGHT: 1,   // Must have 1 self-sponsored on right
    LEFT_TEAM_SIZE: 3,         // Left team needs 3 people (spill over included)
    RIGHT_TEAM_SIZE: 3,        // Right team needs 3 people (spill over included)
  },
  INCOME_PER_PAIR: 1000,       // ₹1,000 per matched pair (3L + 3R)
} as const;

// Payment confirmation workflow
export const CONFIRMATION_WORKFLOW = {
  TOP_REWARD: {
    CONFIRMATIONS: ['admin'],  // Admin only confirms Top Reward
  },
  OTHER_PAYMENTS: {
    CONFIRMATIONS: ['receiver'],  // Receiver only confirms payments 1-7
  },
  STATUSES: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
  }
} as const;

// Binary matching qualification
export const BINARY_QUALIFICATION = {
  // ONE TIME eligibility requirement
  SELF_SPONSORED_LEFT: 1,      // Must sponsor 1 on left (ONE TIME to become eligible)
  SELF_SPONSORED_RIGHT: 1,     // Must sponsor 1 on right (ONE TIME to become eligible)
  
  // PER PAIR requirements (to enter queue)
  LEFT_TEAM_PER_PAIR: 3,       // 3:3 left team per pair
  RIGHT_TEAM_PER_PAIR: 3,      // 3:3 right team per pair
  INCOME_PER_PAIR: 1000,       // ₹1,000 per pair matched
  
  CONTINUOUS_INCOME: true,     // User can earn unlimited pairs
  NOTES: [
    'ONE TIME: Self-sponsor 1 left + 1 right to become ELIGIBLE',
    'PER PAIR: User ENTERS queue only when 3:3 pair is COMPLETE',
    'After receiving ₹1,000, user EXITS queue completely',
    'Build another 3:3 → RE-ENTER queue → Earn ₹1,000 again',
    'Users are NOT in queue while building pairs',
    'Spill over helps build pairs faster',
  ],
} as const;

// Global Matrix placement
export const MATRIX_PLACEMENT = {
  MODEL: 'FIFO',               // First In, First Out
  DIRECTION: 'Top to Bottom, Left to Right',
  GLOBAL: true,                // ONE global matrix for all users
  AUTOMATIC: true,             // System auto-places, user cannot choose
  CONTINUOUS: true,            // Matrix never stops growing
  LEVELS: 5,
  MAX_POSITIONS: 62,           // 2 + 4 + 8 + 16 + 32 = 62 total
  POSITIONS_PER_LEVEL: {
    1: 2,
    2: 4,
    3: 8,
    4: 16,
    5: 32,
  },
  INCOME_PER_POSITION: 500,    // ₹500 per position
  RE_ENTRY: {
    ENABLED: true,
    TRIGGER: 'matrix_full',    // When all 62 positions filled
    FEE: 5000,                 // Same ₹5,000 re-entry fee
    SPONSOR_PAYMENT: 1000,     // ₹1,000 to SAME sponsor
    BINARY_PAYMENT: 1000,      // ₹1,000 to next in binary queue (not matched pair)
    TOP_REWARD: 500,           // ₹500 to admin
    MATRIX_PAYMENTS: 2500,     // ₹2,500 to new matrix uplines (5×₹500)
    BINARY_PLACEMENT: 'bubbled', // Placed as bubbled in binary tree (counts for matching)
    MATRIX_PLACEMENT: 'next_free_spot', // Gets new matrix position number
  },
  NOTE: 'Every activated user placed in next free position automatically. When matrix full, re-entry creates new matrix position.',
} as const;

// User ID format
export const USER_ID_PREFIX = 'PB';  // e.g., PB10000, PB10001, PB10150
