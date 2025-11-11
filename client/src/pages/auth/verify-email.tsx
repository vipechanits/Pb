import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function VerifyEmail() {
  const [, params] = useRoute("/auth/verify-email/:token");
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!params?.token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email/${params.token}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully! Logging you in...");
          
          // Refresh auth context to load the logged-in user
          await refreshUser();
          
          // Redirect to dashboard after auth context is updated
          setTimeout(() => {
            navigate("/user");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    };

    verifyToken();
  }, [params?.token, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" data-testid="icon-verifying" />
              </div>
              <CardTitle data-testid="text-title">Verifying Email</CardTitle>
              <CardDescription data-testid="text-description">Please wait while we verify your email address...</CardDescription>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 dark:text-green-400" data-testid="icon-success" />
              </div>
              <CardTitle className="text-green-600 dark:text-green-400" data-testid="text-title">Email Verified!</CardTitle>
              <CardDescription data-testid="text-description">{message}</CardDescription>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-destructive" data-testid="icon-error" />
              </div>
              <CardTitle className="text-destructive" data-testid="text-title">Verification Failed</CardTitle>
              <CardDescription data-testid="text-description">{message}</CardDescription>
            </>
          )}
        </CardHeader>

        {status !== "verifying" && (
          <CardContent className="space-y-4">
            {status === "success" && (
              <p className="text-sm text-muted-foreground text-center" data-testid="text-redirect">
                Logging you in and redirecting to dashboard...
              </p>
            )}
            
            {status === "error" && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate("/auth/login")}
                  variant="default"
                  className="w-full"
                  data-testid="button-login"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => navigate("/auth/signup")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-signup"
                >
                  Create New Account
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
