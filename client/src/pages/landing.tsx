import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Globe, TrendingUp, Wallet, Users, GitBranch, Grid3x3 } from 'lucide-react';
import logoUrl from '@assets/Generated Image October 16, 2025 - 6_58AM (1)_1762653844897.png';

export default function Landing() {
  const [, setLocation] = useLocation();

  const benefits = [
    {
      icon: Shield,
      title: 'Plan Of Your Security',
      description: 'Your funds are safe and secured with our advanced security systems.'
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Connect with users around the world and build your network globally.'
    },
    {
      icon: TrendingUp,
      title: 'Steady Growth',
      description: 'Experience consistent growth with our proven MLM matrix system.'
    },
    {
      icon: Wallet,
      title: 'Powerful Ecosystem',
      description: 'Benefit from multiple income streams and unlimited earning potential.'
    }
  ];

  const incomeStreams = [
    {
      icon: Users,
      title: 'Sponsor Income',
      description: 'Earn ₹625 for every direct referral you sponsor into the system.'
    },
    {
      icon: GitBranch,
      title: 'Binary Income',
      description: 'Get ₹625 when you match with another user in our global binary queue.'
    },
    {
      icon: Grid3x3,
      title: 'Matrix Income',
      description: 'Receive ₹625 from each of your 5 matrix levels for unlimited passive earnings.'
    }
  ];

  const faqs = [
    {
      question: 'How do I join PAYBACK247?',
      answer: 'Click "Get Started" to sign up with your email. Complete your profile and activate your account with ₹5,000 to start earning.'
    },
    {
      question: 'What is "Non-working" matrix?',
      answer: 'Our 2+5 non-working matrix means you only need 2 direct referrals. The system automatically places additional members in your 5-level matrix, creating passive income without constant recruiting.'
    },
    {
      question: 'How do payments work?',
      answer: 'All payments are made directly peer-to-peer via UPI (Google Pay, Paytm, PhonePe). You pay ₹625 to 8 different members: your sponsor, binary match, creator fee, and 5 matrix uplines.'
    },
    {
      question: 'What is binary income?',
      answer: 'Binary income is earned when you\'re matched with another user in our global FIFO queue. Both users pay each other ₹625, creating instant earnings.'
    },
    {
      question: 'Is my money safe?',
      answer: 'Yes! All payments are direct peer-to-peer transfers. There is no central wallet or fund pool. Admin only verifies transactions to ensure fair play.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="PAYBACK247" className="w-20 h-20" />
            <span className="font-bold text-2xl">PAYBACK247</span>
          </div>
          <Button onClick={() => setLocation('/auth/signup')} data-testid="button-get-started">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Empower Your Financial Future.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join PAYBACK247's non-working matrix system. Earn passive income through our proven 2+5 structure with direct P2P payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => setLocation('/auth/signup')} data-testid="button-join">
              Join PAYBACK247
            </Button>
            <p className="text-sm text-muted-foreground">
              • ₹5,000 one-time activation • 8 payments of ₹625 each
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Why Choose PAYBACK247?</h2>
            <p className="text-muted-foreground">Join thousands who are already building their financial freedom</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Multiple Streams of Income */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Multiple Streams of Income</h2>
            <p className="text-muted-foreground">Earn ₹625 from each of these 8 payment slots as members join under you</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {incomeStreams.map((stream, index) => (
              <Card key={index}>
                <CardHeader>
                  <stream.icon className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>{stream.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stream.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 2+5 Matrix Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">The 2+5 Non-Working Matrix</h2>
          <p className="text-lg max-w-3xl mx-auto opacity-90">
            Our revolutionary system means you only need 2 direct referrals. The system automatically places additional members in your 5-level matrix, creating passive income without constant recruiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-8 border border-primary-foreground/20">
              <div className="text-5xl font-bold mb-2">₹31,000</div>
              <p className="text-sm opacity-90">From your first 2+5 cycle</p>
              <p className="text-xs opacity-75 mt-2">Complete 8 payment cycle</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-8 border border-primary-foreground/20">
              <div className="text-5xl font-bold mb-2">Unlimited</div>
              <p className="text-sm opacity-90">Re-entry potential</p>
              <p className="text-xs opacity-75 mt-2">Scale your income infinitely</p>
            </div>
          </div>
          <p className="text-sm opacity-75 max-w-2xl mx-auto">
            Once your basic 2 + 5 slots are full, you can do re-entry to create more income with 625/- slot again and again!
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/30 border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoUrl} alt="PAYBACK247" className="w-8 h-8" />
                <span className="font-bold">PAYBACK247</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A peer-to-peer MLM platform with direct payments and unlimited earning potential.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setLocation('/auth/signup')} className="hover:text-foreground">Join Now</button></li>
                <li><button onClick={() => setLocation('/auth/login')} className="hover:text-foreground">Login</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Email: support@payback247.com</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 PAYBACK247 • All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
