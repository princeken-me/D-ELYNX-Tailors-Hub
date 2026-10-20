/**
 * D-ELYNX TAILORS HUB - Front-End Site Content Management Service
 *
 * Enables real-time front-end editing and updating of all homepage banners,
 * announcements, trust guarantees, network members, and marketplace content.
 * Edits persist in local storage and synchronize across the application in real-time.
 */

export interface HeroContent {
  announcementEnabled: boolean;
  announcementText: string;
  announcementLinkText: string;
  announcementLinkUrl: string;
  badgeText: string;
  title: string;
  description: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
}

export interface TrustHighlightItem {
  id: string;
  iconName: 'scissors' | 'shield' | 'truck' | 'sparkles';
  title: string;
  description: string;
}

export interface GuaranteeBannerContent {
  badgeText: string;
  title: string;
  description: string;
  highlightNote: string;
}

export interface NetworkMember {
  id: string;
  name: string;
  role: string;
  city: string;
  country: string;
  specialty: string;
  verified: boolean;
  status: string;
  avatarUrl?: string;
}

const DEFAULT_HERO_CONTENT: HeroContent = {
  announcementEnabled: true,
  announcementText: '✨ Worldwide Couture Delivery • Guaranteed Bespoke Fit • Spring/Summer 2026 Collections Live',
  announcementLinkText: 'Shop New Arrivals',
  announcementLinkUrl: '/marketplace',
  badgeText: 'Global Fashion & Tailoring Marketplace',
  title: 'Order Bespoke Suiting, Luxury Ready-to-Wear & Textiles Direct from Certified Ateliers',
  description: 'Connect directly with verified tailors, fashion designers, and textile mills worldwide. Order custom-fitted garments or ready collections with guaranteed delivery.',
  ctaPrimaryText: 'Shop All Products',
  ctaPrimaryLink: '/marketplace',
  ctaSecondaryText: 'Find Verified Tailors',
  ctaSecondaryLink: '/network',
};

const DEFAULT_TRUST_HIGHLIGHTS: TrustHighlightItem[] = [
  {
    id: 'trust-1',
    iconName: 'scissors',
    title: 'Master Bespoke Tailoring',
    description: 'Precision handcrafted garments tailored to your exact measurements with alteration credits.',
  },
  {
    id: 'trust-2',
    iconName: 'shield',
    title: 'Certified Sartorial Houses',
    description: 'Strictly vetted ateliers, master tailors, and luxury designers across the world.',
  },
  {
    id: 'trust-3',
    iconName: 'truck',
    title: 'Global Insured Courier',
    description: 'Door-to-door express delivery with transit insurance and live tracking.',
  },
  {
    id: 'trust-4',
    iconName: 'sparkles',
    title: 'Escrow Payment Protection',
    description: 'Funds securely held until you inspect and approve garment delivery.',
  },
];

const DEFAULT_GUARANTEE_BANNER: GuaranteeBannerContent = {
  badgeText: 'D-ELYNX Fit & Craftsmanship Guarantee',
  title: '100% Fit Guarantee on Bespoke Pieces',
  description: 'Every custom-tailored garment comes with our complimentary alteration credit and fit assurance. If your piece does not fit to your satisfaction, our atelier network covers local alterations or complete remake.',
  highlightNote: 'Zero-Risk Bespoke Ordering • Verified Master Craftsmen • Insured Transit',
};

const DEFAULT_NETWORK_MEMBERS: NetworkMember[] = [
  {
    id: 'mem-1',
    name: 'Atelier Laurent',
    role: 'Master Tailor & Sartorial House',
    city: 'Paris',
    country: 'France',
    specialty: 'Hand-Canvassed Double-Breasted Suiting & Overcoats',
    verified: true,
    status: 'Accepting Bespoke Commissions',
  },
  {
    id: 'mem-2',
    name: 'Elena Rostova Studio',
    role: 'Haute Couture Designer',
    city: 'Milan',
    country: 'Italy',
    specialty: 'Silk Crepe Evening Gowns & Structural Corsetry',
    verified: true,
    status: 'Open for Collaboration',
  },
  {
    id: 'mem-3',
    name: 'Kyoto Textile Works Ltd',
    role: 'Textile Manufacturer & Mill',
    city: 'Kyoto',
    country: 'Japan',
    specialty: 'Organic Raw Silk, Indigo Dyed Twill, Kasuri Jacquard',
    verified: true,
    status: 'Supplying Sample Swatches',
  },
  {
    id: 'mem-4',
    name: 'Savile Craft Academy',
    role: 'Fashion Academy & Apprenticeship',
    city: 'London',
    country: 'United Kingdom',
    specialty: 'Masterclasses in Bespoke Pattern Drafting',
    verified: true,
    status: 'Fall Cohort Applications Open',
  },
  {
    id: 'mem-5',
    name: 'Nordic Apparel CMT Group',
    role: 'Garment Manufacturer',
    city: 'Stockholm',
    country: 'Sweden',
    specialty: 'High-Volume Precision Cutting & Tailored Assembly',
    verified: true,
    status: 'Accepting Production Tech-Packs',
  },
  {
    id: 'mem-6',
    name: 'Lagos Silk Guild',
    role: 'Artisan Dyer & Mill',
    city: 'Lagos',
    country: 'Nigeria',
    specialty: 'Hand-Woven Aso-Oke, Damask Brocades & Embroidered Silk',
    verified: true,
    status: 'Direct Wholesale Swatches Ready',
  },
];

