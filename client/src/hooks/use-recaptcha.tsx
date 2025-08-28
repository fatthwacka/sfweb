import { useCallback } from 'react';

// Types for Google reCAPTCHA
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface UseRecaptchaReturn {
  executeRecaptcha: (action: string) => Promise<string | null>;
  isRecaptchaLoaded: () => boolean;
}

export function useRecaptcha(): UseRecaptchaReturn {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'YOUR_RECAPTCHA_SITE_KEY';
  
  const isRecaptchaLoaded = useCallback((): boolean => {
    return typeof window !== 'undefined' && 
           typeof window.grecaptcha !== 'undefined' && 
           typeof window.grecaptcha.execute === 'function';
  }, []);

  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    if (!isRecaptchaLoaded()) {
      console.warn('reCAPTCHA not loaded yet');
      return null;
    }

    try {
      return new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(siteKey, { action })
            .then(resolve)
            .catch(reject);
        });
      });
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  }, [siteKey, isRecaptchaLoaded]);

  return {
    executeRecaptcha,
    isRecaptchaLoaded
  };
}