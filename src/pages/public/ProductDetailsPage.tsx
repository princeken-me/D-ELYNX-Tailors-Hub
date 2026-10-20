import React, { useEffect, useState } from 'react';
import { useRouter, Link } from '../../lib/router/RouterContext';
import { CatalogService, ProductAvailabilityResult } from '../../services/catalog.service';
import { Product, ProductVariant } from '../../types/ecommerce';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { AdminGovernanceService } from '../../services/admin.service';
import { AdminProductEditModal } from '../../components/admin/AdminProductEditModal';
import { AdminDeleteConfirmModal } from '../../components/admin/AdminDeleteConfirmModal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ProductCard } from '../../components/ui/ProductCard';
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
  Edit3,
  Trash2,
  Shield,
} from 'lucide-react';

export const ProductDetailsPage: React.FC = () => {
  const { path, navigate } = useRouter();
  // Extract slug from /product/:slug
  const slug = path.replace('/product/', '').split('/')[0] || 'ikoyi-super-160s-midnight-dinner-suit';

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { profile } = useAuth();
  const isAdmin = profile?.professional_role === 'admin' || profile?.professional_role === 'super_admin';

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState<ProductAvailabilityResult>({
    status: 'In Stock',
    inStock: true,
  });
  const [addedNotification, setAddedNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping'>('description');

  // Admin Front-End Management State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const item = await CatalogService.getProductBySlug(slug);
        setProduct(item);

        if (item && item.variants && item.variants.length > 0) {
          const firstVariant = item.variants[0];
          setSelectedVariant(firstVariant);
          checkStockForVariant(firstVariant.id, item.status);
        } else if (item) {
          checkStockForVariant(undefined, item.status);
        }

        // Load related products
        const related = await CatalogService.getProducts();
        setRelatedProducts(related.filter((p) => p.id !== item?.id).slice(0, 4));
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const checkStockForVariant = async (variantId?: string, fallbackStatus = product?.status) => {
    try {
      const avail = await CatalogService.getProductAvailability(variantId, fallbackStatus);
      setAvailability(avail);
    } catch {
      setAvailability({ status: 'In Stock', inStock: true });
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    checkStockForVariant(variant.id, product?.status);
  };

  if (loading) {
    return <LoadingState label="Loading product details..." />;
  }

  if (!product) {
    return (
      <div className="text-center py-20 bg-[#121215] rounded-2xl border border-[#27272A] p-8 max-w-lg mx-auto my-12">
        <h2 className="text-xl font-bold text-zinc-100">Product Not Found</h2>
        <p className="text-xs text-zinc-400 mt-2">
          The requested garment or fabric could not be found in our catalog.
        </p>
        <Link
          to="/marketplace"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-zinc-950 font-bold text-xs"
        >
          <span>Return to Marketplace</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);

  // Price calculation
  const currentPrice = selectedVariant?.price_override ?? product.base_price;
  const currencyCode = product.currency || 'USD';
  const formattedPrice = new Intl.NumberFormat(currencyCode === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(currentPrice);

  // Aggregated images
  const allImages = [
    ...(product.hero_image ? [product.hero_image] : []),
    ...(product.images || []),
  ];
  const currentDisplayImage = allImages[activeImageIndex] || product.hero_image;

  const handleAddToCart = async () => {
    if (!availability.inStock) return;
    await addItem(product, selectedVariant || undefined, quantity);
    setAddedNotification(true);
    setTimeout(() => setAddedNotification(false), 3000);
  };

  const handleBuyNow = async () => {
    if (!availability.inStock) return;
    await addItem(product, selectedVariant || undefined, quantity);
    navigate('/account/cart');
  };

  const handleProductUpdated = (updated: Product) => {
    setProduct(updated);
    setAdminFeedback(`"${updated.name}" updated successfully in catalog!`);
    setTimeout(() => setAdminFeedback(null), 4000);
  };

  const handleConfirmDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      const res = await AdminGovernanceService.deleteProduct(product.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        navigate('/marketplace');
      } else {
        alert(res.error || 'Failed to delete piece');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Admin Front-End Management Bar */}
      {isAdmin && (
        <div
          id="admin-frontend-management-bar"
          className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  Control Center & Management
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    product.status === 'active'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {product.status}
                </span>
                {product.featured && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-zinc-950">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Front-end controls: edit metadata, change prices, update availability, or delete listing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-admin-edit-piece"
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 hover:text-amber-300 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Piece</span>
            </button>

            <button
              id="btn-admin-delete-piece"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-red-950/40 border border-red-800 hover:bg-red-900/50 text-red-300 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Piece</span>
            </button>
          </div>
        </div>
      )}

      {adminFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{adminFeedback}</span>
        </div>
      )}

      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-[#D4AF37] transition">Home</Link>
        <span>/</span>
        <Link to="/marketplace" className="hover:text-[#D4AF37] transition">Marketplace</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              to={`/marketplace?cat=${product.category.slug}`}
              className="hover:text-[#D4AF37] transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-zinc-200 truncate">{product.name}</span>
      </nav>

      {/* 2. Main E-Commerce Product Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Images Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#121215] border border-[#27272A] shadow-lg">
            {currentDisplayImage ? (
              <img
                src={currentDisplayImage}
                alt={product.name}
                className="h-full w-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs uppercase tracking-wider">
                No Image
              </div>
            )}

            {/* Wishlist Button on Image */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition cursor-pointer ${
                isFavorited
                  ? 'bg-[#D4AF37] text-zinc-950 shadow-md'
                  : 'bg-zinc-950/70 text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>

            {/* Status Pill */}
            <div className="absolute top-4 left-4">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                  availability.status === 'Out of Stock'
                    ? 'bg-red-950/90 text-red-300 border border-red-800'
                    : availability.status === 'Low Stock'
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                }`}
              >
                {availability.status}
              </span>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-[#D4AF37]'
                      : 'border-[#27272A] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Commercial Purchase & Conversion Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Seller */}
          <div className="space-y-2">
            {product.category && (
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
                {product.category.name}
              </span>
            )}

            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 leading-snug">
              {product.name}
            </h1>

            {/* Seller Information */}
            {product.seller && (
              <div className="flex items-center gap-2 text-xs text-zinc-300 pt-1">
                <span className="text-zinc-400">Sold by:</span>
                <span className="font-semibold text-zinc-200">{product.seller.business_name}</span>
                {product.seller.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#D4AF37] bg-amber-500/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/30 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Atelier</span>
                  </span>
                )}
                {((product.seller as any).city || product.seller.country) && (
                  <span className="text-zinc-400 text-[11px] font-medium">
                    • {(product.seller as any).city || product.seller.country}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Pricing Display */}
          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272A] flex items-baseline justify-between">
            <div>
              <span className="text-xs text-zinc-400 block mb-0.5">Price:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-100">
                {formattedPrice}
              </span>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-semibold ${
                  availability.inStock ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {availability.status}
              </span>
              <span className="text-[10px] text-zinc-500 block">Taxes calculated at checkout</span>
            </div>
          </div>

          {/* Variant Selection (Size, Color, Material) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                Select Option / Size:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between min-h-[48px] ${
                        isSelected
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-zinc-100'
                          : 'border-[#27272A] bg-[#121215] text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-semibold truncate block">
                        {v.size || v.color || v.material || v.sku}
                      </span>
                      {v.color && v.size && (
                        <span className="text-[10px] text-zinc-400 truncate block">{v.color}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Quantity:
            </span>
            <div className="flex items-center rounded-lg border border-[#27272A] bg-[#121215] overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-4 text-xs font-bold text-zinc-100 min-w-[32px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-zinc-400 hover:text-white cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Primary Purchase Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!availability.inStock}
              id="btn-add-to-cart"
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer min-h-[48px] ${
                !availability.inStock
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : addedNotification
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#D4AF37] hover:bg-[#c59b27] text-zinc-950 shadow-[#D4AF37]/20'
              }`}
            >
              {addedNotification ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!availability.inStock}
              id="btn-buy-now"
              className={`w-full py-3 px-6 rounded-xl font-bold text-xs sm:text-sm transition-colors border cursor-pointer min-h-[44px] ${
                !availability.inStock
                  ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'border-[#27272A] hover:border-[#D4AF37] bg-[#121215] hover:bg-zinc-900 text-zinc-200 hover:text-white'
              }`}
            >
              Buy Now
            </button>
          </div>

          {/* Delivery & Trust Assurances */}
          <div className="p-4 rounded-xl bg-[#121215] border border-[#27272A] space-y-3 text-xs text-zinc-300">
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-200 block">Fast Worldwide Delivery</span>
                <span className="text-[11px] text-zinc-400">Tracked shipping from verified atelier directly to your door.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-200 block">Quality & Fit Guarantee</span>
                <span className="text-[11px] text-zinc-400">Every garment is crafted to exact measurements and quality vetted.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-200 block">Easy Returns & Exchanges</span>
                <span className="text-[11px] text-zinc-400">Hassle-free return policy if sizing or quality doesn't match description.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Product Details Tabs (Description, Specifications, Shipping) */}
      <div className="border border-[#27272A] rounded-2xl bg-[#121215] overflow-hidden">
        <div className="flex border-b border-[#27272A] bg-zinc-950">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-5 py-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'description'
                ? 'border-[#D4AF37] text-amber-300 bg-[#121215]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Product Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`px-5 py-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'specifications'
                ? 'border-[#D4AF37] text-amber-300 bg-[#121215]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-5 py-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'shipping'
                ? 'border-[#D4AF37] text-amber-300 bg-[#121215]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Shipping & Returns
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed description provided for this product.'}
              </p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="max-w-2xl">
              <table className="w-full text-xs text-left">
                <tbody>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 text-zinc-400 font-medium w-1/3">Product Category</td>
                    <td className="py-2.5 text-zinc-200 font-semibold">{product.category?.name || 'Garments'}</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 text-zinc-400 font-medium">Availability Status</td>
                    <td className="py-2.5 text-zinc-200 font-semibold capitalize">{product.status.replace('_', ' ')}</td>
                  </tr>
                  {selectedVariant?.size && (
                    <tr className="border-b border-zinc-800">
                      <td className="py-2.5 text-zinc-400 font-medium">Selected Size</td>
                      <td className="py-2.5 text-zinc-200">{selectedVariant.size}</td>
                    </tr>
                  )}
                  {selectedVariant?.color && (
                    <tr className="border-b border-zinc-800">
                      <td className="py-2.5 text-zinc-400 font-medium">Color</td>
                      <td className="py-2.5 text-zinc-200">{selectedVariant.color}</td>
                    </tr>
                  )}
                  {selectedVariant?.material && (
                    <tr className="border-b border-zinc-800">
                      <td className="py-2.5 text-zinc-400 font-medium">Material Composition</td>
                      <td className="py-2.5 text-zinc-200">{selectedVariant.material}</td>
                    </tr>
                  )}
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 text-zinc-400 font-medium">Fulfillment Origin</td>
                    <td className="py-2.5 text-zinc-200">{product.seller?.country || 'Global Atelier'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-3 max-w-2xl text-xs text-zinc-300 leading-relaxed">
              <h4 className="font-bold text-zinc-100">Global Courier Logistics</h4>
              <p>
                All orders are dispatched via tracked international express courier directly from the creator's atelier. Sizing and finish undergo pre-shipment inspection.
              </p>
              <h4 className="font-bold text-zinc-100 pt-2">Return & Refund Policy</h4>
              <p>
                Standard ready-to-wear pieces may be returned within 14 days of receipt in original condition. Custom bespoke commissions include free sizing adjustments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100">
              Related Products
            </h2>
            <Link
              to="/marketplace"
              className="text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              Explore more
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Mobile Sticky Bottom Purchase Bar (Resting cleanly right above MobileNav at bottom-16) */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-[#09090B]/95 border-t border-[#27272A] p-3 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <span className="text-[10px] text-zinc-400 block leading-tight">Total Price</span>
          <span className="text-base font-bold text-zinc-100 leading-tight">
            {formattedPrice}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!availability.inStock}
          className={`py-2.5 px-6 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer min-h-[44px] ${
            !availability.inStock
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-[#D4AF37] text-zinc-950'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>

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
    </div>
  );
};
