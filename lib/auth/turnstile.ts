/**
 * Resolve the Turnstile site key at request time on the server.
 * Supports both NEXT_PUBLIC_TURNSTILE_SITE_KEY (build-time) and
 * TURNSTILE_SITE_KEY (runtime server env) so production deploys
 * do not depend on a client rebuild to pick up the key.
 */
export function getTurnstileSiteKey(): string {
  return (
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
    process.env.TURNSTILE_SITE_KEY ??
    ''
  );
}

export function isTurnstileConfigured(): boolean {
  return Boolean(getTurnstileSiteKey() && process.env.TURNSTILE_SECRET_KEY);
}
