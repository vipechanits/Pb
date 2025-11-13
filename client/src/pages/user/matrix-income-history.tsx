import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, User, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface MatrixIncome {
  id: string;
  incomeType: string;
  amountInr: string;
  status: string;
  sourceUserId: string | null;
  sourceName: string | null;
  confirmedAt: string | null;
  createdAt: string;
  notes: string | null;
}

export default function MatrixIncomeHistory() {
  const { data: matrixHistory, isLoading } = useQuery<MatrixIncome[]>({
    queryKey: ["/api/user/matrix-income-history"],
  });

  const getMatrixLevel = (incomeType: string): number => {
    const match = incomeType.match(/matrix_level_(\d)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getLevelBadgeVariant = (level: number): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Array<"default" | "secondary" | "outline"> = ["default", "secondary", "outline", "outline", "outline"];
    return variants[level - 1] || "outline";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalIncome = matrixHistory
    ?.filter((income) => income.status === "confirmed")
    .reduce((sum, income) => sum + parseFloat(income.amountInr), 0) || 0;

  const incomeByLevel = matrixHistory?.reduce((acc, income) => {
    const level = getMatrixLevel(income.incomeType);
    if (income.status === "confirmed") {
      acc[level] = (acc[level] || 0) + parseFloat(income.amountInr);
    }
    return acc;
  }, {} as Record<number, number>) || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-matrix-history">Global Matrix Income History</h1>
        <p className="text-muted-foreground" data-testid="text-description">
          Track your earnings from the 2x5 global matrix system across all levels
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Matrix Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-total-income">₹{totalIncome.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {matrixHistory?.filter((i) => i.status === "confirmed").length || 0} confirmed transactions
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">L{level}</p>
                  <p className="font-bold text-sm" data-testid={`text-level-${level}-income`}>
                    ₹{(incomeByLevel[level] || 0).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {!matrixHistory || matrixHistory.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-matrix-income">
                No matrix income yet. As users join the global matrix below you, you'll earn ₹500 per activation across 5 levels.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle data-testid="heading-transaction-list">Income Transactions</CardTitle>
            <CardDescription>All matrix income from users in your downline (levels 1-5)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matrixHistory.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-4 rounded-md border hover-elevate"
                  data-testid={`card-income-${income.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLevelBadgeVariant(getMatrixLevel(income.incomeType))} data-testid={`badge-level-${income.id}`}>
                          Level {getMatrixLevel(income.incomeType)}
                        </Badge>
                        {income.status === "confirmed" ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid={`badge-confirmed-${income.id}`}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge variant="destructive" data-testid={`badge-status-${income.id}`}>
                            <XCircle className="w-3 h-3 mr-1" />
                            {income.status}
                          </Badge>
                        )}
                      </div>
                      {income.sourceUserId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span data-testid={`text-source-${income.id}`}>
                            From: {income.sourceName || income.sourceUserId}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-date-${income.id}`}>
                        {income.confirmedAt
                          ? format(new Date(income.confirmedAt), "PPp")
                          : format(new Date(income.createdAt), "PPp")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-xl text-green-600" data-testid={`text-amount-${income.id}`}>
                      ₹{parseFloat(income.amountInr).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle data-testid="heading-matrix-info">Global Matrix System (2x5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>Structure:</strong> 2-way matrix with 5 levels deep (2 + 4 + 8 + 16 + 32 = 62 positions)</p>
          <p>• <strong>Income:</strong> Earn ₹500 for each activation in your matrix (any of the 62 positions)</p>
          <p>• <strong>Placement:</strong> Users are automatically placed in the first available position in the global matrix</p>
          <p>• <strong>Total Potential:</strong> ₹31,000 per matrix cycle (62 positions × ₹500)</p>
          <p>• <strong>Re-entry:</strong> Once your matrix is full, you can re-enter and start a new matrix cycle</p>
        </CardContent>
      </Card>
    </div>
  );
}
