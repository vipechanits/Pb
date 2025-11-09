import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { SiFacebook, SiWhatsapp, SiTelegram, SiX } from 'react-icons/si';

export function ReferralLinks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);

  if (!user?.userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Links</CardTitle>
          <CardDescription>Complete your profile to get referral links</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const baseUrl = window.location.origin;
  const leftLegLink = `${baseUrl}/auth/signup?ref=${user.userId}&leg=left`;
  const rightLegLink = `${baseUrl}/auth/signup?ref=${user.userId}&leg=right`;

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
        description: `${leg === 'left' ? 'Left' : 'Right'} leg referral link copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const shareOnPlatform = (platform: string, link: string, leg: string) => {
    const message = `Join PAYBACK247 and start earning! Click this link to join my ${leg} team: ${link}`;
    let url = '';

    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`;
        break;
      case 'x':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-blue-500" />
            Left Leg Referral Link
          </CardTitle>
          <CardDescription>Share this link to add members to your left team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={leftLegLink} readOnly data-testid="input-left-leg-link" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(leftLegLink, 'left')}
              data-testid="button-copy-left"
            >
              {copiedLeft ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Share on:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform('whatsapp', leftLegLink, 'LEFT')}
                data-testid="button-share-left-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform('facebook', leftLegLink, 'LEFT')}
                data-testid="button-share-left-facebook"
              >
                <SiFacebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform('telegram', leftLegLink, 'LEFT')}
                data-testid="button-share-left-telegram"
              >
                <SiTelegram className="w-4 h-4 mr-2" />
                Telegram
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform('x', leftLegLink, 'LEFT')}
                data-testid="button-share-left-x"
              >
                <SiX className="w-4 h-4 mr-2" />
                X
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-green-500" />
            Right Leg Referral Link
          </CardTitle>
          <CardDescription>Share this link to add members to your right team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={rightLegLink} readOnly data-testid="input-right-leg-link" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(rightLegLink, 'right')}
              data-testid="button-copy-right"
            >
              {copiedRight ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Share on:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform('whatsapp', rightLegLink, 'RIGHT')}
                data-testid="button-share-right-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform('facebook', rightLegLink, 'RIGHT')}
                data-testid="button-share-right-facebook"
              >
                <SiFacebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform('telegram', rightLegLink, 'RIGHT')}
                data-testid="button-share-right-telegram"
              >
                <SiTelegram className="w-4 h-4 mr-2" />
                Telegram
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform('x', rightLegLink, 'RIGHT')}
                data-testid="button-share-right-x"
              >
                <SiX className="w-4 h-4 mr-2" />
                X
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="w-4 h-4" />
            How Binary Placement Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>Left Leg:</strong> Members joining through your left leg link are placed on your left side of the binary tree</p>
          <p>• <strong>Right Leg:</strong> Members joining through your right leg link are placed on your right side of the binary tree</p>
          <p>• Binary matching happens when you have activity on both legs</p>
          <p>• Balance your team growth by sharing both links strategically</p>
        </CardContent>
      </Card>
    </div>
  );
}
