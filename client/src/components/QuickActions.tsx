import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { 
  Wallet, 
  RefreshCw, 
  UserPlus,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  path: string;
  gradient: string;
  testId: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Wallet,
    label: 'Activate',
    path: '/user/activation',
    gradient: 'from-purple-500 to-pink-500',
    testId: 'quick-action-activate'
  },
  {
    icon: UserPlus,
    label: 'Invite',
    path: '/user/direct-sponsoring',
    gradient: 'from-blue-500 to-cyan-500',
    testId: 'quick-action-invite'
  },
  {
    icon: DollarSign,
    label: 'Income',
    path: '/user/transaction-history',
    gradient: 'from-green-500 to-emerald-500',
    testId: 'quick-action-income'
  },
  {
    icon: RefreshCw,
    label: 'Re-entry',
    path: '/user/reentry',
    gradient: 'from-amber-500 to-yellow-500',
    testId: 'quick-action-reentry'
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex gap-2 sm:gap-4 justify-between">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link 
                key={action.path} 
                href={action.path}
                data-testid={action.testId}
                className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg hover-elevate active-elevate-2 transition-all flex-1"
              >
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br",
                  action.gradient,
                  "group-hover:scale-110 transition-transform"
                )}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
