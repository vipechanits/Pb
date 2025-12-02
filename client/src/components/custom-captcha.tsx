import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SystemConfig = {
  customCaptchaEnabled: boolean;
  customCaptchaCodeLength: number;
  customCaptchaCodeType: string;
  customCaptchaColor: string;
};

interface CustomCaptchaProps {
  onCaptchaChange: (validated: boolean) => void;
  onCodeChange?: (code: string) => void;
}

export function CustomCaptcha({ onCaptchaChange, onCodeChange }: CustomCaptchaProps) {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [displayCode, setDisplayCode] = useState('');

  // Fetch system config
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  // Generate random CAPTCHA code
  const generateCaptcha = () => {
    if (!config || !config.customCaptchaEnabled) return;

    const length = config.customCaptchaCodeLength || 6;
    const codeType = config.customCaptchaCodeType || 'digit';
    let code = '';

    if (codeType === 'text') {
      // Mix of letters and numbers
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } else {
      // Digits only
      for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10).toString();
      }
    }

    setCaptchaCode(code);
    setDisplayCode(code);
    setUserInput('');
    onCaptchaChange(false);
  };

  // Generate CAPTCHA on component mount or config change
  useEffect(() => {
    if (config && config.customCaptchaEnabled) {
      generateCaptcha();
    }
  }, [config?.customCaptchaEnabled, config?.customCaptchaCodeLength, config?.customCaptchaCodeType, config]);

  // Handle user input and validation
  useEffect(() => {
    if (config?.customCaptchaEnabled) {
      const isValid = userInput.length > 0 && userInput === captchaCode;
      onCaptchaChange(isValid);
      if (onCodeChange) {
        onCodeChange(userInput);
      }
    }
  }, [userInput, captchaCode, onCaptchaChange, onCodeChange, config?.customCaptchaEnabled]);

  if (!config || !config.customCaptchaEnabled) {
    return null;
  }

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-900 border-blue-300',
    red: 'bg-red-100 text-red-900 border-red-300',
    green: 'bg-green-100 text-green-900 border-green-300',
    purple: 'bg-purple-100 text-purple-900 border-purple-300',
    orange: 'bg-orange-100 text-orange-900 border-orange-300',
    gray: 'bg-gray-100 text-gray-900 border-gray-300',
  };

  const colorClass = colorClasses[config.customCaptchaColor] || colorClasses.blue;

  return (
    <div className="space-y-3" data-testid="captcha-container">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Security Verification</Label>
        
        {/* CAPTCHA Display */}
        <Card className={`p-4 text-center border-2 ${colorClass}`}>
          <div className="font-mono text-2xl font-bold tracking-widest select-none" data-testid="captcha-code">
            {displayCode}
          </div>
        </Card>

        {/* Refresh Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={generateCaptcha}
          className="w-full"
          data-testid="button-refresh-captcha"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Get New Code
        </Button>
      </div>

      {/* User Input */}
      <div className="space-y-2">
        <Label htmlFor="captcha-input">Enter the code above</Label>
        <Input
          id="captcha-input"
          type="text"
          placeholder="Enter verification code"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.toUpperCase())}
          maxLength={config.customCaptchaCodeLength}
          data-testid="input-captcha"
          className="text-center text-lg tracking-widest font-mono"
        />
      </div>

      {/* Validation Status */}
      {userInput && userInput !== captchaCode && (
        <Alert variant="destructive" data-testid="alert-captcha-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Verification code does not match. Please try again.
          </AlertDescription>
        </Alert>
      )}
      {userInput && userInput === captchaCode && (
        <Alert data-testid="alert-captcha-success">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Verification code is correct.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
