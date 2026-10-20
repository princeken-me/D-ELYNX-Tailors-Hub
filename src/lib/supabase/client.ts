import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safely resolve environment variables in both Vite browser bundles and Node test environments
const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : undefined;
const processEnv = typeof process !== 'undefined' && process.env ? (process.env as Record<string, string | undefined>) : undefined;

export const isProduction = Boolean(metaEnv?.PROD || processEnv?.NODE_ENV === 'production');
export const isDevelopment = !isProduction;

// Safe Public Storage Key (Stores ONLY Project URL, Anon Key, and Activation status - NEVER secrets)
const SAFE_PUBLIC_CONFIG_KEY = 'delynx_public_supabase_config';

export interface PublicSupabaseConfig {
  projectUrl: string;
  anonKey: string;
  activated: boolean;
  lastTestedAt?: string | null;
  status: 'not_configured' | 'configured' | 'active' | 'inactive' | 'error';
}

function loadSavedPublicConfig(): PublicSupabaseConfig {
  const envUrl = (metaEnv?.VITE_SUPABASE_URL || processEnv?.VITE_SUPABASE_URL || '').trim();
  const envAnonKey = (metaEnv?.VITE_SUPABASE_ANON_KEY || processEnv?.VITE_SUPABASE_ANON_KEY || '').trim();

  const isEnvValid = Boolean(
    envUrl &&
    envAnonKey &&
    envUrl !== 'https://your-project.supabase.co' &&
    envAnonKey !== 'your-anon-public-key'
  );

  if (typeof window === 'undefined') {
    return {
      projectUrl: isEnvValid ? envUrl : '',
      anonKey: isEnvValid ? envAnonKey : '',
      activated: isEnvValid,
      status: isEnvValid ? 'active' : 'not_configured',
    };
  }

  try {
    const raw = localStorage.getItem(SAFE_PUBLIC_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Strictly ignore if any malicious or secret fields were injected
      delete (parsed as any).service_role_key;
      delete (parsed as any).serviceRoleKey;
      delete (parsed as any).secret;

      return {
        projectUrl: parsed.projectUrl || (isEnvValid ? envUrl : ''),
        anonKey: parsed.anonKey || (isEnvValid ? envAnonKey : ''),
        activated: Boolean(parsed.activated),
        lastTestedAt: parsed.lastTestedAt || null,
        status: parsed.status || (parsed.activated ? 'active' : 'configured'),
      };
    }
  } catch {
    // Fallback to env
  }

  return {
    projectUrl: isEnvValid ? envUrl : '',
    anonKey: isEnvValid ? envAnonKey : '',
    activated: isEnvValid,
    status: isEnvValid ? 'active' : 'not_configured',
  };
}

let activePublicConfig: PublicSupabaseConfig = loadSavedPublicConfig();
let supabaseInstance: SupabaseClient | null = null;
const configListeners = new Set<(config: PublicSupabaseConfig) => void>();

export function checkIsSupabaseConfigured(): boolean {
  return Boolean(
    activePublicConfig.projectUrl &&
    activePublicConfig.anonKey &&
    activePublicConfig.projectUrl !== 'https://your-project.supabase.co' &&
    activePublicConfig.anonKey !== 'your-anon-public-key' &&
    activePublicConfig.projectUrl.trim() !== '' &&
    activePublicConfig.anonKey.trim() !== ''
  );
}

export let isSupabaseConfigured: boolean = checkIsSupabaseConfigured();

export function isSupabaseActive(): boolean {
  return isSupabaseConfigured && activePublicConfig.activated;
}

// Backwards compatibility export
export const isConfigured = isSupabaseConfigured;

export function getSupabase(): SupabaseClient | null {
  // If not configured or not activated, Supabase client is not available
  if (!isSupabaseActive()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(activePublicConfig.projectUrl, activePublicConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

export function getSafePublicConfig(): PublicSupabaseConfig {
  return { ...activePublicConfig };
}

/**
 * Configure Supabase dynamically from the Admin Dashboard.
 * GUARANTEE: Never receives or stores the service-role key.
 */
export function configureSupabaseClient(params: {
  projectUrl: string;
  anonKey: string;
  activated?: boolean;
  lastTestedAt?: string | null;
  status?: PublicSupabaseConfig['status'];
}) {
  activePublicConfig = {
    projectUrl: params.projectUrl.trim(),
    anonKey: params.anonKey.trim(),
    activated: params.activated !== undefined ? params.activated : activePublicConfig.activated,
    lastTestedAt: params.lastTestedAt !== undefined ? params.lastTestedAt : activePublicConfig.lastTestedAt,
    status: params.status || (params.activated ? 'active' : 'configured'),
  };

  isSupabaseConfigured = checkIsSupabaseConfigured();

  // Reset existing client instance so next call re-instantiates with updated credentials
  supabaseInstance = null;

  if (typeof window !== 'undefined') {
    try {
      // Save strictly public configuration
      localStorage.setItem(SAFE_PUBLIC_CONFIG_KEY, JSON.stringify({
        projectUrl: activePublicConfig.projectUrl,
        anonKey: activePublicConfig.anonKey,
        activated: activePublicConfig.activated,
        lastTestedAt: activePublicConfig.lastTestedAt,
        status: activePublicConfig.status,
      }));
    } catch {
      // Ignore storage errors
    }
  }

  // Notify listeners
  configListeners.forEach((listener) => {
    try {
      listener({ ...activePublicConfig });
    } catch (err) {
      console.error('Error in config listener:', err);
    }
  });
}

/**
 * Deactivates Supabase client.
 */
export function deactivateSupabaseClient() {
  configureSupabaseClient({
    projectUrl: activePublicConfig.projectUrl,
    anonKey: activePublicConfig.anonKey,
    activated: false,
    status: 'inactive',
  });
}

/**
 * Subscribe to configuration changes.
 */
export function subscribeToSupabaseConfig(listener: (config: PublicSupabaseConfig) => void) {
  configListeners.add(listener);
  return () => {
    configListeners.delete(listener);
  };
}

// Default export instance (null if not activated)
export const supabase = getSupabase();
