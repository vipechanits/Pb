import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { Users, CheckCircle, XCircle, AlertCircle, Loader2, UserPlus, ArrowLeft, ArrowRight, Calendar, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface DirectReferral {
  userId: string;
  name: string | null;
  email: string;
  mobile: string | null;
  isActivated: boolean;
  binaryLeg: 'left' | 'right' | null;
  createdAt: Date;
  activatedAt: Date | null;
}

export default function DirectSponsoringPage() {
  const { user } = useAuth();

  const { data: referrals, isLoading, error } = useQuery<DirectReferral[]>({
    queryKey: ['/api/users', user?.userId, 'direct-referrals'],
    enabled: !!user?.userId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load direct referrals. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalReferrals = referrals?.length || 0;
  const activatedReferrals = referrals?.filter(r => r.isActivated).length || 0;
  const leftLegReferrals = referrals?.filter(r => r.binaryLeg === 'left').length || 0;
  const rightLegReferrals = referrals?.filter(r => r.binaryLeg === 'right').length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="direct-sponsoring-page">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Direct Sponsoring</h1>
        <p className="text-muted-foreground">
          Manage and track your personally sponsored referrals
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-referrals">
              {totalReferrals}
            </div>
            <p className="text-xs text-muted-foreground">All direct referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Activated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="stat-activated">
              {activatedReferrals}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalReferrals > 0 ? Math.round((activatedReferrals / totalReferrals) * 100) : 0}% activation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              Left Leg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400" data-testid="stat-left-leg">
              {leftLegReferrals}
            </div>
            <p className="text-xs text-muted-foreground">In left binary leg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Right Leg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="stat-right-leg">
              {rightLegReferrals}
            </div>
            <p className="text-xs text-muted-foreground">In right binary leg</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <UserPlus className="h-4 w-4" />
        <AlertDescription>
          <strong>Direct Sponsoring:</strong> These are users you personally invited to join PAYBACK247. They count toward your binary match prerequisite (1L+1R) when activated.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Your Direct Referrals</CardTitle>
          <CardDescription>List of all users you've directly sponsored</CardDescription>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No direct referrals yet</p>
              <p className="text-sm text-muted-foreground">
                Share your referral link to invite new members
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <Card key={referral.userId} className="hover-elevate" data-testid={`referral-card-${referral.userId}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-lg" data-testid={`referral-id-${referral.userId}`}>
                            {referral.userId}
                          </span>
                          <Badge 
                            variant={referral.isActivated ? "default" : "secondary"}
                            data-testid={`status-${referral.userId}`}
                          >
                            {referral.isActivated ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Activated
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Activated
                              </>
                            )}
                          </Badge>
                          {referral.binaryLeg && (
                            <Badge 
                              variant="outline"
                              className={referral.binaryLeg === 'left' ? 'border-pink-500 text-pink-600 dark:text-pink-400' : 'border-blue-500 text-blue-600 dark:text-blue-400'}
                              data-testid={`leg-${referral.userId}`}
                            >
                              {referral.binaryLeg === 'left' ? (
                                <>
                                  <ArrowLeft className="w-3 h-3 mr-1" />
                                  Left
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="w-3 h-3 mr-1" />
                                  Right
                                </>
                              )}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="font-medium" data-testid={`name-${referral.userId}`}>
                            {referral.name || 'Name not set'}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span data-testid={`email-${referral.userId}`}>{referral.email}</span>
                            </div>
                            {referral.mobile && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span data-testid={`mobile-${referral.userId}`}>{referral.mobile}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Joined: {format(new Date(referral.createdAt), 'MMM dd, yyyy')}</span>
                          </div>
                          {referral.activatedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>Activated: {format(new Date(referral.activatedAt), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
