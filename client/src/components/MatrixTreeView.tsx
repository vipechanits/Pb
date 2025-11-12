import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface MatrixNode {
  userId: string;
  name: string | null;
  email?: string | null;
  isActivated: boolean;
  matrixLevel: number | null;
  matrixPosition: number | null;
  matrixPath: string | null;
  leftChild: MatrixNode | null;
  rightChild: MatrixNode | null;
}

interface MatrixTreeViewProps {
  root: MatrixNode;
}

function MatrixNodeComponent({ node, depth = 0 }: { node: MatrixNode | null; depth?: number }) {
  if (!node || depth > 5) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="w-32 h-24 border-2 border-dashed border-purple-300/30 rounded-lg flex items-center justify-center bg-purple-50/20 dark:bg-purple-950/20">
          <p className="text-xs text-muted-foreground">Empty Slot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Card className={`w-32 ${node.isActivated ? 'border-purple-500/50 bg-purple-50/10 dark:bg-purple-950/20' : 'border-muted'}`} data-testid={`matrix-node-${node.userId}`}>
        <CardContent className="p-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold">{node.userId}</p>
            {node.isActivated ? (
              <CheckCircle className="w-3 h-3 text-purple-500" />
            ) : (
              <XCircle className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs truncate">
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
            <div className="h-6 border-l-2 border-purple-300" />
            <Badge variant="outline" className="mb-2 text-xs border-purple-500 text-purple-500">Left</Badge>
            <MatrixNodeComponent node={node.leftChild} depth={depth + 1} />
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 border-l-2 border-pink-300" />
            <Badge variant="outline" className="mb-2 text-xs border-pink-500 text-pink-500">Right</Badge>
            <MatrixNodeComponent node={node.rightChild} depth={depth + 1} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatrixTreeView({ root }: MatrixTreeViewProps) {
  return (
    <Card data-testid="card-matrix-tree">
      <CardHeader>
        <CardTitle>Global Matrix Structure</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-max py-4 flex justify-center">
          <MatrixNodeComponent node={root} depth={0} />
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-6 pt-4 border-t border-purple-300/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-purple-500" />
            <span>Activated & Placed</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-3 h-3 text-muted-foreground" />
            <span>Not Activated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
