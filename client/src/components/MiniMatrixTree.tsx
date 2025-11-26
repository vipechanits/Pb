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

  // Calculate node size based on depth to prevent extreme widening
  const isDeepLevel = depth >= 3;
  const nodeWidth = isDeepLevel ? 'w-16' : 'w-20';
  const nodeHeight = isDeepLevel ? 'h-12' : 'h-14';
  const textSize = isDeepLevel ? 'text-[10px]' : 'text-xs';
  const nameSize = isDeepLevel ? 'text-[8px]' : 'text-[10px]';
  const gap = isDeepLevel ? 'gap-1' : 'gap-2';

  if (!node) {
    return (
      <div className="flex flex-col items-center">
        <div className={`${nodeWidth} ${nodeHeight} rounded-md border-2 border-dashed border-purple-300/30 flex items-center justify-center bg-purple-50/20 dark:bg-purple-950/20`}>
          <span className="text-[8px] text-muted-foreground">Empty</span>
        </div>
      </div>
    );
  }

  const hasChildren = (node.leftChild !== null) || (node.rightChild !== null);

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`${nodeWidth} ${nodeHeight} rounded-md border flex flex-col items-center justify-center p-1 text-center ${
          node.isActivated 
            ? 'bg-purple-500/10 border-purple-500/50' 
            : 'bg-muted/50 border-muted-foreground/30'
        }`}
        data-testid={`mini-matrix-node-${node.userId}`}
      >
        <div className={`${textSize} font-mono font-semibold truncate w-full px-1`}>{node.userId}</div>
        <div className={`${nameSize} text-muted-foreground truncate w-full px-1`}>
          {node.name || 'N/A'}
        </div>
        {node.isActivated ? (
          <CheckCircle className="w-3 h-3 text-purple-500" />
        ) : (
          <XCircle className="w-3 h-3 text-muted-foreground" />
        )}
      </div>

      {hasChildren && depth < maxDepth - 1 && (
        <div className={`flex ${gap} pt-2 border-t-2 border-purple-300/20`}>
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
    <div className="w-full space-y-3">
      <div className="w-full overflow-x-auto overflow-y-auto border rounded-md bg-muted/20 p-4 min-h-64 flex items-start justify-center" style={{ maxHeight: '600px' }}>
        <div className="flex flex-col items-center py-4">
          <MatrixNodeComponent node={root} depth={0} maxDepth={maxDepth} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t border-purple-300/20 flex-wrap">
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
