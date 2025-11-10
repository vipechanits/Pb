import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Users, GitBranch, Grid3x3, TrendingUp, Copy, Check, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Rocket, UserCheck, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);

  const isActivated = user?.isActivated || false;

  // Fetch sponsor details if user has a sponsor
  const { data: sponsorData, isLoading: sponsorLoading } = useQuery<{ userId: string; name: string | null }>({
    queryKey: ['/api/users', user?.sponsorId, 'public'],
    enabled: !!user?.sponsorId,
  });
  const baseUrl = window.location.origin;
  const leftLegLink = `${baseUrl}/auth/signup?ref=${user?.userId}&leg=left`;
  const rightLegLink = `${baseUrl}/auth/signup?ref=${user?.userId}&leg=right`;

  const copyToClipboard = async (text: string, leg: 'left' | 'right') => {
    try {
      await navigator.clipboard.writeText(text);
      if (leg === 'left') {
        setCopiedLeft(true);
        setTimeout(() => setCopiedLeft(false), 2000);
      } else {
        setCopiedRight(true);
        setTimeout(() => setCopiedRight(false), 2000);
      }
      toast({
        title: 'Copied!',
        description: `${leg === 'left' ? 'Left' : 'Right'} leg referral link copied`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const stats = [
    {
      title: 'Total Referrals',
      value: user?.totalReferrals?.toString() || '0',
      description: 'Users you sponsored',
      icon: Users,
    },
    {
      title: 'Left Leg Team',
      value: user?.leftLegCount?.toString() || '0',
      description: 'Active members',
      icon: ArrowLeft,
    },
    {
      title: 'Right Leg Team',
      value: user?.rightLegCount?.toString() || '0',
      description: 'Active members',
      icon: ArrowRight,
    },
    {
      title: 'Total Earnings',
      value: '₹0',
      description: 'Coming soon',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="user-dashboard">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name || user?.email}</h1>
            <p className="text-muted-foreground">
              User ID: <span className="font-mono font-semibold">{user?.userId || 'Not assigned'}</span>
            </p>
          </div>
          {isActivated ? (
            <Badge variant="default" className="gap-1" data-testid="badge-activated">
              <CheckCircle className="w-4 h-4" />
              Activated
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1" data-testid="badge-not-activated">
              <AlertTriangle className="w-4 h-4" />
              Not Activated
            </Badge>
          )}
        </div>
      </div>

      {/* Sponsorship & Placement Information */}
      {user?.sponsorId && (
        <Card className="border-accent/20 bg-accent/5" data-testid="card-sponsor-info">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-accent" />
              <div>
                <CardTitle className="text-lg">Sponsorship & Placement</CardTitle>
                <CardDescription>Your position in the binary tree</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sponsor</p>
                {sponsorLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-lg font-semibold" data-testid="text-sponsor-name">
                      {sponsorData?.name || 'Name not set'}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground" data-testid="text-sponsor-id">
                      {user.sponsorId}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Binary Leg</p>
                <div className="flex items-center gap-2">
                  {user.binaryLeg === 'left' ? (
                    <>
                      <ArrowLeft className="w-5 h-5 text-blue-500" />
                      <Badge variant="outline" className="border-blue-500 text-blue-500" data-testid="badge-binary-leg">
                        Left Leg
                      </Badge>
                    </>
                  ) : user.binaryLeg === 'right' ? (
                    <>
                      <ArrowRight className="w-5 h-5 text-green-500" />
                      <Badge variant="outline" className="border-green-500 text-green-500" data-testid="badge-binary-leg">
                        Right Leg
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="secondary" data-testid="badge-binary-leg">Not Assigned</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activation Status Alert */}
      {!isActivated && (
        <Alert className="border-primary/20 bg-primary/5">
          <Rocket className="h-4 w-4" />
          <AlertTitle>Complete Your Activation</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Your account is not yet activated. Complete all 8 payments to activate your account and start earning!</p>
            <Link href="/user/activation">
              <Button size="sm" className="mt-2" data-testid="button-complete-activation">
                Complete Activation →
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Referral Links - Only shown after activation */}
      {isActivated && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Your Referral Links</CardTitle>
                <CardDescription>Share these links to build your binary team and start earning</CardDescription>
              </div>
              <Badge variant="default" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {/* Left Leg Link */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowLeft className="w-4 h-4 text-blue-500" />
                  Left Leg
                </div>
                <div className="flex gap-2">
                  <Input value={leftLegLink} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(leftLegLink, 'left')}
                    data-testid="button-copy-left-dashboard"
                  >
                    {copiedLeft ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Right Leg Link */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowRight className="w-4 h-4 text-green-500" />
                  Right Leg
                </div>
                <div className="flex gap-2">
                  <Input value={rightLegLink} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(rightLegLink, 'right')}
                    data-testid="button-copy-right-dashboard"
                  >
                    {copiedRight ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isActivated && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete your activation to unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li className="text-muted-foreground">Complete your profile with payment details</li>
                <li className="font-medium">Complete all 8 activation payments</li>
                <li className="text-muted-foreground">Wait for payment confirmations</li>
                <li className="text-muted-foreground">Your account will be automatically activated</li>
                <li className="text-muted-foreground">Start sharing referral links and earning!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
