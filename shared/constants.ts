/**
 * PAYBACK247 Platform Constants
 * Updated payment structure for non-blockchain version
 */

// Payment amounts in INR
export const PAYMENT_AMOUNTS = {
  CREATOR_FEE: 500,        // Payment 0: Admin creator fee
  SPONSOR: 1000,           // Payment 1: Direct sponsor
  BINARY_MATCH: 1000,      // Payment 2: Binary matching (qualified user with 1L+1R)
  MATRIX_L1: 500,          // Payment 3: Matrix Level 1
  MATRIX_L2: 500,          // Payment 4: Matrix Level 2
  MATRIX_L3: 500,          // Payment 5: Matrix Level 3
  MATRIX_L4: 500,          // Payment 6: Matrix Level 4
  MATRIX_L5: 500,          // Payment 7: Matrix Level 5
} as const;

// Total activation cost
export const TOTAL_ACTIVATION_COST = 
  PAYMENT_AMOUNTS.CREATOR_FEE +
  PAYMENT_AMOUNTS.SPONSOR +
  PAYMENT_AMOUNTS.BINARY_MATCH +
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
  creator_fee: 'Creator Fee',
  matrix_level_1: 'Matrix Level 1',
  matrix_level_2: 'Matrix Level 2',
  matrix_level_3: 'Matrix Level 3',
  matrix_level_4: 'Matrix Level 4',
  matrix_level_5: 'Matrix Level 5',
} as const;

// Payment type to amount mapping
export const PAYMENT_TYPE_AMOUNTS: Record<string, number> = {
  creator_fee: PAYMENT_AMOUNTS.CREATOR_FEE,
  direct_sponsor: PAYMENT_AMOUNTS.SPONSOR,
  binary_match: PAYMENT_AMOUNTS.BINARY_MATCH,
  matrix_level_1: PAYMENT_AMOUNTS.MATRIX_L1,
  matrix_level_2: PAYMENT_AMOUNTS.MATRIX_L2,
  matrix_level_3: PAYMENT_AMOUNTS.MATRIX_L3,
  matrix_level_4: PAYMENT_AMOUNTS.MATRIX_L4,
  matrix_level_5: PAYMENT_AMOUNTS.MATRIX_L5,
};

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
  REQUIRED_CONFIRMATIONS: 2,   // Receiver + Admin both must confirm
  STATUSES: {
    PENDING: 'pending',
    RECEIVER_CONFIRMED: 'receiver_confirmed',
    ADMIN_CONFIRMED: 'admin_confirmed',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
  }
} as const;

// User ID format
export const USER_ID_PREFIX = 'PB';  // e.g., PB1, PB2, PB150
