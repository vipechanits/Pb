import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
}: StatCardProps) {
  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-md bg-${iconColor.replace('text-', '')}/10`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums" data-testid={`text-stat-value`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-stat-subtitle">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-sm font-medium ${
                trend.positive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
