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
  siteKey?: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const handleReady = () => {
      if (window.turnstile) {
        resolve();
      }
    };

    const existingScript = document.querySelector(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      if (window.turnstile) {
        resolve();
        return;
      }

      const previousOnLoad = window.onTurnstileLoad;
      window.onTurnstileLoad = () => {
        previousOnLoad?.();
        handleReady();
      };
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      turnstileScriptPromise = null;
      reject(new Error('Failed to load Turnstile script'));
    };

    const previousOnLoad = window.onTurnstileLoad;
    window.onTurnstileLoad = () => {
      previousOnLoad?.();
      handleReady();
    };

    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

function removeWidget(widgetId: string | null) {
  if (!widgetId || !window.turnstile) {
    return;
  }

  try {
    window.turnstile.remove(widgetId);
  } catch {
    // Widget may already be removed.
  }
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
  siteKey: siteKeyProp,
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderedSiteKeyRef = useRef<string | null>(null);

  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  const siteKey = siteKeyProp || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.warn('[Turnstile] No site key configured - CAPTCHA disabled');
      if (process.env.NODE_ENV === 'development') {
        onVerifyRef.current('dev-mode-token');
      }
      return;
    }

    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) {
        return;
      }

      if (widgetIdRef.current && renderedSiteKeyRef.current === siteKey) {
        return;
      }

      if (widgetIdRef.current) {
        removeWidget(widgetIdRef.current);
        widgetIdRef.current = null;
        renderedSiteKeyRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerifyRef.current(token);
        },
        'error-callback': () => {
          onErrorRef.current?.();
        },
        'expired-callback': () => {
          onExpireRef.current?.();
        },
        theme,
        size,
        appearance: 'always',
      });
      renderedSiteKeyRef.current = siteKey;
    };

    void loadTurnstileScript()
      .then(() => {
        if (!cancelled) {
          renderWidget();
        }
      })
      .catch(() => {
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      if (widgetId) {
        removeWidget(widgetId);
        widgetIdRef.current = null;
        renderedSiteKeyRef.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) {
    const message =
      process.env.NODE_ENV === 'development'
        ? 'CAPTCHA disabled (dev mode)'
        : 'Security verification is unavailable. Please use Google sign-in or contact support.';

    return (
      <div className={className}>
        <div className="text-xs text-muted-foreground text-center p-2 border border-dashed border-border rounded-lg">
          {message}
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
