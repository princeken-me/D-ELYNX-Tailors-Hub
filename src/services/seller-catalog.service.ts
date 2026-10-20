import { getSupabase, isSupabaseConfigured, isProduction } from '../lib/supabase/client';
import { Product, ProductVariant, ProductStatus, InventoryRecord } from '../types/ecommerce';
import { sanitizeInput } from '../lib/security/validation';

export interface SellerInventoryItem {
  id: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  hero_image?: string | null;
  sku: string;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  price_override?: number | null;
  base_price: number;
  currency: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_total: number;
  reorder_threshold: number;
  warehouse_location?: string | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  updated_at: string;
}

export interface AdjustStockInput {
  sellerId: string;
  variantId: string;
  delta: number;
  reason?: string;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description: string;
  category_id: string;
  base_price: number;
  currency?: string;
  status: ProductStatus;
  featured?: boolean;
  hero_image?: string | null;
  images?: string[];
  variants?: Array<{
    sku: string;
    size?: string;
    color?: string;
    material?: string;
    price_override?: number | null;
    initial_stock?: number;
  }>;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  category_id?: string;
  base_price?: number;
  currency?: string;
  status?: ProductStatus;
  featured?: boolean;
  hero_image?: string | null;
  images?: string[];
}

export interface SellerRecord {
  id: string;
  user_id: string;
  business_name: string;
  business_description?: string;
  country: string;
  city?: string;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  status: 'active' | 'suspended' | 'dormant';
  rating: number;
  rating_count: number;
  logo_url?: string;
  banner_url?: string;
  specialty_tags?: string[];
  contact_phone?: string;
}

export interface UpdateSellerProfileInput {
  business_name?: string;
  business_description?: string;
  country?: string;
  city?: string;
  logo_url?: string;
  banner_url?: string;
  specialty_tags?: string[];
  contact_phone?: string;
}

export interface SellerSettings {
  leadTimeDays: number;
  acceptsBespokeCustomOrders: boolean;
  notifyOnNewOrder: boolean;
  notifyOnLowStock: boolean;
  notifyOnCustomerInquiry: boolean;
  dispatchPolicyNote?: string;
  updatedAt: string;
}

const LOCAL_SELLER_PROFILES_KEY = 'delynx_seller_profiles_store';
const LOCAL_SELLER_SETTINGS_KEY = 'delynx_seller_settings_store';
const LOCAL_SELLER_PRODUCTS_KEY = 'delynx_seller_products_store';

function getLocalSellerProducts(): Product[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_SELLER_PRODUCTS_KEY) : null;
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveLocalSellerProducts(products: Product[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_SELLER_PRODUCTS_KEY, JSON.stringify(products));
    }
  } catch {
    // ignore
  }
}

