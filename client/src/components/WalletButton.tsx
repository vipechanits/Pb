import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Copy, Check, LogOut, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useWeb3 } from '@/context/Web3Context';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
  const { account, isConnected, isCorrectNetwork, connect, disconnect, switchNetwork } = useWeb3();
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    await connect();
    onConnect?.();
  };

  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

  if (!isCorrectNetwork) {
    return (
      <Button onClick={switchNetwork} variant="destructive" data-testid="button-switch-network">
        <AlertCircle className="w-4 h-4 mr-2" />
        Wrong Network
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="font-mono" data-testid="button-wallet-menu">
          <Wallet className="w-4 h-4 mr-2" />
          {truncateAddress(account!)}
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} data-testid="button-disconnect">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
