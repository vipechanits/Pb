import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

interface SponsorData {
  userId: string;
  name: string | null;
}

interface DashboardSponsorInfoProps {
  sponsorId: string | null | undefined;
  sponsorData?: SponsorData;
  sponsorLoading: boolean;
  binaryLeg: 'left' | 'right' | null | undefined;
}

export function DashboardSponsorInfo({ 
  sponsorId, 
  sponsorData, 
  sponsorLoading, 
  binaryLeg 
}: DashboardSponsorInfoProps) {
  if (!sponsorId) {
    return null;
  }

  return (
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
                  {sponsorId}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Binary Leg</p>
            <div className="flex items-center gap-2">
              {binaryLeg === 'left' ? (
                <>
                  <ArrowLeft className="w-5 h-5 text-blue-500" />
                  <Badge variant="outline" className="border-blue-500 text-blue-500" data-testid="badge-binary-leg">
                    Left Leg
                  </Badge>
                </>
              ) : binaryLeg === 'right' ? (
                <>
                  <ArrowRight className="w-5 h-5 text-green-500" />
                  <Badge variant="outline" className="border-green-500 text-green-500" data-testid="badge-binary-leg">
                    Right Leg
                  </Badge>
                </>
              ) : (
                <Badge variant="secondary" data-testid="badge-binary-leg">
                  <span className="text-muted-foreground">Pending Placement</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
