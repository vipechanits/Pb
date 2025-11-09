import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">PAYBACK247</CardTitle>
            <CardDescription>Hybrid P2P MLM Platform (Non-Blockchain Mode)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Blockchain Features Removed</AlertTitle>
              <AlertDescription>
                The platform is being rebuilt without blockchain dependencies.
                Coming soon: Email/password authentication and manual payment tracking.
              </AlertDescription>
            </Alert>
            <Button onClick={() => setLocation('/user')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
