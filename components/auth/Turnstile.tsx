'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: TurnstileOptions
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

/**
 * Cloudflare Turnstile CAPTCHA component
 * 
 * To use this component, you need to:
 * 1. Create a Turnstile widget at https://dash.cloudflare.com/turnstile
 * 2. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your .env.local
 * 3. Add TURNSTILE_SECRET_KEY to your server environment
 */
export function Turnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) return;
    
    // Remove existing widget if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        // Ignore errors when removing
      }
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerify,
      'error-callback': onError,
      'expired-callback': onExpire,
      theme,
      size,
      appearance: 'always',
    });
  }, [siteKey, onVerify, onError, onExpire, theme, size]);

  useEffect(() => {
    // If no site key, don't render (dev mode)
    if (!siteKey) {
      console.warn('[Turnstile] No site key configured - CAPTCHA disabled');
      // In dev mode, auto-verify with a dummy token
      if (process.env.NODE_ENV === 'development') {
        onVerify('dev-mode-token');
      }
      return;
    }

    // Check if script is already loaded
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Check if script is being loaded
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // Load the Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = () => {
      renderWidget();
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, [siteKey, renderWidget, onVerify]);

  // Don't render anything if no site key (dev mode)
  if (!siteKey) {
    return (
      <div className={className}>
        <div className="text-xs text-muted-foreground text-center p-2 border border-dashed border-border rounded-lg">
          CAPTCHA disabled (dev mode)
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}

/**
 * Hook for managing Turnstile token state
 */
export function useTurnstile() {
  const tokenRef = useRef<string | null>(null);

  const setToken = useCallback((token: string) => {
    tokenRef.current = token;
  }, []);

  const getToken = useCallback(() => {
    return tokenRef.current || '';
  }, []);

  const clearToken = useCallback(() => {
    tokenRef.current = null;
  }, []);

  return {
    setToken,
    getToken,
    clearToken,
  };
}
