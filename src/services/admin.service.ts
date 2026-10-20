import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';
import { UserProfile, ProfessionalRole, UserStatus, SellerVerificationStatus } from '../types/user';
import { Product, ProductStatus, Order, Category } from '../types/ecommerce';
import { DEV_SAMPLE_PRODUCTS, DEV_SAMPLE_CATEGORIES } from './catalog.service';
import { SUPABASE_SCHEMA_CATALOG } from '../lib/supabase/schema-info';
import { sanitizeInput } from '../lib/security/validation';

export interface AdminEcosystemMetrics {
  totalUsers: number;
  totalSellers: number;
  verifiedSellers: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  tablesCount: number;
}

export interface AdminUserRecord {
  id: string;
  full_name?: string;
  display_name: string;
  email: string;
  role: ProfessionalRole;
  professional_role: ProfessionalRole;
  country?: string | null;
  city?: string | null;
  phone?: string | null;
  bio?: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminSellerRecord {
  id: string;
  user_id: string;
  business_name: string;
  business_description?: string | null;
  country: string;
  city?: string | null;
  contact_phone?: string | null;
  verification_status: SellerVerificationStatus;
  status: 'active' | 'suspended' | 'dormant';
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    display_name: string;
    professional_role: string;
  };
  productCount?: number;
}

// Initial seed stores for dev/preview fallback to maintain authoritative state across turns
const LOCAL_USERS_KEY = 'delynx_admin_users_store';
const LOCAL_SELLERS_KEY = 'delynx_admin_sellers_store';

function getInitialLocalUsers(): UserProfile[] {
  return [
    {
      id: 'usr-1',
      auth_user_id: 'usr-1',
      email: 'valmont@couture.com',
      display_name: 'Lord Henri de Valmont',
      professional_role: 'designer',
      country: 'FRA',
      city: 'Paris',
      bio: 'Principal designer for Maison Valmont haute couture collections.',
      status: 'active',
      created_at: '2026-08-15T10:00:00Z',
      updated_at: '2026-09-01T12:00:00Z',
    },
    {
      id: 'usr-2',
      auth_user_id: 'usr-2',
      email: 'laurent@tailor.paris',
      display_name: 'Atelier Laurent',
      professional_role: 'tailor',
      country: 'FRA',
      city: 'Paris',
      bio: 'Master tailor specializing in bespoke canvassed suiting.',
      status: 'active',
      created_at: '2026-08-20T11:30:00Z',
      updated_at: '2026-09-02T14:00:00Z',
    },
    {
      id: 'usr-3',
      auth_user_id: 'usr-3',
      email: 'danladi@vanguard.ng',
      display_name: 'Danladi Vanguard',
      professional_role: 'seller',
      country: 'NGA',
      city: 'Lagos',
      bio: 'Atelier master at Vanguard Bespoke Victoria Island.',
      status: 'active',
      created_at: '2026-08-22T09:15:00Z',
      updated_at: '2026-09-03T16:20:00Z',
    },
    {
      id: 'usr-4',
      auth_user_id: 'usr-4',
      email: 'buyer@sartorialcapital.com',
      display_name: 'Bespoke Buyer Syndicate',
      professional_role: 'buyer_retailer',
      country: 'GBR',
      city: 'London',
      bio: 'Curator and institutional procurer of luxury African and European fashion.',
      status: 'active',
      created_at: '2026-08-25T14:00:00Z',
      updated_at: '2026-09-04T10:00:00Z',
    },
    {
      id: 'usr-5',
      auth_user_id: 'usr-5',
      email: 'procure@kyototextiles.jp',
      display_name: 'Kyoto Textile Works',
      professional_role: 'manufacturer',
      country: 'JPN',
      city: 'Kyoto',
      bio: 'Artisan hand-loomed silk and organic cotton supplier.',
      status: 'pending_verification',
      created_at: '2026-08-28T08:00:00Z',
      updated_at: '2026-09-05T09:00:00Z',
    },
    {
      id: 'usr-6',
      auth_user_id: 'usr-6',
      email: 'client@eliteluxury.ng',
      display_name: 'Amina Al-Hassan',
      professional_role: 'customer',
      country: 'NGA',
      city: 'Abuja',
      bio: 'Private client collecting ceremonial bridal and gala bespoke couture.',
      status: 'active',
      created_at: '2026-09-01T15:00:00Z',
      updated_at: '2026-09-06T11:00:00Z',
    },
  ];
}

