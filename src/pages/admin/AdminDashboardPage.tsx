import React, { useState, useEffect } from 'react';
import { Shield, Users, Store, Package, ShoppingBag, Database, ArrowUpRight, Activity, Settings, Key, Server, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { Badge } from '../../components/ui/Badge';
import { isSupabaseActive, isSupabaseConfigured, getSafePublicConfig } from '../../lib/supabase/client';
import { AdminGovernanceService, AdminEcosystemMetrics } from '../../services/admin.service';

export const AdminDashboardPage: React.FC = () => {
  const isLive = isSupabaseActive();
  const isConfig = isSupabaseConfigured;
  const publicCfg = getSafePublicConfig();

  const [metrics, setMetrics] = useState<AdminEcosystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await AdminGovernanceService.getPlatformMetrics();
      setMetrics(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div id="admin-dashboard-page" className="space-y-8">
      {/* Admin Header */}
      <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-serif tracking-widest text-amber-400 font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Unified Administration</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
            Control Center & Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Centralized platform oversight, front-end catalog editing, merchant vetting, and ecosystem governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            title="Refresh Metrics"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>System Status: Operational</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-serif">
            <span>Ecosystem Users</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 font-serif text-2xl font-bold text-zinc-100">
            {metrics ? `${metrics.totalUsers} Accounts` : '...'}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Across client & merchant roles</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-serif">
            <span>Verified Ateliers</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 font-serif text-2xl font-bold text-zinc-100">
            {metrics ? `${metrics.verifiedSellers} Maisons` : '...'}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {metrics ? `${metrics.totalSellers} total onboarded` : 'Vetting passed'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-serif">
            <span>Catalog Garments</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 font-serif text-2xl font-bold text-zinc-100">
            {metrics ? `${metrics.activeProducts} Active` : '...'}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {metrics ? `${metrics.totalProducts} total curated pieces` : 'In category tree'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-serif">
            <span>Marketplace Orders</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 font-serif text-2xl font-bold text-zinc-100">
            {metrics ? `${metrics.totalOrders} Orders` : '...'}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {metrics ? `${metrics.pendingOrders} in fulfillment` : 'Authoritative ledger'}
          </p>
        </div>
      </div>

      {/* Module Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          id="link-admin-users"
          className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group"
        >
          <div>
            <Users className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="font-serif text-sm font-semibold text-zinc-100 group-hover:text-amber-300">
              User Management
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Profiles, role assignments, verification flags, and suspension controls.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-300">
            <span>Inspect Users</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/sellers"
          id="link-admin-sellers"
          className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group"
        >
          <div>
            <Store className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="font-serif text-sm font-semibold text-zinc-100 group-hover:text-amber-300">
              Seller & Atelier Vetting
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Merchant KYC, business registration certificates, and artisan accreditation.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-300">
            <span>Inspect Sellers</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/products"
          id="link-admin-products"
          className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group"
        >
          <div>
            <Package className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="font-serif text-sm font-semibold text-zinc-100 group-hover:text-amber-300">
              Product Moderation
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Taxonomy classification, content review, and haute couture curation.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-300">
            <span>Inspect Products</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/orders"
          id="link-admin-orders"
          className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group"
        >
          <div>
            <ShoppingBag className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="font-serif text-sm font-semibold text-zinc-100 group-hover:text-amber-300">
              Order Governance & Audits
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Fulfillment oversight, status verification, and customer delivery auditing.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-300">
            <span>Inspect Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Backend & Supabase Infrastructure Management Section */}
      <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-serif uppercase tracking-widest text-[#D4AF37] font-semibold">
              Settings & Infrastructure
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold text-zinc-100">
            Supabase Backend Connection & Activation
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Configure project endpoints, manage masked service-role private credentials in server memory, run connection tests, and switch between authoritative live PostgreSQL and local standby mode.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : isConfig ? 'bg-blue-400' : 'bg-amber-400'}`} />
              <span>Status: {isLive ? 'ACTIVE (Live PostgreSQL)' : isConfig ? 'CONFIGURED (Standby)' : 'NOT CONFIGURED'}</span>
            </div>
            {publicCfg.projectUrl && (
              <span className="text-[11px] text-zinc-500 font-mono truncate max-w-[200px]">
                {publicCfg.projectUrl}
              </span>
            )}
          </div>
        </div>

        <Link
          to="/admin/settings/supabase"
          id="link-admin-supabase-settings"
          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-serif font-bold text-xs flex items-center gap-2 transition shrink-0"
        >
          <Settings className="w-4 h-4" />
          <span>Configure & Activate Supabase</span>
        </Link>
      </div>
    </div>
  );
};
