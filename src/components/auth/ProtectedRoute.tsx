import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, Link } from '../../lib/router/RouterContext';
import { ProfessionalRole } from '../../types/user';
import { ShieldAlert, Lock, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ProfessionalRole[];
  requireAuth?: boolean;
  clearanceName?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
  clearanceName = 'Ecosystem Access',
}) => {
  const { user, profile, isLoading, isConfigured } = useAuth();
  const { path } = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span className="font-serif text-xs uppercase tracking-widest text-zinc-400">
            Verifying Identity Credentials...
          </span>
        </div>
      </div>
    );
  }

  // 1. Authentication Check
  // In Supabase mode, check user. In prototype mode, profile is provided.
  const isAuthenticated = Boolean(user || profile);
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[10px] font-serif uppercase tracking-widest text-amber-400 font-semibold">
            Authentication Required
          </span>
          <h2 className="font-serif text-2xl font-bold text-zinc-100 mt-1">
            Restricted Sartorial Area
          </h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            You must be signed in with valid credentials to access the <strong>{clearanceName}</strong> module.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link to={`/signin?redirect=${encodeURIComponent(path)}`}>
            <Button className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Sign In to Your Account
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="ghost" className="w-full text-xs text-zinc-400">
              Return to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Account Status Check (Suspended/Deactivated)
  if (profile && (profile.status === 'suspended' || profile.status === 'deactivated')) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl border border-red-500/30 bg-red-950/20 backdrop-blur-xl text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[10px] font-serif uppercase tracking-widest text-red-400 font-semibold">
            Account Status: {profile.status.toUpperCase()}
          </span>
          <h2 className="font-serif text-2xl font-bold text-zinc-100 mt-1">
            Access Suspended
          </h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Your fashion ecosystem profile is currently marked as <strong>{profile.status}</strong>. Please contact compliance arbitration or platform governance for review.
          </p>
        </div>

        <Link to="/marketplace">
          <Button variant="secondary" className="w-full">
            Return to Public Catalog
          </Button>
        </Link>
      </div>
    );
  }

  // 3. Role Authorization Clearance
  if (allowedRoles && profile) {
    const hasRole = allowedRoles.includes(profile.professional_role);
    if (!hasRole) {
      return (
        <div className="max-w-lg mx-auto my-12 p-8 rounded-3xl border border-amber-500/20 bg-zinc-900/60 backdrop-blur-xl text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[10px] font-serif uppercase tracking-widest text-amber-400 font-semibold">
              Insufficient Role Clearance
            </span>
            <h2 className="font-serif text-2xl font-bold text-zinc-100 mt-1">
              Access Restricted
            </h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Your active identity is <strong>{profile.professional_role.replace('_', ' ').toUpperCase()}</strong>.
              Access to this view requires one of the following accredited clearances:
            </p>

            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {allowedRoles.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider bg-zinc-800 text-amber-400 border border-zinc-700/60"
                >
                  {r.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-left text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Preview Role Switching</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              You can switch your active identity using the <strong>Role Selector</strong> in the top header to inspect the system under different professional clearances.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link to="/marketplace">
              <Button variant="secondary" size="sm">
                Marketplace
              </Button>
            </Link>
            <Link to="/account">
              <Button size="sm">
                Return to Account
              </Button>
            </Link>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
