/**
 * D-ELYNX TAILORS HUB - Security Headers & Content Security Policy
 *
 * Configures defense-in-depth HTTP headers to prevent XSS, clickjacking,
 * MIME sniffing, and unintended cross-origin embedding.
 */

import { ServerResponse } from 'http';

export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking while permitting AI Studio preview frames if needed
  'X-Frame-Options': 'SAMEORIGIN',

  // Strict Referrer policy protecting URLs from leaking query tokens
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy restricting unnecessary browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://placehold.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co https://api.flutterwave.com",
    "frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://*.web.app",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; '),
};

/**
 * Apply security headers to an outgoing HTTP response
 */
export function applySecurityHeaders(res: ServerResponse): void {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    if (!res.hasHeader(header)) {
      res.setHeader(header, value);
    }
  }
}
