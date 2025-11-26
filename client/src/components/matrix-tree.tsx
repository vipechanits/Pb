import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TreeNode {
  userId: string;
  name: string;
  level: number;
  position: 'left' | 'right' | null;
  personalLeft: number;
  personalRight: number;
  children: TreeNode[];
}

interface MatrixTreeProps {
  root: TreeNode;
}

function NodeRenderer({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const positionLabel = node.position === 'left' ? '◄ L' : node.position === 'right' ? '► R' : '●';

  return (
    <div className="font-mono text-sm">
      <div className="flex items-center gap-2" style={{ marginLeft: `${depth * 24}px` }}>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-0 w-5 h-5 flex items-center justify-center hover:bg-muted rounded"
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <div className="flex items-center gap-2 px-2 py-1 rounded bg-card border">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {node.userId}
          </span>
          <span className="text-muted-foreground">{node.name}</span>
          <span className="text-xs text-muted-foreground ml-2">
            {positionLabel}
          </span>
          <span className="text-xs text-muted-foreground ml-2 bg-muted px-1.5 rounded">
            {node.personalLeft}/{node.personalRight}
          </span>
        </div>
      </div>

      {isOpen && hasChildren && (
        <div>
          {node.children.map((child, idx) => (
            <NodeRenderer key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MatrixTree({ root }: MatrixTreeProps) {
  return (
    <Card className="p-4 bg-background">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold mb-4">Matrix Tree Structure</h3>
        <NodeRenderer node={root} />
      </div>
    </Card>
  );
}
