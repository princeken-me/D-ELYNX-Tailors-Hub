import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Link, useRouter } from '../../lib/router/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeInput } from '../../lib/security/validation';

export const ProfileSettingsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile, updateProfile, refreshProfile } = useAuth();

  // Parse existing display name into first/last for customer convenience
  const parseNames = (name?: string) => {
    if (!name) return { firstName: '', lastName: '' };
    const parts = name.trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  };

  const initialNames = parseNames(profile?.display_name);
  const [firstName, setFirstName] = useState(initialNames.firstName);
  const [lastName, setLastName] = useState(initialNames.lastName);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.profile_image_url || '');
  const [bio, setBio] = useState(profile?.bio || '');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      const parsed = parseNames(profile.display_name);
      setFirstName(parsed.firstName);
      setLastName(parsed.lastName);
      setDisplayName(profile.display_name || '');
      setPhoneNumber(profile.phone_number || '');
      setAvatarUrl(profile.profile_image_url || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  // Keep display name synchronized if user modifies first/last name
  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    const combined = [val.trim(), lastName.trim()].filter(Boolean).join(' ');
    setDisplayName(combined);
  };

  const handleLastNameChange = (val: string) => {
    setLastName(val);
    const combined = [firstName.trim(), val.trim()].filter(Boolean).join(' ');
    setDisplayName(combined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const cleanDisplay = sanitizeInput(displayName.trim());
    if (!cleanDisplay) {
      setErrorMessage('Display name is required for order deliveries and atelier communications.');
      return;
    }

    const cleanPhone = phoneNumber.trim();
    if (cleanPhone) {
      // Basic international / Nigerian telephone regex check (+234 or standard digits)
      const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setErrorMessage('Please enter a valid phone number (e.g., +234 803 123 4567).');
        return;
      }
    }

    setSaving(true);
    try {
      // Strictly passes only customer-permitted whitelisted fields
      const res = await updateProfile({
        display_name: cleanDisplay,
        phone_number: cleanPhone || undefined,
        profile_image_url: avatarUrl.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Your profile information has been saved successfully.');
        await refreshProfile();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="customer-profile-page" className="space-y-8 pb-12 max-w-3xl">
      {/* Header & Back Link */}
      <div>
        <Link
          to="/account"
          id="btn-back-to-account-profile"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </Link>

        <div className="border-b border-zinc-800/80 pb-6">
          <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
            Account Management
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
            Profile Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Update your personal contact details, delivery identity, and profile avatar.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          id="profile-success-banner"
          className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          id="profile-error-banner"
          className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar section */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <h3 className="text-xs font-serif uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Profile Photo</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-zinc-950 border-2 border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center text-zinc-400">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName || 'Customer Avatar'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarUrl('')}
                />
              ) : (
                <User className="w-8 h-8 text-zinc-500" />
              )}
            </div>

            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-xs text-zinc-400 font-medium block">
                Avatar Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-zinc-500">
                Provide a secure HTTPS URL for your customer avatar picture.
              </p>
            </div>
          </div>
        </div>

        {/* Identity & Contact Fields */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
          <h3 className="text-xs font-serif uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">First Name</label>
              <input
                type="text"
                placeholder="e.g. Adewale"
                value={firstName}
                onChange={(e) => handleFirstNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Adeleke"
                value={lastName}
                onChange={(e) => handleLastNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium block">
              Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Adewale Adeleke"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />
            <p className="text-[11px] text-zinc-500">
              The name shown on orders, fitting consultations, and customer invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-zinc-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                placeholder="+234 803 123 4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-zinc-500">
                Used by couriers for garment dispatch notifications.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-zinc-500" />
                <span>Email Address (Protected)</span>
              </label>
              <input
                type="email"
                disabled
                value={user?.email || profile?.email || 'customer@example.com'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-zinc-600">
                Managed securely in Security Settings.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium block">
              Sartorial Notes / Bio
            </label>
            <textarea
              rows={3}
              placeholder="Tell your tailors about your fit preferences, style inclinations, or preferred silhouettes..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Security / Whitelist Note */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Security controls active: customer accounts are strictly bounded to contact preferences. System roles, administrative privileges, and verified merchant credentials cannot be modified from this form.
          </p>
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            id="btn-save-profile"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/10 disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
