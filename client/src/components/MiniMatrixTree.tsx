import { CheckCircle, XCircle } from 'lucide-react';

interface MatrixNode {
  userId: string;
  name: string | null;
  email: string | null;
  isActivated: boolean;
  matrixLevel: number | null;
  matrixPosition: number | null;
  matrixPath: string | null;
  leftChild: MatrixNode | null;
  rightChild: MatrixNode | null;
}

interface MiniMatrixTreeProps {
  root: MatrixNode | null;
  maxDepth?: number;
}

function MatrixNodeComponent({ node, depth = 0, maxDepth = 3 }: { node: MatrixNode | null; depth?: number; maxDepth?: number }) {
  if (depth >= maxDepth) {
    return null;
  }

  if (!node) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-20 h-14 rounded-md border-2 border-dashed border-purple-300/30 flex items-center justify-center bg-purple-50/20 dark:bg-purple-950/20">
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
            ? 'bg-purple-500/10 border-purple-500/50' 
            : 'bg-muted/50 border-muted-foreground/30'
        }`}
        data-testid={`mini-matrix-node-${node.userId}`}
      >
        <div className="text-xs font-mono font-semibold truncate w-full px-1">{node.userId}</div>
        <div className="text-[10px] text-muted-foreground truncate w-full px-1">
          {node.name || 'No name'}
        </div>
        {node.isActivated ? (
          <CheckCircle className="w-3 h-3 text-purple-500" />
        ) : (
          <XCircle className="w-3 h-3 text-muted-foreground" />
        )}
      </div>

      {hasChildren && depth < maxDepth - 1 && (
        <div className="flex gap-2 pt-2 border-t-2 border-purple-300/20">
          <MatrixNodeComponent node={node.leftChild} depth={depth + 1} maxDepth={maxDepth} />
          <MatrixNodeComponent node={node.rightChild} depth={depth + 1} maxDepth={maxDepth} />
        </div>
      )}
    </div>
  );
}

export default function MiniMatrixTree({ root, maxDepth = 3 }: MiniMatrixTreeProps) {
  if (!root) {
    return (
      <div className="w-full py-8 text-center text-muted-foreground">
        <p className="text-sm">Not placed in matrix yet. Complete activation to be placed.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="min-w-max flex justify-center">
        <MatrixNodeComponent node={root} depth={0} maxDepth={maxDepth} />
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4 pt-2 border-t border-purple-300/20">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-purple-500" />
          <span>Activated & Placed</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-3 h-3 text-muted-foreground" />
          <span>Not Activated</span>
        </div>
      </div>
    </div>
  );
}
