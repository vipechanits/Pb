import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Copy, Check, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'; // todo: remove mock functionality

  const handleConnect = () => {
    setIsConnected(true);
    onConnect?.();
    console.log('Wallet connect triggered');
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    onDisconnect?.();
    console.log('Wallet disconnect triggered');
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} data-testid="button-connect-wallet">
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="font-mono" data-testid="button-wallet-menu">
          <Wallet className="w-4 h-4 mr-2" />
          {truncateAddress(walletAddress)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={copyAddress} data-testid="button-copy-address">
          {copied ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDisconnect} data-testid="button-disconnect">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
