import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ReentryCycle {
  id: number;
  cycleNumber: number;
  status: string;
  completedAt?: string;
  initiatedAt?: string;
}

interface ReentryHistoryProps {
  reentryHistory: ReentryCycle[];
}

export function ReentryHistory({ reentryHistory }: ReentryHistoryProps) {
  if (!reentryHistory || reentryHistory.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 pt-4 border-t">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="w-4 h-4" />
        Re-entry History
      </div>
      <div className="space-y-2">
        {reentryHistory.slice(0, 5).map((cycle) => (
          <div key={cycle.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-card" data-testid={`reentry-cycle-${cycle.cycleNumber}`}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Cycle #{cycle.cycleNumber}
              </Badge>
              <span className="text-muted-foreground">
                {cycle.status === 'completed' && cycle.completedAt
                  ? format(new Date(cycle.completedAt), 'MMM dd, yyyy')
                  : cycle.status === 'in_progress' && cycle.initiatedAt
                  ? `Started ${format(new Date(cycle.initiatedAt), 'MMM dd, yyyy')}`
                  : 'Pending'}
              </span>
            </div>
            <Badge 
              variant={cycle.status === 'completed' ? 'default' : 'secondary'}
              className={cycle.status === 'completed' ? 'bg-green-600' : ''}
            >
              {cycle.status === 'completed' ? 'Completed' : 'In Progress'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
