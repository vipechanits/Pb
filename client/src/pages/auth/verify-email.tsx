import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Copy, Check, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function VerifyEmail() {
  const [, params] = useRoute("/auth/verify-email/:token");
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyUserId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          setMessage(data.message || "Email verified successfully!");
          
          // Extract User ID from response
          if (data.user?.userId) {
            setUserId(data.user.userId);
          }
          
          // Refresh auth context to load the logged-in user
          await refreshUser();
          
          // Redirect to dashboard after user sees their ID (longer delay)
          setTimeout(() => {
            navigate("/user");
          }, 5000);
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
              
              {userId && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Your Unique User ID</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold text-primary tracking-wider" data-testid="text-user-id">
                      {userId}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyUserId}
                      className="h-8 w-8"
                      data-testid="button-copy-userid"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Use this ID to log in to your account
                  </p>
                </div>
              )}
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
              <div className="space-y-3">
                <Alert data-testid="alert-save-id">
                  <AlertDescription className="text-center">
                    Please save your User ID above. You will need it to log in.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground text-center" data-testid="text-redirect">
                  Redirecting to dashboard in a few seconds...
                </p>
                <Button
                  onClick={() => navigate("/user")}
                  variant="default"
                  className="w-full"
                  data-testid="button-goto-dashboard"
                >
                  Go to Dashboard Now
                </Button>
              </div>
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
