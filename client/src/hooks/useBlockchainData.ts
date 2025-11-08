import { useQuery } from '@tanstack/react-query';
import { useWeb3 } from '@/context/Web3Context';
import { useContract } from './useContract';

export function useActivationData(userAddress?: string) {
  const { account, isConnected, isCorrectNetwork, contract } = useWeb3();
  const { getUserActivationData } = useContract();
  const address = userAddress || account || undefined;

  return useQuery({
    queryKey: ['activation', address],
    queryFn: () => getUserActivationData(address),
    enabled: isConnected && isCorrectNetwork && !!contract && !!address,
    refetchInterval: 30000,
  });
}

export function useBinaryReport(userAddress?: string) {
  const { account, isConnected, isCorrectNetwork, contract } = useWeb3();
  const { getBinaryReport } = useContract();
  const address = userAddress || account || undefined;

  return useQuery({
    queryKey: ['binary-report', address],
    queryFn: () => getBinaryReport(address),
    enabled: isConnected && isCorrectNetwork && !!contract && !!address,
    refetchInterval: 30000,
  });
}

export function useMatrixPosition(userAddress?: string) {
  const { account, isConnected, isCorrectNetwork, contract } = useWeb3();
  const { getUserMatrixPosition } = useContract();
  const address = userAddress || account || undefined;

  return useQuery({
    queryKey: ['matrix-position', address],
    queryFn: () => getUserMatrixPosition(address),
    enabled: isConnected && isCorrectNetwork && !!contract && !!address,
    refetchInterval: 30000,
  });
}

export function useUserProfile(userAddress?: string) {
  const { account, isConnected, isCorrectNetwork, contract } = useWeb3();
  const { getUserProfile } = useContract();
  const address = userAddress || account || undefined;

  return useQuery({
    queryKey: ['user-profile', address],
    queryFn: () => getUserProfile(address),
    enabled: isConnected && isCorrectNetwork && !!contract && !!address,
    refetchInterval: 60000,
  });
}

export function useActivationFee() {
  const { isConnected, isCorrectNetwork, contract } = useWeb3();
  const { getActivationFee } = useContract();

  return useQuery({
    queryKey: ['activation-fee'],
    queryFn: getActivationFee,
    enabled: isConnected && isCorrectNetwork && !!contract,
    refetchInterval: 60000,
  });
}

export function useBinaryMatchingCriteria() {
  const { isConnected, isCorrectNetwork, contract } = useWeb3();
  const { getBinaryMatchingCriteria } = useContract();

  return useQuery({
    queryKey: ['binary-criteria'],
    queryFn: getBinaryMatchingCriteria,
    enabled: isConnected && isCorrectNetwork && !!contract,
    refetchInterval: 60000,
  });
}

export function useCreatorCards() {
  const { isConnected, isCorrectNetwork, contract } = useWeb3();
  const { getCreatorCards } = useContract();

  return useQuery({
    queryKey: ['creator-cards'],
    queryFn: getCreatorCards,
    enabled: isConnected && isCorrectNetwork && !!contract,
    refetchInterval: 60000,
  });
}
