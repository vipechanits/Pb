import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Users, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, UserCircle, ArrowRight } from 'lucide-react';
import type { BinaryTreeNode, SponsorInfo } from '@shared/schema';

// Sponsor Summary Component
function SponsorSummary({ sponsor }: { sponsor: SponsorInfo | null }) {
  if (!sponsor) {
    return (
      <Alert data-testid="alert-no-sponsor">
        <UserCircle className="h-4 w-4" />
        <AlertDescription>
          No direct sponsor (Root user or PB0/PB1)
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card data-testid="card-sponsor-summary">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserCircle className="w-4 h-4" />
          Your Direct Sponsor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-mono font-semibold" data-testid="text-sponsor-userid">{sponsor.userId}</p>
            <p className="text-xs text-muted-foreground" data-testid="text-sponsor-name">{sponsor.name || 'No name'}</p>
            <p className="text-xs text-muted-foreground" data-testid="text-sponsor-email">{sponsor.email}</p>
          </div>
          <div>
            {sponsor.isActivated ? (
              <Badge variant="default" data-testid="badge-sponsor-activated">Active</Badge>
            ) : (
              <Badge variant="secondary" data-testid="badge-sponsor-not-activated">Not Active</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface UserNodeProps {
  node: BinaryTreeNode | null;
  position: 'root' | 'left' | 'right';
  rootUserId: string;
}

function UserNode({ node, position, rootUserId }: UserNodeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Initialize expansion state based on whether child objects exist
  const [isExpanded, setIsExpanded] = useState(() => Boolean(node?.leftChild || node?.rightChild));
  const [childrenLoaded, setChildrenLoaded] = useState(false);

  // Mutation to load children on demand
  const loadChildren = useMutation({
    mutationFn: async (childUserId: string) => {
      // Fetch children of the node being expanded (childUserId is the parent)
      const response = await fetch(`/api/users/${rootUserId}/binary-tree/children/${childUserId}`);
      if (!response.ok) {
        throw new Error('Failed to load children');
      }
      return response.json() as Promise<{ leftChild: BinaryTreeNode | null; rightChild: BinaryTreeNode | null }>;
    },
    onSuccess: (data) => {
      if (node) {
        // Immutably update the cache while preserving metadata
        queryClient.setQueryData<BinaryTreeNode>(
          ['/api/users', rootUserId, 'binary-tree'],
          (oldTree) => {
            if (!oldTree) return oldTree;
            
            // Recursively update the tree to add children to the target node
            const updateNode = (currentNode: BinaryTreeNode): BinaryTreeNode => {
              if (currentNode.userId === node.userId) {
                // This is the node being expanded - add its children while preserving all metadata
                return {
                  ...currentNode, // Preserve all existing properties including hasLeftChild/hasRightChild
                  leftChild: data.leftChild,
                  rightChild: data.rightChild,
                };
              }
              
              // Recursively update children
              return {
                ...currentNode,
                leftChild: currentNode.leftChild ? updateNode(currentNode.leftChild) : currentNode.leftChild,
                rightChild: currentNode.rightChild ? updateNode(currentNode.rightChild) : currentNode.rightChild,
              };
            };
            
            return updateNode(oldTree);
          }
        );
        setChildrenLoaded(true);
        setIsExpanded(true); // Ensure node stays expanded after loading children
      }
    },
    onError: (error) => {
      // Show error toast and reset expansion state so user can retry
      toast({
        variant: "destructive",
        title: "Failed to load children",
        description: error instanceof Error ? error.message : "An error occurred while loading children. Please try again.",
      });
      setIsExpanded(false); // Reset to collapsed so user can retry
    },
  });

  // Sync childrenLoaded with actual props to handle cache invalidation
  useEffect(() => {
    // If children exist in props, mark as loaded
    if (node?.leftChild || node?.rightChild) {
      setChildrenLoaded(true);
    }
    // If children don't exist in props and we're not loading, mark as not loaded
    else if (!loadChildren.isPending) {
      setChildrenLoaded(false);
    }
  }, [node?.leftChild, node?.rightChild, loadChildren.isPending]);

  if (!node) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="w-36 h-28 border-2 border-dashed border-muted rounded-md flex items-center justify-center bg-muted/20">
          <p className="text-xs text-muted-foreground">Empty Spot</p>
        </div>
      </div>
    );
  }

  const hasChildren = node.hasLeftChild || node.hasRightChild;

  return (
    <div className="flex flex-col items-center gap-2">
      <Card 
        className={`w-36 ${node.isActivated ? 'border-green-500/50' : 'border-muted'}`} 
        data-testid={`node-${node.userId}`}
      >
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
          
          {/* Placement Type Badge */}
          {node.placementType === 'spillover' && (
            <Badge 
              variant="secondary" 
              className="text-xs py-0" 
              data-testid={`badge-placement-spillover-${node.userId}`}
            >
              Spillover
            </Badge>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span title="Left Leg">L: {node.personalLeftCount}</span>
            <span title="Right Leg">R: {node.personalRightCount}</span>
          </div>
          
          {/* Expand/Collapse Button for nodes with children */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-6 mt-1"
              onClick={() => {
                // Recompute from latest props to avoid stale closures
                const childrenAreLoaded = Boolean(node?.leftChild || node?.rightChild) || childrenLoaded;
                
                // If actual child objects exist, just toggle expansion state
                if (childrenAreLoaded) {
                  setIsExpanded(!isExpanded);
                }
                // Otherwise, trigger lazy load (onSuccess/onError will manage isExpanded)
                else if (!loadChildren.isPending) {
                  loadChildren.mutate(node.userId);
                }
              }}
              data-testid={`button-toggle-${node.userId}`}
            >
              {loadChildren.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span className="ml-1 text-xs">
                {isExpanded ? 'Collapse' : 'Expand'}
              </span>
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Children - Collapsible */}
      {hasChildren && isExpanded && (Boolean(node?.leftChild || node?.rightChild) || childrenLoaded) && (
        <div className="flex gap-8 mt-6">
          {/* Left Child */}
          <div className="flex flex-col items-center">
            <div className="h-6 border-l-2 border-muted" />
            <Badge variant="outline" className="mb-2 text-xs border-blue-500 text-blue-500">
              Left
            </Badge>
            <UserNode node={node.leftChild || null} position="left" rootUserId={rootUserId} />
          </div>
          
          {/* Right Child */}
          <div className="flex flex-col items-center">
            <div className="h-6 border-l-2 border-muted" />
            <Badge variant="outline" className="mb-2 text-xs border-green-500 text-green-500">
              Right
            </Badge>
            <UserNode node={node.rightChild || null} position="right" rootUserId={rootUserId} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserBinaryTreePage() {
  const { user } = useAuth();

  const { data: tree, isLoading, error } = useQuery<BinaryTreeNode>({
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

      {/* Sponsor Summary */}
      {tree?.directSponsor !== undefined && (
        <SponsorSummary sponsor={tree.directSponsor} />
      )}

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
          <CardDescription>Visual representation of your team structure (unlimited depth, collapsible)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex justify-center min-w-max p-6">
            {tree && user?.userId ? (
              <UserNode node={tree} position="root" rootUserId={user.userId} />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p>No team data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Activated</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-muted-foreground" />
          <span>Not Activated</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs py-0">Spillover</Badge>
          <span>Placed by upline (not your direct referral)</span>
        </div>
      </div>
    </div>
  );
}
