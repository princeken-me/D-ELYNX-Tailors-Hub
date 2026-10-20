import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Cart, CartItem, Product, ProductVariant } from '../types/ecommerce';

/**
 * Supabase Cart Service
 * Manages customer cart storage and line items on Supabase PostgreSQL.
 * Strict preparation phase: NO payment, NO checkout.
 * Recalculates subtotal on display. RLS ensures users only access their own cart.
 */
export class CartService {
  /**
   * Get or create the authenticated user's active cart
   */
  static async getOrCreateUserCart(userId: string): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return null;

    try {
      const { data: existing, error: fetchError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('CartService: Error fetching cart:', fetchError.message);
      }

      const { data: created, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: userId,
          currency: 'NGN',
        })
        .select('id')
        .single();

      if (createError) {
        console.warn('CartService: Error creating cart:', createError.message);
        return null;
      }

      return created.id;
    } catch (err) {
      console.warn('CartService unexpected error in getOrCreateUserCart:', err);
      return null;
    }
  }

  /**
   * Fetch active cart and line items for the user
   */
  static async getUserCart(userId: string): Promise<Cart | null> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return null;

    try {
      const cartId = await this.getOrCreateUserCart(userId);
      if (!cartId) return null;

      const { data: items, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          cart_id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          created_at,
          updated_at,
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
          ),
          variant:product_variants(*)
        `)
        .eq('cart_id', cartId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('CartService: Error fetching cart items:', error.message);
        return null;
      }

      const formattedItems: CartItem[] = (items || []).map((item: any) => ({
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        product: item.product as Product,
        variant: item.variant as ProductVariant | undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return {
        id: cartId,
        user_id: userId,
        currency: 'NGN',
        items: formattedItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('CartService unexpected error in getUserCart:', err);
      return null;
    }
  }

  /**
   * Add an item to user's cart or increment quantity if matching variant exists
   */
  static async addCartItem(
    userId: string,
    productId: string,
    variantId: string | null,
    quantity: number,
    unitPrice: number
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return false;

    try {
      const cartId = await this.getOrCreateUserCart(userId);
      if (!cartId) return false;

      // Check if line item already exists
      let query = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId);

      if (variantId) {
        query = query.eq('variant_id', variantId);
      } else {
        query = query.is('variant_id', null);
      }

      const { data: existingItem } = await query.maybeSingle();

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            unit_price: unitPrice,
          })
          .eq('id', existingItem.id);

        if (updateError) {
          console.warn('CartService: Error updating item quantity:', updateError.message);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            variant_id: variantId || null,
            quantity: Math.max(1, quantity),
            unit_price: unitPrice,
          });

        if (insertError) {
          console.warn('CartService: Error inserting cart item:', insertError.message);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.warn('CartService unexpected error in addCartItem:', err);
      return false;
    }
  }

  /**
   * Update quantity of a cart item
   */
  static async updateCartItemQuantity(cartItemId: string, quantity: number): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return false;

    try {
      if (quantity <= 0) {
        return this.removeCartItem(cartItemId);
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) {
        console.warn('CartService: Error updating quantity:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('CartService unexpected error in updateCartItemQuantity:', err);
      return false;
    }
  }

  /**
   * Remove a single item from cart
   */
  static async removeCartItem(cartItemId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return false;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        console.warn('CartService: Error deleting cart item:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('CartService unexpected error in removeCartItem:', err);
      return false;
    }
  }

  /**
   * Clear all items in user's cart
   */
  static async clearCart(userId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return false;

    try {
      const cartId = await this.getOrCreateUserCart(userId);
      if (!cartId) return false;

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        console.warn('CartService: Error clearing cart items:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('CartService unexpected error in clearCart:', err);
      return false;
    }
  }
}
