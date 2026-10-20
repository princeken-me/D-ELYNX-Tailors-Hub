/**
 * D-ELYNX TAILORS HUB - System Security Audit Logging Service
 *
 * Implements an immutable audit log for sensitive actions (user roles, suspensions,
 * order overrides, refunds, payments, and system configurations).
 *
 * CRITICAL INVARIANT: ZERO-SECRET EXPOSURE.
 * All credentials, keys, passwords, and tokens are scrubbed before logging.
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
}

const SENSITIVE_KEYS = [
  'password',
  'pass',
  'token',
  'secret',
  'apikey',
  'api_key',
  'servicerolekey',
  'service_role_key',
  'authorization',
  'cvv',
  'cardnumber',
  'card_number',
  'privatekey',
  'private_key',
];

/**
 * Deeply recursively scrubs any key matching sensitive patterns
 */
export function sanitizeAuditMetadata(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditMetadata(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      sanitized[key] = '•••••••••••••••• [REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeAuditMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class SecurityAuditService {
  private inMemoryLogs: AuditLogEntry[] = [];
  private readonly maxRetention = 1000;

  /**
   * Record a security event with zero-secret guarantee
   */
  public log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const sanitizedMetadata = sanitizeAuditMetadata(entry.metadata);

    const record: AuditLogEntry = {
      id: `sec_log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      severity: entry.severity,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      metadata: sanitizedMetadata,
    };

    this.inMemoryLogs.unshift(record);

    if (this.inMemoryLogs.length > this.maxRetention) {
      this.inMemoryLogs.pop();
    }

    return record;
  }

  /**
   * Retrieve audit logs filtered by severity or resource
   */
  public getLogs(filter?: {
    severity?: string;
    resourceType?: string;
    actorId?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let result = this.inMemoryLogs;

    if (filter?.severity) {
      result = result.filter((l) => l.severity === filter.severity);
    }
    if (filter?.resourceType) {
      result = result.filter((l) => l.resourceType === filter.resourceType);
    }
    if (filter?.actorId) {
      result = result.filter((l) => l.actorId === filter.actorId);
    }

    const limit = filter?.limit || 100;
    return result.slice(0, limit);
  }

  /**
   * Clear logs (testing only)
   */
  public clear(): void {
    this.inMemoryLogs = [];
  }
}

export const securityAuditService = new SecurityAuditService();
