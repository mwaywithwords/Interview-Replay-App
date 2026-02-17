/**
 * Email validation utilities for anti-abuse protection
 * Includes format validation and disposable email domain blocking
 */

// Common disposable email domains that should be blocked
// This list should be updated periodically
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // Popular disposable email services
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'tempmail.com',
  'temp-mail.org',
  'tempail.com',
  'fakeinbox.com',
  'throwaway.email',
  'throwawaymail.com',
  'getnada.com',
  'getairmail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'mailnesia.com',
  'mailcatch.com',
  'maildrop.cc',
  'dispostable.com',
  'mintemail.com',
  'mt2009.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'sharklasers.com',
  'spam4.me',
  'spamgourmet.com',
  'jetable.org',
  'emailondeck.com',
  'mailsac.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minute-mail.com',
  '20minutemail.com',
  'tempinbox.com',
  'tempinbox.co.uk',
  'mytrashmail.com',
  'mailexpire.com',
  'mailmoat.com',
  'spambox.us',
  'spamevader.com',
  'mailnull.com',
  'e4ward.com',
  'sneakemail.com',
  'sogetthis.com',
  'spam.la',
  'spamavert.com',
  'tempomail.fr',
  'temporaryemail.net',
  'temporaryinbox.com',
  'throwawaymail.com',
  'discard.email',
  'discardmail.com',
  'disposeamail.com',
  'mailforspam.com',
  'no-spam.ws',
  'shortmail.net',
  'trash-mail.com',
  'trash2009.com',
  'binkmail.com',
  'chammy.info',
  'devnullmail.com',
  'emailtemporario.com.br',
  'fakemailgenerator.com',
  'getonemail.com',
  'imgof.com',
  'incognitomail.org',
  'mailcatch.com',
  'mailscrap.com',
  'tempsky.com',
  'mohmal.com',
  'anonymbox.com',
  'emlhub.com',
  'fakemail.fr',
  'imgv.de',
  'kurzepost.de',
  'mailbox92.biz',
  'mailtemp.info',
  'mail-temp.com',
  'mohmal.tech',
  'one-time.email',
  'tempmailer.com',
  'tempmailaddress.com',
  'vpn.st',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'mail.tm',
  'dropmail.me',
  'emailfake.com',
  'emkei.cz',
  'fakemailgenerator.net',
  'burnermail.io',
  'tempmailo.com',
  'tempr.email',
  'clrmail.com',
  'crazymailing.com',
]);

// Valid TLDs - only most common ones to avoid false positives
// We'll reject obviously fake TLDs like .test, .invalid, .example
const INVALID_TLDS = new Set([
  'test',
  'invalid',
  'example',
  'localhost',
  'local',
  'internal',
  'corp',
  'home',
  'lan',
  'intranet',
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  isDisposable?: boolean;
}

/**
 * Validates email format using a comprehensive regex
 * More strict than HTML5 type="email" validation
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim and lowercase for validation
  const normalizedEmail = email.trim().toLowerCase();

  // Check length constraints
  if (normalizedEmail.length < 5 || normalizedEmail.length > 254) {
    return false;
  }

  // RFC 5322 compliant email regex (simplified for practical use)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(normalizedEmail)) {
    return false;
  }

  // Additional checks
  const [localPart, domain] = normalizedEmail.split('@');

  // Local part checks
  if (!localPart || localPart.length > 64) {
    return false;
  }

  // Domain checks
  if (!domain || domain.length > 253) {
    return false;
  }

  // Must have at least one dot in domain (e.g., example.com)
  if (!domain.includes('.')) {
    return false;
  }

  // Check TLD
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) {
    return false;
  }

  return true;
}

/**
 * Extracts the domain from an email address
 */
export function getEmailDomain(email: string): string | null {
  if (!email || !email.includes('@')) {
    return null;
  }
  return email.split('@')[1]?.toLowerCase() || null;
}

/**
 * Checks if an email uses a known disposable email domain
 */
export function isDisposableEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) {
    return false;
  }
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Checks if an email uses an invalid/reserved TLD
 */
export function hasInvalidTld(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) {
    return true;
  }
  const tld = domain.split('.').pop()?.toLowerCase();
  return !tld || INVALID_TLDS.has(tld);
}

/**
 * Comprehensive email validation
 * Checks format, TLD, and disposable domain
 */
export function validateEmail(email: string, options?: {
  blockDisposable?: boolean;
}): EmailValidationResult {
  const { blockDisposable = true } = options || {};

  // Trim and normalize
  const normalizedEmail = email?.trim().toLowerCase() || '';

  // Check basic format
  if (!isValidEmailFormat(normalizedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  // Check for invalid TLD
  if (hasInvalidTld(normalizedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  // Check for disposable email
  if (blockDisposable && isDisposableEmail(normalizedEmail)) {
    return {
      isValid: false,
      error: 'Please use a permanent email address. Temporary/disposable emails are not allowed.',
      isDisposable: true,
    };
  }

  return {
    isValid: true,
    isDisposable: false,
  };
}

/**
 * Normalizes an email address (trim, lowercase)
 */
export function normalizeEmail(email: string): string {
  return email?.trim().toLowerCase() || '';
}

/**
 * Simple email format check for client-side use
 * Returns error message or null if valid
 */
export function getEmailError(email: string, blockDisposable = true): string | null {
  const result = validateEmail(email, { blockDisposable });
  return result.isValid ? null : (result.error || 'Invalid email address');
}
