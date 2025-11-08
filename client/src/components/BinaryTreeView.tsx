import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TreeNode {
  address?: string;
  active: boolean;
  left?: TreeNode;
  right?: TreeNode;
}

interface BinaryTreeViewProps {
  root: TreeNode;
}

function TreeNodeComponent({ node, depth = 0 }: { node?: TreeNode; depth?: number }) {
  if (!node || depth > 2) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-md border-2 border-dashed border-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Empty</span>
        </div>
      </div>
    );
  }

  const truncate = (addr?: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`p-3 rounded-md border-2 ${
          node.active ? 'border-primary bg-primary/5' : 'border-muted bg-muted'
        }`}
      >
        <div className="text-xs font-mono text-center">{truncate(node.address)}</div>
        <Badge variant={node.active ? 'default' : 'secondary'} className="mt-1 text-xs">
          {node.active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      {depth < 2 && (node.left || node.right) && (
        <div className="flex gap-4 mt-2">
          <TreeNodeComponent node={node.left} depth={depth + 1} />
          <TreeNodeComponent node={node.right} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

export default function BinaryTreeView({ root }: BinaryTreeViewProps) {
  return (
    <Card data-testid="card-binary-tree">
      <CardHeader>
        <CardTitle>Binary Tree Structure</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-max py-4">
          <TreeNodeComponent node={root} />
        </div>
      </CardContent>
    </Card>
  );
}
