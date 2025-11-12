import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * System configuration DTO (normalized from database decimals to numbers)
 */
export interface SystemConfigDTO {
  // Payment amounts (in INR)
  sponsorPaymentAmount: number;
  binaryMatchPaymentAmount: number;
  creatorFeeAmount: number;
  matrixLevel1Amount: number;
  matrixLevel2Amount: number;
  matrixLevel3Amount: number;
  matrixLevel4Amount: number;
  matrixLevel5Amount: number;
  
  // Binary matching configuration
  binaryLeftQualification: number;
  binaryRightQualification: number;
  binaryMatchingRatioLeft: number;
  binaryMatchingRatioRight: number;
  
  // Admin payment methods
  adminUpiId?: string;
  adminBankAccount?: string;
  adminIfscCode?: string;
  adminMobile?: string;
  adminQrCodeUrl?: string;
}

/**
 * Default fallback values (used if config fails to load)
 */
export const DEFAULT_SYSTEM_CONFIG: SystemConfigDTO = {
  sponsorPaymentAmount: 1000,
  binaryMatchPaymentAmount: 1000,
  creatorFeeAmount: 500,
  matrixLevel1Amount: 500,
  matrixLevel2Amount: 500,
  matrixLevel3Amount: 500,
  matrixLevel4Amount: 500,
  matrixLevel5Amount: 500,
  binaryLeftQualification: 1,
  binaryRightQualification: 1,
  binaryMatchingRatioLeft: 3,
  binaryMatchingRatioRight: 3,
};

/**
 * Computed config values with derived totals
 */
export interface ComputedSystemConfig extends SystemConfigDTO {
  // Derived totals
  totalActivationCost: number;
  totalMatrixPotential: number;
  
  // Matrix structure (positions per level - currently fixed at 2x5)
  matrixStructure: {
    level1Positions: number;
    level2Positions: number;
    level3Positions: number;
    level4Positions: number;
    level5Positions: number;
    totalPositions: number;
  };
  
  // Binary income per pair (from binary match amount)
  binaryIncomePerPair: number;
  
  // Payment slot amounts by index (for 8-slot activation)
  paymentSlots: {
    slot0Amount: number; // Direct sponsor
    slot1Amount: number; // Binary match
    slot2Amount: number; // Creator fee
    slot3Amount: number; // Matrix L1
    slot4Amount: number; // Matrix L2
    slot5Amount: number; // Matrix L3
    slot6Amount: number; // Matrix L4
    slot7Amount: number; // Matrix L5
  };
}

/**
 * Custom hook to fetch and use system configuration
 * 
 * Features:
 * - React Query caching with 5-minute stale time
 * - Automatic background refetch on focus/mount
 * - Computed values (totals, matrix structure)
 * - Fallback to defaults on error
 * - Loading and error states
 */
export function useSystemConfig() {
  const { data, isLoading, isError, error, refetch } = useQuery<SystemConfigDTO>({
    queryKey: ['/api/system-config'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Use data if loaded, otherwise fallback to defaults
  const config = data || DEFAULT_SYSTEM_CONFIG;

  // Compute derived values
  const computed = useMemo((): ComputedSystemConfig => {
    const totalActivationCost = 
      config.sponsorPaymentAmount +
      config.binaryMatchPaymentAmount +
      config.creatorFeeAmount +
      config.matrixLevel1Amount +
      config.matrixLevel2Amount +
      config.matrixLevel3Amount +
      config.matrixLevel4Amount +
      config.matrixLevel5Amount;

    const totalMatrixPotential = 
      (2 * config.matrixLevel1Amount) +
      (4 * config.matrixLevel2Amount) +
      (8 * config.matrixLevel3Amount) +
      (16 * config.matrixLevel4Amount) +
      (32 * config.matrixLevel5Amount);

    return {
      ...config,
      totalActivationCost,
      totalMatrixPotential,
      matrixStructure: {
        level1Positions: 2,
        level2Positions: 4,
        level3Positions: 8,
        level4Positions: 16,
        level5Positions: 32,
        totalPositions: 62, // 2+4+8+16+32
      },
      binaryIncomePerPair: config.binaryMatchPaymentAmount,
      paymentSlots: {
        slot0Amount: config.sponsorPaymentAmount,
        slot1Amount: config.binaryMatchPaymentAmount,
        slot2Amount: config.creatorFeeAmount,
        slot3Amount: config.matrixLevel1Amount,
        slot4Amount: config.matrixLevel2Amount,
        slot5Amount: config.matrixLevel3Amount,
        slot6Amount: config.matrixLevel4Amount,
        slot7Amount: config.matrixLevel5Amount,
      },
    };
  }, [config]);

  return {
    config: computed,
    isLoading,
    isError,
    error,
    refetch,
    isUsingDefaults: !data, // True if using fallback defaults
  };
}

/**
 * Format amount with Indian currency symbol
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Get payment type label
 */
export function getPaymentTypeLabel(paymentType: string): string {
  const labels: Record<string, string> = {
    direct_sponsor: 'Direct Sponsor',
    binary_match: 'Binary Match',
    creator_fee: 'Creator Fee',
    matrix_level_1: 'Matrix Level 1',
    matrix_level_2: 'Matrix Level 2',
    matrix_level_3: 'Matrix Level 3',
    matrix_level_4: 'Matrix Level 4',
    matrix_level_5: 'Matrix Level 5',
  };
  return labels[paymentType] || paymentType;
}

/**
 * Get payment amount by type from config
 */
export function getPaymentAmount(config: ComputedSystemConfig, paymentType: string): number {
  const typeMap: Record<string, keyof ComputedSystemConfig> = {
    direct_sponsor: 'sponsorPaymentAmount',
    binary_match: 'binaryMatchPaymentAmount',
    creator_fee: 'creatorFeeAmount',
    matrix_level_1: 'matrixLevel1Amount',
    matrix_level_2: 'matrixLevel2Amount',
    matrix_level_3: 'matrixLevel3Amount',
    matrix_level_4: 'matrixLevel4Amount',
    matrix_level_5: 'matrixLevel5Amount',
  };
  const key = typeMap[paymentType];
  return key ? (config[key] as number) : 0;
}