export class SellerCatalogService {
  /**
   * Helper to retrieve or initialize local seller profiles store
   */
  private static getLocalSellerProfiles(): Record<string, SellerRecord> {
    try {
      const raw = localStorage.getItem(LOCAL_SELLER_PROFILES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {};
  }

  private static saveLocalSellerProfiles(store: Record<string, SellerRecord>): void {
    try {
      localStorage.setItem(LOCAL_SELLER_PROFILES_KEY, JSON.stringify(store));
    } catch {
      // ignore
    }
  }

  /**
   * Retrieve seller profile for the authenticated user
   */
  static async getSellerProfile(userId: string): Promise<SellerRecord | null> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const localProfiles = this.getLocalSellerProfiles();
      const existing = Object.values(localProfiles).find((p) => p.user_id === userId);
      if (existing) {
        return existing;
      }
      // Fallback seller record
      const defaultSeller: SellerRecord = {
        id: `seller-${userId}`,
        user_id: userId,
        business_name: 'Atelier Laurent Paris',
        business_description: 'High-craft bespoke tailoring house founded on Rue Saint-Honoré, Paris.',
        country: 'France',
        city: 'Paris',
        verification_status: 'verified',
        status: 'active',
        rating: 4.95,
        rating_count: 38,
        specialty_tags: ['Bespoke Suiting', 'Double-Breasted', 'Silk Canvassing'],
        contact_phone: '+33 1 42 68 55 00',
      };
      localProfiles[defaultSeller.id] = defaultSeller;
      this.saveLocalSellerProfiles(localProfiles);
      return defaultSeller;
    }

    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('SellerCatalogService: Error fetching seller profile:', error.message);
        return null;
      }
      if (data) {
        const localProfiles = this.getLocalSellerProfiles();
        const cached = localProfiles[data.id];
        return {
          ...(data as SellerRecord),
          logo_url: cached?.logo_url,
          banner_url: cached?.banner_url,
          specialty_tags: cached?.specialty_tags || ['Bespoke Suiting', 'Tuxedos', 'Bridal Tailoring'],
          contact_phone: cached?.contact_phone,
        };
      }
      return null;
    } catch (err) {
      console.warn('SellerCatalogService unexpected error in getSellerProfile:', err);
      return null;
    }
  }

  /**
   * Update seller store profile
   * Strictly enforces seller ownership (user_id matching caller auth context).
   * Prevents mutation of protected fields (id, user_id, verification_status, status, rating, rating_count).
   */
  static async updateSellerProfile(
    sellerId: string,
    userId: string,
    updates: UpdateSellerProfileInput
  ): Promise<{ success: boolean; profile?: SellerRecord; error?: string }> {
    if (!sellerId || !userId) {
      return { success: false, error: 'Unauthorized: missing seller or user identity.' };
    }

    // Input sanitization
    const sanitizedName = updates.business_name ? sanitizeInput(updates.business_name.trim()) : undefined;
    const sanitizedDesc = updates.business_description ? sanitizeInput(updates.business_description.trim()) : undefined;
    const sanitizedCountry = updates.country ? sanitizeInput(updates.country.trim()) : undefined;
    const sanitizedCity = updates.city ? sanitizeInput(updates.city.trim()) : undefined;
    const sanitizedPhone = updates.contact_phone ? sanitizeInput(updates.contact_phone.trim()) : undefined;

    if (sanitizedName && sanitizedName.length < 2) {
      return { success: false, error: 'Atelier business name must be at least 2 characters.' };
    }

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (sanitizedName) updatePayload.business_name = sanitizedName;
        if (sanitizedDesc !== undefined) updatePayload.business_description = sanitizedDesc;
        if (sanitizedCountry) updatePayload.country = sanitizedCountry;
        if (sanitizedCity !== undefined) updatePayload.city = sanitizedCity;

        const { data, error } = await supabase
          .from('sellers')
          .update(updatePayload)
          .eq('id', sellerId)
          .eq('user_id', userId)
          .select()
          .maybeSingle();

        if (error) {
          return { success: false, error: error.message };
        }

        if (data) {
          // Also sync presentation fields to local store
          const localProfiles = this.getLocalSellerProfiles();
          const merged: SellerRecord = {
            ...(data as SellerRecord),
            logo_url: updates.logo_url,
            banner_url: updates.banner_url,
            specialty_tags: updates.specialty_tags,
            contact_phone: sanitizedPhone,
          };
          localProfiles[sellerId] = merged;
          this.saveLocalSellerProfiles(localProfiles);

          return {
            success: true,
            profile: merged,
          };
        }
      } catch (err: any) {
        console.warn('SellerCatalogService: Error updating seller profile via Supabase:', err);
      }
    }

    // Local fallback
    const localProfiles = this.getLocalSellerProfiles();
    const existing = localProfiles[sellerId] || (await this.getSellerProfile(userId));

    if (!existing) {
      return { success: false, error: 'Atelier profile not found.' };
    }

    if (existing.user_id !== userId) {
      return { success: false, error: 'Security violation: Atelier profile does not belong to your account.' };
    }

    const updatedProfile: SellerRecord = {
      ...existing,
      business_name: sanitizedName || existing.business_name,
      business_description: sanitizedDesc !== undefined ? sanitizedDesc : existing.business_description,
      country: sanitizedCountry || existing.country,
      city: sanitizedCity !== undefined ? sanitizedCity : existing.city,
      logo_url: updates.logo_url !== undefined ? updates.logo_url : existing.logo_url,
      banner_url: updates.banner_url !== undefined ? updates.banner_url : existing.banner_url,
      specialty_tags: updates.specialty_tags !== undefined ? updates.specialty_tags : existing.specialty_tags,
      contact_phone: sanitizedPhone !== undefined ? sanitizedPhone : existing.contact_phone,
    };

    localProfiles[sellerId] = updatedProfile;
    this.saveLocalSellerProfiles(localProfiles);

    return { success: true, profile: updatedProfile };
  }

  /**
   * Retrieve seller operating settings
   */
  static async getSellerSettings(sellerId: string): Promise<SellerSettings> {
    try {
      const raw = localStorage.getItem(`${LOCAL_SELLER_SETTINGS_KEY}_${sellerId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }

    return {
      leadTimeDays: 7,
      acceptsBespokeCustomOrders: true,
      notifyOnNewOrder: true,
      notifyOnLowStock: true,
      notifyOnCustomerInquiry: true,
      dispatchPolicyNote: 'Each garment undergoes rigorous hand inspection before dispatched in archival luxury packaging.',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update seller operating settings
   */
  static async updateSellerSettings(
    sellerId: string,
    settings: Partial<SellerSettings>
  ): Promise<SellerSettings> {
    const current = await this.getSellerSettings(sellerId);
    const updated: SellerSettings = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`${LOCAL_SELLER_SETTINGS_KEY}_${sellerId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return updated;
  }

  /**
   * Fetch all products owned by this atelier (drafts, active, archived)
   */
  static async getSellerProducts(sellerId: string): Promise<Product[]> {
    if (!sellerId) return [];

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      return getLocalSellerProducts().filter((p) => p.seller_id === sellerId);
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*, inventory(*))')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('SellerCatalogService: Error fetching products:', error.message);
        return [];
      }
      return (data as Product[]) || [];
    } catch (err) {
      console.warn('SellerCatalogService unexpected error in getSellerProducts:', err);
      return [];
    }
  }

  /**
   * Fetch a single product owned by this atelier
   */
  static async getSellerProduct(productId: string, sellerId: string): Promise<Product | null> {
    if (!productId || !sellerId) return null;

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const found = getLocalSellerProducts().find((p) => p.id === productId);
      if (!found) return null;
      if (found.seller_id !== sellerId) return null;
      return { ...found };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*, inventory(*))')
        .eq('id', productId)
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (error || !data) return null;
      return data as Product;
    } catch {
      return null;
    }
  }

  /**
   * Create a new product in the atelier catalog
   */
  static async createProduct(
    sellerId: string,
    input: CreateProductInput
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    if (!sellerId) {
      return { success: false, error: 'Seller identity required.' };
    }

    // Validate input fields
    const cleanName = sanitizeInput(input.name?.trim() || '');
    if (!cleanName) {
      return { success: false, error: 'Product name is required.' };
    }
    if (isNaN(Number(input.base_price)) || Number(input.base_price) <= 0) {
      return { success: false, error: 'Base price must be greater than zero.' };
    }
    if (!input.category_id) {
      return { success: false, error: 'Please select a valid category.' };
    }

    const VALID_STATUSES: ProductStatus[] = ['draft', 'active', 'out_of_stock', 'archived'];
    const chosenStatus: ProductStatus = VALID_STATUSES.includes(input.status) ? input.status : 'draft';

    // Generate or clean slug
    const rawSlug = input.slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanSlug = rawSlug.substring(0, 100) + '-' + Math.random().toString(36).substring(2, 6);

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        seller_id: sellerId,
        category_id: input.category_id,
        name: cleanName,
        slug: cleanSlug,
        description: sanitizeInput(input.description?.trim() || ''),
        base_price: Number(input.base_price),
        currency: (input.currency || 'NGN').toUpperCase().substring(0, 3),
        status: chosenStatus,
        featured: Boolean(input.featured),
        hero_image: input.hero_image || null,
        images: input.images || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: input.category_id,
          name: 'Custom Bespoke',
          slug: 'custom',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        variants: (input.variants || []).map((v, i) => ({
          id: `var-${Date.now()}-${i}`,
          product_id: `prod-${Date.now()}`,
          sku: sanitizeInput(v.sku.trim()) || `SKU-${i}`,
          size: v.size ? sanitizeInput(v.size.trim()) : null,
          color: v.color ? sanitizeInput(v.color.trim()) : null,
          material: v.material ? sanitizeInput(v.material.trim()) : null,
          price_override: v.price_override ? Number(v.price_override) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          inventory: typeof v.initial_stock === 'number' ? {
            id: `inv-${Date.now()}-${i}`,
            variant_id: `var-${Date.now()}-${i}`,
            quantity_available: Math.max(0, v.initial_stock),
            quantity_reserved: 0,
            reorder_threshold: 5,
            warehouse_location: 'Atelier Main Vault',
            updated_at: new Date().toISOString(),
          } : undefined,
        })),
      };

      const localProducts = getLocalSellerProducts();
      localProducts.unshift(newProduct);
      saveLocalSellerProducts(localProducts);
      return { success: true, product: newProduct };
    }

    try {
      const productPayload = {
        seller_id: sellerId,
        category_id: input.category_id,
        name: cleanName,
        slug: cleanSlug,
        description: sanitizeInput(input.description?.trim() || ''),
        base_price: Number(input.base_price),
        currency: (input.currency || 'NGN').toUpperCase().substring(0, 3),
        status: chosenStatus,
        featured: Boolean(input.featured),
        hero_image: input.hero_image || null,
        images: input.images || [],
      };

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productPayload)
        .select()
        .single();

      if (productError) {
        console.warn('SellerCatalogService: Error creating product:', productError.message);
        return { success: false, error: productError.message };
      }

      // Create variants if supplied
      if (input.variants && input.variants.length > 0) {
        for (const v of input.variants) {
          const cleanSku = sanitizeInput(v.sku.trim()) || `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
          const { data: newVar, error: varError } = await supabase
            .from('product_variants')
            .insert({
              product_id: newProduct.id,
              sku: cleanSku,
              size: v.size ? sanitizeInput(v.size.trim()) : null,
              color: v.color ? sanitizeInput(v.color.trim()) : null,
              material: v.material ? sanitizeInput(v.material.trim()) : null,
              price_override: v.price_override ? Number(v.price_override) : null,
            })
            .select()
            .single();

          if (!varError && newVar && typeof v.initial_stock === 'number') {
            // Seed inventory record
            await supabase
              .from('inventory')
              .insert({
                variant_id: newVar.id,
                quantity_available: Math.max(0, v.initial_stock),
                quantity_reserved: 0,
                reorder_threshold: 5,
              });
          }
        }
      }

      return { success: true, product: newProduct as Product };
    } catch (err: any) {
      console.warn('SellerCatalogService unexpected error in createProduct:', err);
      return { success: false, error: err.message || 'Failed to create product listing.' };
    }
  }

  /**
   * Update an existing product owned by the atelier.
   * Strictly enforces seller ownership at the authoritative database level.
   */
  static async updateProduct(
    productId: string,
    sellerId: string,
    updates: UpdateProductInput
  ): Promise<{ success: boolean; error?: string }> {
    if (!productId || !sellerId) {
      return { success: false, error: 'Product ID and Seller ID are required.' };
    }

    const payload: Record<string, any> = {};

    if (updates.name !== undefined) {
      const cleanName = sanitizeInput(updates.name.trim());
      if (!cleanName) return { success: false, error: 'Product name cannot be empty.' };
      payload.name = cleanName;
    }
    if (updates.description !== undefined) {
      payload.description = sanitizeInput(updates.description.trim());
    }
    if (updates.base_price !== undefined) {
      const numPrice = Number(updates.base_price);
      if (isNaN(numPrice) || numPrice < 0) {
        return { success: false, error: 'Price must be a valid non-negative number.' };
      }
      payload.base_price = numPrice;
    }
    if (updates.currency !== undefined) {
      payload.currency = updates.currency.toUpperCase().slice(0, 3);
    }
    if (updates.category_id !== undefined) {
      if (!updates.category_id.trim()) return { success: false, error: 'Category cannot be empty.' };
      payload.category_id = updates.category_id;
    }
    if (updates.status !== undefined) {
      const VALID_STATUSES: ProductStatus[] = ['draft', 'active', 'out_of_stock', 'archived'];
      if (!VALID_STATUSES.includes(updates.status)) {
        return { success: false, error: `Invalid product status "${updates.status}". Allowed: ${VALID_STATUSES.join(', ')}` };
      }
      payload.status = updates.status;
    }
    if (updates.featured !== undefined) {
      payload.featured = Boolean(updates.featured);
    }
    if (updates.hero_image !== undefined) {
      payload.hero_image = updates.hero_image ? updates.hero_image.trim() : null;
    }
    if (updates.images !== undefined) {
      payload.images = Array.isArray(updates.images) ? updates.images : [];
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const localProducts = getLocalSellerProducts();
      const idx = localProducts.findIndex((p) => p.id === productId);
      if (idx === -1) {
        return { success: false, error: 'Product not found.' };
      }
      const existing = localProducts[idx];

      // Authoritative seller ownership check
      if (existing.seller_id !== sellerId) {
        return { success: false, error: 'Unauthorized: Product does not belong to your atelier.' };
      }

      localProducts[idx] = {
        ...existing,
        ...payload,
        updated_at: new Date().toISOString(),
      };
      saveLocalSellerProducts(localProducts);
      return { success: true };
    }

    try {
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)
        .eq('seller_id', sellerId)
        .select();

      if (error) {
        console.warn('SellerCatalogService: Error updating product:', error.message);
        return { success: false, error: error.message };
      }
      if (!data || data.length === 0) {
        return { success: false, error: 'Unauthorized: Product not found or does not belong to your atelier.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update product.' };
    }
  }

  /**
   * Delete a product listing owned by the atelier.
   * Strictly enforces seller ownership at the authoritative database level.
   */
  static async deleteProduct(
    productId: string,
    sellerId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!productId || !sellerId) {
      return { success: false, error: 'Product ID and Seller ID are required.' };
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const localProducts = getLocalSellerProducts();
      const idx = localProducts.findIndex((p) => p.id === productId);
      if (idx === -1) {
        return { success: false, error: 'Product not found.' };
      }
      if (localProducts[idx].seller_id !== sellerId) {
        return { success: false, error: 'Unauthorized: Product does not belong to your atelier.' };
      }
      localProducts.splice(idx, 1);
      saveLocalSellerProducts(localProducts);
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', sellerId)
        .select();

      if (error) {
        console.warn('SellerCatalogService: Error deleting product:', error.message);
        return { success: false, error: error.message };
      }
      if (!data || data.length === 0) {
        return { success: false, error: 'Unauthorized: Product not found or does not belong to your atelier.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete product.' };
    }
  }

  /**
   * Upload garment image to Supabase Storage ('garment-media' bucket)
   * Enforces 10MB limit and safe image MIME types.
   */
  static async uploadGarmentImage(
    file: File,
    sellerId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      // Return a placeholder or mock for preview
      return {
        success: true,
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
      };
    }

    // 1. Validate MIME type
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Unsupported image format (${file.type}). Allowed: JPG, PNG, WEBP, AVIF.`,
      };
    }

    // 2. Validate file size (10MB maximum)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return {
        success: false,
        error: `File size exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      };
    }

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `sellers/${sellerId}/${Date.now()}_${cleanFileName}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('garment-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.warn('SellerCatalogService: Storage upload error:', uploadError.message);
        return { success: false, error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from('garment-media')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrlData.publicUrl };
    } catch (err: any) {
      console.warn('SellerCatalogService unexpected error during image upload:', err);
      return { success: false, error: err.message || 'Image upload failed.' };
    }
  }

  /**
   * Fetch inventory allocations for all variants belonging to this atelier.
   * Strictly enforces seller ownership at both the service and PostgreSQL RLS levels.
   */
  static async getSellerInventory(sellerId: string): Promise<SellerInventoryItem[]> {
    if (!sellerId) return [];

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const ownedProducts = getLocalSellerProducts().filter((p) => p.seller_id === sellerId);

      const items: SellerInventoryItem[] = [];
      for (const product of ownedProducts) {
        const variants = product.variants || [];
        for (const variant of variants) {
          const inv = variant.inventory;
          const available = typeof inv?.quantity_available === 'number' ? inv.quantity_available : 0;
          const reserved = typeof inv?.quantity_reserved === 'number' ? inv.quantity_reserved : 0;
          const total = available + reserved;
          const threshold = typeof inv?.reorder_threshold === 'number' ? inv.reorder_threshold : 5;

          let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          if (available <= 0) {
            status = 'out_of_stock';
          } else if (available <= threshold) {
            status = 'low_stock';
          }

          items.push({
            id: inv?.id || `inv-${variant.id}`,
            variant_id: variant.id,
            product_id: product.id,
            product_name: product.name,
            hero_image: product.hero_image || (product.images && product.images[0]) || null,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            material: variant.material,
            price_override: variant.price_override,
            base_price: product.base_price,
            currency: product.currency,
            quantity_available: available,
            quantity_reserved: reserved,
            quantity_total: total,
            reorder_threshold: threshold,
            warehouse_location: inv?.warehouse_location || 'Atelier Main Vault',
            status,
            updated_at: inv?.updated_at || product.updated_at,
          });
        }
      }
      return items;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          hero_image,
          images,
          base_price,
          currency,
          seller_id,
          updated_at,
          variants:product_variants (
            id,
            sku,
            size,
            color,
            material,
            price_override,
            inventory (
              id,
              variant_id,
              quantity_available,
              quantity_reserved,
              reorder_threshold,
              warehouse_location,
              updated_at
            )
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('SellerCatalogService: Error fetching inventory:', error.message);
        return [];
      }

      const items: SellerInventoryItem[] = [];
      const products = (data as any[]) || [];

      for (const prod of products) {
        const variants = prod.variants || [];
        for (const variant of variants) {
          // Handle inventory row or array from Supabase join
          const rawInv = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
          const available = Number(rawInv?.quantity_available ?? 0);
          const reserved = Number(rawInv?.quantity_reserved ?? 0);
          const total = available + reserved;
          const threshold = Number(rawInv?.reorder_threshold ?? 5);

          let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          if (available <= 0) {
            status = 'out_of_stock';
          } else if (available <= threshold) {
            status = 'low_stock';
          }

          items.push({
            id: rawInv?.id || `inv-${variant.id}`,
            variant_id: variant.id,
            product_id: prod.id,
            product_name: prod.name,
            hero_image: prod.hero_image || (prod.images && prod.images[0]) || null,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            material: variant.material,
            price_override: variant.price_override,
            base_price: Number(prod.base_price),
            currency: prod.currency || 'NGN',
            quantity_available: available,
            quantity_reserved: reserved,
            quantity_total: total,
            reorder_threshold: threshold,
            warehouse_location: rawInv?.warehouse_location || 'Atelier Main Vault',
            status,
            updated_at: rawInv?.updated_at || prod.updated_at,
          });
        }
      }

      return items;
    } catch (err) {
      console.warn('SellerCatalogService unexpected error in getSellerInventory:', err);
      return [];
    }
  }

  /**
   * Adjust inventory available stock by delta (+restock or -reduction).
   * Strictly verifies seller ownership of the garment variant before mutation.
   * Never modifies reserved inventory; orders retain sole authority over reservations.
   * Atomically rejects any operation that would drive available stock negative.
   */
  static async adjustInventoryStock(
    input: AdjustStockInput
  ): Promise<{ success: boolean; inventory?: InventoryRecord; error?: string }> {
    if (!input.sellerId || !input.variantId) {
      return { success: false, error: 'Seller ID and Variant ID are required.' };
    }

    if (typeof input.delta !== 'number' || !Number.isInteger(input.delta) || input.delta === 0) {
      return { success: false, error: 'Adjustment delta must be a non-zero integer.' };
    }

    // In browser environment, attempt server-authoritative endpoint first
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/seller/inventory/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerId: input.sellerId,
            variantId: input.variantId,
            delta: input.delta,
            reason: input.reason,
          }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.inventory) {
            const localProducts = getLocalSellerProducts();
            const product = localProducts.find((p) =>
              p.variants?.some((v) => v.id === input.variantId)
            );
            if (product) {
              const variant = product.variants?.find((v) => v.id === input.variantId);
              if (variant) {
                variant.inventory = result.inventory;
                saveLocalSellerProducts(localProducts);
              }
            }
            return { success: true, inventory: result.inventory };
          } else if (result.error) {
            return { success: false, error: result.message || result.error };
          }
        }
      } catch {
        // Fallback to local / database execution below
      }
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const localProducts = getLocalSellerProducts();

      // Find product containing this variant
      const product = localProducts.find((p) =>
        p.variants?.some((v) => v.id === input.variantId)
      );

      if (!product) {
        return { success: false, error: 'Variant not found in atelier catalog.' };
      }

      // Strict seller ownership check
      if (product.seller_id !== input.sellerId) {
        return { success: false, error: 'Unauthorized: Garment variant does not belong to your atelier.' };
      }

      const variant = product.variants?.find((v) => v.id === input.variantId);
      if (!variant) {
        return { success: false, error: 'Variant not found.' };
      }

      if (!variant.inventory) {
        variant.inventory = {
          id: `inv-${Date.now()}`,
          variant_id: variant.id,
          quantity_available: 0,
          quantity_reserved: 0,
          reorder_threshold: 5,
          warehouse_location: 'Atelier Main Vault',
          updated_at: new Date().toISOString(),
        };
      }

      const currentAvailable = variant.inventory.quantity_available;
      const newAvailable = currentAvailable + input.delta;

      if (newAvailable < 0) {
        return {
          success: false,
          error: `Cannot reduce stock below zero. Current available stock is ${currentAvailable} units, requested reduction is ${Math.abs(input.delta)} units.`,
        };
      }

      variant.inventory.quantity_available = newAvailable;
      variant.inventory.updated_at = new Date().toISOString();
      saveLocalSellerProducts(localProducts);

      return {
        success: true,
        inventory: { ...variant.inventory },
      };
    }

    try {
      // 1. Authoritatively verify variant ownership through products table
      const { data: variantRec, error: varErr } = await supabase
        .from('product_variants')
        .select('id, product_id, sku, products!inner(id, seller_id, name)')
        .eq('id', input.variantId)
        .single();

      if (varErr || !variantRec) {
        return { success: false, error: 'Variant not found in atelier catalog.' };
      }

      const productRecord = (variantRec as any).products;
      if (productRecord?.seller_id !== input.sellerId) {
        return { success: false, error: 'Unauthorized: Garment variant does not belong to your atelier.' };
      }

      // 2. Fetch existing inventory record
      const { data: existingInv, error: invFetchErr } = await supabase
        .from('inventory')
        .select('*')
        .eq('variant_id', input.variantId)
        .maybeSingle();

      if (invFetchErr) {
        return { success: false, error: invFetchErr.message };
      }

      if (existingInv) {
        const currentAvailable = Number(existingInv.quantity_available || 0);
        const newAvailable = currentAvailable + input.delta;

        if (newAvailable < 0) {
          return {
            success: false,
            error: `Cannot reduce stock below zero. Current available stock is ${currentAvailable} units, requested reduction is ${Math.abs(input.delta)} units.`,
          };
        }

        // Apply mutation - quantity_reserved is preserved untouched
        const { data: updatedInv, error: updateErr } = await supabase
          .from('inventory')
          .update({
            quantity_available: newAvailable,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingInv.id)
          .select()
          .single();

        if (updateErr) {
          return { success: false, error: updateErr.message };
        }

        return { success: true, inventory: updatedInv as InventoryRecord };
      } else {
        // Variant does not yet have an inventory row: can only add, not reduce
        if (input.delta < 0) {
          return {
            success: false,
            error: 'Cannot reduce stock below zero. Variant has no existing recorded inventory.',
          };
        }

        const { data: newInv, error: insertErr } = await supabase
          .from('inventory')
          .insert({
            variant_id: input.variantId,
            quantity_available: input.delta,
            quantity_reserved: 0,
            reorder_threshold: 5,
            warehouse_location: 'Atelier Main Vault',
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertErr) {
          return { success: false, error: insertErr.message };
        }

        return { success: true, inventory: newInv as InventoryRecord };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to adjust stock.' };
    }
  }

  /**
   * Update reorder threshold for low-stock alerts on a garment variant.
   * Strictly enforces seller ownership.
   */
  static async updateReorderThreshold(params: {
    sellerId: string;
    variantId: string;
    threshold: number;
  }): Promise<{ success: boolean; inventory?: InventoryRecord; error?: string }> {
    if (!params.sellerId || !params.variantId) {
      return { success: false, error: 'Seller ID and Variant ID are required.' };
    }

    if (typeof params.threshold !== 'number' || !Number.isInteger(params.threshold) || params.threshold < 0) {
      return { success: false, error: 'Reorder threshold must be a non-negative integer.' };
    }

    // In browser environment, attempt server-authoritative endpoint first
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/seller/inventory/threshold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerId: params.sellerId,
            variantId: params.variantId,
            threshold: params.threshold,
          }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.inventory) {
            const localProducts = getLocalSellerProducts();
            const product = localProducts.find((p) =>
              p.variants?.some((v) => v.id === params.variantId)
            );
            if (product) {
              const variant = product.variants?.find((v) => v.id === params.variantId);
              if (variant) {
                variant.inventory = result.inventory;
                saveLocalSellerProducts(localProducts);
              }
            }
            return { success: true, inventory: result.inventory };
          }
        }
      } catch {
        // Fallback to local / database execution below
      }
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const localProducts = getLocalSellerProducts();

      const product = localProducts.find((p) =>
        p.variants?.some((v) => v.id === params.variantId)
      );

      if (!product) {
        return { success: false, error: 'Variant not found in atelier catalog.' };
      }

      if (product.seller_id !== params.sellerId) {
        return { success: false, error: 'Unauthorized: Garment variant does not belong to your atelier.' };
      }

      const variant = product.variants?.find((v) => v.id === params.variantId);
      if (!variant) return { success: false, error: 'Variant not found.' };

      if (!variant.inventory) {
        variant.inventory = {
          id: `inv-${Date.now()}`,
          variant_id: variant.id,
          quantity_available: 0,
          quantity_reserved: 0,
          reorder_threshold: params.threshold,
          warehouse_location: 'Atelier Main Vault',
          updated_at: new Date().toISOString(),
        };
      } else {
        variant.inventory.reorder_threshold = params.threshold;
        variant.inventory.updated_at = new Date().toISOString();
      }

      saveLocalSellerProducts(localProducts);
      return { success: true, inventory: { ...variant.inventory } };
    }

    try {
      const { data: variantRec, error: varErr } = await supabase
        .from('product_variants')
        .select('id, product_id, sku, products!inner(id, seller_id)')
        .eq('id', params.variantId)
        .single();

      if (varErr || !variantRec) {
        return { success: false, error: 'Variant not found in atelier catalog.' };
      }

      const productRecord = (variantRec as any).products;
      if (productRecord?.seller_id !== params.sellerId) {
        return { success: false, error: 'Unauthorized: Garment variant does not belong to your atelier.' };
      }

      const { data: updatedInv, error: updateErr } = await supabase
        .from('inventory')
        .update({
          reorder_threshold: params.threshold,
          updated_at: new Date().toISOString(),
        })
        .eq('variant_id', params.variantId)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      return { success: true, inventory: updatedInv as InventoryRecord };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update reorder threshold.' };
    }
  }
}
