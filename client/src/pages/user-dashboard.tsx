import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Users, GitBranch, Grid3x3, TrendingUp, Copy, Check, ArrowLeft, ArrowRight } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);

  const baseUrl = 'https://payback247.com';
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
      title: 'Total Earnings',
      value: '₹0',
      description: 'All time earnings',
      icon: TrendingUp,
    },
    {
      title: 'Direct Referrals',
      value: '0',
      description: 'Users you sponsored',
      icon: Users,
    },
    {
      title: 'Binary Matches',
      value: '0',
      description: 'Completed matches',
      icon: GitBranch,
    },
    {
      title: 'Matrix Position',
      value: 'Not Active',
      description: 'Current matrix level',
      icon: Grid3x3,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="user-dashboard">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome, {user?.name || user?.email}</h1>
        <p className="text-muted-foreground">
          User ID: <span className="font-mono font-semibold">{user?.userId || 'Not assigned'}</span>
        </p>
      </div>

      {/* Referral Links - Compact Version */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Your Referral Links</CardTitle>
          <CardDescription>Share these links to build your binary team</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Complete your profile and start building your network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Next Steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Complete your profile with payment details</li>
              <li>Share your referral link with others</li>
              <li>Activate your account to start earning</li>
              <li>Track your network growth in the dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
