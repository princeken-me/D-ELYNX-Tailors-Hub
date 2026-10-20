import React, { useState, useEffect } from 'react';
import {
  Store,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { Badge } from '../../components/ui/Badge';
import { AdminGovernanceService, AdminSellerRecord } from '../../services/admin.service';

export const AdminSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<AdminSellerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const data = await AdminGovernanceService.getAdminSellers();
      setSellers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleVerificationChange = async (
    sellerId: string,
    newStatus: 'unverified' | 'pending' | 'verified' | 'rejected'
  ) => {
    setActionInProgress(sellerId);
    setFeedback(null);
    try {
      const res = await AdminGovernanceService.updateSellerVerification(sellerId, newStatus);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Atelier verification status successfully set to '${newStatus}'.`,
        });
        await loadSellers();
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Failed to update verification status.',
        });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStatusChange = async (sellerId: string, newStatus: 'active' | 'suspended') => {
    setActionInProgress(sellerId);
    setFeedback(null);
    try {
      const res = await AdminGovernanceService.updateSellerStatus(sellerId, newStatus);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Atelier operational state set to '${newStatus}'.`,
        });
        await loadSellers();
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Failed to update atelier status.',
        });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredSellers = sellers.filter((s) => {
    const matchesSearch =
      (s.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.country || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || s.verification_status === statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="admin-sellers-page" className="space-y-8">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Hub</span>
        </Link>

        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
              Merchant & Atelier Vetting
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Seller & Maison Verification
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Validate merchant credentials, artisan accreditation, and atelier operating standing.
            </p>
          </div>

          <button
            onClick={loadSellers}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ateliers by name, city, or country..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified Maisons</option>
            <option value="pending">Pending Vetting</option>
            <option value="unverified">Unverified</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950/50 font-serif text-[10px] uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">Maison / Business</th>
              <th className="px-5 py-3.5">Craft & Heritage</th>
              <th className="px-5 py-3.5">Location</th>
              <th className="px-5 py-3.5">Verification</th>
              <th className="px-5 py-3.5">Store State</th>
              <th className="px-5 py-3.5 text-right">Governance Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                  Loading atelier directory...
                </td>
              </tr>
            ) : filteredSellers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                  No ateliers found matching criteria.
                </td>
              </tr>
            ) : (
              filteredSellers.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-4">
                    <div className="font-medium text-zinc-100 font-serif text-sm">{s.business_name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">ID: {s.id}</div>
                    {s.contact_phone && (
                      <div className="text-[11px] text-zinc-400 mt-0.5">{s.contact_phone}</div>
                    )}
                  </td>

                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-[11px] text-zinc-300 line-clamp-2">
                      {s.business_description || 'No description provided.'}
                    </p>
                    {s.specialty_tags && s.specialty_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.specialty_tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-amber-300 font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-zinc-300">
                    <div>{s.city ? `${s.city}, ${s.country}` : s.country}</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">
                      ★ {s.rating ? s.rating.toFixed(1) : '5.0'} ({s.rating_count || 0})
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={s.verification_status}
                      disabled={actionInProgress === s.id}
                      onChange={(e) =>
                        handleVerificationChange(
                          s.id,
                          e.target.value as 'unverified' | 'pending' | 'verified' | 'rejected'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-[11px] text-amber-300 focus:outline-none focus:border-amber-400 font-serif"
                    >
                      <option value="verified">Verified Maison</option>
                      <option value="pending">Pending Vetting</option>
                      <option value="unverified">Unverified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>

                  <td className="px-5 py-4">
                    {s.status === 'suspended' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      disabled={actionInProgress === s.id}
                      onClick={() =>
                        handleStatusChange(s.id, s.status === 'suspended' ? 'active' : 'suspended')
                      }
                      className={`px-3 py-1 rounded-lg text-[11px] font-medium border transition ${
                        s.status === 'suspended'
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/40'
                          : 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/40'
                      }`}
                    >
                      {actionInProgress === s.id ? (
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      ) : s.status === 'suspended' ? (
                        'Reactivate'
                      ) : (
                        'Suspend'
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