const STORAGE_KEYS = {
  HERO: 'delynx_site_hero_content_v1',
  TRUST: 'delynx_site_trust_content_v1',
  GUARANTEE: 'delynx_site_guarantee_content_v1',
  NETWORK: 'delynx_site_network_content_v1',
  EDIT_MODE: 'delynx_front_end_edit_mode_active',
};

export class SiteContentService {
  /**
   * Dispatch custom event to inform components of front-end content updates
   */
  private static notifyUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('delynx_site_content_updated'));
    }
  }

  // --- Hero & Announcement ---
  public static getHeroContent(): HeroContent {
    if (typeof window === 'undefined') return DEFAULT_HERO_CONTENT;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HERO);
      if (saved) return { ...DEFAULT_HERO_CONTENT, ...JSON.parse(saved) };
    } catch {
      // Fallback to defaults
    }
    return DEFAULT_HERO_CONTENT;
  }

  public static updateHeroContent(updates: Partial<HeroContent>): HeroContent {
    const current = this.getHeroContent();
    const updated = { ...current, ...updates };
    try {
      localStorage.setItem(STORAGE_KEYS.HERO, JSON.stringify(updated));
      this.notifyUpdate();
    } catch (e) {
      console.error('Failed to save hero content:', e);
    }
    return updated;
  }

  // --- Trust Highlights ---
  public static getTrustHighlights(): TrustHighlightItem[] {
    if (typeof window === 'undefined') return DEFAULT_TRUST_HIGHLIGHTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRUST);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TRUST_HIGHLIGHTS;
  }

  public static updateTrustHighlights(items: TrustHighlightItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRUST, JSON.stringify(items));
      this.notifyUpdate();
    } catch (e) {
      console.error('Failed to save trust highlights:', e);
    }
  }

  // --- Guarantee Banner ---
  public static getGuaranteeBanner(): GuaranteeBannerContent {
    if (typeof window === 'undefined') return DEFAULT_GUARANTEE_BANNER;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GUARANTEE);
      if (saved) return { ...DEFAULT_GUARANTEE_BANNER, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_GUARANTEE_BANNER;
  }

  public static updateGuaranteeBanner(updates: Partial<GuaranteeBannerContent>): GuaranteeBannerContent {
    const current = this.getGuaranteeBanner();
    const updated = { ...current, ...updates };
    try {
      localStorage.setItem(STORAGE_KEYS.GUARANTEE, JSON.stringify(updated));
      this.notifyUpdate();
    } catch (e) {
      console.error('Failed to save guarantee banner:', e);
    }
    return updated;
  }

  // --- Network Members ---
  public static getNetworkMembers(): NetworkMember[] {
    if (typeof window === 'undefined') return DEFAULT_NETWORK_MEMBERS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NETWORK);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NETWORK_MEMBERS;
  }

  public static updateNetworkMember(memberId: string, updates: Partial<NetworkMember>): NetworkMember[] {
    const list = this.getNetworkMembers();
    const updated = list.map((m) => (m.id === memberId ? { ...m, ...updates } : m));
    try {
      localStorage.setItem(STORAGE_KEYS.NETWORK, JSON.stringify(updated));
      this.notifyUpdate();
    } catch (e) {
      console.error('Failed to update network member:', e);
    }
    return updated;
  }

  public static addNetworkMember(newMember: Omit<NetworkMember, 'id'>): NetworkMember[] {
    const list = this.getNetworkMembers();
    const member: NetworkMember = {
      ...newMember,
      id: `mem-${Date.now()}`,
    };
    const updated = [member, ...list];
    try {
      localStorage.setItem(STORAGE_KEYS.NETWORK, JSON.stringify(updated));
      this.notifyUpdate();
    } catch (e) {
      console.error('Failed to add network member:', e);
    }
    return updated;
  }

  public static deleteNetworkMember(memberId: string): NetworkMember[] {
    const list = this.getNetworkMembers();
    const updated = list.filter((m) => m.id !== memberId);
    try {
      localStorage.setItem(STORAGE_KEYS.NETWORK, JSON.stringify(updated));
      this.notifyUpdate();
    } catch (e) {
      console.error('Failed to delete network member:', e);
    }
    return updated;
  }

  // --- Front-End Live Edit Mode Toggle ---
  public static isLiveEditModeActive(): boolean {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.EDIT_MODE);
    return saved !== null ? saved === 'true' : true; // Default ON for Admin
  }

  public static toggleLiveEditMode(): boolean {
    const next = !this.isLiveEditModeActive();
    try {
      localStorage.setItem(STORAGE_KEYS.EDIT_MODE, String(next));
      this.notifyUpdate();
    } catch {}
    return next;
  }

  // --- Reset All to Factory Defaults ---
  public static resetToDefaults(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HERO);
      localStorage.removeItem(STORAGE_KEYS.TRUST);
      localStorage.removeItem(STORAGE_KEYS.GUARANTEE);
      localStorage.removeItem(STORAGE_KEYS.NETWORK);
      this.notifyUpdate();
    } catch (e) {
      console.error('Failed to reset content:', e);
    }
  }
}
