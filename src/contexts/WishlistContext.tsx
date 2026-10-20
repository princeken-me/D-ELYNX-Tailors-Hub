import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Wishlist, WishlistItem } from '../types/ecommerce';
import { useAuth } from './AuthContext';
import { WishlistService } from '../services/wishlist.service';
import { isSupabaseConfigured } from '../lib/supabase/client';

interface WishlistContextType {
  wishlist: Wishlist;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isSyncing: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const INITIAL_WISHLIST: Wishlist = {
  id: 'wl_local_init',
  user_id: 'usr_guest',
  name: 'Curated Selections',
  items: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const [wishlist, setWishlist] = useState<Wishlist>(() => {
    try {
      const saved = localStorage.getItem('delynx_wishlist');
      return saved ? JSON.parse(saved) : INITIAL_WISHLIST;
    } catch {
      return INITIAL_WISHLIST;
    }
  });

  // Sync with Supabase on user auth change
  const syncWithSupabase = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    try {
      setIsSyncing(true);
      const remoteWishlist = await WishlistService.getUserWishlist(user.id);
      if (remoteWishlist) {
        setWishlist(remoteWishlist);
      }
    } catch (err) {
      console.warn('WishlistContext: Failed to sync with Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      syncWithSupabase();
    }
  }, [user, syncWithSupabase]);

  // Save to localStorage for offline / guest browsing
  useEffect(() => {
    localStorage.setItem('delynx_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const isInWishlist = (productId: string) => {
    return wishlist.items.some((i) => i.product_id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    const exists = wishlist.items.some((i) => i.product_id === product.id);

    if (exists) {
      // Optimistic local update
      setWishlist((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.product_id !== product.id),
        updated_at: new Date().toISOString(),
      }));

      if (user && isSupabaseConfigured) {
        await WishlistService.removeFromWishlist(user.id, product.id);
      }
    } else {
      const newItem: WishlistItem = {
        id: `wli_${Date.now()}`,
        wishlist_id: wishlist.id,
        product_id: product.id,
        product,
        created_at: new Date().toISOString(),
      };

      setWishlist((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
        updated_at: new Date().toISOString(),
      }));

      if (user && isSupabaseConfigured) {
        await WishlistService.addToWishlist(user.id, product.id);
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlist((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.product_id !== productId),
      updated_at: new Date().toISOString(),
    }));

    if (user && isSupabaseConfigured) {
      await WishlistService.removeFromWishlist(user.id, productId);
    }
  };

  const clearWishlist = async () => {
    setWishlist((prev) => ({
      ...prev,
      items: [],
      updated_at: new Date().toISOString(),
    }));

    if (user && isSupabaseConfigured) {
      await WishlistService.clearWishlist(user.id);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        isSyncing,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
