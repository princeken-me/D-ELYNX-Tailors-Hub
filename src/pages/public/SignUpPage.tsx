import React, { useState } from 'react';
import { useRouter, Link } from '../../lib/router/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { ProfessionalRole } from '../../types/user';
import { User, Mail, Lock, ShieldCheck, AlertCircle, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { validatePasswordStrength } from '../../lib/security/validation';

const ROLE_OPTIONS: { id: string; role: ProfessionalRole; label: string; note: string }[] = [
  { id: 'buyer', role: 'customer', label: 'Buyer', note: 'Commission bespoke pieces and purchase curated designer collections' },
  { id: 'tailor', role: 'tailor', label: 'Tailor', note: 'Accept tailoring commissions, bespoke fittings, and alteration bookings' },
  { id: 'designer', role: 'designer', label: 'Designer', note: 'Publish lookbooks, runway capsules, and digital pattern specs' },
  { id: 'manufacturer', role: 'manufacturer', label: 'Manufacturer', note: 'Supply textiles, CMT manufacturing runs, and high-volume production' },
  { id: 'retailer', role: 'buyer_retailer', label: 'Retailer', note: 'Curate boutique inventory, wholesale procurement, and retail accounts' },
  { id: 'student', role: 'customer', label: 'Student', note: 'Access learning academy tracks, master guild mentorship, and pattern study' },
];

export const SignUpPage: React.FC = () => {
  const { signUp } = useAuth();
  const { navigate } = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('buyer');
  const [role, setRole] = useState<ProfessionalRole>('customer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const passwordEvaluation = validatePasswordStrength(password);

  const handleRoleSelect = (option: typeof ROLE_OPTIONS[0]) => {
    setSelectedRoleId(option.id);
    setRole(option.role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passwordEvaluation.isValid) {
      setErrorMsg(passwordEvaluation.errors[0]);
      return;
    }

    setLoading(true);
    try {
      await signUp({
        displayName,
        email,
        password,
        role,
      });
      navigate('/account');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12">
      <div className="rounded-3xl border border-[#27272A] bg-[#121215]/80 p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
        <div className="text-center space-y-2 mb-8">
          <span className="text-[10px] font-serif uppercase tracking-widest text-[#D4AF37] font-semibold">
            Join The Fashion Ecosystem
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 uppercase">
            Create Your D-ELYNX Account
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Establish your identity within the global luxury fashion infrastructure.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-serif uppercase tracking-wider text-zinc-300 block font-semibold">
              Full Name or Atelier Brand
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-signup-name"
                type="text"
                required
                placeholder="Lord Henri de Valmont"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]/60 min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-serif uppercase tracking-wider text-zinc-300 block font-semibold">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-signup-email"
                type="email"
                required
                placeholder="valmont@couture.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]/60 min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-serif uppercase tracking-wider text-zinc-300 block font-semibold">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Minimum 8 characters with mix of uppercase and numbers"
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

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="pt-1.5 space-y-1.5">
                <div className="flex gap-1 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordEvaluation.score <= 1
                        ? 'w-1/4 bg-red-500'
                        : passwordEvaluation.score === 2
                        ? 'w-2/4 bg-amber-500'
                        : passwordEvaluation.score === 3
                        ? 'w-3/4 bg-yellow-400'
                        : 'w-full bg-emerald-400'
                    }`}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400">
                  <span className={password.length >= 8 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                    ✓ 8+ chars
                  </span>
                  <span className={/[A-Z]/.test(password) ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                    ✓ Uppercase
                  </span>
                  <span className={/[a-z]/.test(password) ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                    ✓ Lowercase
                  </span>
                  <span className={/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password) ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                    ✓ Number or symbol
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Professional Role Selection: Buyer, Tailor, Designer, Manufacturer, Retailer, Student */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-serif uppercase tracking-wider text-zinc-300 block font-semibold">
              Select Ecosystem Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  id={`role-option-${opt.id}`}
                  onClick={() => handleRoleSelect(opt)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer min-h-[64px] ${
                    selectedRoleId === opt.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-amber-300 ring-1 ring-[#D4AF37]/50'
                      : 'border-[#27272A] bg-[#09090B] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-xs font-bold block font-serif text-zinc-100">{opt.label}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 leading-snug">{opt.note}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            id="btn-signup-submit"
            type="submit"
            size="lg"
            isLoading={loading}
            className="w-full mt-4"
          >
            Create Professional Profile
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#27272A] text-center text-xs text-zinc-400">
          Already registered?{' '}
          <Link to="/signin" id="link-goto-signin" className="text-[#D4AF37] hover:text-amber-300 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
