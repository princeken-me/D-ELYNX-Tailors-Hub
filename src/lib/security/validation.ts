import { ProfessionalRole } from '../../types/user';

// Permitted roles for public self-registration
export const ALLOWED_REGISTRATION_ROLES: ProfessionalRole[] = [
  'customer',
  'designer',
  'tailor',
  'manufacturer',
  'buyer_retailer',
  'seller',
];

// Privileged administrative roles requiring manual or governed promotion
export const PRIVILEGED_ROLES: ProfessionalRole[] = [
  'moderator',
  'admin',
  'super_admin',
];

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  errors: string[];
}

/**
 * Validates password strength for production standards
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    errors.push('Password must contain at least 8 characters.');
  } else {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must include at least one uppercase letter (A-Z).');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must include at least one lowercase letter (a-z).');
  }

  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must include at least one digit or symbol.');
  }

  return {
    isValid: errors.length === 0,
    score,
    errors,
  };
}

/**
 * Basic XSS-safe string sanitization
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // remove direct angle brackets
    .slice(0, 1000); // cap maximum input length
}

/**
 * Sanitize and validate email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleaned)) {
    throw new Error('Please enter a valid email address.');
  }
  return cleaned;
}

/**
 * Validate redirect path to prevent Open Redirect vulnerabilities
 * Ensures redirect is strictly an internal application route
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback: string = '/account'): string {
  if (!target || typeof target !== 'string') return fallback;

  // Disallow absolute URLs, protocol relative URLs (//), and javascript: schemes
  const trimmed = target.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.toLowerCase().includes('javascript:')) {
    return trimmed;
  }

  return fallback;
}

/**
 * SQL Injection pattern detection
 * Detects classic SQL injection heuristics in user strings
 */
export function containsSqlInjectionPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))(\s)*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /(union(\s)+select)/i,
    /(drop(\s)+table)/i,
    /(insert(\s)+into)/i,
    /(delete(\s)+from)/i,
    /(update\s+\w+\s+set)/i,
    /(exec(\s|\+)+(s|x)p\w+)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validates and normalizes quantity bounds
 */
export function validatePositiveInteger(val: any, defaultVal = 1, max = 10000): number {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultVal;
  }
  return Math.min(parsed, max);
}

/**
 * Validates unit price bounds
 */
export function validatePositivePrice(val: any): number | null {
  const parsed = parseFloat(val);
  if (isNaN(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

/**
 * UUID v4 / PostgreSQL standard UUID validator
 */
export function validateUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
}

/**
 * Privacy Masking: Masks email address for display (e.g. j***e@domain.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '••••@••••.•••';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Privacy Masking: Masks phone numbers (e.g. +234 ••• ••• 4567)
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 5) return '••••••••';
  const clean = phone.trim();
  const visibleCount = 4;
  const maskedPrefix = clean.slice(0, -visibleCount).replace(/[0-9]/g, '•');
  const visibleSuffix = clean.slice(-visibleCount);
  return `${maskedPrefix}${visibleSuffix}`;
}

/**
 * Privacy Masking: Masks bank accounts / card numbers (e.g. ••••••••1234)
 */
export function maskAccountNumber(account: string): string {
  if (!account || account.length < 4) return '••••••••';
  const lastFour = account.trim().slice(-4);
  return `••••••••${lastFour}`;
}
