import { getSupabase } from '../lib/supabase/client';
import { ProfessionalRole, UserProfile } from '../types/user';
import {
  ALLOWED_REGISTRATION_ROLES,
  validatePasswordStrength,
  sanitizeEmail,
  sanitizeInput,
} from '../lib/security/validation';

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
  role: ProfessionalRole;
}

export interface SignInParams {
  email: string;
  password: string;
}

// Client-side rate-limiting / brute-force protection tracking
let failedAttempts = 0;
let lockoutUntil = 0;

export class AuthService {
  /**
   * Check if client is temporarily throttled due to multiple failed sign-in attempts
   */
  private static checkRateLimit() {
    const now = Date.now();
    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      throw new Error(
        `Too many failed authentication attempts. Access locked for ${remainingSeconds}s for your protection.`
      );
    }
  }

  private static recordFailure() {
    failedAttempts += 1;
    if (failedAttempts >= 5) {
      // Lock for 60 seconds after 5 consecutive failures
      lockoutUntil = Date.now() + 60000;
      failedAttempts = 0;
    }
  }

  private static recordSuccess() {
    failedAttempts = 0;
    lockoutUntil = 0;
  }

  /**
   * Sign up a new user with hardened validation and role whitelist
   */
  static async signUp({ email, password, displayName, role }: SignUpParams) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
      );
    }

    const cleanEmail = sanitizeEmail(email);
    const cleanName = sanitizeInput(displayName);

    // Enforce production password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0]);
    }

    // Role elevation guard: Disallow self-registration for administrative/moderation roles
    const safeRole: ProfessionalRole = ALLOWED_REGISTRATION_ROLES.includes(role)
      ? role
      : 'customer';

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          display_name: cleanName || cleanEmail.split('@')[0],
          professional_role: safeRole,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in an existing user with rate limiting and sanitized inputs
   */
  static async signIn({ email, password }: SignInParams) {
    this.checkRateLimit();

    const supabase = getSupabase();
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
      );
    }

    const cleanEmail = sanitizeEmail(email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      this.recordFailure();
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    this.recordSuccess();
    return data;
  }

  /**
   * Sign out current user and clear sensitive state
   */
  static async signOut() {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out cleanup warning:', err);
    }
  }

  /**
   * Request password reset email (with generic safe response to prevent email enumeration)
   */
  static async resetPassword(email: string) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const cleanEmail = sanitizeEmail(email);

    // Supabase reset password
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/signin`,
    });

    if (error) {
      console.warn('Password reset request error:', error.message);
      // Still return normally or with non-disclosing error to avoid user enumeration
      throw new Error('Unable to process password reset request. Please try again later.');
    }
  }

  /**
   * Fetch user profile from public.profiles table
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabase();
    if (!supabase || !userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Profile retrieval notice:', error.message);
      return null;
    }
    return data as UserProfile;
  }

  /**
   * Update profile with whitelisted customer-editable fields
   * Prevents client from altering professional_role, id, status, or email directly.
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    // Whitelist customer-editable fields
    const safeUpdates: Record<string, any> = {};
    if (updates.display_name !== undefined) safeUpdates.display_name = sanitizeInput(updates.display_name);
    if (updates.bio !== undefined) safeUpdates.bio = sanitizeInput(updates.bio || '');
    if (updates.country !== undefined) safeUpdates.country = sanitizeInput(updates.country || '').slice(0, 50);
    if (updates.city !== undefined) safeUpdates.city = sanitizeInput(updates.city || '').slice(0, 100);
    if (updates.phone !== undefined) safeUpdates.phone = sanitizeInput(updates.phone || '').slice(0, 30);
    if (updates.profile_image_url !== undefined) safeUpdates.profile_image_url = sanitizeInput(updates.profile_image_url || '');

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  }
}
