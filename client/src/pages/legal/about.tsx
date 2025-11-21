import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Target, Shield, TrendingUp, Heart, Lightbulb, HandHelping, Check } from 'lucide-react';
import logoUrl from '@assets/payback247-logo_1763267164811.png';
import { useSystemConfig, formatINR } from '@/hooks/use-system-config';

export default function AboutUs() {
  const [, setLocation] = useLocation();
  const { config } = useSystemConfig();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="PAYBACK247" className="w-32 h-32 my-2" />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')} 
              data-testid="button-back-home"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">About PAYBACK247</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Building financial freedom through peer-to-peer income opportunities and a proven affiliate system.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To empower individuals worldwide with a transparent, peer-to-peer income platform that offers genuine earning opportunities through affiliate programs without the complexities of traditional MLM systems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To become the most trusted P2P income platform globally, known for transparency, simplicity, and creating sustainable income streams for our community members.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What We Do */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">What is PAYBACK247?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              PAYBACK247 is a revolutionary peer-to-peer (P2P) income platform that operates on a <strong>2x5 Non-Working Matrix System</strong>. Unlike traditional MLM programs that require constant recruiting, our platform is designed to create passive income through automatic matrix placement.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our platform facilitates direct UPI payments between members, eliminating the need for a central payment processor. This means faster payments, complete transparency, and full control over your earnings.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              With a one-time activation cost of {formatINR(config.totalActivationCost)} (8 payments), members gain access to multiple income streams including direct sponsor rewards, binary matching income, and 5-level matrix earnings. The system supports unlimited re-entry, allowing members to scale their income infinitely.
            </p>
          </CardContent>
        </Card>

        {/* Our Philosophy */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Our Philosophy: Give First, Receive With Gratitude</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="border-none shadow-sm bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <HandHelping className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Step 1: Help Needy Members First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When you join PAYBACK247, your activation involves helping members who came before you. Your 8 payments go directly to members below you - supporting their journey and creating a culture of mutual aid and community care.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span>Direct support to members in need</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span>Build meaningful community connections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span>Foster genuine relationships through giving</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500/10 to-transparent">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <Heart className="w-7 h-7 text-purple-500" />
                </div>
                <CardTitle className="text-2xl">Step 2: Receive Help With Gratitude</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  As new members join your network and activate, they help others just like you did. What you gave comes back multiplied through payments, matrix income, and binary matching - a beautiful cycle of mutual support and community care.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span>Receive from your growing community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span>Earn through multiple income streams</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span>Unlimited re-entry for continued support & earnings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <p className="text-lg font-semibold text-foreground mb-3">The Circle of Giving</p>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                PAYBACK247 is fundamentally different because it's built on caring for others first. We believe true wealth comes from lifting each other up. Your success naturally follows when you prioritize the success of those around you. This isn't just a platform - it's a movement toward genuine community care and mutual prosperity.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every transaction, payment, and income calculation is visible to members. No hidden fees, no surprises—just complete transparency.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Community First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We prioritize the success and satisfaction of our members. Your growth is our success, and we're committed to supporting you every step of the way.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Sustainable Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Built on a proven 2x5 matrix system that emphasizes quality over quantity, ensuring long-term sustainability for all members.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">How PAYBACK247 Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">1. Sign Up with a Referral Link</h3>
              <p className="text-muted-foreground">
                Join through a sponsor's referral link to be placed in their binary tree (left or right leg). This ensures proper tracking and income distribution.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">2. Complete Profile & Activation</h3>
              <p className="text-muted-foreground">
                Fill in your payment details (UPI ID, bank account) and make 8 direct UPI payments ({formatINR(config.totalActivationCost)} total) to designated members to activate your account.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">3. Start Earning Immediately</h3>
              <p className="text-muted-foreground">
                Once activated, you start earning through:
              </p>
              <ul className="list-disc list-inside text-muted-foreground pl-4 space-y-1">
                <li><strong>Direct Sponsor Income:</strong> {formatINR(config.sponsorPaymentAmount)} per direct referral</li>
                <li><strong>Binary Match Income:</strong> {formatINR(config.binaryMatchPaymentAmount)} per 3:3 matched pair</li>
                <li><strong>Matrix Income:</strong> {formatINR(config.matrixLevel1Amount)} from each of 5 matrix levels ({formatINR(config.matrixLevel1Amount * 5)} total potential)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">4. Build Your Network</h3>
              <p className="text-muted-foreground">
                Invite just 2 direct referrals (1 left + 1 right). The system automatically places additional members in your 5-level matrix through FIFO (First-In-First-Out) placement.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">5. Re-entry for Unlimited Income</h3>
              <p className="text-muted-foreground">
                After completing one cycle (all 8 payments confirmed), you can re-enter with a fresh {formatINR(config.totalActivationCost)} activation to create additional income streams. There's no limit to how many times you can re-enter!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform Statistics */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Platform Highlights</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">{formatINR(config.totalActivationCost)}</div>
                <p className="text-sm text-muted-foreground">One-time Activation</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">8</div>
                <p className="text-sm text-muted-foreground">Payment Slots</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">62</div>
                <p className="text-sm text-muted-foreground">Matrix Positions (5 levels)</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">∞</div>
                <p className="text-sm text-muted-foreground">Unlimited Re-entry</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Why Choose PAYBACK247?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-muted-foreground"><strong>Direct P2P Payments:</strong> All payments go directly to members via UPI—no central wallet, no delays</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-muted-foreground"><strong>Low Entry Barrier:</strong> Just {formatINR(config.totalActivationCost)} one-time activation cost to get started</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-muted-foreground"><strong>2x5 Non-Working Matrix:</strong> Only 2 direct referrals needed—system does the rest through automatic placement</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-muted-foreground"><strong>Multiple Income Streams:</strong> Earn from sponsor income, binary matching, and 5-level matrix rewards</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-muted-foreground"><strong>Complete Transparency:</strong> Track every payment, income, and network position in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="text-muted-foreground"><strong>Unlimited Scaling:</strong> Re-enter as many times as you want to multiply your income potential</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
              Join thousands of members already building their financial freedom with PAYBACK247's proven 2+5 matrix system.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setLocation('/auth/signup')}
                data-testid="button-join-now"
              >
                Join PAYBACK247 Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setLocation('/legal/contact')}
                data-testid="button-contact-us"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Contact Us
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <Button 
            variant="ghost"
            onClick={() => setLocation('/')} 
            data-testid="button-back-home-footer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 PAYBACK247. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
