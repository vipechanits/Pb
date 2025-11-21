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
  onCaptchaChange: (code: string) => void;
  isValid: boolean;
}

export function CustomCaptcha({ onCaptchaChange, isValid }: CustomCaptchaProps) {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [displayCode, setDisplayCode] = useState('');

  // Fetch system config
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  // Generate random CAPTCHA code
  const generateCaptcha = () => {
    if (!config) return;

    const length = config.customCaptchaCodeLength || 6;
    let code = '';

    if (config.customCaptchaCodeType === 'text') {
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
    onCaptchaChange('');
  };

  // Generate CAPTCHA on component mount or config change
  useEffect(() => {
    if (config?.customCaptchaEnabled) {
      generateCaptcha();
    }
  }, [config?.customCaptchaEnabled, config?.customCaptchaCodeLength, config?.customCaptchaCodeType]);

  // Handle user input
  useEffect(() => {
    onCaptchaChange(userInput);
  }, [userInput, onCaptchaChange]);

  if (!config?.customCaptchaEnabled) {
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

      {/* Validation Error */}
      {userInput && !isValid && (
        <Alert variant="destructive" data-testid="alert-captcha-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Verification code does not match. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
