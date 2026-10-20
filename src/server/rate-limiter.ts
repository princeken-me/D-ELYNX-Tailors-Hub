/**
 * D-ELYNX TAILORS HUB - In-Memory Sliding Window Rate Limiter
 *
 * Protects endpoints from credential stuffing, brute force, payment abuse,
 * oversized uploads, and denial-of-service attempts.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Purge expired records every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Evaluate whether a request is allowed under rate limits
   * @param key Unique identifier (IP address, user ID, or endpoint scope)
   * @param maxRequests Maximum requests allowed within window
   * @param windowSeconds Duration of window in seconds
   */
  public check(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): {
    allowed: boolean;
    remaining: number;
    resetInSeconds: number;
    limit: number;
  } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out timestamps outside the current window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetInSeconds = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
        limit: maxRequests,
      };
    }

    // Record this attempt
    record.timestamps.push(now);

    const remaining = maxRequests - record.timestamps.length;
    const resetInSeconds = windowSeconds;

    return {
      allowed: true,
      remaining,
      resetInSeconds,
      limit: maxRequests,
    };
  }

  /**
   * Reset limits for a key (e.g. after successful authentication)
   */
  public reset(key: string): void {
    this.records.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    const maxRetention = 3600 * 1000; // 1 hour max retention
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < maxRetention);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }
}

export const serverRateLimiter = new InMemoryRateLimiter();

// Preconfigured tier limits
export const RATE_LIMIT_TIERS = {
  // Authentication endpoints (Sign-in, password reset): 5 requests / 60 seconds
  AUTH: { maxRequests: 5, windowSeconds: 60 },

  // Order checkout & creation: 10 requests / 60 seconds
  CHECKOUT: { maxRequests: 10, windowSeconds: 60 },

  // Payment initialization & verification: 15 requests / 60 seconds
  PAYMENT: { maxRequests: 15, windowSeconds: 60 },

  // File upload validation: 10 requests / 60 seconds
  UPLOAD: { maxRequests: 10, windowSeconds: 60 },

  // Administrative APIs: 30 requests / 60 seconds
  ADMIN: { maxRequests: 30, windowSeconds: 60 },

  // General API: 60 requests / 60 seconds
  GENERAL: { maxRequests: 60, windowSeconds: 60 },
};
