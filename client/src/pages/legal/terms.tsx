import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, AlertTriangle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logoUrl from '@assets/payback247-logo_1763267164811.png';
import { useSystemConfig, formatINR } from '@/hooks/use-system-config';

export default function TermsAndConditions() {
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-muted-foreground text-lg">
            Last Updated: November 17, 2025
          </p>
        </div>

        {/* Legal Disclaimer Alert */}
        <Alert className="mb-8 border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertDescription className="text-sm">
            <strong className="text-destructive">IMPORTANT LEGAL DISCLAIMER:</strong> By using PAYBACK247, you acknowledge that this is a peer-to-peer (P2P) income platform where all payments are made directly between members. PAYBACK247 does not guarantee any earnings, income, or profits. Participation involves financial risk, and you should only invest what you can afford to lose. This platform is not a get-rich-quick scheme and requires active participation and effort to build a network.
          </AlertDescription>
        </Alert>

        {/* Terms Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                By accessing and using PAYBACK247 ("Platform", "Service", "We", "Us"), you ("User", "Member", "You") accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use this Platform.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and PAYBACK247. We reserve the right to modify these terms at any time, and it is your responsibility to review them periodically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Platform Description & Service</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                <strong>PAYBACK247</strong> is a peer-to-peer (P2P) income platform that facilitates direct payments between members using a multi-level marketing (MLM) structure. The Platform operates using:
              </p>
              <ul>
                <li><strong>Binary Tree Structure:</strong> Each member can have up to 2 direct referrals (left and right legs)</li>
                <li><strong>Global Matrix (2x5 Non-Working):</strong> A 5-level deep matrix with automatic FIFO placement</li>
                <li><strong>8-Payment Activation System:</strong> New members make 8 direct payments to activate their account (₹5,000 total)</li>
                <li><strong>Binary Matching Queue:</strong> Members are matched in pairs for binary income (3:3 ratio)</li>
                <li><strong>Unlimited Re-entry:</strong> Members can re-enter after completing one activation cycle</li>
              </ul>
              <p>
                <strong className="text-destructive">IMPORTANT:</strong> PAYBACK247 acts only as a facilitating platform. All payments are made directly between members via UPI (Google Pay, Paytm, PhonePe, etc.). We DO NOT collect, hold, or process any payments ourselves.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Eligibility & Account Registration</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>To use PAYBACK247, you must:</p>
              <ul>
                <li>Be at least 18 years of age or the legal age of majority in your jurisdiction</li>
                <li>Have a valid email address and mobile number</li>
                <li>Provide accurate and complete information during registration</li>
                <li>Have a valid UPI account and bank account for receiving payments</li>
                <li>Comply with all applicable laws and regulations in your jurisdiction</li>
              </ul>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. Any activities under your account are your sole responsibility.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Payment Terms & Obligations</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h4 className="font-semibold">4.1 Activation Payments</h4>
              <p>
                To activate your account, you must make 8 direct peer-to-peer payments totaling {formatINR(config.totalActivationCost)}:
              </p>
              <ol>
                <li>Direct Sponsor Payment (Slot 0): {formatINR(config.sponsorPaymentAmount)}</li>
                <li>Binary Match Payment (Slot 1): {formatINR(config.binaryMatchPaymentAmount)}</li>
                <li>Top Reward Payment (Slot 2): {formatINR(config.topRewardAmount)}</li>
                <li>Matrix Level 1-5 Payments (Slots 3-7): {formatINR(config.matrixLevel1Amount)} each ({formatINR(config.matrixLevel1Amount * 5)} total)</li>
              </ol>

              <h4 className="font-semibold mt-4">4.2 Payment Process</h4>
              <ul>
                <li>All payments are made directly via UPI to designated members</li>
                <li>You must submit UPI Transaction ID (UTR) and optional payment proof for each payment</li>
                <li>Receivers must manually confirm each payment before it is considered complete</li>
                <li>Payments can be rejected if proof is insufficient or incorrect</li>
              </ul>

              <h4 className="font-semibold mt-4">4.3 Payment Responsibilities</h4>
              <p className="text-destructive">
                <strong>CRITICAL:</strong> PAYBACK247 is NOT responsible for any payment disputes, fraud, or non-payment between members. All transactions are direct member-to-member exchanges. We do not hold, process, or guarantee any payments.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Income & Earnings Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-destructive font-semibold">
                ⚠️ NO INCOME GUARANTEE: PAYBACK247 makes NO guarantees regarding your ability to earn income through this Platform.
              </p>
              <ul>
                <li>Your earnings depend entirely on your ability to recruit and activate new members</li>
                <li>Past performance of other members does NOT guarantee your future results</li>
                <li>Income potential shown on the Platform are theoretical maximums, not typical results</li>
                <li>Most members may not earn back their initial activation cost</li>
                <li>You may lose your entire activation payment ({formatINR(config.totalActivationCost)}) without earning any income</li>
              </ul>
              <p>
                <strong>Risk Acknowledgment:</strong> You understand and accept that participation in PAYBACK247 involves financial risk. You should only invest money that you can afford to lose completely.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Member Obligations & Prohibited Activities</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>Members MUST NOT:</p>
              <ul>
                <li>Provide false or misleading information during registration or payment confirmation</li>
                <li>Create multiple accounts (one account per person only)</li>
                <li>Use automated tools, bots, or scripts to manipulate the Platform</li>
                <li>Engage in fraudulent payment activities or submit fake payment proofs</li>
                <li>Harass, spam, or misrepresent the Platform to potential members</li>
                <li>Make unrealistic income claims or guarantees to recruit new members</li>
                <li>Violate any applicable laws, including MLM and pyramid scheme regulations</li>
              </ul>
              <p className="text-destructive font-semibold">
                Violation of these terms may result in immediate account suspension and forfeiture of all payments and earnings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Refund & Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-destructive font-semibold">
                ⚠️ NO REFUNDS: All payments made through PAYBACK247 are FINAL and NON-REFUNDABLE.
              </p>
              <ul>
                <li>Once you make a payment to another member, it cannot be reversed</li>
                <li>PAYBACK247 cannot process refunds as we do not hold any funds</li>
                <li>Payment disputes must be resolved directly between the payer and receiver</li>
                <li>Account closure does not entitle you to any refunds</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PAYBACK247 SHALL NOT BE LIABLE FOR:
              </p>
              <ul>
                <li>Any financial losses or damages resulting from your use of the Platform</li>
                <li>Payment disputes, fraud, or non-payment between members</li>
                <li>Technical failures, data loss, or service interruptions</li>
                <li>Actions or omissions of other members on the Platform</li>
                <li>Changes to laws or regulations that affect the Platform's operation</li>
              </ul>
              <p className="text-destructive font-semibold">
                YOU USE THIS PLATFORM ENTIRELY AT YOUR OWN RISK.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Account Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                PAYBACK247 reserves the right to suspend or terminate your account at any time for:
              </p>
              <ul>
                <li>Violation of these Terms & Conditions</li>
                <li>Fraudulent activity or false payment claims</li>
                <li>Complaints from other members</li>
                <li>Legal or regulatory requirements</li>
              </ul>
              <p>
                Account termination does NOT entitle you to any refunds or compensation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Legal Compliance & Jurisdiction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                You are solely responsible for ensuring that your participation in PAYBACK247 complies with all applicable laws in your jurisdiction, including:
              </p>
              <ul>
                <li>MLM and affiliate marketing regulations</li>
                <li>Tax reporting and payment obligations</li>
                <li>Consumer protection laws</li>
                <li>Financial services regulations</li>
              </ul>
              <p>
                These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in [City], India.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                For questions or concerns regarding these Terms & Conditions, please contact us at:
              </p>
              <ul>
                <li><strong>Email:</strong> support@payback247.com</li>
                <li><strong>Support:</strong> Use the ticket system on your dashboard after logging in</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Acceptance Footer */}
        <Alert className="mt-8">
          <Shield className="h-5 w-5" />
          <AlertDescription>
            <strong>By using PAYBACK247, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.</strong> If you do not agree, you must immediately cease using this Platform.
          </AlertDescription>
        </Alert>

        <div className="mt-8 flex justify-center">
          <Button 
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
