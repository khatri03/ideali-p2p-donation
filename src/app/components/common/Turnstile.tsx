import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';

declare global {
  interface Window {
    turnstile: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  retry?: boolean;
  retryInterval?: number;
}

const TURNSTILE_SCRIPT_ID = 'turnstile-script';

const Turnstile: React.FC<TurnstileProps> = ({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  retry = true,
  retryInterval = 8000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs for callbacks to avoid re-renders
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
    const handleVerify = (token: string) => {
      console.log('Turnstile verified, token received');
      onVerifyRef.current(token);
    };

    const handleExpire = () => {
      console.log('Turnstile token expired');
      onExpireRef.current?.();
    };

    const handleError = () => {
      console.error('Turnstile error occurred');

      // Reset widget on error for retry
      if (retry && widgetIdRef.current && window.turnstile) {
        retryTimeoutRef.current = setTimeout(() => {
          if (widgetIdRef.current && window.turnstile) {
            console.log('Retrying Turnstile...');
            window.turnstile.reset(widgetIdRef.current);
          }
        }, retryInterval);
      }

      onErrorRef.current?.();
    };

    const renderWidget = () => {
      if (containerRef.current && window.turnstile && !widgetIdRef.current) {
        console.log('Rendering Turnstile widget...');
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: handleVerify,
          'expired-callback': handleExpire,
          'error-callback': handleError,
          theme,
          size,
        });
        console.log('Turnstile widget ID:', widgetIdRef.current);
      }
    };

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (!existingScript) {
      console.log('Loading Turnstile script...');
      const script = document.createElement('script');
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Turnstile script loaded');
        renderWidget();
      };
      script.onerror = () => {
        console.error('Failed to load Turnstile script');
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      existingScript.addEventListener('load', renderWidget);
    }

    return () => {
      // Clear any pending retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (widgetIdRef.current && window.turnstile) {
        console.log('Removing Turnstile widget...');
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, size, retry, retryInterval]);

  return <Box ref={containerRef} />;
};

export default Turnstile;
