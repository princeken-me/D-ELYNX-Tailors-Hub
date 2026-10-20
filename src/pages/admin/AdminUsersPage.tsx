import React, { useState, useEffect } from 'react';
import {
  Users,
  ArrowLeft,
  ShieldCheck,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  UserX,
  UserCheck,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { Badge } from '../../components/ui/Badge';
import { AdminGovernanceService, AdminUserRecord } from '../../services/admin.service';
import { UserRole } from '../../types/user';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminGovernanceService.getAdminUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionInProgress(userId);
    setFeedback(null);
    try {
      const res = await AdminGovernanceService.updateUserRole(userId, newRole);
      if (res.success) {
        setFeedback({ type: 'success', text: `User role successfully updated to ${newRole}.` });
        await loadUsers();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to update user role.' });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleStatus = async (user: AdminUserRecord) => {
    setActionInProgress(user.id);
    setFeedback(null);
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await AdminGovernanceService.updateUserStatus(user.id, newStatus);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `User account has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`,
        });
        await loadUsers();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to update user status.' });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div id="admin-users-page" className="space-y-8">
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
              Identity & Authorization Governance
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              User Management & Accounts
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Governs ecosystem identities, role clearance, verification states, and security access.
            </p>
          </div>

          <button
            onClick={loadUsers}
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
            placeholder="Search by name, email, or account ID..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="tailor">Tailor</option>
            <option value="designer">Designer</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950/50 font-serif text-[10px] uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">User Identity</th>
              <th className="px-5 py-3.5">Assigned Role</th>
              <th className="px-5 py-3.5">Contact / Location</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Joined</th>
              <th className="px-5 py-3.5 text-right">Governance Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                  Loading user records...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                  No user records match your search filter.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-4">
                    <div className="font-medium text-zinc-100 font-serif">
                      {u.full_name || 'Unnamed Account'}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">{u.email}</div>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      disabled={actionInProgress === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-[11px] text-amber-300 focus:outline-none focus:border-amber-400 font-serif capitalize"
                    >
                      <option value="customer">Customer</option>
                      <option value="tailor">Tailor</option>
                      <option value="designer">Designer</option>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="fabric_vendor">Fabric Vendor</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>

                  <td className="px-5 py-4 text-zinc-300">
                    <div>{u.country || u.city ? `${u.city || ''} ${u.country || ''}`.trim() : 'Unspecified'}</div>
                    {u.phone && <div className="text-[10px] text-zinc-500 font-mono">{u.phone}</div>}
                  </td>

                  <td className="px-5 py-4">
                    {u.status === 'suspended' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      disabled={actionInProgress === u.id}
                      onClick={() => handleToggleStatus(u)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-medium border transition ${
                        u.status === 'suspended'
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/40'
                          : 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/40'
                      }`}
                    >
                      {actionInProgress === u.id ? (
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      ) : u.status === 'suspended' ? (
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
