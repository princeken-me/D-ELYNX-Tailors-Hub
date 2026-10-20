import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Scissors,
  Globe,
  Truck,
  Sparkles,
  Award,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { CatalogService } from '../../services/catalog.service';
import { Product, Category } from '../../types/ecommerce';
import { ProductCard } from '../../components/ui/ProductCard';
import { LoadingState } from '../../components/feedback/LoadingState';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodList, catList] = await Promise.all([
          CatalogService.getProducts(),
          CatalogService.getCategories(),
        ]);
        setProducts(prodList);
        setCategories(catList);
      } catch (err) {
        console.error('Failed to load marketplace home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Split products for commercial sections
  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.featured).slice(0, 10);
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 10);
  }, [products]);

  // Distinct sellers from catalog for the Verified Ateliers showcase
  const uniqueSellers = useMemo(() => {
    const sellersMap = new Map<string, any>();
    products.forEach((p) => {
      if (p.seller && !sellersMap.has(p.seller.id)) {
        sellersMap.set(p.seller.id, p.seller);
      }
    });
    return Array.from(sellersMap.values()).slice(0, 4);
  }, [products]);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* 1. COMPACT E-COMMERCE HERO & PROMOTION */}
      <section className="relative rounded-2xl overflow-hidden border border-[#27272A] bg-gradient-to-r from-[#121215] via-[#16161c] to-[#121215] p-5 sm:p-8 md:p-10">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Global Fashion & Tailoring Marketplace</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-100 leading-tight">
            Order Bespoke Suiting, Luxury Ready-to-Wear & Textiles Direct from Certified Ateliers
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Connect directly with verified tailors, fashion designers, and textile mills worldwide. Order custom-fitted garments or ready collections with guaranteed delivery.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/marketplace"
              id="hero-shop-all-btn"
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c59b27] text-zinc-950 font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-md cursor-pointer min-h-[44px]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop All Products</span>
            </Link>

            <Link
              to="/network"
              id="hero-explore-tailors-btn"
              className="px-5 py-2.5 rounded-xl bg-[#121215] hover:bg-zinc-800 text-zinc-200 border border-[#27272A] hover:border-[#D4AF37]/50 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Scissors className="w-4 h-4 text-[#D4AF37]" />
              <span>Find Verified Tailors</span>
            </Link>

            <Link
              to="/signup"
              id="hero-seller-register-btn"
              className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-amber-300 text-xs font-medium transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <span>Sell Your Designs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Assurance Badges */}
        <div className="mt-6 pt-5 border-t border-[#27272A] grid grid-cols-2 sm:grid-cols-4 gap-3 text-zinc-400 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span className="truncate">Verified Designers & Tailors</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span className="truncate">Global Doorstep Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span className="truncate">Bespoke Fit Guarantees</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span className="truncate">Secure International Escrow</span>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CATEGORIES TILES */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                Shop by Category
              </h2>
              <p className="text-xs text-zinc-400">
                Browse our specialized tailoring and apparel categories
              </p>
            </div>
            <Link
              to="/marketplace"
              className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/marketplace?cat=${category.slug}`}
                id={`cat-card-${category.slug}`}
                className="group p-4 rounded-xl bg-[#121215] border border-[#27272A] hover:border-[#D4AF37]/60 hover:bg-zinc-900/80 transition-all flex items-center justify-between"
              >
                <div className="space-y-1 truncate pr-2">
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-[#D4AF37] transition-colors block truncate">
                    {category.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Explore collection
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-[#D4AF37] transition-colors">
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#D4AF37]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. TRENDING / FEATURED PRODUCTS (2 cols mobile, 3 tablet, 4 desktop, 5 xl) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                Trending Now
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100 mt-1">
              Featured Garments & Tailoring
            </h2>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            <span>See All Products</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Loading featured products..." />
        ) : featuredProducts.length === 0 && products.length === 0 ? (
          <div className="p-8 text-center bg-[#121215] rounded-xl border border-[#27272A] text-zinc-400 text-xs">
            No products available currently. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {(featuredProducts.length > 0 ? featuredProducts : products.slice(0, 10)).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. FEATURED TAILORS & DESIGNERS */}
      {uniqueSellers.length > 0 && (
        <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-[#121215] border border-[#27272A]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                Certified Fashion Designers & Tailors
              </h2>
              <p className="text-xs text-zinc-400">
                Commission custom pieces directly from master craftspeople
              </p>
            </div>
            <Link
              to="/network"
              className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              <span>View Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {uniqueSellers.map((seller) => (
              <div
                key={seller.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5 hover:border-[#D4AF37]/50 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-zinc-900 border border-[#D4AF37]/40 flex items-center justify-center font-bold text-[#D4AF37] text-sm shrink-0">
                  {seller.business_name.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {seller.business_name}
                    </span>
                    {seller.verification_status === 'verified' && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" title="Verified" />
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 block truncate">
                    {seller.country || 'Global Atelier'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. NEW ARRIVALS & POPULAR PRODUCTS */}
      {products.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                New Arrivals
              </h2>
              <p className="text-xs text-zinc-400">
                Freshly listed garments, bespoke releases, and accessories
              </p>
            </div>
            <Link
              to="/marketplace"
              className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              <span>Explore Marketplace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {newArrivals.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. PLATFORM VALUE PROPOSITION & TRUST */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#121215] border border-[#27272A] space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100">
            The Professional Fashion Marketplace
          </h2>
          <p className="text-xs text-zinc-400">
            D-ELYNX ensures seamless cross-border commerce for independent fashion houses, tailors, and garment buyers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-xs font-bold text-zinc-200">100% Verified Sellers</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Every tailor, designer, and textile mill is rigorously vetted for quality standards and authentic craftsmanship.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
            <Truck className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-xs font-bold text-zinc-200">Doorstep Global Shipping</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Integrated cross-border logistics ensure safe tracked delivery from local ateliers to global customers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
            <Scissors className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-xs font-bold text-zinc-200">Custom Sizing Guarantee</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Provide your exact dimensions for bespoke fit adjustments directly with the master cutter.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-xs font-bold text-zinc-200">Escrow Payment Protection</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Funds are held securely until your order is fulfilled, verified, and delivered to your satisfaction.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
