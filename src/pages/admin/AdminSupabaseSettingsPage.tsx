import React, { useState, useEffect } from 'react';
import {
  Database,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
  Power,
  PowerOff,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Layers,
  Lock,
  EyeOff,
  Eye,
  FileCode,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  SupabaseAdminClientService,
  MigrationReport,
} from '../../services/supabase-admin.service';
import { SafeSupabaseConfig, ConnectionTestResult, SupabaseAdminAuditEvent } from '../../server/supabase-admin-service';

export const AdminSupabaseSettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SafeSupabaseConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);

  // Form fields
  const [projectUrl, setProjectUrl] = useState<string>('');
  const [anonKey, setAnonKey] = useState<string>('');
  const [serviceRoleKey, setServiceRoleKey] = useState<string>('');
  const [isReplacingSecret, setIsReplacingSecret] = useState<boolean>(false);
  const [showAnonKey, setShowAnonKey] = useState<boolean>(false);

  // Status & Feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [migrationReport, setMigrationReport] = useState<MigrationReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<SupabaseAdminAuditEvent[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cfg, report, logs] = await Promise.all([
        SupabaseAdminClientService.getConfig(),
        SupabaseAdminClientService.getMigrationReport(),
        SupabaseAdminClientService.getAuditLogs(),
      ]);

      setConfig(cfg);
      setProjectUrl(cfg.projectUrl || '');
      setAnonKey(cfg.anonKey || '');
      setMigrationReport(report);
      setAuditLogs(logs);

      // If secret key already exists on server, start in masked mode
      if (cfg.hasServiceRoleKey) {
        setIsReplacingSecret(false);
      } else {
        setIsReplacingSecret(true);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Failed to load Supabase configuration. Please refresh.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const payload: { projectUrl: string; anonKey: string; serviceRoleKey?: string } = {
        projectUrl,
        anonKey,
      };

      // Only send service role key if replacing and non-empty
      if (isReplacingSecret && serviceRoleKey.trim() !== '') {
        payload.serviceRoleKey = serviceRoleKey.trim();
      }

      const updated = await SupabaseAdminClientService.saveConfig(payload);
      setConfig(updated);

      // CRITICAL: Immediately wipe the plaintext secret key from React component state
      setServiceRoleKey('');
      if (updated.hasServiceRoleKey) {
        setIsReplacingSecret(false);
      }

      setFeedback({
        type: 'success',
        message: 'Supabase configuration saved securely. Credentials verified.',
      });

      // Refresh logs
      const logs = await SupabaseAdminClientService.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to save configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFeedback(null);
    setTestResult(null);

    try {
      const payload: { projectUrl?: string; anonKey?: string; serviceRoleKey?: string } = {
        projectUrl: projectUrl.trim() || undefined,
        anonKey: anonKey.trim() || undefined,
      };

      if (isReplacingSecret && serviceRoleKey.trim() !== '') {
        payload.serviceRoleKey = serviceRoleKey.trim();
      }

      const result = await SupabaseAdminClientService.testConnection(payload);
      setTestResult(result);

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message,
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.message,
        });
      }

      // Re-sync config and report
      const [updatedConfig, report, logs] = await Promise.all([
        SupabaseAdminClientService.getConfig(),
        SupabaseAdminClientService.getMigrationReport(),
        SupabaseAdminClientService.getAuditLogs(),
      ]);
      setConfig(updatedConfig);
      setMigrationReport(report);
      setAuditLogs(logs);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Supabase connection failed. Check the configuration.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    setFeedback(null);

    try {
      const res = await SupabaseAdminClientService.activateBackend();
      if (res.success) {
        setConfig(res.config);
        setFeedback({
          type: 'success',
          message: res.message,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message,
        });
      }

      const [report, logs] = await Promise.all([
        SupabaseAdminClientService.getMigrationReport(),
        SupabaseAdminClientService.getAuditLogs(),
      ]);
      setMigrationReport(report);
      setAuditLogs(logs);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to activate backend.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivate = async () => {
    setIsActivating(true);
    setFeedback(null);

    try {
      const res = await SupabaseAdminClientService.deactivateBackend();
      setConfig(res.config);
      setFeedback({
        type: 'info',
        message: res.message,
      });

      const [report, logs] = await Promise.all([
        SupabaseAdminClientService.getMigrationReport(),
        SupabaseAdminClientService.getAuditLogs(),
      ]);
      setMigrationReport(report);
      setAuditLogs(logs);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to deactivate backend.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const getStatusBadge = () => {
    if (!config) return <Badge variant="neutral">LOADING</Badge>;

    if (config.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE
        </span>
      );
    }
    if (config.status === 'test_passed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          CONNECTION TEST PASSED
        </span>
      );
    }
    if (config.status === 'configured') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          <Server className="w-3.5 h-3.5" />
          CONFIGURED (STANDBY)
        </span>
      );
    }
    if (config.status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          CONNECTION ERROR
        </span>
      );
    }
    if (config.status === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
          <PowerOff className="w-3.5 h-3.5" />
          INACTIVE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5" />
        NOT CONFIGURED
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link to="/admin" className="hover:text-amber-400 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Admin Dashboard</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span>Settings</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span>Backend</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-amber-400 font-medium">Supabase Connection</span>
      </div>

      {/* Main Header */}
      <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-serif tracking-widest text-amber-400 font-semibold">
            <Database className="w-4 h-4 text-[#D4AF37]" />
            <span>Infrastructure & Backend Governance</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
            Supabase Connection & Activation
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Configure project endpoints, test server reachability, manage protected service-role authority, and activate the authoritative PostgreSQL backend for the global tailoring marketplace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />}
          {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />}
          {feedback.type === 'info' && <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />}
          <div className="flex-1">
            <span className="font-semibold block font-serif">
              {feedback.type === 'success' ? 'Operation Completed' : feedback.type === 'error' ? 'Connection Error' : 'System Notice'}
            </span>
            <p className="mt-0.5">{feedback.message}</p>
          </div>
        </div>
      )}

      {/* Backend Status Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-serif">
            <span>Backend Status</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-xl font-bold font-serif text-zinc-100">
            {config?.activated ? 'ACTIVE' : config?.configured ? 'STANDBY' : 'NOT CONFIGURED'}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {config?.activated ? 'Authoritative PostgreSQL live' : 'Offline / Dev Prototype'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-serif">
            <span>Supabase Project</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-sm font-mono font-semibold text-zinc-200 truncate">
            {config?.projectUrl ? new URL(config.projectUrl).hostname : 'None Configured'}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {config?.configured ? 'Public API endpoint bound' : 'Awaiting credentials'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-serif">
            <span>Auth & Service Role</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-sm font-serif font-bold text-zinc-100">
            {config?.hasServiceRoleKey ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Service-Role Stored
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Anon Key Only
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {config?.hasServiceRoleKey ? 'Protected in server runtime' : 'Optional administrative key'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-serif">
            <span>Last Connection Test</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-sm font-medium text-zinc-200">
            {config?.lastTestedAt
              ? new Date(config.lastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Never Run'}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {config?.lastTestStatus === 'passed' ? '✓ Probe verified' : config?.lastTestStatus === 'failed' ? '✕ Test failed' : 'Pending verification'}
          </p>
        </div>
      </div>

      {/* Main Connection Form & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-widest text-[#D4AF37] font-semibold">
                  Backend Credentials
                </span>
                <h3 className="font-serif text-lg font-bold text-zinc-100 mt-0.5">
                  Supabase Connection Settings
                </h3>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                REST & AUTH v1
              </Badge>
            </div>

            {/* Project URL */}
            <div className="space-y-2">
              <label className="block text-xs font-serif font-semibold text-zinc-300">
                Supabase Project URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                required
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/80 font-mono transition"
              />
              <p className="text-[11px] text-zinc-500">
                Found in your Supabase Dashboard under <strong>Project Settings → API → Project URL</strong>.
              </p>
            </div>

            {/* Publishable / Anon Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-serif font-semibold text-zinc-300">
                  Publishable / Anon Public Key <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                >
                  {showAnonKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showAnonKey ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>
              <input
                type={showAnonKey ? 'text' : 'password'}
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJh..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/80 font-mono transition"
              />
              <p className="text-[11px] text-zinc-500">
                Public client key adhering to database Row-Level Security. Found in <strong>Project Settings → API → Project API Keys (anon public)</strong>.
              </p>
            </div>

            {/* Secret / Service-Role Key */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-xs font-serif font-semibold text-zinc-200">
                    Secret / Service-Role Private Key (Server-Side Only)
                  </label>
                </div>
                {config?.hasServiceRoleKey && !isReplacingSecret && (
                  <button
                    type="button"
                    onClick={() => setIsReplacingSecret(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition"
                  >
                    Replace Secret Key
                  </button>
                )}
              </div>

              {config?.hasServiceRoleKey && !isReplacingSecret ? (
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-zinc-300 font-mono">
                    <span className="text-emerald-400">●</span>
                    <span>••••••••••••••••••••••••••••••••••••••••</span>
                    <span className="text-[10px] text-zinc-500 font-sans">(Protected in Server Memory)</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReplacingSecret(true)}
                    className="text-xs py-1"
                  >
                    Replace
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={serviceRoleKey}
                    onChange={(e) => setServiceRoleKey(e.target.value)}
                    placeholder="Enter new service-role secret key (eyJh...)"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/80 font-mono transition"
                  />
                  {config?.hasServiceRoleKey && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Leave blank to retain current server-stored secret key.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsReplacingSecret(false);
                          setServiceRoleKey('');
                        }}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        Cancel replacement
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Zero-Exposure Architecture Notice */}
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left flex items-start gap-2.5 text-xs text-amber-300/90">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Critical Zero-Exposure Guarantee:</strong> The service-role key bypasses RLS and is handled exclusively by server-side infrastructure. It is <strong>never stored in the browser</strong>, never returned in API payloads, never saved to localStorage, and never logged.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#D4AF37] hover:bg-[#c59b27] text-zinc-950 font-bold text-xs"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />}
                  className="text-xs"
                >
                  {isTesting ? 'Testing Connection...' : 'Test Connection'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {config?.activated ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isActivating}
                    onClick={handleDeactivate}
                    leftIcon={<PowerOff className="w-3.5 h-3.5 text-rose-400" />}
                    className="text-xs text-rose-300 hover:text-rose-200 border-rose-500/30 hover:bg-rose-500/10"
                  >
                    {isActivating ? 'Deactivating...' : 'Deactivate Supabase'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isActivating || !config?.configured}
                    onClick={handleActivate}
                    leftIcon={<Power className="w-3.5 h-3.5 text-emerald-400" />}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    {isActivating ? 'Activating...' : 'Activate Supabase'}
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Test Connection Diagnostics Panel */}
          {testResult && (
            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h4 className="font-serif text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span>Connection Diagnostics Result</span>
                </h4>
                {testResult.latencyMs !== undefined && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                    Latency: {testResult.latencyMs} ms
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                {testResult.message}
              </p>

              {testResult.endpoints && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-serif text-zinc-500 block">Database REST API</span>
                    <span className={`text-xs font-mono font-bold mt-1 block ${testResult.endpoints.rest ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {testResult.endpoints.rest ? 'RESPONDING (200)' : 'FAILED'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-serif text-zinc-500 block">GoTrue Auth API</span>
                    <span className={`text-xs font-mono font-bold mt-1 block ${testResult.endpoints.auth ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {testResult.endpoints.auth ? 'RESPONDING (200)' : 'FAILED'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-serif text-zinc-500 block">Service-Role Authority</span>
                    <span className={`text-xs font-mono font-bold mt-1 block ${testResult.endpoints.serviceRoleVerified ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {testResult.endpoints.serviceRoleVerified ? 'VERIFIED' : 'NOT CONFIGURED'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Security Architecture, Migrations & Audit */}
        <div className="space-y-6">
          {/* Migration Status Card */}
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-serif text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>Migration Catalog Status</span>
              </h4>
              <Badge variant="outline" className="text-[10px]">
                v1.3.0
              </Badge>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              PostgreSQL schema migrations registered for the D-ELYNX platform:
            </p>

            <div className="space-y-2">
              {migrationReport?.catalog.migrations.map((m, idx) => (
                <div key={m} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-300 truncate max-w-[200px]">
                    <span className="text-amber-400 font-bold">{idx + 1}.</span>
                    <span className="truncate">{m}</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Source Verified
                  </span>
                </div>
              ))}
            </div>

            {/* Live Verification Notice */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <span className="text-[10px] uppercase font-serif tracking-wider text-amber-400/90 font-semibold block">
                Live Verification Audit:
              </span>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                {migrationReport?.liveStatusMessage ||
                  'Live Supabase migration status could not be verified because no valid server-side connection is configured.'}
              </p>
            </div>
          </div>

          {/* Audit Logging Card */}
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-serif text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Admin Audit Log</span>
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">Zero-Secret Log</span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                No administrative events recorded yet in this session.
              </p>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-amber-400 font-semibold">{log.action}</span>
                      <span className="text-zinc-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{log.actor}</span>
                      {log.details.projectUrlHost && (
                        <span className="text-zinc-500 font-mono truncate max-w-[120px]">
                          {log.details.projectUrlHost}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Architecture Reference */}
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <h4 className="font-serif text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              <span>Architectural Boundaries</span>
            </h4>
            <ul className="text-[11px] text-zinc-400 space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong>Public Anon Key:</strong> Transmitted to the browser client and enforces strict Row-Level Security (RLS) on all 15 database tables.
              </li>
              <li>
                <strong>Service-Role Key:</strong> Retained exclusively in server-side Node.js memory. Bypasses RLS and is used only for automated escrow arbitration and webhook verification.
              </li>
              <li>
                <strong>Production Safety:</strong> When deactivated, production operations fail safely rather than silently substituting development mock data.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
