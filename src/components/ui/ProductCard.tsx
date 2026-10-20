import React, { useState } from 'react';
import { Heart, ShoppingBag, ShieldCheck, Check, Edit3, Trash2 } from 'lucide-react';
import { Product } from '../../types/ecommerce';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from '../../lib/router/RouterContext';
import { AdminProductEditModal } from '../admin/AdminProductEditModal';
import { AdminDeleteConfirmModal } from '../admin/AdminDeleteConfirmModal';
import { AdminGovernanceService } from '../../services/admin.service';

export const ProductCard: React.FC<{
  product: Product;
  onProductUpdated?: (p: Product) => void;
  onProductDeleted?: (id: string) => void;
}> = ({ product: initialProduct, onProductUpdated, onProductDeleted }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { profile } = useAuth();
  const isAdmin = profile?.professional_role === 'admin' || profile?.professional_role === 'super_admin';

  const [product, setProduct] = useState<Product>(initialProduct);
  const [isDeleted, setIsDeleted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Admin front-end modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isDeleted) {
    return null;
  }

  const isFavorited = isInWishlist(product.id);

  const currencyCode = product.currency || 'NGN';
  const formattedPrice = new Intl.NumberFormat(currencyCode === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(product.base_price);

  const isOutOfStock = product.status === 'out_of_stock';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem(product, product.variants?.[0] || undefined, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleAdminEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleAdminDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleProductUpdated = (updated: Product) => {
    setProduct(updated);
    if (onProductUpdated) onProductUpdated(updated);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await AdminGovernanceService.deleteProduct(product.id);
      if (res.success) {
        setIsDeleted(true);
        if (onProductDeleted) onProductDeleted(product.id);
      } else {
        alert(res.error || 'Failed to delete piece');
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <article
        id={`product-card-${product.id}`}
        className="group relative flex flex-col rounded-xl bg-[#121215] border border-[#27272A] overflow-hidden hover:border-[#D4AF37]/60 hover:shadow-lg hover:shadow-black/40 transition-all duration-200"
      >
        {/* Product Image Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950">
          <Link to={`/product/${product.slug}`} className="block w-full h-full">
            {product.hero_image ? (
              <img
                src={product.hero_image}
                alt={product.name}
                className={`h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out ${
                  isOutOfStock ? 'opacity-50 grayscale' : ''
                }`}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs uppercase tracking-wider bg-zinc-900">
                No Image
              </div>
            )}
          </Link>

          {/* Status Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
            {product.featured && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37] text-zinc-950 shadow-sm">
                Featured
              </span>
            )}
            {product.status === 'archived' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                Archived
              </span>
            )}
            {product.status === 'draft' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
                Draft
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-800">
                Out of Stock
              </span>
            )}
          </div>

          {/* Actions: Wishlist + Admin Front-End Tools */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
            {/* Wishlist Button */}
            <button
              id={`btn-wishlist-${product.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center ${
                isFavorited
                  ? 'bg-[#D4AF37] text-zinc-950 shadow-md'
                  : 'bg-zinc-950/70 text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800'
              }`}
              aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>

            {/* Admin Quick Edit Action */}
            {isAdmin && (
              <>
                <button
                  id={`btn-admin-quick-edit-${product.id}`}
                  onClick={handleAdminEditClick}
                  className="p-2 rounded-full bg-zinc-900/90 hover:bg-amber-400 text-amber-400 hover:text-zinc-950 border border-amber-500/40 transition-all cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center shadow-md"
                  title="Admin: Edit garment details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  id={`btn-admin-quick-delete-${product.id}`}
                  onClick={handleAdminDeleteClick}
                  className="p-2 rounded-full bg-zinc-900/90 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 transition-all cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center shadow-md"
                  title="Admin: Delete listing"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="flex flex-1 flex-col p-3 sm:p-3.5 justify-between gap-2.5">
          <div className="space-y-1">
            {/* Category */}
            {product.category && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 block truncate">
                {product.category.name}
              </span>
            )}

            {/* Product Name */}
            <h3 className="text-xs sm:text-sm font-medium text-zinc-100 line-clamp-2 leading-snug group-hover:text-[#D4AF37] transition-colors">
              <Link to={`/product/${product.slug}`} id={`link-product-${product.slug}`}>
                {product.name}
              </Link>
            </h3>

            {/* Seller / Atelier with Verified Badge */}
            {product.seller && (
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate pt-0.5">
                <span className="truncate font-medium text-zinc-300">{product.seller.business_name}</span>
                {product.seller.verification_status === 'verified' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" title="Verified Atelier" />
                )}
                {((product.seller as any).city || product.seller.country) && (
                  <span className="text-zinc-500 text-[10px] truncate shrink-0">
                    • {((product.seller as any).city || product.seller.country).split(',')[0]}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Price & Add to Cart Action */}
          <div className="pt-2 border-t border-[#27272A] flex items-center justify-between gap-2">
            <div>
              <span className="text-sm sm:text-base font-bold text-zinc-100 block leading-tight">
                {formattedPrice}
              </span>
              <span className="text-[9px] text-emerald-400 block font-medium">
                {isOutOfStock ? 'Sold out' : 'In Stock'}
              </span>
            </div>

            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              id={`btn-quick-add-${product.id}`}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[34px] ${
                isOutOfStock
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#121215] hover:bg-[#D4AF37] text-zinc-200 hover:text-zinc-950 border border-[#27272A] hover:border-[#D4AF37]'
              }`}
              title="Add to shopping cart"
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* Admin Modals */}
      {isAdmin && (
        <>
          <AdminProductEditModal
            product={product}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleProductUpdated}
          />
          <AdminDeleteConfirmModal
            product={product}
            isOpen={isDeleteModalOpen}
            isDeleting={isDeleting}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </>
  );
};