function getInitialLocalSellers(): AdminSellerRecord[] {
  return [
    {
      id: 'seller-danladi',
      user_id: 'usr-3',
      business_name: 'Vanguard Bespoke Atelier',
      business_description: 'Luxury bespoke suiting and ceremonial menswear handcrafted in Victoria Island, Lagos.',
      country: 'Nigeria',
      city: 'Lagos',
      verification_status: 'verified',
      status: 'active',
      rating: 4.95,
      rating_count: 42,
      created_at: '2026-08-22T09:15:00Z',
      updated_at: '2026-09-05T12:00:00Z',
      user: {
        email: 'danladi@vanguard.ng',
        display_name: 'Danladi Vanguard',
        professional_role: 'seller',
      },
      productCount: 4,
    },
    {
      id: 'seller-01',
      user_id: 'usr-2',
      business_name: 'Atelier Laurent Paris',
      business_description: 'High-craft bespoke tailoring house founded on Rue Saint-Honoré, Paris.',
      country: 'France',
      city: 'Paris',
      verification_status: 'verified',
      status: 'active',
      rating: 4.92,
      rating_count: 38,
      created_at: '2026-08-20T11:30:00Z',
      updated_at: '2026-09-04T10:00:00Z',
      user: {
        email: 'laurent@tailor.paris',
        display_name: 'Atelier Laurent',
        professional_role: 'tailor',
      },
      productCount: 3,
    },
    {
      id: 'seller-02',
      user_id: 'usr-1',
      business_name: 'Maison Valmont',
      business_description: 'High fashion couture house and luxury leather apparel artisan guild.',
      country: 'France',
      city: 'Paris',
      verification_status: 'verified',
      status: 'active',
      rating: 4.88,
      rating_count: 24,
      created_at: '2026-08-15T10:00:00Z',
      updated_at: '2026-09-03T16:00:00Z',
      user: {
        email: 'valmont@couture.com',
        display_name: 'Lord Henri de Valmont',
        professional_role: 'designer',
      },
      productCount: 2,
    },
    {
      id: 'seller-03',
      user_id: 'usr-5',
      business_name: 'Kyoto Textile Works Ltd',
      business_description: 'Authentic Kyoto jacquard and natural indigo textile milling consortium.',
      country: 'Japan',
      city: 'Kyoto',
      verification_status: 'pending',
      status: 'active',
      rating: 5.0,
      rating_count: 6,
      created_at: '2026-08-28T08:00:00Z',
      updated_at: '2026-09-05T09:00:00Z',
      user: {
        email: 'procure@kyototextiles.jp',
        display_name: 'Kyoto Textile Works',
        professional_role: 'manufacturer',
      },
      productCount: 1,
    },
  ];
}

