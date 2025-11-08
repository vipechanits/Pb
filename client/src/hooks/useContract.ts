import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { formatUnits, parseUnits } from 'ethers';
import { useToast } from '@/hooks/use-toast';

export function useContract() {
  const { contract, usdtContract, account, isConnected } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getUserActivationData = async (userAddress?: string) => {
    if (!contract) return null;
    const address = userAddress || account;
    if (!address) return null;

    try {
      const result = await contract.getActivation(address);
      return {
        hasActivation: result[0],
        activated: result[1],
        receivers: result[2],
        amounts: result[3].map((amt: bigint) => formatUnits(amt, 6)),
        paid: result[4],
        verifiedOnchain: result[5],
        modes: result[6],
        proofs: result[7],
      };
    } catch (error) {
      console.error('Error fetching activation data:', error);
      return null;
    }
  };

  const getBinaryReport = async (userAddress?: string) => {
    if (!contract) return null;
    const address = userAddress || account;
    if (!address) return null;

    try {
      const result = await contract.getBinaryReport(address);
      return {
        directLeft: Number(result[0]),
        directRight: Number(result[1]),
        qualified: result[2],
        leftUnits: Number(result[3]),
        rightUnits: Number(result[4]),
        pairsMatched: Number(result[5]),
        accruedUSDT: formatUnits(result[6], 6),
      };
    } catch (error) {
      console.error('Error fetching binary report:', error);
      return null;
    }
  };

  const getUserMatrixPosition = async (userAddress?: string) => {
    if (!contract) return null;
    const address = userAddress || account;
    if (!address) return null;

    try {
      const result = await contract.getUserMatrixPosition(address);
      return {
        index: Number(result[0]),
        parentIndex: Number(result[1]),
        parent: result[2],
        level: Number(result[3]),
        leftChildIndex: Number(result[4]),
        rightChildIndex: Number(result[5]),
      };
    } catch (error) {
      console.error('Error fetching matrix position:', error);
      return null;
    }
  };

  const getUserProfile = async (userAddress?: string) => {
    if (!contract) return null;
    const address = userAddress || account;
    if (!address) return null;

    try {
      const result = await contract.getUserProfile(address);
      return {
        name: result[0],
        email: result[1],
        mobile: result[2],
        avatar: result[3],
        profileCompleted: result[4],
        holderName: result[5],
        bankName: result[6],
        accountNumber: result[7],
        ifscOrSwift: result[8],
        upiId: result[9],
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const getActivationFee = async () => {
    if (!contract) return null;
    try {
      const fee = await contract.activationFeeUSDT();
      return formatUnits(fee, 6);
    } catch (error) {
      console.error('Error fetching activation fee:', error);
      return null;
    }
  };

  const getBinaryMatchingCriteria = async () => {
    if (!contract) return null;
    try {
      const left = await contract.binaryMatchLeft();
      const right = await contract.binaryMatchRight();
      return {
        matchLeft: Number(left),
        matchRight: Number(right),
      };
    } catch (error) {
      console.error('Error fetching binary criteria:', error);
      return null;
    }
  };

  const getCreatorCards = async () => {
    if (!contract) return [];
    try {
      const cards = await contract.getAllCreatorCards();
      return cards.map((card: any) => ({
        id: Number(card.id),
        label: card.label,
        holderName: card.holderName,
        bankName: card.bankName,
        accountNumber: card.accountNumber,
        ifscOrSwift: card.ifscOrSwift,
        upiId: card.upiId,
        active: card.active,
      }));
    } catch (error) {
      console.error('Error fetching creator cards:', error);
      return [];
    }
  };

  const approveUSDT = async (amount: string) => {
    if (!usdtContract || !contract) {
      toast({
        title: 'Error',
        description: 'Contract not initialized',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const amountWei = parseUnits(amount, 6);
      const tx = await usdtContract.approve(await contract.getAddress(), amountWei);
      
      toast({
        title: 'Approval Pending',
        description: 'Please wait for transaction confirmation...',
      });

      const receipt = await tx.wait();
      
      toast({
        title: 'Approval Successful',
        description: `USDT approved for spending`,
      });

      return receipt;
    } catch (error: any) {
      console.error('Error approving USDT:', error);
      toast({
        title: 'Approval Failed',
        description: error.message || 'Transaction failed',
        variant: 'destructive',
      });
      return null;
    }
  };

  const paySlotWeb3 = async (slotIndex: number) => {
    if (!contract) {
      toast({
        title: 'Error',
        description: 'Contract not initialized',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      const tx = await contract.payIndividuallyWeb3(slotIndex);
      
      toast({
        title: 'Payment Pending',
        description: 'Processing your payment...',
      });

      const receipt = await tx.wait();
      
      toast({
        title: 'Payment Successful',
        description: `Slot ${slotIndex} payment confirmed`,
      });

      return receipt;
    } catch (error: any) {
      console.error('Error paying slot:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Transaction failed',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const submitOfflineProof = async (slotIndex: number, utrOrTx: string, proof: string) => {
    if (!contract) {
      toast({
        title: 'Error',
        description: 'Contract not initialized',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      const tx = await contract.submitOfflineProof(slotIndex, utrOrTx, proof);
      
      toast({
        title: 'Proof Submission Pending',
        description: 'Submitting your payment proof...',
      });

      const receipt = await tx.wait();
      
      toast({
        title: 'Proof Submitted',
        description: 'Your offline payment proof has been submitted for verification',
      });

      return receipt;
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Transaction failed',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (name: string, email: string, mobile: string, avatar: string) => {
    if (!contract) {
      toast({
        title: 'Error',
        description: 'Contract not initialized',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      const tx = await contract.updateUserProfile(name, email, mobile, avatar);
      
      toast({
        title: 'Update Pending',
        description: 'Updating your profile...',
      });

      const receipt = await tx.wait();
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });

      return receipt;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Transaction failed',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const preregister = async (sponsorAddress: string, side: number) => {
    if (!contract) {
      toast({
        title: 'Error',
        description: 'Contract not initialized',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      const tx = await contract.preregister(sponsorAddress, side);
      
      toast({
        title: 'Registration Pending',
        description: 'Processing your registration...',
      });

      const receipt = await tx.wait();
      
      toast({
        title: 'Registration Successful',
        description: 'You have been pre-registered successfully',
      });

      return receipt;
    } catch (error: any) {
      console.error('Error preregistering:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Transaction failed',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getUserActivationData,
    getBinaryReport,
    getUserMatrixPosition,
    getUserProfile,
    getActivationFee,
    getBinaryMatchingCriteria,
    getCreatorCards,
    approveUSDT,
    paySlotWeb3,
    submitOfflineProof,
    updateUserProfile,
    preregister,
  };
}
