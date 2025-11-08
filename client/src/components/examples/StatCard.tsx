import StatCard from '../StatCard';
import { DollarSign } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <StatCard
        title="Total Income"
        value="125.50 USDT"
        subtitle="₹12,550 INR"
        icon={DollarSign}
        iconColor="text-primary"
        trend={{ value: "12.5%", positive: true }}
      />
      <StatCard
        title="Binary Pairs"
        value="42"
        subtitle="3 pending"
        icon={DollarSign}
        iconColor="text-chart-3"
      />
    </div>
  );
}
