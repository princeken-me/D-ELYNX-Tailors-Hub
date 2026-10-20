import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, CartItem, Product, ProductVariant } from '../types/ecommerce';
import { useAuth } from './AuthContext';
import { CartService } from '../services/cart.service';
import { isSupabaseConfigured } from '../lib/supabase/client';

interface CartContextType {
  cart: Cart;
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const INITIAL_CART: Cart = {
  id: 'cart_local_init',
  currency: 'NGN',
  items: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const [cart, setCart] = useState<Cart>(() => {
    try {
      const saved = localStorage.getItem('delynx_cart');
      return saved ? JSON.parse(saved) : INITIAL_CART;
    } catch {
      return INITIAL_CART;
    }
  });

  // Sync with Supabase on user auth change
  const syncWithSupabase = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    try {
      setIsSyncing(true);
      const remoteCart = await CartService.getUserCart(user.id);
      if (remoteCart) {
        setCart(remoteCart);
      }
    } catch (err) {
      console.warn('CartContext: Failed to sync with Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      syncWithSupabase();
    }
  }, [user, syncWithSupabase]);

  // Persist to localStorage for guests / offline support
  useEffect(() => {
    localStorage.setItem('delynx_cart', JSON.stringify(cart));
  }, [cart]);

  const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cart.items.reduce(
    (acc, item) => acc + item.unit_price * item.quantity,
    0
  );

  const addItem = async (
    product: Product,
    variant?: ProductVariant,
    quantity: number = 1
  ) => {
    const price = variant?.price_override ?? product.base_price;
    const existingIdx = cart.items.findIndex(
      (i) => i.product_id === product.id && i.variant_id === (variant?.id ?? null)
    );

    let newItems: CartItem[];
    if (existingIdx > -1) {
      newItems = [...cart.items];
      newItems[existingIdx] = {
        ...newItems[existingIdx],
        quantity: newItems[existingIdx].quantity + quantity,
        updated_at: new Date().toISOString(),
      };
    } else {
      const newItem: CartItem = {
        id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        cart_id: cart.id,
        product_id: product.id,
        variant_id: variant?.id ?? null,
        quantity,
        unit_price: price,
        product,
        variant,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      newItems = [...cart.items, newItem];
    }

    setCart((prev) => ({
      ...prev,
      currency: product.currency || prev.currency || 'NGN',
      items: newItems,
      updated_at: new Date().toISOString(),
    }));

    if (user && isSupabaseConfigured) {
      await CartService.addCartItem(
        user.id,
        product.id,
        variant?.id || null,
        quantity,
        price
      );
    }
  };

  const removeItem = async (itemId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
      updated_at: new Date().toISOString(),
    }));

    if (user && isSupabaseConfigured) {
      await CartService.removeCartItem(itemId);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, quantity, updated_at: new Date().toISOString() } : i
      ),
      updated_at: new Date().toISOString(),
    }));

    if (user && isSupabaseConfigured) {
      await CartService.updateCartItemQuantity(itemId, quantity);
    }
  };

  const clearCart = async () => {
    setCart({
      ...INITIAL_CART,
      id: `cart_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (user && isSupabaseConfigured) {
      await CartService.clearCart(user.id);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isSyncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
