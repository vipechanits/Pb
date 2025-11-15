import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad?: () => void;
  }
}

type SystemConfig = {
  recaptchaSiteKey: string | null;
  recaptchaEnabled: boolean;
};

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch system config to get reCAPTCHA settings
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  useEffect(() => {
    // Only load reCAPTCHA if it's enabled and we have a site key
    if (!config?.recaptchaEnabled || !config?.recaptchaSiteKey) {
      setIsLoaded(false);
      return;
    }

    // Check if reCAPTCHA is already loaded
    if (window.grecaptcha && window.grecaptcha.render) {
      setIsLoaded(true);
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
    script.async = true;
    script.defer = true;

    window.onRecaptchaLoad = () => {
      setIsLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      window.onRecaptchaLoad = undefined;
    };
  }, [config?.recaptchaEnabled, config?.recaptchaSiteKey]);

  const executeRecaptcha = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!config?.recaptchaEnabled) {
        resolve('');
        return;
      }

      if (!isLoaded || !window.grecaptcha) {
        reject(new Error('reCAPTCHA not loaded'));
        return;
      }

      // Find the reCAPTCHA widget div
      const widgetDiv = document.querySelector('.g-recaptcha') as HTMLElement;
      if (!widgetDiv) {
        reject(new Error('reCAPTCHA widget not found'));
        return;
      }

      const widgetId = widgetDiv.getAttribute('data-widget-id');
      if (widgetId) {
        const response = window.grecaptcha.getResponse(parseInt(widgetId));
        if (response) {
          resolve(response);
        } else {
          reject(new Error('Please complete the reCAPTCHA verification'));
        }
      } else {
        reject(new Error('reCAPTCHA widget not initialized'));
      }
    });
  };

  const renderRecaptcha = (container: string | HTMLElement, callback?: () => void) => {
    if (!config?.recaptchaEnabled || !config?.recaptchaSiteKey || !isLoaded) {
      return null;
    }

    if (!window.grecaptcha || !window.grecaptcha.render) {
      return null;
    }

    try {
      const widgetId = window.grecaptcha.render(container, {
        sitekey: config.recaptchaSiteKey,
        callback: callback,
      });

      // Store widget ID on the container for later retrieval
      if (typeof container === 'string') {
        const elem = document.getElementById(container);
        if (elem) {
          elem.setAttribute('data-widget-id', widgetId.toString());
        }
      } else {
        container.setAttribute('data-widget-id', widgetId.toString());
      }

      return widgetId;
    } catch (error) {
      console.error('Error rendering reCAPTCHA:', error);
      return null;
    }
  };

  return {
    isLoaded,
    isEnabled: config?.recaptchaEnabled ?? false,
    siteKey: config?.recaptchaSiteKey ?? null,
    executeRecaptcha,
    renderRecaptcha,
  };
}
