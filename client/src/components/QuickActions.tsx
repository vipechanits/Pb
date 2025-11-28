import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { 
  Wallet, 
  RefreshCw, 
  UserPlus,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  iconBg: string;
  iconColor: string;
  testId: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Wallet,
    label: 'Activate',
    description: 'Complete payment',
    path: '/user/activation',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    testId: 'quick-action-activate'
  },
  {
    icon: UserPlus,
    label: 'Invite',
    description: 'Grow your team',
    path: '/user/direct-sponsoring',
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
    testId: 'quick-action-invite'
  },
  {
    icon: DollarSign,
    label: 'Income',
    description: 'View earnings',
    path: '/user/transaction-history',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    testId: 'quick-action-income'
  },
  {
    icon: RefreshCw,
    label: 'Re-entry',
    description: 'Start new cycle',
    path: '/user/reentry',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    testId: 'quick-action-reentry'
  },
];

export function QuickActions() {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link 
                key={action.path} 
                href={action.path}
                data-testid={action.testId}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                  action.iconBg
                )}>
                  <Icon className={cn("w-6 h-6", action.iconColor)} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
