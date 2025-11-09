import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function PlaceholderPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>Non-blockchain version coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Blockchain Features Removed</AlertTitle>
            <AlertDescription>
              This page is being rebuilt to work without blockchain integration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
