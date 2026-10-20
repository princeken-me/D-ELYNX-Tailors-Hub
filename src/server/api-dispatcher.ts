/**
 * D-ELYNX TAILORS HUB - Unified Server-Side API Dispatcher
 *
 * Intercepts all `/api/*` endpoints in the backend middleware layer.
 * Applies:
 * 1. Security Headers (CSP, X-Content-Type-Options, etc.)
 * 2. In-Memory Sliding-Window Rate Limiting
 * 3. Request Size Limits (Prevents buffer exhaustion)
 * 4. Error Sanitization (Zero secret leaks)
 */

import { IncomingMessage, ServerResponse } from 'http';
import { handleSupabaseAdminApi } from './api-handler';
import { applySecurityHeaders } from './security-headers';
import { serverRateLimiter, RATE_LIMIT_TIERS } from './rate-limiter';
import { ServerPaymentService } from './payment-service';
import { UploadSecurityService } from './upload-service';
import { securityAuditService } from './audit-service';
import { ServerInventoryService } from './inventory-service';

// JSON parser with size guard (Max 100KB for standard APIs)
function parseJsonBody<T = any>(req: IncomingMessage, maxBytes = 100000): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : ({} as T));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

// Raw body parser for webhook signature verification
function parseRawBody(req: IncomingMessage, maxBytes = 100000): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.end(JSON.stringify(data));
}

