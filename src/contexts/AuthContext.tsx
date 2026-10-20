import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured, isProduction, isDevelopment } from '../lib/supabase/client';
import { AuthService, SignInParams, SignUpParams } from '../services/auth.service';
import { ProfessionalRole, UserProfile } from '../types/user';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isProduction: boolean;
  configurationError: string | null;
  signIn: (params: SignInParams) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setDemoProfile: (role: ProfessionalRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default mock guest / prototype profile for DEVELOPMENT ONLY
const createDevMockProfile = (role: ProfessionalRole): UserProfile => ({
  id: 'usr_demo_8829',
  auth_user_id: 'usr_demo_8829',
  email: 'director@d-elynx.fashion',
  display_name: 'Alexandre Laurent [Dev Preview]',
  professional_role: role,
  country: 'FRA',
  city: 'Paris',
  bio: 'Master tailor and bespoke atelier founder. Development prototype identity.',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();

    if (!isSupabaseConfigured || !supabase) {
      // Provide prototype sandbox identity for preview and UI exploration
      const savedRole = (localStorage.getItem('delynx_demo_role') as ProfessionalRole) || 'designer';
      setProfile(createDevMockProfile(savedRole));
      setIsLoading(false);
      return;
    }

    // Supabase is configured: load real active session from PostgreSQL auth
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const userProfile = await AuthService.getProfile(initialSession.user.id);
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('Error initializing Supabase session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const userProfile = await AuthService.getProfile(newSession.user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (params: SignInParams) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Prototype sign in with requested or default role
        const demoRole: ProfessionalRole = 'tailor';
        setProfile(createDevMockProfile(demoRole));
        return;
      }
      await AuthService.signIn(params);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: SignUpParams) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setProfile(createDevMockProfile(params.role));
        return;
      }
      await AuthService.signUp(params);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await AuthService.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);

    // PWA & Session Invalidation: Purge authenticated caches and sensitive session items
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          if (key.includes('api') || key.includes('user') || key.includes('account')) {
            await caches.delete(key);
          }
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('delynx_demo_role');
        sessionStorage.clear();
      }
    } catch (err) {
      console.warn('Session cache cleanup warning:', err);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return;
    }
    await AuthService.resetPassword(email);
  };

  const setDemoProfile = (role: ProfessionalRole) => {
    if (isProduction) {
      console.warn('Demo profile switching is disabled in production mode.');
      return;
    }
    localStorage.setItem('delynx_demo_role', role);
    setProfile(createDevMockProfile(role));
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (profile) {
      if (isSupabaseConfigured && profile.id !== 'usr_demo_8829') {
        const updated = await AuthService.updateProfile(profile.id, updates);
        setProfile(updated);
      } else {
        if (isProduction) {
          throw new Error('Cannot update profile: Supabase backend is not configured in production.');
        }
        setProfile({ ...profile, ...updates, updated_at: new Date().toISOString() });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        isProduction,
        configurationError,
        signIn,
        signUp,
        signOut,
        resetPassword,
        setDemoProfile,
        updateProfile,
        updateCurrentProfile: updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
