import NetworkBadge from '../NetworkBadge';

export default function NetworkBadgeExample() {
  return (
    <div className="flex gap-2 p-4">
      <NetworkBadge network="polygon-amoy" isCorrect={true} />
      <NetworkBadge network="polygon-mainnet" isCorrect={false} />
    </div>
  );
}
