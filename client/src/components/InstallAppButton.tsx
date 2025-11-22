import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    (deferredPrompt as any).prompt();
    const { outcome } = await (deferredPrompt as any).userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleIOSInstall = () => {
    alert('To install PAYBACK247 on iOS:\n\n1. Open this page in Safari\n2. Tap the Share button\n3. Scroll down and tap "Add to Home Screen"\n4. Name it "PAYBACK247"\n5. Tap "Add"');
  };

  if (!showPrompt && !isIOS) {
    return null;
  }

  if (isIOS) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={handleIOSInstall}
        data-testid="button-install-ios"
      >
        <Download className="w-4 h-4" />
        Install App
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        onClick={handleInstall}
        data-testid="button-install-app"
      >
        <Download className="w-4 h-4" />
        Install App
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setShowPrompt(false)}
        data-testid="button-dismiss-install"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
