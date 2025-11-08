import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MatrixPosition {
  index: number;
  address: string;
  level: number;
  isCurrentUser?: boolean;
  filled: boolean;
}

interface MatrixGridProps {
  positions: MatrixPosition[];
  maxLevel?: number;
}

export default function MatrixGrid({ positions, maxLevel = 5 }: MatrixGridProps) {
  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const groupedByLevel = positions.reduce((acc, pos) => {
    if (!acc[pos.level]) acc[pos.level] = [];
    acc[pos.level].push(pos);
    return acc;
  }, {} as Record<number, MatrixPosition[]>);

  return (
    <Card data-testid="card-matrix-grid">
      <CardHeader>
        <CardTitle>Matrix Position (2×N Grid)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: maxLevel }, (_, i) => i + 1).map((level) => {
            const levelPositions = groupedByLevel[level] || [];
            return (
              <div key={level}>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Level {level}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {levelPositions.length > 0 ? (
                    levelPositions.map((pos) => (
                      <div
                        key={pos.index}
                        className={`p-3 rounded-md border ${
                          pos.isCurrentUser
                            ? 'border-primary bg-primary/10'
                            : pos.filled
                            ? 'border-border bg-card'
                            : 'border-dashed border-muted bg-muted/50'
                        }`}
                        data-testid={`matrix-position-${pos.index}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono">{truncate(pos.address)}</span>
                          {pos.isCurrentUser && (
                            <Badge variant="default" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Index: {pos.index}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-3 rounded-md border-dashed border-muted bg-muted/50">
                        <span className="text-xs text-muted-foreground">Empty</span>
                      </div>
                      <div className="p-3 rounded-md border-dashed border-muted bg-muted/50">
                        <span className="text-xs text-muted-foreground">Empty</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
