import React, { useState } from 'react';
import { Heart, Trash2, ShoppingBag, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { Link, useRouter } from '../../lib/router/RouterContext';
import { EmptyState } from '../../components/feedback/EmptyState';

export const WishlistPage: React.FC = () => {
  const { navigate } = useRouter();
  const { wishlist, removeFromWishlist, clearWishlist, isSyncing } = useWishlist();
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleAddToCart = (product: any) => {
    if (!product || product.status === 'out_of_stock') return;
    addItem(product, product.variants?.[0] || undefined, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Breadcrumb */}
      <div>
        <Link
          to="/account"
          id="btn-back-account-from-wishlist"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#D4AF37] transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </Link>

        <div className="border-b border-[#27272A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
                My Wishlist
              </h1>
              {isSyncing && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse">
                  Syncing...
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Saved garments, custom tailoring options, and fabrics for future purchase.
            </p>
          </div>

          {wishlist.items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs text-zinc-500 hover:text-red-400 transition cursor-pointer self-start sm:self-auto"
            >
              Clear All Items
            </button>
          )}
        </div>
      </div>

      {/* 2. Empty State */}
      {wishlist.items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="You haven't saved any items yet. Explore the marketplace to find pieces from independent ateliers and master tailors worldwide."
          actionLabel="Explore Marketplace"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        /* 3. Product-Focused Grid: 2 cols on mobile, 3 on tablet, 4 on desktop */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {wishlist.items.map((item) => {
            const product = item.product;
            if (!product) return null;

            const currencyCode = product.currency || 'NGN';
            const formattedPrice = new Intl.NumberFormat(currencyCode === 'NGN' ? 'en-NG' : 'en-US', {
              style: 'currency',
              currency: currencyCode,
              maximumFractionDigits: 0,
            }).format(product.base_price);

            const isOutOfStock = product.status === 'out_of_stock';
            const justAdded = addedIds[product.id];

            return (
              <div
                key={item.id}
                id={`wishlist-item-${item.id}`}
                className="group relative rounded-xl bg-[#121215] border border-[#27272A] overflow-hidden flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950">
                  {product.hero_image ? (
                    <Link to={`/product/${product.slug}`} className="block w-full h-full">
                      <img
                        src={product.hero_image}
                        alt={product.name}
                        className={`h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ${
                          isOutOfStock ? 'opacity-50 grayscale' : ''
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
                      No Image
                    </div>
                  )}

                  {/* Stock Badge */}
                  <div className="absolute top-2 left-2 pointer-events-none">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/90 text-red-300 border border-red-800">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-800">
                        In Stock
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-red-400 transition cursor-pointer backdrop-blur-md min-h-[32px] min-w-[32px] flex items-center justify-center"
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content & Actions */}
                <div className="p-3 flex flex-1 flex-col justify-between gap-2.5">
                  <div className="space-y-1">
                    {product.category && (
                      <span className="text-[10px] uppercase text-zinc-400 font-medium tracking-wider block truncate">
                        {product.category.name}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">
                      <Link
                        to={`/product/${product.slug}`}
                        className="hover:text-[#D4AF37] transition-colors"
                      >
                        {product.name}
                      </Link>
                    </h3>
                    {product.seller && (
                      <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                        <span>{product.seller.business_name}</span>
                        {product.seller.verification_status === 'verified' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                        )}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#27272A] flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-zinc-100">
                      {formattedPrice}
                    </span>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[34px] ${
                        isOutOfStock
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : justAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#D4AF37] hover:bg-[#c59b27] text-zinc-950'
                      }`}
                    >
                      {justAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
