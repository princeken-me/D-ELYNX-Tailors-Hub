import React, { useState } from 'react';
import { useRouter, Link } from '../../lib/router/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getSafeRedirectUrl } from '../../lib/security/validation';

export const SignInPage: React.FC = () => {
  const { signIn, resetPassword, isConfigured } = useAuth();
  const { navigate, query } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const destination = getSafeRedirectUrl(query.get('redirect'), '/account');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await signIn({ email, password });
      navigate(destination);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setErrorMsg('Please provide your account email address to receive reset instructions.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-14">
      <div className="rounded-3xl border border-[#27272A] bg-[#121215]/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#D4AF37]/40 flex items-center justify-center mx-auto p-2">
            <img src="/icon.svg" alt="D-ELYNX" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-100 uppercase">
            Sign In to D-ELYNX
          </h1>
          <p className="text-xs text-zinc-400">
            Access your atelier, orders, and fashion ecosystem permissions.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {resetSent && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200">
            Password reset instructions dispatched to {email}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-serif uppercase tracking-wider text-zinc-300 block font-semibold">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-signin-email"
                type="email"
                required
                placeholder="tailor@atelier.fashion"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]/60 min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-serif uppercase tracking-wider text-zinc-300 font-semibold">
                Password
              </label>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-[11px] text-[#D4AF37] hover:text-amber-300 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-signin-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]/60 min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            id="btn-signin-submit"
            type="submit"
            size="lg"
            isLoading={loading}
            className="w-full mt-2"
          >
            Access Ecosystem
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#27272A] text-center text-xs text-zinc-400">
          New to D-ELYNX?{' '}
          <Link to="/signup" id="link-goto-signup" className="text-[#D4AF37] hover:text-amber-300 font-semibold">
            Create an Account
          </Link>
        </div>

        {!isConfigured && (
          <div className="mt-4 p-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-[11px] text-zinc-500 text-center">
            Supabase Auth active in architecture preview mode. You can sign in with credentials to inspect the dashboard.
          </div>
        )}
      </div>
    </div>
  );
};
