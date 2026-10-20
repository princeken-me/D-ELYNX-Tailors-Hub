import { getSupabase, isSupabaseConfigured, isProduction } from '../lib/supabase/client';
import { Wishlist, WishlistItem, Product } from '../types/ecommerce';

/**
 * Supabase Wishlist Service
 * Handles authenticated customer wishlists with Row Level Security enforcement.
 * Enforces ownership via auth.uid() = user_id.
 */
export class WishlistService {
  /**
   * Get or create the authenticated user's wishlist record
   */
  static async getOrCreateUserWishlist(userId: string): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return null;

    try {
      // Fetch existing wishlist for user
      const { data: existing, error: fetchError } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('WishlistService: Error locating user wishlist:', fetchError.message);
      }

      // Create new wishlist record if none found
      const { data: created, error: createError } = await supabase
        .from('wishlists')
        .insert({
          user_id: userId,
          name: 'Curated Selections',
        })
        .select('id')
        .single();

      if (createError) {
        console.warn('WishlistService: Error creating user wishlist:', createError.message);
        return null;
      }

      return created.id;
    } catch (err) {
      console.warn('WishlistService unexpected error in getOrCreateUserWishlist:', err);
      return null;
    }
  }

  /**
   * Fetch user's wishlist items with joined product, category, and atelier details
   */
  static async getUserWishlist(userId: string): Promise<Wishlist | null> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return null;

    try {
      const wishlistId = await this.getOrCreateUserWishlist(userId);
      if (!wishlistId) return null;

      const { data: items, error } = await supabase
        .from('wishlist_items')
        .select(`
          id,
          wishlist_id,
          product_id,
          created_at,
          product:products(
            id,
            seller_id,
            category_id,
            name,
            slug,
            description,
            base_price,
            currency,
            status,
            featured,
            hero_image,
            images,
            created_at,
            updated_at,
            category:categories(*),
            seller:sellers(id, business_name, country, verification_status)
          )
        `)
        .eq('wishlist_id', wishlistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('WishlistService: Error fetching items:', error.message);
        return null;
      }

      // Transform joined items
      const formattedItems: WishlistItem[] = (items || []).map((item: any) => ({
        id: item.id,
        wishlist_id: item.wishlist_id,
        product_id: item.product_id,
        product: item.product as Product,
        created_at: item.created_at,
      }));

      return {
        id: wishlistId,
        user_id: userId,
        name: 'Curated Selections',
        items: formattedItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('WishlistService unexpected error in getUserWishlist:', err);
      return null;
    }
  }

  /**
   * Add a product to the user's wishlist
   */
  static async addToWishlist(userId: string, productId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return false;

    try {
      const wishlistId = await this.getOrCreateUserWishlist(userId);
      if (!wishlistId) return false;

      const { error } = await supabase
        .from('wishlist_items')
        .upsert(
          {
            wishlist_id: wishlistId,
            product_id: productId,
          },
          { onConflict: 'wishlist_id,product_id' }
        );

      if (error) {
        console.warn('WishlistService: Error inserting wishlist item:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('WishlistService unexpected error in addToWishlist:', err);
      return false;
    }
  }

  /**
   * Remove a product from the user's wishlist
   */
  static async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return false;

    try {
      const wishlistId = await this.getOrCreateUserWishlist(userId);
      if (!wishlistId) return false;

      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', wishlistId)
        .eq('product_id', productId);

      if (error) {
        console.warn('WishlistService: Error deleting wishlist item:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('WishlistService unexpected error in removeFromWishlist:', err);
      return false;
    }
  }

  /**
   * Clear all items in user's wishlist
   */
  static async clearWishlist(userId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return false;

    try {
      const wishlistId = await this.getOrCreateUserWishlist(userId);
      if (!wishlistId) return false;

      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', wishlistId);

      if (error) {
        console.warn('WishlistService: Error clearing wishlist:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('WishlistService unexpected error in clearWishlist:', err);
      return false;
    }
  }
}
