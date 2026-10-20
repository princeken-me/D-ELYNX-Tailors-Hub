import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Sparkles,
  Phone,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Loader2,
} from 'lucide-react';
import { SellerStudioLayout } from '../../components/seller/SellerStudioLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  SellerCatalogService,
  SellerRecord,
  UpdateSellerProfileInput,
} from '../../services/seller-catalog.service';
import { Button } from '../../components/ui/Button';

export const SellerProfilePage: React.FC = () => {
  const { user, profile } = useAuth();
  const [seller, setSeller] = useState<SellerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [specialtyTagsInput, setSpecialtyTagsInput] = useState('');

  const effectiveUserId = user?.id || profile?.id || profile?.auth_user_id || 'usr-seller-demo';

  const loadProfile = async () => {
    setLoading(true);
    try {
      const record = await SellerCatalogService.getSellerProfile(effectiveUserId);
      if (record) {
        setSeller(record);
        setBusinessName(record.business_name || '');
        setBusinessDescription(record.business_description || '');
        setCountry(record.country || '');
        setCity(record.city || '');
        setContactPhone(record.contact_phone || '');
        setLogoUrl(record.logo_url || '');
        setBannerUrl(record.banner_url || '');
        setSpecialtyTagsInput((record.specialty_tags || []).join(', '));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [effectiveUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    setSaving(true);
    setFeedback(null);

    const tags = specialtyTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updates: UpdateSellerProfileInput = {
      business_name: businessName,
      business_description: businessDescription,
      country,
      city,
      contact_phone: contactPhone,
      logo_url: logoUrl || undefined,
      banner_url: bannerUrl || undefined,
      specialty_tags: tags,
    };

    const res = await SellerCatalogService.updateSellerProfile(seller.id, effectiveUserId, updates);

    setSaving(false);
    if (res.success && res.profile) {
      setSeller(res.profile);
      setFeedback({
        type: 'success',
        text: 'Atelier profile updated successfully. Changes are now visible across the luxury marketplace.',
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Failed to update atelier profile.',
      });
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Atelier
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Pending Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Verification Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            Unverified
          </span>
        );
    }
  };

  return (
    <SellerStudioLayout>
      <div id="seller-profile-page" className="space-y-8 pb-12 max-w-5xl">
        {/* Page Header */}
        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
              Store Branding
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Atelier Profile & Identity
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Curate your atelier’s public storefront, sartorial heritage, and contact channels.
            </p>
          </div>

          {seller && (
            <div className="flex items-center gap-3">
              {getVerificationBadge(seller.verification_status)}
            </div>
          )}
        </div>

        {/* Feedback Alert */}
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

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            Loading atelier profile...
          </div>
        ) : !seller ? (
          <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400">
            No atelier profile found for this account.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Governance & Reputation Card (Read-Only) */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-serif uppercase tracking-wider font-semibold text-zinc-200">
                    Platform Standing & Vetting
                  </h2>
                </div>
                <span className="text-[10px] text-zinc-500">Authoritatively Managed</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <span className="text-[10px] uppercase text-zinc-500 block mb-1">Verification Status</span>
                  <div>{getVerificationBadge(seller.verification_status)}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <span className="text-[10px] uppercase text-zinc-500 block mb-1">Operational State</span>
                  <span className="font-semibold text-zinc-200 capitalize">{seller.status}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <span className="text-[10px] uppercase text-zinc-500 block mb-1">Client Satisfaction Rating</span>
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <span>★ {seller.rating ? seller.rating.toFixed(2) : '5.00'}</span>
                    <span className="text-zinc-500 font-normal">({seller.rating_count || 0} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 italic">
                * Note: Verification tiers, store ratings, and account status are strictly governed by platform administration to maintain sartorial standards.
              </p>
            </div>

            {/* Core Atelier Information */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-serif uppercase tracking-wider font-semibold text-zinc-200">
                  Atelier Identity
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Atelier / Brand Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Atelier Laurent Paris"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Official Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    placeholder="+33 1 42 68 55 00 or +234 802 000 0000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    City <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Paris or Lagos"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Country <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. France or Nigeria"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Craftsmanship Heritage & Biography
                  </label>
                  <textarea
                    rows={4}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                    placeholder="Describe your house heritage, bespoke cutting methods, tailoring traditions, and fabric provenance..."
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Specialty Disciplines (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={specialtyTagsInput}
                    onChange={(e) => setSpecialtyTagsInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Bespoke Suiting, Double-Breasted, Hand Canvassed, Royal Agbada, Haute Couture"
                  />
                  <p className="text-[11px] text-zinc-500">
                    These keywords guide client discovery on the public marketplace.
                  </p>
                </div>
              </div>
            </div>

            {/* Media & Visual Assets */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-serif uppercase tracking-wider font-semibold text-zinc-200">
                  Visual Branding
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">
                    Atelier Logo URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    placeholder="https://example.com/logo.png"
                  />
                  {logoUrl && (
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 w-24 h-24 flex items-center justify-center overflow-hidden">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">
                    Showroom Banner URL
                  </label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    placeholder="https://example.com/banner.jpg"
                  />
                  {bannerUrl && (
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 h-24 flex items-center justify-center overflow-hidden">
                      <img
                        src={bannerUrl}
                        alt="Banner preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
              <Button
                type="submit"
                disabled={saving}
                className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Store Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </SellerStudioLayout>
  );
};
