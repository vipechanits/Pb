import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { Network, CheckCircle, XCircle, AlertCircle, Loader2, TrendingUp, Users, Layers } from 'lucide-react';

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

interface MatrixStats {
  totalFilled: number;
  maxLevel: number;
  totalLevels: number;
  levelBreakdown: Array<{
    level: number;
    capacity: number;
    filled: number;
    available: number;
  }>;
}

interface MatrixNodeProps {
  node: MatrixNode | null;
  position: 'root' | 'left' | 'right';
  depth: number;
}

function MatrixNodeComponent({ node, position, depth }: MatrixNodeProps) {
  if (depth > 5 || !node) {
    return null;
  }

  const hasLeftChild = node.leftChild !== null;
  const hasRightChild = node.rightChild !== null;

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <Card className={`w-36 flex-shrink-0 border-0 shadow-md ${node.isActivated ? 'bg-gradient-to-br from-primary/5 to-primary/10 ring-1 ring-primary/30' : 'bg-muted/50'}`} data-testid={`matrix-node-${node.userId}`}>
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-mono font-bold text-primary">{node.userId}</p>
            {node.isActivated ? (
              <CheckCircle className="w-3.5 h-3.5 text-success" data-testid={`icon-activated-${node.userId}`} />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-muted-foreground" data-testid={`icon-not-activated-${node.userId}`} />
            )}
          </div>
          <p className="text-xs truncate text-foreground/80" data-testid={`name-${node.userId}`}>
            {node.name || 'No name'}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">L{node.matrixLevel ?? '-'}</Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">P{node.matrixPosition ?? '-'}</Badge>
          </div>
        </CardContent>
      </Card>
      
      {depth < 5 && (hasLeftChild || hasRightChild) && (
        <div className="mt-4 flex flex-col items-center flex-shrink-0">
          {/* Vertical line from parent to horizontal connector */}
          <div className="h-6 w-0.5 bg-primary/30" />
          
          {/* Horizontal connector line with branches */}
          <div className="flex items-start gap-6 flex-shrink-0">
            {/* Left branch with connector */}
            {hasLeftChild && (
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative">
                  <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3 bg-primary/40" />
                </div>
                <Badge className="my-2 text-xs bg-primary/10 text-primary border-primary/30 flex-shrink-0">Left</Badge>
                <MatrixNodeComponent node={node.leftChild} position="left" depth={depth + 1} />
              </div>
            )}
            
            {/* Horizontal connector between left and right */}
            {hasLeftChild && hasRightChild && (
              <div className="w-10 h-0.5 bg-primary/30 self-start mt-3 flex-shrink-0" />
            )}
            
            {/* Right branch with connector */}
            {hasRightChild && (
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative">
                  <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3 bg-accent/60" />
                </div>
                <Badge className="my-2 text-xs bg-accent/10 text-accent border-accent/30 flex-shrink-0">Right</Badge>
                <MatrixNodeComponent node={node.rightChild} position="right" depth={depth + 1} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CycleMatrixViewProps {
  activation: UserActivation;
  userId: string;
  isSelected: boolean;
}

function CycleMatrixView({ activation, userId, isSelected }: CycleMatrixViewProps) {
  // Fetch matrix tree for this specific activation
  const { data: matrix, isLoading } = useQuery<MatrixNode>({
    queryKey: ['/api/users', userId, 'global-matrix', activation.activationId],
    queryFn: async () => {
      const url = `/api/users/${userId}/global-matrix?activationId=${activation.activationId}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to load global matrix');
      }
      return await res.json();
    },
    enabled: isSelected && activation.matrixLevel !== null, // Only fetch if selected and placed in matrix
  });

  const countTeamMembers = (node: MatrixNode | null): number => {
    if (!node) return 0;
    return 1 + countTeamMembers(node.leftChild) + countTeamMembers(node.rightChild);
  };

  const teamCount = matrix ? countTeamMembers(matrix) - 1 : 0;

  return (
    <div className="space-y-4">
      {/* Cycle Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Matrix Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={`stat-matrix-level-cycle-${activation.cycleNumber}`}>
              {activation.matrixLevel ?? 'Not Placed'}
            </div>
            <p className="text-xs text-muted-foreground">
              Position in Cycle #{activation.cycleNumber} matrix
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Matrix Path</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono font-bold truncate" data-testid={`stat-matrix-path-cycle-${activation.cycleNumber}`}>
              {activation.matrixPath || 'Not Placed'}
            </div>
            <p className="text-xs text-muted-foreground">
              Breadcrumb trail for Cycle #{activation.cycleNumber}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={`stat-team-count-cycle-${activation.cycleNumber}`}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : teamCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Under you in Cycle #{activation.cycleNumber}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matrix Tree Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Matrix Position - Cycle #{activation.cycleNumber}</CardTitle>
          <CardDescription>
            {activation.status === 'completed' 
              ? `Matrix tree for Cycle #${activation.cycleNumber} (completed ${activation.completedAt ? new Date(activation.completedAt).toLocaleDateString() : ''})`
              : `Matrix tree for Cycle #${activation.cycleNumber} (${activation.status})`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {activation.matrixLevel === null ? (
            <Alert className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Matrix Placement Pending:</strong> Complete all 8 payments for Cycle #{activation.cycleNumber} to be placed in the global matrix.
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="text-center text-muted-foreground py-12">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading matrix data for Cycle #{activation.cycleNumber}...</p>
            </div>
          ) : matrix ? (
            <div className="flex justify-center min-w-max p-6">
              <MatrixNodeComponent node={matrix} position="root" depth={0} />
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No matrix data available for Cycle #{activation.cycleNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface UserActivation {
  activationId: string;
  cycleNumber: number;
  status: string;
  matrixLevel: number | null;
  matrixPath: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function UserGlobalMatrixPage() {
  const { user } = useAuth();
  const [selectedActivationId, setSelectedActivationId] = useState<string | undefined>();
  
  // Fetch user's activations list (for cycle tabs)
  const { data: activations, isLoading: isLoadingActivations } = useQuery<UserActivation[]>({
    queryKey: ['/api/users', user?.userId, 'activations'],
    enabled: !!user?.userId,
  });
  
  // Auto-select first activation when loaded (using useEffect to avoid render-phase mutation)
  useEffect(() => {
    if (activations && activations.length > 0 && !selectedActivationId) {
      setSelectedActivationId(activations[0].activationId);
    }
  }, [activations, selectedActivationId]);
  
  // Fetch matrix tree for selected activation
  const { data: matrix, isLoading, error } = useQuery<MatrixNode>({
    queryKey: selectedActivationId 
      ? ['/api/users', user?.userId, 'global-matrix', selectedActivationId]
      : ['/api/users', user?.userId, 'global-matrix'],
    queryFn: async () => {
      const baseUrl = `/api/users/${user?.userId}/global-matrix`;
      const url = selectedActivationId 
        ? `${baseUrl}?activationId=${selectedActivationId}`
        : baseUrl;
      
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to load global matrix');
      }
      return await res.json();
    },
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

      <Alert>
        <Network className="h-4 w-4" />
        <AlertDescription>
          <strong>Global Matrix System:</strong> All activated users are placed in an unlimited global 2×∞ matrix (2 positions per level, infinite levels).
          Placement is automatic and follows breadth-first order, independent of your binary sponsorship tree. Each re-entry cycle creates a separate matrix position, allowing unlimited matrix participation.
        </AlertDescription>
      </Alert>

      {activations && activations.length > 0 ? (
        <Tabs value={selectedActivationId} onValueChange={setSelectedActivationId} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${activations.length}, minmax(0, 1fr))` }}>
            {activations.map((activation) => (
              <TabsTrigger
                key={activation.activationId}
                value={activation.activationId}
                data-testid={`tab-cycle-${activation.cycleNumber}`}
                className="gap-2"
              >
                <span>Cycle #{activation.cycleNumber}</span>
                {activation.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                {activation.matrixLevel !== null && <Badge variant="outline" className="text-xs">L{activation.matrixLevel}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {activations.map((activation) => (
            <TabsContent key={activation.activationId} value={activation.activationId} className="mt-6">
              <CycleMatrixView 
                activation={activation} 
                userId={user?.userId!} 
                isSelected={selectedActivationId === activation.activationId}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
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
      )}

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
