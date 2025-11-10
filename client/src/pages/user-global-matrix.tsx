import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { Network, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface MatrixNode {
  userId: string;
  name: string | null;
  email: string;
  isActivated: boolean;
  matrixLevel: number | null;
  matrixPosition: number | null;
  matrixPath: string | null;
  leftChild: MatrixNode | null;
  rightChild: MatrixNode | null;
}

interface MatrixNodeProps {
  node: MatrixNode | null;
  position: 'root' | 'left' | 'right';
  depth: number;
}

function MatrixNodeComponent({ node, position, depth }: MatrixNodeProps) {
  if (!node || depth > 5) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="w-32 h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center bg-muted/20">
          <p className="text-xs text-muted-foreground">Empty Slot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Card className={`w-32 ${node.isActivated ? 'border-purple-500/50' : 'border-muted'}`} data-testid={`matrix-node-${node.userId}`}>
        <CardContent className="p-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold">{node.userId}</p>
            {node.isActivated ? (
              <CheckCircle className="w-3 h-3 text-purple-500" data-testid={`icon-activated-${node.userId}`} />
            ) : (
              <XCircle className="w-3 h-3 text-muted-foreground" data-testid={`icon-not-activated-${node.userId}`} />
            )}
          </div>
          <p className="text-xs truncate" data-testid={`name-${node.userId}`}>
            {node.name || 'No name'}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span title="Matrix Level">L{node.matrixLevel ?? '-'}</span>
            <span title="Position">P{node.matrixPosition ?? '-'}</span>
          </div>
        </CardContent>
      </Card>
      
      {(node.leftChild || node.rightChild) && depth < 5 && (
        <div className="flex gap-8 mt-6">
          <div className="flex flex-col items-center">
            <div className="h-6 border-l-2 border-muted" />
            <Badge variant="outline" className="mb-2 text-xs border-purple-500 text-purple-500">Left</Badge>
            <MatrixNodeComponent node={node.leftChild} position="left" depth={depth + 1} />
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 border-l-2 border-muted" />
            <Badge variant="outline" className="mb-2 text-xs border-pink-500 text-pink-500">Right</Badge>
            <MatrixNodeComponent node={node.rightChild} position="right" depth={depth + 1} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserGlobalMatrixPage() {
  const { user } = useAuth();

  const { data: matrix, isLoading, error } = useQuery<MatrixNode>({
    queryKey: ['/api/users', user?.userId, 'global-matrix'],
    enabled: !!user?.userId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading global matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load global matrix. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const countTeamMembers = (node: MatrixNode | null): number => {
    if (!node) return 0;
    return 1 + countTeamMembers(node.leftChild) + countTeamMembers(node.rightChild);
  };

  const teamCount = matrix ? countTeamMembers(matrix) - 1 : 0;
  const isPlacedInMatrix = matrix?.matrixLevel != null && matrix?.matrixPath != null;

  if (!isPlacedInMatrix && matrix) {
    return (
      <div className="container mx-auto p-6 space-y-6" data-testid="global-matrix-page">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Global Matrix</h1>
          <p className="text-muted-foreground">
            View your position in the global 2x5 matrix system
          </p>
        </div>

        <Alert>
          <Network className="h-4 w-4" />
          <AlertDescription>
            <strong>Not Placed Yet:</strong> You haven't been placed in the global matrix yet.
            Complete your activation by confirming all 8 payments to be automatically assigned to the next available matrix position.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="global-matrix-page">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Global Matrix</h1>
        <p className="text-muted-foreground">
          View your position in the global 2x5 matrix system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Matrix Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-matrix-level">
              {matrix?.matrixLevel ?? 'Not Placed'}
            </div>
            <p className="text-xs text-muted-foreground">
              Your position in matrix
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Matrix Path</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono font-bold truncate" data-testid="stat-matrix-path">
              {matrix?.matrixPath || 'Not Placed'}
            </div>
            <p className="text-xs text-muted-foreground">
              Breadcrumb trail
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-team-count">{teamCount}</div>
            <p className="text-xs text-muted-foreground">
              Under you in matrix
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Network className="h-4 w-4" />
        <AlertDescription>
          <strong>Global Matrix System:</strong> All activated users are placed in a global 2x5 matrix (2 positions per level, 5 levels deep).
          Placement is automatic and follows breadth-first order, independent of your binary sponsorship tree.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Your Matrix Position</CardTitle>
          <CardDescription>Visual representation of your matrix team (up to 5 levels deep)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex justify-center min-w-max p-6">
            {matrix ? (
              <MatrixNodeComponent node={matrix} position="root" depth={0} />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p>No matrix data available. Activate your account to be placed in the global matrix.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-purple-500" />
          <span>Activated & Placed</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-muted-foreground" />
          <span>Not Activated</span>
        </div>
      </div>
    </div>
  );
}
