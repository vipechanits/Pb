import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  TrendingUp, 
  User, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  Users,
  Target,
  Award,
  RefreshCw,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

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

interface MatrixUser {
  userId: string;
  name: string;
  email: string;
  mobile: string | null;
  position: 'Left' | 'Right';
  matrixPath: string;
  isActivated: boolean;
  currentCycleNumber: number;
  reentryCount: number;
  isEligibleForReentry: boolean;
  joinedAt: string;
}

interface LevelData {
  level: number;
  users: MatrixUser[];
  maxCapacity: number;
  currentCount: number;
}

interface MatrixDownlineData {
  currentCycle: number;
  isEligibleForReentry: boolean;
  reentryCount: number;
  levels: LevelData[];
  totalDownlineCount: number;
  matrixCompleteCount: number;
  isMatrixComplete: boolean;
}

export default function MatrixIncomeHistory() {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

  const { data: matrixHistory, isLoading: historyLoading } = useQuery<MatrixIncome[]>({
    queryKey: ["/api/user/matrix-income-history"],
  });

  const { data: downlineData, isLoading: downlineLoading } = useQuery<MatrixDownlineData>({
    queryKey: ["/api/user/matrix-downline-details"],
  });

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  };

  const getMatrixLevel = (incomeType: string): number => {
    const match = incomeType.match(/matrix_level_(\d)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getLevelBadgeVariant = (level: number): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Array<"default" | "secondary" | "outline"> = ["default", "secondary", "outline", "outline", "outline"];
    return variants[level - 1] || "outline";
  };

  if (historyLoading || downlineLoading) {
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

  const reentryUsers = downlineData?.levels.flatMap(l => 
    l.users.filter(u => u.isEligibleForReentry || u.reentryCount > 0)
  ) || [];

  // Guard against divide-by-zero for users not yet placed in matrix
  const completionPercentage = downlineData && downlineData.matrixCompleteCount > 0
    ? Math.round((downlineData.totalDownlineCount / downlineData.matrixCompleteCount) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-matrix-history">Global Matrix Income History</h1>
        <p className="text-muted-foreground" data-testid="text-description">
          Track your earnings, downline members, and matrix completion across all levels
        </p>
      </div>

      {/* Current Cycle Status Card */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Current Cycle Status</CardTitle>
            </div>
            {downlineData?.isEligibleForReentry && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <RefreshCw className="w-3 h-3 mr-1" />
                Re-entry Available
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cycle Number</p>
              <p className="text-2xl font-bold" data-testid="text-cycle-number">
                #{downlineData?.currentCycle || 1}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Matrix Filled</p>
              <p className="text-2xl font-bold" data-testid="text-matrix-filled">
                {downlineData?.totalDownlineCount ?? 0} / {downlineData?.matrixCompleteCount ?? 62}
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completion</p>
              <p className="text-2xl font-bold text-primary" data-testid="text-completion">
                {completionPercentage}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Re-entries Done</p>
              <p className="text-2xl font-bold" data-testid="text-reentry-count">
                {downlineData?.reentryCount || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Summary Section */}
      <div className="grid gap-4 md:grid-cols-1">
        {/* Total Income - Large Prominent Card */}
        <Card>
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-base font-semibold">Total Matrix Income</h3>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2" data-testid="text-total-income">
                ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground">
                From {matrixHistory?.filter((i) => i.status === "confirmed").length || 0} confirmed transactions across 5 levels
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Income by Level - Detailed Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Income Breakdown by Level</CardTitle>
            <CardDescription>Earnings from each matrix level (₹500 per activation)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((level) => {
                const levelIncome = incomeByLevel[level] || 0;
                const levelTransactions = matrixHistory?.filter(
                  (i) => i.status === "confirmed" && getMatrixLevel(i.incomeType) === level
                ).length || 0;
                const maxCapacity = Math.pow(2, level);
                const completionPercentage = maxCapacity > 0 ? (levelTransactions / maxCapacity) * 100 : 0;
                
                return (
                  <div key={level} className="flex items-center justify-between p-3 rounded-md border">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="font-semibold">L{level}</Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Level {level}</span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400" data-testid={`text-level-${level}-income`}>
                            ₹{levelIncome.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {levelTransactions} / {maxCapacity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level-wise User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle data-testid="heading-downline-by-level">Matrix Downline by Level</CardTitle>
          </div>
          <CardDescription>View all users in your 5-level matrix downline organized by level</CardDescription>
        </CardHeader>
        <CardContent>
          {!downlineData || downlineData.levels.every(l => l.currentCount === 0) ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-downline">
                No matrix downline yet. As users activate, they'll be placed in your matrix and you'll earn ₹500 per activation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {downlineData.levels.map((levelData) => (
                <Collapsible
                  key={levelData.level}
                  open={expandedLevels.has(levelData.level)}
                  onOpenChange={() => toggleLevel(levelData.level)}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      className="flex items-center justify-between p-4 rounded-md border hover-elevate cursor-pointer"
                      data-testid={`card-level-${levelData.level}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Award className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getLevelBadgeVariant(levelData.level)}>
                              Level {levelData.level}
                            </Badge>
                            <Badge variant="outline">
                              {levelData.currentCount} / {levelData.maxCapacity} positions
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {levelData.currentCount === 0 
                              ? "No users yet" 
                              : `${levelData.currentCount} active user${levelData.currentCount !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">
                            ₹{(incomeByLevel[levelData.level] || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">earned</p>
                        </div>
                        {expandedLevels.has(levelData.level) ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {levelData.users.length > 0 ? (
                      <div className="mt-3 ml-14 space-y-2 border-l-2 border-primary/20 pl-4">
                        {levelData.users.map((user) => (
                          <div
                            key={user.userId}
                            className="p-3 rounded-md bg-muted/50 border"
                            data-testid={`user-card-${user.userId}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold" data-testid={`text-user-id-${user.userId}`}>
                                    {user.userId}
                                  </p>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    data-testid={`badge-position-${user.userId}`}
                                  >
                                    {user.position}
                                  </Badge>
                                  {user.isEligibleForReentry && (
                                    <Badge variant="default" className="bg-green-600 text-xs">
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Re-entry Ready
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm" data-testid={`text-user-name-${user.userId}`}>
                                  {user.name}
                                </p>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    <span data-testid={`text-email-${user.userId}`}>{user.email}</span>
                                  </div>
                                  {user.mobile && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      <span data-testid={`text-mobile-${user.userId}`}>{user.mobile}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span data-testid={`text-joined-${user.userId}`}>
                                      {format(new Date(user.joinedAt), "PP")}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    Cycle #{user.currentCycleNumber}
                                  </Badge>
                                  {user.reentryCount > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {user.reentryCount} re-entr{user.reentryCount === 1 ? 'y' : 'ies'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 ml-14 text-sm text-muted-foreground italic">
                        No users at this level yet
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Re-entry Users List */}
      {reentryUsers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-600" />
              <CardTitle data-testid="heading-reentry-users">Re-entry Users</CardTitle>
            </div>
            <CardDescription>
              Users in your downline who have completed their matrix and are eligible for re-entry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reentryUsers.map((user) => (
                <div
                  key={user.userId}
                  className="p-3 rounded-md border hover-elevate"
                  data-testid={`reentry-user-${user.userId}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{user.userId}</p>
                        <p className="text-sm text-muted-foreground">- {user.name}</p>
                        {user.isEligibleForReentry && (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Eligible Now
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Cycle #{user.currentCycleNumber}</span>
                        <span>•</span>
                        <span>{user.reentryCount} re-entr{user.reentryCount === 1 ? 'y' : 'ies'} completed</span>
                        <span>•</span>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Transactions */}
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

      {/* Matrix System Info */}
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
          <p>• <strong>Unlimited Growth:</strong> Complete unlimited cycles and continue earning from new activations infinitely</p>
        </CardContent>
      </Card>
    </div>
  );
}