export class AdminGovernanceService {
  private static getStoredUsers(): UserProfile[] {
    try {
      const raw = localStorage.getItem(LOCAL_USERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    const initial = getInitialLocalUsers();
    this.saveStoredUsers(initial);
    return initial;
  }

  private static saveStoredUsers(users: UserProfile[]): void {
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }

  private static getStoredSellers(): AdminSellerRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_SELLERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    const initial = getInitialLocalSellers();
    this.saveStoredSellers(initial);
    return initial;
  }

  private static saveStoredSellers(sellers: AdminSellerRecord[]): void {
    try {
      localStorage.setItem(LOCAL_SELLERS_KEY, JSON.stringify(sellers));
    } catch {
      // ignore
    }
  }

  /**
   * Fetch aggregate platform metrics across users, sellers, products, orders
   */
  public static async getPlatformMetrics(): Promise<AdminEcosystemMetrics> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const [
          { count: userCount },
          { count: sellerCount },
          { count: verifiedSellerCount },
          { count: productCount },
          { count: activeProductCount },
          { count: orderCount },
          { count: pendingOrderCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('sellers').select('*', { count: 'exact', head: true }),
          supabase.from('sellers').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending_payment', 'processing']),
        ]);

        return {
          totalUsers: userCount || 0,
          totalSellers: sellerCount || 0,
          verifiedSellers: verifiedSellerCount || 0,
          totalProducts: productCount || 0,
          activeProducts: activeProductCount || 0,
          totalOrders: orderCount || 0,
          pendingOrders: pendingOrderCount || 0,
          tablesCount: SUPABASE_SCHEMA_CATALOG.tablesCount,
        };
      } catch (err) {
        console.warn('AdminGovernanceService: Supabase error in getPlatformMetrics, falling back to local store:', err);
      }
    }

    // Local authoritative fallback
    const users = this.getStoredUsers();
    const sellers = this.getStoredSellers();
    const verifiedSellers = sellers.filter((s) => s.verification_status === 'verified').length;
    const products = DEV_SAMPLE_PRODUCTS;
    const activeProducts = products.filter((p) => p.status === 'active').length;

    let totalOrders = 0;
    let pendingOrders = 0;
    try {
      const rawOrders = localStorage.getItem('delynx_orders_store');
      if (rawOrders) {
        const orders: Order[] = JSON.parse(rawOrders);
        totalOrders = orders.length;
        pendingOrders = orders.filter((o) => o.status === 'pending_payment' || o.status === 'processing').length;
      }
    } catch {
      // ignore
    }

    return {
      totalUsers: users.length,
      totalSellers: sellers.length,
      verifiedSellers,
      totalProducts: products.length,
      activeProducts,
      totalOrders,
      pendingOrders,
      tablesCount: SUPABASE_SCHEMA_CATALOG.tablesCount,
    };
  }

  /**
   * Fetch users with search and filtering
   */
  public static async getUsers(filters?: {
    search?: string;
    role?: string;
    status?: string;
  }): Promise<UserProfile[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

        if (filters?.role && filters.role !== 'all') {
          query = query.eq('professional_role', filters.role);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          let results = data as UserProfile[];
          if (filters?.search) {
            const q = filters.search.toLowerCase();
            results = results.filter(
              (u) =>
                u.display_name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.country?.toLowerCase().includes(q) ||
                u.city?.toLowerCase().includes(q)
            );
          }
          return results;
        }
      } catch (err) {
        console.warn('AdminGovernanceService: Supabase error in getUsers:', err);
      }
    }

    // Local fallback
    let results = this.getStoredUsers();

    if (filters?.role && filters.role !== 'all') {
      results = results.filter((u) => u.professional_role === filters.role);
    }
    if (filters?.status && filters.status !== 'all') {
      results = results.filter((u) => u.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.country?.toLowerCase().includes(q) ||
          u.city?.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Fetch admin users with full_name mapping and role fields
   */
  public static async getAdminUsers(filters?: {
    search?: string;
    role?: string;
    status?: string;
  }): Promise<AdminUserRecord[]> {
    const users = await this.getUsers(filters);
    return users.map((u) => ({
      ...u,
      full_name: u.display_name || '',
      role: u.professional_role,
    }));
  }

  /**
   * Authoritative user account status update
   */
  public static async updateUserStatus(
    userId: string,
    newStatus: UserStatus
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (!error) return { success: true };
        return { success: false, error: error.message };
      } catch (err: any) {
        console.warn('AdminGovernanceService: Error updating user status via Supabase:', err);
        return { success: false, error: err?.message || 'Failed to update user status' };
      }
    }

    const users = this.getStoredUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].status = newStatus;
      users[idx].updated_at = new Date().toISOString();
      this.saveStoredUsers(users);
      return { success: true };
    }
    return { success: false, error: 'User record not found' };
  }

  /**
   * Authoritative user role governance update
   */
  public static async updateUserRole(
    userId: string,
    newRole: ProfessionalRole
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ professional_role: newRole, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (!error) return { success: true };
        return { success: false, error: error.message };
      } catch (err: any) {
        console.warn('AdminGovernanceService: Error updating user role via Supabase:', err);
        return { success: false, error: err?.message || 'Failed to update user role' };
      }
    }

    const users = this.getStoredUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].professional_role = newRole;
      users[idx].updated_at = new Date().toISOString();
      this.saveStoredUsers(users);
      return { success: true };
    }
    return { success: false, error: 'User record not found' };
  }

  /**
   * Fetch sellers with search and status filtering
   */
  public static async getSellers(filters?: {
    search?: string;
    verification?: string;
    status?: string;
  }): Promise<AdminSellerRecord[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        let query = supabase
          .from('sellers')
          .select(`
            *,
            user:profiles(email, display_name, professional_role)
          `)
          .order('created_at', { ascending: false });

        if (filters?.verification && filters.verification !== 'all') {
          query = query.eq('verification_status', filters.verification);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          let results = data as AdminSellerRecord[];
          if (filters?.search) {
            const q = filters.search.toLowerCase();
            results = results.filter(
              (s) =>
                s.business_name?.toLowerCase().includes(q) ||
                s.country?.toLowerCase().includes(q) ||
                s.city?.toLowerCase().includes(q) ||
                s.user?.email?.toLowerCase().includes(q) ||
                s.user?.display_name?.toLowerCase().includes(q)
            );
          }
          return results;
        }
      } catch (err) {
        console.warn('AdminGovernanceService: Supabase error in getSellers:', err);
      }
    }

    // Local fallback
    let results = this.getStoredSellers();

    if (filters?.verification && filters.verification !== 'all') {
      results = results.filter((s) => s.verification_status === filters.verification);
    }
    if (filters?.status && filters.status !== 'all') {
      results = results.filter((s) => s.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.business_name?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.user?.email?.toLowerCase().includes(q) ||
          s.user?.display_name?.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Fetch sellers with search and status filtering (Alias for getSellers for Admin pages)
   */
  public static async getAdminSellers(filters?: {
    search?: string;
    verification?: string;
    status?: string;
  }): Promise<AdminSellerRecord[]> {
    return this.getSellers(filters);
  }

  /**
   * Update seller verification status (vetting approval or rejection)
   */
  public static async updateSellerVerification(
    sellerId: string,
    verificationStatus: SellerVerificationStatus
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('sellers')
          .update({
            verification_status: verificationStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sellerId);

        if (!error) return { success: true };
        return { success: false, error: error.message };
      } catch (err: any) {
        console.warn('AdminGovernanceService: Error updating seller verification:', err);
        return { success: false, error: err?.message || 'Failed to update verification' };
      }
    }

    const sellers = this.getStoredSellers();
    const idx = sellers.findIndex((s) => s.id === sellerId);
    if (idx >= 0) {
      sellers[idx].verification_status = verificationStatus;
      sellers[idx].updated_at = new Date().toISOString();
      this.saveStoredSellers(sellers);
      return { success: true };
    }
    return { success: false, error: 'Seller record not found' };
  }

  /**
   * Update seller operational status (active / suspended / dormant)
   */
  public static async updateSellerStatus(
    sellerId: string,
    newStatus: 'active' | 'suspended' | 'dormant'
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('sellers')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sellerId);

        if (!error) return { success: true };
        return { success: false, error: error.message };
      } catch (err: any) {
        console.warn('AdminGovernanceService: Error updating seller status:', err);
        return { success: false, error: err?.message || 'Failed to update atelier status' };
      }
    }

    const sellers = this.getStoredSellers();
    const idx = sellers.findIndex((s) => s.id === sellerId);
    if (idx >= 0) {
      sellers[idx].status = newStatus;
      sellers[idx].updated_at = new Date().toISOString();
      this.saveStoredSellers(sellers);
      return { success: true };
    }
    return { success: false, error: 'Seller record not found' };
  }

  /**
   * Update product moderation status (e.g. active, archived, draft)
   */
  public static async updateProductStatus(
    productId: string,
    status: ProductStatus
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('products')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId);

        if (!error) return { success: true };
        return { success: false, error: error.message };
      } catch (err: any) {
        console.warn('AdminGovernanceService: Error updating product status:', err);
        return { success: false, error: err?.message || 'Failed to update garment status' };
      }
    }

    // Local update
    const p = DEV_SAMPLE_PRODUCTS.find((item) => item.id === productId);
    if (p) {
      p.status = status;
      p.updated_at = new Date().toISOString();
      return { success: true };
    }
    return { success: false, error: 'Garment piece not found in catalog' };
  }

  /**
   * Moderate product status (boolean return for backward compatibility)
   */
  public static async moderateProductStatus(
    productId: string,
    status: ProductStatus
  ): Promise<boolean> {
    const res = await this.updateProductStatus(productId, status);
    return res.success;
  }

  /**
   * Toggle featured product status
   */
  public static async toggleProductFeatured(
    productId: string,
    featured: boolean
  ): Promise<boolean> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('products')
          .update({
            featured,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId);

        if (!error) return true;
      } catch (err) {
        console.warn('AdminGovernanceService: Error toggling product featured:', err);
      }
    }

    const p = DEV_SAMPLE_PRODUCTS.find((item) => item.id === productId);
    if (p) {
      p.featured = featured;
      p.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Authoritative product content update from front-end or control center
   */
  public static async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const payload: any = {
          ...updates,
          updated_at: new Date().toISOString(),
        };
        // Remove joined objects before Supabase update
        delete payload.category;
        delete payload.seller;
        delete payload.variants;

        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId)
          .select('*, category:categories(*), seller:sellers(*), variants:product_variants(*)')
          .maybeSingle();

        if (!error && data) {
          const localIdx = DEV_SAMPLE_PRODUCTS.findIndex((item) => item.id === productId);
          if (localIdx >= 0) {
            DEV_SAMPLE_PRODUCTS[localIdx] = {
              ...DEV_SAMPLE_PRODUCTS[localIdx],
              ...updates,
              updated_at: new Date().toISOString(),
            };
          }
          return { success: true, product: data as Product };
        }
        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('AdminGovernanceService: Error updating product:', err);
        return { success: false, error: err?.message || 'Failed to update garment' };
      }
    }

    // Local fallback update
    const idx = DEV_SAMPLE_PRODUCTS.findIndex((item) => item.id === productId);
    if (idx >= 0) {
      DEV_SAMPLE_PRODUCTS[idx] = {
        ...DEV_SAMPLE_PRODUCTS[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return { success: true, product: DEV_SAMPLE_PRODUCTS[idx] };
    }
    return { success: false, error: 'Garment not found' };
  }

  /**
   * Authoritative product deletion from front-end or control center
   */
  public static async deleteProduct(
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', productId);

        if (!error) {
          const localIdx = DEV_SAMPLE_PRODUCTS.findIndex((item) => item.id === productId);
          if (localIdx >= 0) {
            DEV_SAMPLE_PRODUCTS.splice(localIdx, 1);
          }
          return { success: true };
        }
        return { success: false, error: error.message };
      } catch (err: any) {
        console.warn('AdminGovernanceService: Error deleting product:', err);
        return { success: false, error: err?.message || 'Failed to delete garment' };
      }
    }

    // Local fallback deletion
    const idx = DEV_SAMPLE_PRODUCTS.findIndex((item) => item.id === productId);
    if (idx >= 0) {
      DEV_SAMPLE_PRODUCTS.splice(idx, 1);
      return { success: true };
    }
    return { success: false, error: 'Garment not found in catalog' };
  }
}
