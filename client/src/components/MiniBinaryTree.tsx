import { CheckCircle, XCircle } from 'lucide-react';

interface TreeNode {
  userId: string;
  name: string | null;
  email: string | null;
  isActivated: boolean;
  leftLegCount?: number;
  rightLegCount?: number;
  personalLeftCount?: number;
  personalRightCount?: number;
  totalReferrals?: number;
  leftChild: TreeNode | null;
  rightChild: TreeNode | null;
}

interface MiniBinaryTreeProps {
  root: TreeNode;
  maxDepth?: number;
}

function TreeNodeComponent({ node, depth = 0, maxDepth = 3 }: { node: TreeNode | null; depth?: number; maxDepth?: number }) {
  if (depth >= maxDepth) {
    return null;
  }

  if (!node) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-20 h-14 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
          <span className="text-xs text-muted-foreground">Empty</span>
        </div>
      </div>
    );
  }

  const hasChildren = (node.leftChild !== null) || (node.rightChild !== null);

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`w-20 h-14 rounded-md border flex flex-col items-center justify-center p-1 text-center ${
          node.isActivated 
            ? 'bg-green-500/10 border-green-500/50' 
            : 'bg-muted/50 border-muted-foreground/30'
        }`}
        data-testid={`mini-tree-node-${node.userId}`}
      >
        <div className="text-xs font-mono font-semibold truncate w-full px-1">{node.userId}</div>
        <div className="text-[10px] text-muted-foreground truncate w-full px-1">
          {node.name || 'No name'}
        </div>
        {node.isActivated ? (
          <CheckCircle className="w-3 h-3 text-green-500" />
        ) : (
          <XCircle className="w-3 h-3 text-muted-foreground" />
        )}
      </div>

      {hasChildren && depth < maxDepth - 1 && (
        <div className="flex gap-2 pt-2 border-t-2 border-muted-foreground/20">
          <TreeNodeComponent node={node.leftChild} depth={depth + 1} maxDepth={maxDepth} />
          <TreeNodeComponent node={node.rightChild} depth={depth + 1} maxDepth={maxDepth} />
        </div>
      )}
    </div>
  );
}

export default function MiniBinaryTree({ root, maxDepth = 3 }: MiniBinaryTreeProps) {
  if (!root) {
    return (
      <div className="w-full py-8 text-center text-muted-foreground">
        <p className="text-sm">No binary tree data available.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="min-w-max flex justify-center">
        <TreeNodeComponent node={root} depth={0} maxDepth={maxDepth} />
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4 pt-2 border-t">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>Activated</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-3 h-3 text-muted-foreground" />
          <span>Not Activated</span>
        </div>
      </div>
    </div>
  );
}
