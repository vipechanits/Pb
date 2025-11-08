import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface NetworkBadgeProps {
  network?: 'polygon-amoy' | 'polygon-mainnet' | 'unknown';
  isCorrect?: boolean;
}

export default function NetworkBadge({ 
  network = 'polygon-amoy',
  isCorrect = true 
}: NetworkBadgeProps) {
  const networkNames = {
    'polygon-amoy': 'Polygon Amoy',
    'polygon-mainnet': 'Polygon Mainnet',
    'unknown': 'Unknown Network'
  };

  return (
    <Badge 
      variant={isCorrect ? 'default' : 'destructive'}
      data-testid="badge-network"
      className="gap-1"
    >
      {isCorrect ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      {networkNames[network]}
    </Badge>
  );
}
