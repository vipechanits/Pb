import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setupSecurityCodeSchema } from '@shared/schema';
import type { SetupPinRequest } from '@shared/schema';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Lock, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SecurityCodeSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SecurityCodeSetupModal({ open, onOpenChange, onSuccess }: SecurityCodeSetupModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(setupSecurityCodeSchema),
    defaultValues: {
      securityCode: '',
      confirmSecurityCode: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/setup-security-code', {
        securityCode: data.securityCode,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup security code');
      }

      toast({
        title: 'Success',
        description: 'Your security code has been set up successfully! Use it to update password, PIN, and email.',
      });
      
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to setup security code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField('default');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-security-code-setup">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Set Up Your Security Code
          </DialogTitle>
          <DialogDescription>
            This is a one-time setup. Your 6-digit security code is required to update password, PIN, and email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300">Default Security Code</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400 space-y-2">
              <p>For this first-time setup, use the default security code: <span className="font-mono font-bold">123456</span></p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
                onClick={() => copyToClipboard('123456')}
                data-testid="button-copy-default-code"
              >
                {copiedField === 'default' ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Default Code
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="securityCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter Security Code</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="123456"
                        maxLength={6}
                        {...field}
                        data-testid="input-security-code"
                      />
                    </FormControl>
                    <FormDescription>6-digit code (currently use default: 123456)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmSecurityCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Security Code</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="123456"
                        maxLength={6}
                        {...field}
                        data-testid="input-confirm-security-code"
                      />
                    </FormControl>
                    <FormDescription>Re-enter your security code to confirm</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                data-testid="button-setup-security-code"
              >
                {loading ? 'Setting up...' : 'Set Up Security Code'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
