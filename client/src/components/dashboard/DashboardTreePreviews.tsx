import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, Grid3x3, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import MiniBinaryTree from '@/components/MiniBinaryTree';
import MiniMatrixTree from '@/components/MiniMatrixTree';

interface TreeNode {
  userId: string;
  name: string | null;
  email: string | null;
  isActivated: boolean;
  leftLegCount?: number;
  rightLegCount?: number;
  personalLeftCount?: number;
  personalRightCount?: number;
  leftChild: TreeNode | null;
  rightChild: TreeNode | null;
}

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

interface DashboardTreePreviewsProps {
  binaryTree: TreeNode | undefined;
  matrixTree: MatrixNode | undefined;
}

export function DashboardTreePreviews({ binaryTree, matrixTree }: DashboardTreePreviewsProps) {
  return (
    <Card data-testid="card-tree-previews">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Matrix Tree View</CardTitle>
        <CardDescription>Current cycle matrix preview (5 levels)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Global Matrix Placement</span>
          </div>
          <Link href="/user/global-matrix">
            <Button variant="outline" size="sm" data-testid="button-view-full-matrix-tree">
              View Full Tree →
            </Button>
          </Link>
        </div>
        {matrixTree ? (
          <MiniMatrixTree root={matrixTree} maxDepth={5} />
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
