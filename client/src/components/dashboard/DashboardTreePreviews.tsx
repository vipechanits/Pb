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
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Binary Tree Preview */}
      <Card data-testid="card-binary-tree-preview">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-green-600" />
                Binary Tree Preview
              </CardTitle>
              <CardDescription>Your binary sponsorship tree (3 levels)</CardDescription>
            </div>
            <Link href="/user/binary-tree">
              <Button variant="outline" size="sm" data-testid="button-view-full-binary-tree">
                View Full Tree →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {binaryTree ? (
            <MiniBinaryTree root={binaryTree} maxDepth={3} />
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrix Tree Preview */}
      <Card data-testid="card-matrix-tree-preview">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-purple-600" />
                Matrix Tree Preview
              </CardTitle>
              <CardDescription>Your global matrix placement (3 levels)</CardDescription>
            </div>
            <Link href="/user/global-matrix">
              <Button variant="outline" size="sm" data-testid="button-view-full-matrix-tree">
                View Full Tree →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {matrixTree ? (
            <MiniMatrixTree root={matrixTree} maxDepth={3} />
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
