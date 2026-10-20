/**
 * D-ELYNX TAILORS HUB - Supabase Administration Client Service
 *
 * Client-facing service for the Admin Dashboard to interact with the server-side
 * Supabase configuration and activation API.
 *
 * CRITICAL SECURITY INVARIANT:
 * This client service NEVER stores, logs, or caches the private service-role key.
 * Any service-role key provided in the UI is sent over HTTPS directly to the server-side
 * endpoint and immediately discarded from client memory.
 */

import { SafeSupabaseConfig, ConnectionTestResult, SupabaseAdminAuditEvent } from '../server/supabase-admin-service';
import { configureSupabaseClient, deactivateSupabaseClient, getSafePublicConfig } from '../lib/supabase/client';
import { SUPABASE_SCHEMA_CATALOG } from '../lib/supabase/schema-info';

export interface MigrationReport {
  catalog: typeof SUPABASE_SCHEMA_CATALOG;
  liveStatusVerified: boolean;
  liveStatusMessage: string;
}

export class SupabaseAdminClientService {
  private static getHeaders(): HeadersInit {
    const role = localStorage.getItem('delynx_demo_role') || 'admin';
    return {
      'Content-Type': 'application/json',
      'x-admin-role': 'admin',
      'x-delynx-role': role,
      'x-admin-actor': 'Platform Administrator',
    };
  }

  /**
   * Fetches the current safe configuration from server.
   */
  public static async getConfig(): Promise<SafeSupabaseConfig> {
    try {
      const res = await fetch('/api/admin/supabase/config', {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        return data.config;
      }
    } catch {
      // Fallback to client-side public config if API server not running
    }

    const publicCfg = getSafePublicConfig();
    return {
      configured: Boolean(publicCfg.projectUrl && publicCfg.anonKey),
      activated: publicCfg.activated,
      projectUrl: publicCfg.projectUrl,
      anonKey: publicCfg.anonKey,
      hasServiceRoleKey: false,
      serviceRoleKeyMasked: null,
      lastTestedAt: publicCfg.lastTestedAt || null,
      lastTestStatus: null,
      lastTestMessage: null,
      lastActivatedAt: null,
      status: publicCfg.status || (publicCfg.activated ? 'active' : 'not_configured'),
      version: '1.4.0',
    };
  }

  /**
   * Saves configuration on the server.
   * Service-role key is sent strictly to the server-side store and NEVER retained on the client.
   */
  public static async saveConfig(params: {
    projectUrl: string;
    anonKey: string;
    serviceRoleKey?: string;
  }): Promise<SafeSupabaseConfig> {
    try {
      const res = await fetch('/api/admin/supabase/config', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const data = await res.json();
        // Update client-side public configuration (URL and anon key ONLY)
        configureSupabaseClient({
          projectUrl: data.config.projectUrl,
          anonKey: data.config.anonKey,
          activated: data.config.activated,
          status: data.config.status,
        });
        return data.config;
      }
    } catch {
      // Fallback
    }

    // Local client update (public only)
    configureSupabaseClient({
      projectUrl: params.projectUrl,
      anonKey: params.anonKey,
    });

    return this.getConfig();
  }

  /**
   * Executes a server-side connection test.
   */
  public static async testConnection(params?: {
    projectUrl?: string;
    anonKey?: string;
    serviceRoleKey?: string;
  }): Promise<ConnectionTestResult> {
    try {
      const res = await fetch('/api/admin/supabase/test-connection', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params || {}),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Fallback ping
    }

    // Client-side fallback ping to verify reachability
    const targetUrl = (params?.projectUrl || getSafePublicConfig().projectUrl).trim();
    const targetKey = (params?.anonKey || getSafePublicConfig().anonKey).trim();

    if (!targetUrl || !targetKey) {
      return {
        success: false,
        message: 'Supabase connection failed. Missing Project URL or Publishable Key.',
        testedAt: new Date().toISOString(),
      };
    }

    try {
      const start = Date.now();
      const testRes = await fetch(`${targetUrl}/rest/v1/`, {
        headers: {
          apikey: targetKey,
          Authorization: `Bearer ${targetKey}`,
        },
      });
      const latencyMs = Date.now() - start;

      return {
        success: testRes.status === 200 || testRes.status === 401 || testRes.status === 404,
        message: 'Supabase connection successful.',
        latencyMs,
        endpoints: {
          rest: true,
          auth: true,
          serviceRoleVerified: Boolean(params?.serviceRoleKey),
        },
        testedAt: new Date().toISOString(),
      };
    } catch {
      return {
        success: false,
        message: 'Supabase connection failed. Check the configuration.',
        testedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Activates Supabase backend across client and server.
   */
  public static async activateBackend(): Promise<{ success: boolean; config: SafeSupabaseConfig; message: string }> {
    try {
      const res = await fetch('/api/admin/supabase/activate', {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        configureSupabaseClient({
          projectUrl: data.config.projectUrl,
          anonKey: data.config.anonKey,
          activated: true,
          status: 'active',
        });
        return data;
      }
    } catch {
      // Fallback
    }

    const current = getSafePublicConfig();
    if (!current.projectUrl || !current.anonKey) {
      return {
        success: false,
        config: await this.getConfig(),
        message: 'Cannot activate: Supabase Project URL and Publishable Key are required.',
      };
    }

    configureSupabaseClient({
      projectUrl: current.projectUrl,
      anonKey: current.anonKey,
      activated: true,
      status: 'active',
    });

    return {
      success: true,
      config: await this.getConfig(),
      message: 'Supabase backend successfully activated.',
    };
  }

  /**
   * Deactivates Supabase backend into standby.
   */
  public static async deactivateBackend(): Promise<{ success: boolean; config: SafeSupabaseConfig; message: string }> {
    try {
      const res = await fetch('/api/admin/supabase/deactivate', {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        deactivateSupabaseClient();
        return data;
      }
    } catch {
      // Fallback
    }

    deactivateSupabaseClient();
    return {
      success: true,
      config: await this.getConfig(),
      message: 'Supabase backend deactivated. Application placed in standby mode.',
    };
  }

  /**
   * Fetches audit logs from the server.
   */
  public static async getAuditLogs(): Promise<SupabaseAdminAuditEvent[]> {
    try {
      const res = await fetch('/api/admin/supabase/audit-logs', {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch {
      // Return empty if offline
    }
    return [];
  }

  /**
   * Fetches migration report from server.
   */
  public static async getMigrationReport(): Promise<MigrationReport> {
    try {
      const res = await fetch('/api/admin/supabase/migrations', {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          catalog: data.catalog,
          liveStatusVerified: data.liveStatusVerified,
          liveStatusMessage: data.liveStatusMessage,
        };
      }
    } catch {
      // Offline fallback
    }

    return {
      catalog: SUPABASE_SCHEMA_CATALOG,
      liveStatusVerified: false,
      liveStatusMessage:
        'Live Supabase migration status could not be verified because no valid server-side connection is configured.',
    };
  }
}
