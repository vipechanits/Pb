import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Trophy, RefreshCw } from 'lucide-react';

interface ReentryStatus {
  isEligibleForReentry: boolean;
  currentReentry: {
    status: string;
  } | null;
}

interface DashboardHeaderProps {
  userName: string | null | undefined;
  userEmail: string | undefined;
  userId: string | undefined;
  isActivated: boolean;
  reentryStatus?: ReentryStatus;
}

export function DashboardHeader({ 
  userName, 
  userEmail, 
  userId, 
  isActivated, 
  reentryStatus 
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome, {userName || userEmail}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            User ID: <span className="font-mono font-semibold text-foreground">{userId || 'Not assigned'}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isActivated ? (
            <Badge variant="default" className="gap-1.5 px-3 py-1.5" data-testid="badge-activated">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Activated</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5" data-testid="badge-not-activated">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Not Activated</span>
            </Badge>
          )}
          
          {isActivated && reentryStatus?.isEligibleForReentry && (
            <Badge variant="default" className="gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700" data-testid="badge-reentry-eligible">
              <Trophy className="w-4 h-4" />
              <span className="font-medium">Re-entry Eligible</span>
            </Badge>
          )}
          
          {isActivated && reentryStatus?.currentReentry?.status === 'in_progress' && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-blue-500 text-blue-500" data-testid="badge-reentry-in-progress">
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">Re-entry In Progress</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
