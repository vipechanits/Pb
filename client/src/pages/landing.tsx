import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Globe, 
  TrendingUp, 
  BarChart3, 
  Users, 
  DollarSign,
  Network,
  ChevronDown
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import WalletButton from '@/components/WalletButton';
import NetworkBadge from '@/components/NetworkBadge';
import { useWeb3 } from '@/context/Web3Context';
import { useActivationData } from '@/hooks/useBlockchainData';
import logoUrl from '@assets/Generated Image October 16, 2025 - 6_58AM (1)_1762653844897.png';

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isConnected, isCorrectNetwork, account } = useWeb3();
  const { data: activationData } = useActivationData();

  useEffect(() => {
    if (isConnected && isCorrectNetwork && account) {
      if (activationData?.activated) {
        setLocation('/user');
      }
    }
  }, [isConnected, isCorrectNetwork, account, activationData, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="PAYBACK247" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-primary">PAYBACK247</h1>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && <NetworkBadge network="polygon-amoy" isCorrect={isCorrectNetwork} />}
            <WalletButton />
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Empower Your Financial Future.
            </h2>
            <p className="text-lg text-muted-foreground">
              Join PAYBACK247, the revolutionary peer-to-peer financial platform designed for your growth and success.
            </p>
            <div className="flex flex-col items-center gap-3 pt-4">
              <Button size="lg" onClick={() => setLocation('/user')} data-testid="button-get-started-hero">
                Get Started
              </Button>
              <p className="text-sm text-muted-foreground">
                Already a member?{' '}
                <button 
                  onClick={() => setLocation('/user')} 
                  className="text-primary hover:underline"
                  data-testid="link-login"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose PAYBACK247 */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-2">Why Choose PAYBACK247?</h3>
            <p className="text-muted-foreground">Discover the benefits that set us apart</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Easy To Use Portal</CardTitle>
                <CardDescription>
                  Our intuitive platform makes it simple to track your earnings and manage your network
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Global Community</CardTitle>
                <CardDescription>
                  Connect with users from around the world and build a sustainable income stream
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Proven Platform</CardTitle>
                <CardDescription>
                  Transparent smart contracts on the Polygon blockchain ensure fair and secure transactions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Financial & Marketing</CardTitle>
                <CardDescription>
                  Tools and training to help you succeed in growing your network and income
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Multiple Streams of Income */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-2">Multiple Streams of Income</h3>
            <p className="text-muted-foreground">
              Unlock your earning potential through diverse income opportunities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-background">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-chart-1/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-chart-1" />
                </div>
                <CardTitle className="text-lg">Sponsor Income</CardTitle>
                <CardDescription>
                  Earn direct income by introducing new members to the PAYBACK247 platform
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Binary Income</CardTitle>
                <CardDescription>
                  It is a long established fact that a reader will be distracted by readable content
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto mb-4">
                  <Network className="w-8 h-8 text-chart-3" />
                </div>
                <CardTitle className="text-lg">Matrix Income</CardTitle>
                <CardDescription>
                  Benefit from automated distribution across a 5-level matrix with unlimited earning potential
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* 2+5 Non-Working Matrix */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">The 2+5 Non-Working Matrix</h3>
            <p className="text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
              Our most generous income plan. You can earn even with personally sponsored members beyond the system 
              requirements. It grows passively to give you secured, structured, ever-increasing income.
            </p>
            <div className="flex flex-wrap gap-6 justify-center items-center">
              <div className="bg-background text-foreground rounded-lg p-8 min-w-[200px]">
                <div className="text-4xl font-bold text-primary">₹31,000</div>
                <p className="text-sm text-muted-foreground mt-2">Activation Fee</p>
              </div>
              <div className="bg-background text-foreground rounded-lg p-8 min-w-[200px]">
                <div className="text-4xl font-bold text-primary">Unlimited</div>
                <p className="text-sm text-muted-foreground mt-2">Earning Potential</p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80 mt-6">
              Grow your wealth with 5 MLM, 5 free joiner for each Affiliate on which you earn & even more with Matrix upon re-entry!
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold">Frequently Asked Questions</h3>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger data-testid="faq-what-is">
                  <span className="text-left">How do I join PAYBACK247?</span>
                </AccordionTrigger>
                <AccordionContent>
                  To join PAYBACK247, connect your MetaMask wallet, ensure you're on the Polygon network, 
                  and complete the activation process with the required USDT fee. Once activated, you can 
                  start building your network and earning income.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger data-testid="faq-how-start">
                  <span className="text-left">What is the "Non-working matrix"?</span>
                </AccordionTrigger>
                <AccordionContent>
                  The non-working matrix means you can earn passive income even if you don't actively recruit 
                  new members. The system automatically places new members in your matrix, allowing you to 
                  benefit from the network's growth.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger data-testid="faq-payments">
                  <span className="text-left">How do payments work?</span>
                </AccordionTrigger>
                <AccordionContent>
                  PAYBACK247 supports both Web3 (on-chain USDT transactions) and offline payment modes. 
                  All earnings are distributed through smart contracts on the Polygon blockchain, ensuring 
                  transparency and security.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger data-testid="faq-income">
                  <span className="text-left">What is re-entry Matrix?</span>
                </AccordionTrigger>
                <AccordionContent>
                  The re-entry matrix allows you to cycle through the income levels multiple times. Once you 
                  complete a matrix cycle, you can re-enter to continue earning, creating unlimited income potential.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger data-testid="faq-safety">
                  <span className="text-left">Is my money safe?</span>
                </AccordionTrigger>
                <AccordionContent>
                  Yes! PAYBACK247 is built on Polygon blockchain smart contracts that are transparent, 
                  immutable, and auditable. Your funds are secured by the blockchain, and all transactions 
                  are verifiable on-chain.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoUrl} alt="PAYBACK247" className="w-10 h-10" />
                <h4 className="font-bold text-lg">PAYBACK247</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                A successful hybrid peer-to-peer MLM system based on financial planning and wealth creation.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => setLocation('/user')} className="hover:text-foreground" data-testid="footer-link-home">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/user')} className="hover:text-foreground" data-testid="footer-link-about">
                    Why Choose Us
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/user')} className="hover:text-foreground" data-testid="footer-link-income">
                    Income Plan
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground" data-testid="footer-link-terms">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground" data-testid="footer-link-privacy">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="font-semibold mb-4">Connect With Us</h4>
              <div className="flex gap-3">
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-md bg-background border border-border flex items-center justify-center hover-elevate active-elevate-2"
                  data-testid="social-link-twitter"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-md bg-background border border-border flex items-center justify-center hover-elevate active-elevate-2"
                  data-testid="social-link-facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-md bg-background border border-border flex items-center justify-center hover-elevate active-elevate-2"
                  data-testid="social-link-linkedin"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 PAYBACK247. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
