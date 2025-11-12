import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Users, TrendingUp, Zap, GitBranch, Grid3x3, ArrowRight, Check } from 'lucide-react';
import logoUrl from '@assets/generated_images/PAYBACK247_transparent_platform_logo_fa9e977f.png';
import { useSystemConfig, formatINR } from '@/hooks/use-system-config';

export default function Landing() {
  const [, setLocation] = useLocation();
  const { config, isLoading } = useSystemConfig();

  const benefits = [
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Direct peer-to-peer payments with full transaction transparency and admin verification.'
    },
    {
      icon: Zap,
      title: 'Instant Earnings',
      description: 'Get paid directly when members activate under you - no waiting, no delays.'
    },
    {
      icon: TrendingUp,
      title: 'Passive Growth',
      description: 'Automatic matrix placement means continuous income without constant recruiting.'
    },
    {
      icon: Users,
      title: 'Global Network',
      description: 'Join a thriving community building financial freedom together worldwide.'
    }
  ];

  // Income streams with dynamic amounts from config
  const incomeStreams = [
    {
      icon: Users,
      title: 'Direct Sponsor',
      amount: formatINR(config.sponsorPaymentAmount),
      description: 'Earn immediately when someone joins using your referral link'
    },
    {
      icon: GitBranch,
      title: 'Binary Match',
      description: `Get ${formatINR(config.binaryMatchPaymentAmount)} when you're matched in the global binary pairing queue`,
      amount: formatINR(config.binaryMatchPaymentAmount)
    },
    {
      icon: Grid3x3,
      title: 'Matrix Levels (1-5)',
      amount: formatINR(config.matrixLevel1Amount * 5),
      description: `Receive ${formatINR(config.matrixLevel1Amount)} from each of 5 matrix levels as your team grows`
    }
  ];

  const features = [
    'Only 2 direct referrals needed',
    'Automatic matrix placement',
    '8 payment slots per activation',
    'Unlimited re-entry potential',
    'Direct P2P UPI payments',
    'Complete transparency'
  ];

  // FAQs with dynamic amounts from config
  const faqs = [
    {
      question: 'How do I get started?',
      answer: `Sign up with your email, complete your profile with payment details (UPI ID, bank account), then activate your account by making 8 payments to designated members (${formatINR(config.paymentSlots.slot0Amount)} to sponsor, ${formatINR(config.paymentSlots.slot1Amount)} to binary match, ${formatINR(config.paymentSlots.slot2Amount)} creator fee, and ${formatINR(config.matrixLevel1Amount)} to each of 5 matrix levels).`
    },
    {
      question: 'What is the 2+5 non-working matrix?',
      answer: `You only need 2 direct referrals. After that, our system automatically places new members in your 5-level matrix (breadth-first), creating passive income without constant recruiting. Each matrix level can earn you ${formatINR(config.matrixLevel1Amount)} per member.`
    },
    {
      question: 'How do payments work?',
      answer: `All payments are direct peer-to-peer via UPI (Google Pay, Paytm, PhonePe). When you activate, you make 8 payments totaling ${formatINR(config.totalActivationCost)}: to your sponsor (${formatINR(config.sponsorPaymentAmount)}), binary match partner (${formatINR(config.binaryMatchPaymentAmount)}), creator fee (${formatINR(config.creatorFeeAmount)}), and 5 matrix uplines (${formatINR(config.matrixLevel1Amount)} each). You confirm payments by submitting UTR/transaction ID and optional proof.`
    },
    {
      question: 'What is binary income?',
      answer: `When you activate, you're placed in a global binary tree. When matched with another new activator, you both pay each other ${formatINR(config.binaryMatchPaymentAmount)}. This creates instant earnings and helps you recover your activation cost quickly.`
    },
    {
      question: 'Is my money safe?',
      answer: 'Yes! All payments go directly to other members, never to a central pool. Admin only verifies transactions and ensures fair play. Your UPI payments are secure through your bank\'s payment system.'
    },
    {
      question: 'What is re-entry?',
      answer: `Once you complete your first activation cycle (all 8 payments confirmed), you can re-enter the system for ${formatINR(config.totalActivationCost)} to create additional income streams. This allows unlimited earning potential as you can re-enter multiple times.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="PAYBACK247" className="w-16 h-16 sm:w-20 sm:h-20" />
            <span className="font-bold text-xl sm:text-2xl">PAYBACK247</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/auth/login')} 
              className="hidden sm:inline-flex"
              data-testid="button-header-login"
            >
              Login
            </Button>
            <Button onClick={() => setLocation('/auth/signup')} data-testid="button-header-signup">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Build Your Financial Future
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Join PAYBACK247's non-working matrix system. Earn passive income through proven 2+5 structure with direct peer-to-peer payments.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => setLocation('/auth/signup')} 
                data-testid="button-hero-join"
                className="text-base w-full sm:w-auto group"
              >
                Join PAYBACK247
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{formatINR(config.totalActivationCost)} one-time activation</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>8 payments of {formatINR(config.paymentSlots.slot3Amount)} each</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose PAYBACK247?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A platform designed for your success
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-none shadow-sm">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Income Streams */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Multiple Income Streams</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Earn from 8 different payment slots totaling ₹4,000 per activation cycle
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {incomeStreams.map((stream, index) => (
              <Card key={index} className="hover-elevate">
                <CardHeader>
                  <stream.icon className="w-10 h-10 text-primary mb-3" />
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle className="text-lg">{stream.title}</CardTitle>
                    <span className="text-2xl font-bold text-primary">{stream.amount}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{stream.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-16 sm:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl font-bold">The 2+5 Matrix System</h2>
                <p className="text-lg opacity-90 leading-relaxed">
                  Our revolutionary non-working matrix requires only 2 direct referrals. The system automatically places new members in your 5-level matrix through FIFO (First-In-First-Out) placement, creating passive income without constant recruiting.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Card className="bg-primary-foreground/10 border-primary-foreground/20 backdrop-blur">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl font-bold mb-2">₹4,000</div>
                    <p className="text-sm opacity-90">Total earnings per cycle</p>
                    <p className="text-xs opacity-75 mt-2">From 8 payment slots</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary-foreground/10 border-primary-foreground/20 backdrop-blur">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl font-bold mb-2">∞</div>
                    <p className="text-sm opacity-90">Unlimited re-entry</p>
                    <p className="text-xs opacity-75 mt-2">Scale your income infinitely</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about PAYBACK247</p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of members already building their financial freedom with PAYBACK247
            </p>
            <Button 
              size="lg" 
              onClick={() => setLocation('/auth/signup')} 
              className="text-base group"
              data-testid="button-cta-join"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoUrl} alt="PAYBACK247" className="w-10 h-10" />
                <span className="font-bold text-lg">PAYBACK247</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                A peer-to-peer income platform with direct payments and unlimited earning potential through our proven 2+5 matrix system.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button 
                    onClick={() => setLocation('/auth/signup')} 
                    className="hover:text-foreground transition-colors"
                    data-testid="button-footer-signup"
                  >
                    Join Now
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation('/auth/login')} 
                    className="hover:text-foreground transition-colors"
                    data-testid="button-footer-login"
                  >
                    Login
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@payback247.com</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 PAYBACK247. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
