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
          No direct sponsor (Root user or PB0)
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
  onViewTeam?: (userId: string) => void;
  expandedNodes: Set<string>;
  loadedNodes: Set<string>;
  onToggleExpansion: (nodeUserId: string, isExpanded: boolean) => void;
  onMarkLoaded: (nodeUserId: string) => void;
}

function UserNode({ 
  node, 
  position, 
  rootUserId, 
  onViewTeam,
  expandedNodes,
  loadedNodes,
  onToggleExpansion,
  onMarkLoaded,
}: UserNodeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Use shared expansion state instead of local state
  const isExpanded = node ? expandedNodes.has(node.userId) : false;
  const childrenLoaded = node ? loadedNodes.has(node.userId) : false;

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
        // Mark as loaded and expanded in shared state
        onMarkLoaded(node.userId);
        onToggleExpansion(node.userId, true);
      }
    },
    onError: (error) => {
      // Show error toast and reset expansion state so user can retry
      toast({
        variant: "destructive",
        title: "Failed to load children",
        description: error instanceof Error ? error.message : "An error occurred while loading children. Please try again.",
      });
      // Reset to collapsed in shared state
      if (node) {
        onToggleExpansion(node.userId, false);
      }
    },
  });

  // Auto-mark nodes as loaded if they have children in props (from cache)
  useEffect(() => {
    if (node && (node.leftChild || node.rightChild) && !childrenLoaded) {
      onMarkLoaded(node.userId);
    }
  }, [node, childrenLoaded, onMarkLoaded]);

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
          
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-green-600" title="Total Left Leg Count">L: {node.leftLegCount}</span>
            <span className="font-semibold text-blue-600" title="Total Right Leg Count">R: {node.rightLegCount}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span title="Personal Left">PL: {node.personalLeftCount}</span>
            <span title="Personal Right">PR: {node.personalRightCount}</span>
          </div>
          
          {/* Expand/Collapse Button for nodes with children */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-6 mt-1"
              onClick={() => {
                if (!node) return;
                
                // If children are already loaded, just toggle expansion
                if (childrenLoaded || node.leftChild || node.rightChild) {
                  onToggleExpansion(node.userId, !isExpanded);
                }
                // Otherwise, trigger lazy load (onSuccess will set expansion)
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
          
          {/* View This Team Button */}
          {onViewTeam && node.userId !== rootUserId && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full h-6 mt-1"
              onClick={() => onViewTeam(node.userId)}
              data-testid={`button-view-team-${node.userId}`}
            >
              <Users className="w-3 h-3 mr-1" />
              <span className="text-xs">View Team</span>
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
            <UserNode 
              node={node.leftChild || null} 
              position="left" 
              rootUserId={rootUserId} 
              onViewTeam={onViewTeam}
              expandedNodes={expandedNodes}
              loadedNodes={loadedNodes}
              onToggleExpansion={onToggleExpansion}
              onMarkLoaded={onMarkLoaded}
            />
          </div>
          
          {/* Right Child */}
          <div className="flex flex-col items-center">
            <div className="h-6 border-l-2 border-muted" />
            <Badge variant="outline" className="mb-2 text-xs border-green-500 text-green-500">
              Right
            </Badge>
            <UserNode 
              node={node.rightChild || null} 
              position="right" 
              rootUserId={rootUserId} 
              onViewTeam={onViewTeam}
              expandedNodes={expandedNodes}
              loadedNodes={loadedNodes}
              onToggleExpansion={onToggleExpansion}
              onMarkLoaded={onMarkLoaded}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type TreeExpansionState = {
  expanded: Set<string>;
  loaded: Set<string>;
};

export default function UserBinaryTreePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Track which user's tree is being viewed (defaults to logged-in user)
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const effectiveViewedUserId = viewedUserId || user?.userId || '';

  // Maintain expansion state per tree (keyed by rootUserId)
  const [expansionStates, setExpansionStates] = useState<Record<string, TreeExpansionState>>({});

  const { data: tree, isLoading, error } = useQuery<BinaryTreeNode>({
    queryKey: ['/api/users', effectiveViewedUserId, 'binary-tree'],
    enabled: !!effectiveViewedUserId,
    retry: (failureCount, error: any) => {
      // Don't retry on 403 (forbidden) - this means unauthorized access
      if (error?.response?.status === 403) return false;
      return failureCount < 3;
    },
  });
  
  // Handle 403 errors by redirecting to own tree
  useEffect(() => {
    if (error && (error as any)?.response?.status === 403) {
      toast({
        title: "Access Denied",
        description: "You can only view your own tree or downline trees",
        variant: "destructive",
      });
      setViewedUserId(null); // Reset to own tree
    }
  }, [error, toast]);
  
  // Initialize expansion state for new trees (preserves existing state)
  useEffect(() => {
    if (!effectiveViewedUserId) return;
    
    setExpansionStates(prev => {
      // Only initialize if this tree hasn't been viewed before
      if (!prev[effectiveViewedUserId]) {
        return {
          ...prev,
          [effectiveViewedUserId]: {
            expanded: new Set([effectiveViewedUserId]), // Root expanded by default
            loaded: new Set(),
          },
        };
      }
      return prev; // Preserve existing state
    });
  }, [effectiveViewedUserId]);
  
  // Hydrate loaded state from cached tree data (merges with existing, never overwrites expanded)
  useEffect(() => {
    if (!tree || !effectiveViewedUserId) return;
    
    // Traverse tree and collect nodes that have children (should be marked as loaded)
    const nodesWithChildren = new Set<string>();
    const traverseTree = (node: BinaryTreeNode | null) => {
      if (!node) return;
      
      if (node.leftChild || node.rightChild) {
        nodesWithChildren.add(node.userId);
      }
      
      if (node.leftChild) traverseTree(node.leftChild);
      if (node.rightChild) traverseTree(node.rightChild);
    };
    
    traverseTree(tree);
    
    // ONLY update loaded Set, never touch expanded (user controls expanded via toggles)
    if (nodesWithChildren.size > 0) {
      setExpansionStates(prev => {
        const existing = prev[effectiveViewedUserId];
        
        // Initialize if this is first time viewing this tree
        if (!existing) {
          return {
            ...prev,
            [effectiveViewedUserId]: {
              expanded: new Set([effectiveViewedUserId]), // Root expanded by default
              loaded: nodesWithChildren,
            },
          };
        }
        
        // Merge new loaded nodes with existing (preserve expanded completely)
        const newLoaded = new Set([...Array.from(existing.loaded), ...Array.from(nodesWithChildren)]);
        
        return {
          ...prev,
          [effectiveViewedUserId]: {
            expanded: existing.expanded, // NEVER modify - user controls this
            loaded: newLoaded, // ONLY merge new cached children
          },
        };
      });
    }
  }, [tree, effectiveViewedUserId]);
  
  // Get or initialize expansion state for current tree
  const currentExpansionState = expansionStates[effectiveViewedUserId] || {
    expanded: new Set<string>([effectiveViewedUserId]), // Root is expanded by default
    loaded: new Set<string>(),
  };
  
  // Helper to update expansion state for a node
  const toggleNodeExpansion = (nodeUserId: string, isExpanded: boolean) => {
    setExpansionStates(prev => {
      const state = prev[effectiveViewedUserId] || {
        expanded: new Set([effectiveViewedUserId]),
        loaded: new Set(),
      };
      
      const newExpanded = new Set(state.expanded);
      if (isExpanded) {
        newExpanded.add(nodeUserId);
      } else {
        newExpanded.delete(nodeUserId);
      }
      
      return {
        ...prev,
        [effectiveViewedUserId]: {
          ...state,
          expanded: newExpanded,
        },
      };
    });
  };
  
  // Helper to mark node as loaded
  const markNodeAsLoaded = (nodeUserId: string) => {
    setExpansionStates(prev => {
      const state = prev[effectiveViewedUserId] || {
        expanded: new Set([effectiveViewedUserId]),
        loaded: new Set(),
      };
      
      const newLoaded = new Set(state.loaded);
      newLoaded.add(nodeUserId);
      
      return {
        ...prev,
        [effectiveViewedUserId]: {
          ...state,
          loaded: newLoaded,
        },
      };
    });
  };

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

  const isViewingOwnTree = effectiveViewedUserId === user?.userId;
  
  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="binary-tree-page">
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Binary Tree</h1>
            <p className="text-muted-foreground">
              {isViewingOwnTree 
                ? "View your binary team structure and downline placements"
                : `Viewing ${tree?.name || effectiveViewedUserId}'s binary team structure`
              }
            </p>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {!isViewingOwnTree && (
              <Button
                variant="outline"
                onClick={() => setViewedUserId(null)}
                data-testid="button-back-to-my-tree"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back to My Tree
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tree Owner Info Badge */}
      {!isViewingOwnTree && tree && (
        <Alert data-testid="alert-viewing-other-tree">
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>Viewing:</strong> {tree.name || tree.userId} ({tree.userId}) - {tree.isActivated ? "Activated" : "Not Activated"}
          </AlertDescription>
        </Alert>
      )}

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
            {tree && effectiveViewedUserId ? (
              <UserNode 
                key={effectiveViewedUserId}
                node={tree} 
                position="root" 
                rootUserId={effectiveViewedUserId} 
                onViewTeam={setViewedUserId}
                expandedNodes={currentExpansionState.expanded}
                loadedNodes={currentExpansionState.loaded}
                onToggleExpansion={toggleNodeExpansion}
                onMarkLoaded={markNodeAsLoaded}
              />
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
