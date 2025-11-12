import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, ArrowLeft, ArrowRight, Copy, Check } from 'lucide-react';

interface DashboardReferralLinksProps {
  leftLegLink: string;
  rightLegLink: string;
  copiedLeft: boolean;
  copiedRight: boolean;
  onCopyLeft: () => void;
  onCopyRight: () => void;
}

export function DashboardReferralLinks({
  leftLegLink,
  rightLegLink,
  copiedLeft,
  copiedRight,
  onCopyLeft,
  onCopyRight,
}: DashboardReferralLinksProps) {
  return (
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
                onClick={onCopyLeft}
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
                onClick={onCopyRight}
                data-testid="button-copy-right-dashboard"
              >
                {copiedRight ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
