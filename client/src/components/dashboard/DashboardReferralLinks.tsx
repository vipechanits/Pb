import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, ArrowLeft, ArrowRight, Copy, Check, Share2 } from 'lucide-react';
import { FaWhatsapp, FaFacebook, FaTelegram, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface DashboardReferralLinksProps {
  leftLegLink: string;
  rightLegLink: string;
  copiedLeft: boolean;
  copiedRight: boolean;
  onCopyLeft: () => void;
  onCopyRight: () => void;
}

// Social media sharing helper functions
const createShareMessage = (leg: 'left' | 'right') => {
  return `Join PAYBACK247 - Your Path to Financial Freedom!\n\nEarn through Binary Pairing, Matrix Income & Sponsoring Rewards\nBuild your network and grow your income\nTransparent payment tracking system\n\nJoin my ${leg === 'left' ? 'LEFT' : 'RIGHT'} team today!`;
};

const shareOnWhatsApp = (url: string, leg: 'left' | 'right') => {
  const message = createShareMessage(leg);
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n\n' + url)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
};

const shareOnFacebook = (url: string) => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
};

const shareOnTwitter = (url: string, leg: 'left' | 'right') => {
  const message = `Join my ${leg === 'left' ? 'LEFT' : 'RIGHT'} team on PAYBACK247! Earn through Binary Pairing, Matrix Income & more. Start your journey to financial freedom today!`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
};

const shareOnTelegram = (url: string, leg: 'left' | 'right') => {
  const message = createShareMessage(leg);
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
};

const shareOnLinkedIn = (url: string) => {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
};

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
            <CardTitle className="text-lg dashboard-text">Your Referral Links</CardTitle>
            <CardDescription className="dashboard-text">Share these links to build your binary team and start earning</CardDescription>
          </div>
          <Badge variant="default" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left Leg Link */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium dashboard-text">
              <ArrowLeft className="w-4 h-4 text-blue-500" />
              Left Leg
            </div>
            <div className="flex gap-2">
              <Input value={leftLegLink} readOnly className="text-xs dashboard-variable" />
              <Button
                variant="outline"
                size="icon"
                onClick={onCopyLeft}
                data-testid="button-copy-left-dashboard"
              >
                {copiedLeft ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Social Media Share Buttons - Left */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Share2 className="w-3 h-3" />
                <span>Share on social media</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnWhatsApp(leftLegLink, 'left')}
                  className="gap-2"
                  data-testid="button-share-whatsapp-left"
                >
                  <FaWhatsapp className="w-4 h-4 text-green-600" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnFacebook(leftLegLink)}
                  className="gap-2"
                  data-testid="button-share-facebook-left"
                >
                  <FaFacebook className="w-4 h-4 text-blue-600" />
                  <span className="text-xs">Facebook</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnTwitter(leftLegLink, 'left')}
                  className="gap-2"
                  data-testid="button-share-twitter-left"
                >
                  <FaXTwitter className="w-4 h-4" />
                  <span className="text-xs">X</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnTelegram(leftLegLink, 'left')}
                  className="gap-2"
                  data-testid="button-share-telegram-left"
                >
                  <FaTelegram className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">Telegram</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnLinkedIn(leftLegLink)}
                  className="gap-2"
                  data-testid="button-share-linkedin-left"
                >
                  <FaLinkedin className="w-4 h-4 text-blue-700" />
                  <span className="text-xs">LinkedIn</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Leg Link */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium dashboard-text">
              <ArrowRight className="w-4 h-4 text-green-500" />
              Right Leg
            </div>
            <div className="flex gap-2">
              <Input value={rightLegLink} readOnly className="text-xs dashboard-variable" />
              <Button
                variant="outline"
                size="icon"
                onClick={onCopyRight}
                data-testid="button-copy-right-dashboard"
              >
                {copiedRight ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Social Media Share Buttons - Right */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Share2 className="w-3 h-3" />
                <span>Share on social media</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnWhatsApp(rightLegLink, 'right')}
                  className="gap-2"
                  data-testid="button-share-whatsapp-right"
                >
                  <FaWhatsapp className="w-4 h-4 text-green-600" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnFacebook(rightLegLink)}
                  className="gap-2"
                  data-testid="button-share-facebook-right"
                >
                  <FaFacebook className="w-4 h-4 text-blue-600" />
                  <span className="text-xs">Facebook</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnTwitter(rightLegLink, 'right')}
                  className="gap-2"
                  data-testid="button-share-twitter-right"
                >
                  <FaXTwitter className="w-4 h-4" />
                  <span className="text-xs">X</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnTelegram(rightLegLink, 'right')}
                  className="gap-2"
                  data-testid="button-share-telegram-right"
                >
                  <FaTelegram className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">Telegram</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnLinkedIn(rightLegLink)}
                  className="gap-2"
                  data-testid="button-share-linkedin-right"
                >
                  <FaLinkedin className="w-4 h-4 text-blue-700" />
                  <span className="text-xs">LinkedIn</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
