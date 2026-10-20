import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Clock,
  Check,
} from 'lucide-react';
import { Link, useRouter } from '../../lib/router/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { validatePasswordStrength } from '../../lib/security/validation';

export const SecuritySettingsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordStrength = validatePasswordStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return { label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { label: 'None', color: 'bg-zinc-800' };
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (!passwordStrength.isValid) {
      setErrorMessage(passwordStrength.errors[0] || 'Password does not meet security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          setErrorMessage(error.message || 'Failed to update password.');
          return;
        }
      }

      setSuccessMessage('Your password has been changed successfully. You can now use your new credentials to sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecureLogout = async () => {
    await logout();
    navigate('/login');
  };

  const strengthInfo = getStrengthLabel(passwordStrength.score);

  return (
    <div id="customer-security-page" className="space-y-8 pb-12 max-w-3xl">
      {/* Header & Back Link */}
      <div>
        <Link
          to="/account"
          id="btn-back-to-account-security"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </Link>

        <div className="border-b border-zinc-800/80 pb-6">
          <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
            Security & Authentication
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
            Security Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your credentials, password protections, and active account sessions.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          id="security-success-banner"
          className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          id="security-error-banner"
          className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Change Password Card */}
      <form onSubmit={handlePasswordChange} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-zinc-100">
                Change Password
              </h3>
              <p className="text-[11px] text-zinc-400">
                Ensure your account is secured with a strong, distinct password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPasswords ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium block">
              Current Password (Optional)
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium block">
              New Password <span className="text-rose-400">*</span>
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              placeholder="At least 8 characters, with letters & numbers"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />

            {/* Password strength meter */}
            {newPassword && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Password Strength</span>
                  <span className="font-semibold text-zinc-300">{strengthInfo.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`rounded-full transition-colors ${
                        step <= passwordStrength.score ? strengthInfo.color : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.errors.length > 0 && (
                  <p className="text-[10px] text-amber-400/90 leading-tight">
                    {passwordStrength.errors[0]}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium block">
              Confirm New Password <span className="text-rose-400">*</span>
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !newPassword}
            id="btn-update-password"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </form>

      {/* Session & Account Security Information */}
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
        <h3 className="font-serif text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Account Security Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[11px] text-zinc-500 block">Account Role</span>
            <span className="font-semibold text-zinc-200 capitalize flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile?.role || 'Customer'}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[11px] text-zinc-500 block">Account Status</span>
            <span className="font-semibold text-emerald-400 capitalize flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{profile?.account_status || 'Active & Verified'}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[11px] text-zinc-500 block">Registered Email</span>
            <span className="font-semibold text-zinc-200 font-mono text-[11px] truncate block">
              {user?.email || profile?.email || 'customer@example.com'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[11px] text-zinc-500 block">Session State</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Active Session Authenticated</span>
            </span>
          </div>
        </div>
      </div>

      {/* Secure Logout Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-serif text-sm font-semibold text-zinc-200">
            Sign Out of Account
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Terminates your active session and clears cached client state securely.
          </p>
        </div>

        <button
          onClick={handleSecureLogout}
          id="btn-secure-logout"
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/60 text-zinc-300 hover:text-rose-300 text-xs font-semibold transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Secure Sign Out</span>
        </button>
      </div>
    </div>
  );
};
