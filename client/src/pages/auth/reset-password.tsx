import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Lock, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/auth/reset-password/:token");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const token = params?.token;

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setIsValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setIsVerifying(true);
        // apiRequest returns Response object, must call .json() to parse
        const res = await apiRequest("GET", `/api/auth/verify-reset-token/${token}`);
        const data = await res.json();
        
        if (data.valid) {
          setIsValid(true);
          setEmail(data.email);
        } else {
          setIsValid(false);
          setError("Invalid or expired reset token");
        }
      } catch (err: any) {
        setIsValid(false);
        setError("Failed to verify reset token");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: data.password,
      });

      setSuccess(true);
      form.reset();

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="icon" data-testid="button-back-to-login">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
          </div>
          <CardDescription>
            {email ? `Resetting password for ${email}` : "Enter your new password"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4" data-testid="status-verifying">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying reset token...</p>
            </div>
          ) : !token || !isValid ? (
            <div className="space-y-4">
              <Alert variant="destructive" data-testid="alert-invalid-token">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || "Invalid or expired reset token. Please request a new password reset."}
                </AlertDescription>
              </Alert>
              <Link href="/auth/forgot-password">
                <Button className="w-full" data-testid="button-request-new-reset">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" data-testid="alert-success">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Password has been reset successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive" data-testid="alert-error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter new password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters with uppercase, lowercase, and number
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm new password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-reset-password"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            Remember your password?{" "}
            <Link href="/auth/login">
              <a className="text-primary hover:underline" data-testid="link-login">
                Back to Login
              </a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