export async function dispatchServerApi(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const urlStr = req.url || '';
  const pathname = urlStr.split('?')[0];

  // Only handle `/api/*` routes
  if (!pathname.startsWith('/api/')) {
    return false;
  }

  // 1. Apply Defense-in-Depth Security Headers
  applySecurityHeaders(res);

  // 2. Identify Client for Rate-Limiting
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';

  try {
    // --------------------------------------------------------------------------
    // A. Supabase Administration Endpoints
    // --------------------------------------------------------------------------
    if (pathname.startsWith('/api/admin/supabase')) {
      const rate = serverRateLimiter.check(`admin:${clientIp}`, RATE_LIMIT_TIERS.ADMIN.maxRequests, RATE_LIMIT_TIERS.ADMIN.windowSeconds);
      if (!rate.allowed) {
        res.setHeader('Retry-After', rate.resetInSeconds);
        sendJson(res, 429, { error: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded. Please wait before retrying.' });
        return true;
      }
      return await handleSupabaseAdminApi(req, res, pathname);
    }

    // --------------------------------------------------------------------------
    // B. Payment Security Endpoints
    // --------------------------------------------------------------------------
    if (pathname === '/api/payments/initialize' && req.method === 'POST') {
      const rate = serverRateLimiter.check(`pay_init:${clientIp}`, RATE_LIMIT_TIERS.PAYMENT.maxRequests, RATE_LIMIT_TIERS.PAYMENT.windowSeconds);
      if (!rate.allowed) {
        res.setHeader('Retry-After', rate.resetInSeconds);
        sendJson(res, 429, { error: 'TOO_MANY_REQUESTS', message: 'Payment initiation rate limit exceeded.' });
        return true;
      }

      const body = await parseJsonBody(req);
      const result = await ServerPaymentService.initializePayment({
        orderId: body.orderId,
        provider: body.provider || 'paystack',
        userId: body.userId,
        userEmail: body.userEmail,
        orderTotal: Number(body.orderTotal),
        orderCurrency: body.orderCurrency || 'NGN',
        orderStatus: body.orderStatus || 'pending_payment',
        callbackUrl: body.callbackUrl,
      });

      sendJson(res, result.success ? 200 : 400, result);
      return true;
    }

    if (pathname === '/api/payments/verify' && req.method === 'POST') {
      const rate = serverRateLimiter.check(`pay_verify:${clientIp}`, RATE_LIMIT_TIERS.PAYMENT.maxRequests, RATE_LIMIT_TIERS.PAYMENT.windowSeconds);
      if (!rate.allowed) {
        res.setHeader('Retry-After', rate.resetInSeconds);
        sendJson(res, 429, { error: 'TOO_MANY_REQUESTS', message: 'Payment verification rate limit exceeded.' });
        return true;
      }

      const body = await parseJsonBody(req);
      const result = await ServerPaymentService.verifyPayment(body.reference, body.userId);
      sendJson(res, result.success ? 200 : 400, result);
      return true;
    }

    if (pathname === '/api/payments/webhook' && req.method === 'POST') {
      const signatureHeader = String(req.headers['x-paystack-signature'] || req.headers['verif-hash'] || '');
      const provider = (req.headers['x-payment-provider'] as any) || 'paystack';
      const rawBody = await parseRawBody(req);

      const result = ServerPaymentService.handleWebhook(rawBody, signatureHeader, provider);
      sendJson(res, result.status, result);
      return true;
    }

    // --------------------------------------------------------------------------
    // C. File Upload Security Endpoints
    // --------------------------------------------------------------------------
    if (pathname === '/api/upload/validate' && req.method === 'POST') {
      const rate = serverRateLimiter.check(`upload:${clientIp}`, RATE_LIMIT_TIERS.UPLOAD.maxRequests, RATE_LIMIT_TIERS.UPLOAD.windowSeconds);
      if (!rate.allowed) {
        res.setHeader('Retry-After', rate.resetInSeconds);
        sendJson(res, 429, { error: 'TOO_MANY_REQUESTS', message: 'Upload validation rate limit exceeded.' });
        return true;
      }

      const body = await parseJsonBody(req);
      const result = UploadSecurityService.validateUpload({
        filename: body.filename,
        mimeType: body.mimeType,
        sizeBytes: Number(body.sizeBytes),
        bucket: body.bucket,
        userId: body.userId,
      });

      sendJson(res, result.valid ? 200 : 400, result);
      return true;
    }

    // --------------------------------------------------------------------------
    // D. Inventory Safety Endpoints (Authoritative Server Mutation)
    // --------------------------------------------------------------------------
    if (pathname === '/api/seller/inventory/adjust' && req.method === 'POST') {
      const rate = serverRateLimiter.check(`inv_adjust:${clientIp}`, RATE_LIMIT_TIERS.ADMIN.maxRequests, RATE_LIMIT_TIERS.ADMIN.windowSeconds);
      if (!rate.allowed) {
        res.setHeader('Retry-After', rate.resetInSeconds);
        sendJson(res, 429, { error: 'TOO_MANY_REQUESTS', message: 'Inventory adjustment rate limit exceeded.' });
        return true;
      }

      const body = await parseJsonBody(req);
      const result = await ServerInventoryService.adjustStock({
        sellerId: body.sellerId,
        variantId: body.variantId,
        delta: body.delta,
        reason: body.reason,
        userId: body.userId,
      });

      sendJson(res, result.success ? 200 : 400, result);
      return true;
    }

    if (pathname === '/api/seller/inventory/threshold' && req.method === 'POST') {
      const rate = serverRateLimiter.check(`inv_thresh:${clientIp}`, RATE_LIMIT_TIERS.ADMIN.maxRequests, RATE_LIMIT_TIERS.ADMIN.windowSeconds);
      if (!rate.allowed) {
        res.setHeader('Retry-After', rate.resetInSeconds);
        sendJson(res, 429, { error: 'TOO_MANY_REQUESTS', message: 'Threshold update rate limit exceeded.' });
        return true;
      }

      const body = await parseJsonBody(req);
      const result = await ServerInventoryService.updateThreshold({
        sellerId: body.sellerId,
        variantId: body.variantId,
        threshold: body.threshold,
        userId: body.userId,
      });

      sendJson(res, result.success ? 200 : 400, result);
      return true;
    }

    // --------------------------------------------------------------------------
    // E. Security Audit Logs Endpoints
    // --------------------------------------------------------------------------
    if (pathname === '/api/security/audit-logs' && req.method === 'GET') {
      const logs = securityAuditService.getLogs();
      sendJson(res, 200, { success: true, count: logs.length, logs });
      return true;
    }

    // --------------------------------------------------------------------------
    // E. General API Fallback
    // --------------------------------------------------------------------------
    sendJson(res, 404, { error: 'NOT_FOUND', message: `API route ${pathname} was not found.` });
    return true;
  } catch (err: any) {
    // Sanitized general error
    sendJson(res, 500, {
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while processing the request.',
    });
    return true;
  }
}
