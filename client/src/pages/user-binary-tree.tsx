import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { Users, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TreeNode {
  userId: string;
  name: string | null;
  email: string;
  isActivated: boolean;
  leftLegCount: number;
  rightLegCount: number;
  personalLeftCount: number;
  personalRightCount: number;
  totalReferrals: number;
  leftChild: TreeNode | null;
  rightChild: TreeNode | null;
}

interface UserNodeProps {
  node: TreeNode | null;
  position: 'root' | 'left' | 'right';
  depth: number;
}

function UserNode({ node, position, depth }: UserNodeProps) {
  if (!node || depth > 5) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="w-32 h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center bg-muted/20">
          <p className="text-xs text-muted-foreground">Empty Spot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Card className={`w-32 ${node.isActivated ? 'border-green-500/50' : 'border-muted'}`} data-testid={`node-${node.userId}`}>
        <CardContent className="p-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold">{node.userId}</p>
            {node.isActivated ? (
              <CheckCircle className="w-3 h-3 text-green-500" data-testid={`icon-activated-${node.userId}`} />
            ) : (
              <XCircle className="w-3 h-3 text-muted-foreground" data-testid={`icon-not-activated-${node.userId}`} />
            )}
          </div>
          <p className="text-xs truncate" data-testid={`name-${node.userId}`}>
            {node.name || 'No name'}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span title="Left Leg">L: {node.personalLeftCount}</span>
            <span title="Right Leg">R: {node.personalRightCount}</span>
          </div>
        </CardContent>
      </Card>
      
      {(node.leftChild || node.rightChild) && depth < 5 && (
        <div className="flex gap-8 mt-6">
          <div className="flex flex-col items-center">
            <div className="h-6 border-l-2 border-muted" />
            <Badge variant="outline" className="mb-2 text-xs border-blue-500 text-blue-500">Left</Badge>
            <UserNode node={node.leftChild} position="left" depth={depth + 1} />
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 border-l-2 border-muted" />
            <Badge variant="outline" className="mb-2 text-xs border-green-500 text-green-500">Right</Badge>
            <UserNode node={node.rightChild} position="right" depth={depth + 1} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserBinaryTreePage() {
  const { user } = useAuth();

  const { data: tree, isLoading, error } = useQuery<TreeNode>({
    queryKey: ['/api/users', user?.userId, 'binary-tree'],
    enabled: !!user?.userId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading binary tree...</p>
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
            Failed to load binary tree. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="binary-tree-page">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Binary Tree</h1>
        <p className="text-muted-foreground">
          View your binary team structure and downline placements
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Left Leg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-left-leg">{tree?.leftLegCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Personal: {tree?.personalLeftCount || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Right Leg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-right-leg">{tree?.rightLegCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Personal: {tree?.personalRightCount || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-referrals">{tree?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Binary Matching Qualification Status */}
      {tree && (
        <Alert 
          className={tree.personalLeftCount >= 1 && tree.personalRightCount >= 1 ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"}
          data-testid="alert-binary-qualification"
        >
          <Users className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div className="font-semibold">
              {tree.personalLeftCount >= 1 && tree.personalRightCount >= 1 ? (
                <span className="text-green-600 dark:text-green-400" data-testid="text-qualification-qualified">✓ Binary Match Qualified!</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400" data-testid="text-qualification-pending">Binary Match Prerequisite</span>
              )}
            </div>
            <p className="text-sm" data-testid="text-prerequisite-requirement">
              <strong>Qualification Requirement:</strong> You must have <strong>1 direct left</strong> + <strong>1 direct right</strong> personal referral (one-time). After qualification, your 3:3 matching counts include your entire team (personal + spillover).
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span 
                className={tree.personalLeftCount >= 1 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}
                data-testid="text-left-progress"
              >
                Left: {tree.personalLeftCount}/1 {tree.personalLeftCount >= 1 && "✓"}
              </span>
              <span 
                className={tree.personalRightCount >= 1 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}
                data-testid="text-right-progress"
              >
                Right: {tree.personalRightCount}/1 {tree.personalRightCount >= 1 && "✓"}
              </span>
            </div>
            {tree.personalLeftCount >= 1 && tree.personalRightCount >= 1 && (
              <p className="text-sm text-green-600 dark:text-green-400" data-testid="text-qualification-success">
                You can now earn ₹1,000 per 3:3 matched pair through the binary matching queue!
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Alert data-testid="alert-binary-structure">
        <Users className="h-4 w-4" />
        <AlertDescription>
          <p data-testid="text-binary-structure-info">
            <strong>Binary Tree Structure:</strong> Each member can have up to 2 direct referrals (left and right legs).
            Your team grows as your downline recruits more members into their left and right positions.
          </p>
          <br />
          <p data-testid="text-personal-count-note">
            <strong>Important:</strong> "Personal" counts = Your direct referrals only (for 1L+1R qualification). 
            "Total" leg counts = Your entire team including spillover from upline (used for 3:3 binary matching).
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Your Binary Network</CardTitle>
          <CardDescription>Visual representation of your team structure (up to 5 levels deep)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex justify-center min-w-max p-6">
            {tree ? (
              <UserNode node={tree} position="root" depth={0} />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p>No team data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Activated</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-muted-foreground" />
          <span>Not Activated</span>
        </div>
      </div>
    </div>
  );
}
