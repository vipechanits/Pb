import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABI, USDT_ABI, NETWORK_CONFIG, POLYGON_AMOY_CHAIN_ID } from '@shared/contracts';

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  contract: Contract | null;
  usdtContract: Contract | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<Contract | null>(null);

  const isConnected = !!account;
  const isCorrectNetwork = chainId === NETWORK_CONFIG.chainId;

  const initializeContracts = async (provider: BrowserProvider, signer: any) => {
    const hybridContract = new Contract(CONTRACT_ADDRESSES.HYBRID_P2P, CONTRACT_ABI, signer);
    const usdt = new Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, signer);
    setContract(hybridContract);
    setUsdtContract(usdt);
  };

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this DApp');
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      setProvider(provider);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      if (Number(network.chainId) === NETWORK_CONFIG.chainId) {
        const signer = await provider.getSigner();
        await initializeContracts(provider, signer);
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setContract(null);
    setUsdtContract(null);
  };

  const switchNetwork = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
                chainName: NETWORK_CONFIG.chainName,
                nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                rpcUrls: NETWORK_CONFIG.rpcUrls,
                blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      } else {
        console.error('Error switching network:', error);
      }
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnect();
        }
      });

      window.ethereum.on('chainChanged', async (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        
        if (newChainId === NETWORK_CONFIG.chainId && provider) {
          const signer = await provider.getSigner();
          await initializeContracts(provider, signer);
        } else {
          setContract(null);
          setUsdtContract(null);
        }
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [provider]);

  const value = {
    account,
    chainId,
    provider,
    contract,
    usdtContract,
    isConnected,
    isCorrectNetwork,
    connect,
    disconnect,
    switchNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
