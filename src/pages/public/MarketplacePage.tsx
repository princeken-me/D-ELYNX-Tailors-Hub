import React, { useEffect, useState, useTransition, useMemo } from 'react';
import {
  Search,
  X,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
  Check,
  Tag,
} from 'lucide-react';
import { CatalogService } from '../../services/catalog.service';
import { Product, Category } from '../../types/ecommerce';
import { ProductCard } from '../../components/ui/ProductCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useRouter } from '../../lib/router/RouterContext';

export const MarketplacePage: React.FC = () => {
  const { query, navigate } = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(query.get('cat') || 'all');
  const [searchQuery, setSearchQuery] = useState(query.get('q') || '');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_stock'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sync state when URL query params change (e.g. from header search or category click)
  useEffect(() => {
    const urlCat = query.get('cat');
    const urlQ = query.get('q');
    if (urlCat !== null) {
      setSelectedCategory(urlCat);
    }
    if (urlQ !== null) {
      setSearchQuery(urlQ);
    }
  }, [query]);

  const loadData = async (catSlug: string, queryText: string) => {
    try {
      setLoading(true);
      setError(null);

      const targetCategory = catSlug === 'all' ? undefined : catSlug;

      if (queryText.trim()) {
        const results = await CatalogService.searchProducts(queryText, targetCategory);
        setProducts(results);
      } else {
        const [cats, prods] = await Promise.all([
          CatalogService.getCategories(),
          CatalogService.getProducts(targetCategory),
        ]);
        setCategories(cats);
        setProducts(prods);
      }
    } catch (err: any) {
      console.error('MarketplacePage load error:', err);
      setError(err?.message || 'Failed to load marketplace products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedCategory, searchQuery);
  }, [selectedCategory]);

  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        loadData(selectedCategory, searchQuery);
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    navigate(`/marketplace?cat=${encodeURIComponent(slug)}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setAvailabilityFilter('all');
    setVerifiedOnly(false);
    setMaxPrice('');
    setSortBy('featured');
    navigate('/marketplace');
  };

  // Find price bounds from loaded products
  const highestPriceInCatalog = useMemo(() => {
    if (products.length === 0) return 5000;
    return Math.max(...products.map((p) => p.base_price));
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (availabilityFilter === 'in_stock') {
      result = result.filter((p) => p.status !== 'out_of_stock');
    }

    if (verifiedOnly) {
      result = result.filter((p) => p.seller?.verification_status === 'verified');
    }

    if (typeof maxPrice === 'number' && maxPrice > 0) {
      result = result.filter((p) => p.base_price <= maxPrice);
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.base_price - b.base_price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.base_price - a.base_price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [products, availabilityFilter, verifiedOnly, maxPrice, sortBy]);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    availabilityFilter !== 'all' ||
    verifiedOnly ||
    maxPrice !== '';

  return (
    <div className="space-y-6">
      {/* 1. Marketplace Top Banner / Breadcrumb & Controls */}
      <div className="border-b border-[#27272A] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
            Marketplace Catalog
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Browse verified garments, bespoke tailoring, and accessories from global artisans
          </p>
        </div>

        {/* Total Results Count & Mobile Filter Trigger */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <span className="text-xs text-zinc-400">
            <strong className="text-zinc-100 font-semibold">{filteredAndSortedProducts.length}</strong> products found
          </span>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden px-3 py-1.5 rounded-lg bg-[#121215] border border-[#27272A] text-xs font-semibold text-zinc-200 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121215] p-3 rounded-xl border border-[#27272A]">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-marketplace-search"
            type="text"
            placeholder="Filter by keyword, title, fabric..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-400 hidden sm:inline">Sort:</span>
          <select
            id="select-marketplace-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort products"
            className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Product Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 3. Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 text-[11px]">Applied filters:</span>

          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#121215] border border-[#D4AF37]/50 text-amber-300 text-[11px]">
              <span>Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
              <button onClick={() => handleCategorySelect('all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#121215] border border-zinc-700 text-zinc-300 text-[11px]">
              <span>Search: "{searchQuery}"</span>
              <button onClick={() => setSearchQuery('')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {availabilityFilter === 'in_stock' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#121215] border border-zinc-700 text-zinc-300 text-[11px]">
              <span>In Stock Only</span>
              <button onClick={() => setAvailabilityFilter('all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {verifiedOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#121215] border border-zinc-700 text-zinc-300 text-[11px]">
              <span>Verified Sellers Only</span>
              <button onClick={() => setVerifiedOnly(false)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {typeof maxPrice === 'number' && maxPrice > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#121215] border border-zinc-700 text-zinc-300 text-[11px]">
              <span>Under ${maxPrice}</span>
              <button onClick={() => setMaxPrice('')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleResetFilters}
            className="text-[11px] text-[#D4AF37] hover:underline ml-1 cursor-pointer font-medium"
          >
            Clear All
          </button>
        </div>
      )}

      {/* 4. Main Catalog Layout: Left Sidebar Filters (Desktop) + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block md:col-span-1 space-y-5 bg-[#121215] p-4 rounded-xl border border-[#27272A]">
          {/* Categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#D4AF37] text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategorySelect(c.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                    selectedCategory === c.slug
                      ? 'bg-[#D4AF37] text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#27272A] pt-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Availability
            </h3>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={availabilityFilter === 'in_stock'}
                onChange={(e) => setAvailabilityFilter(e.target.checked ? 'in_stock' : 'all')}
                className="rounded border-zinc-700 bg-zinc-900 text-[#D4AF37] focus:ring-0 cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>

          <div className="border-t border-[#27272A] pt-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Seller Verification
            </h3>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-[#D4AF37] focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <span>Verified Ateliers</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              </span>
            </label>
          </div>

          <div className="border-t border-[#27272A] pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Max Price
              </h3>
              {maxPrice !== '' && (
                <button
                  onClick={() => setMaxPrice('')}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">$</span>
              <input
                type="number"
                placeholder={`Up to ${highestPriceInCatalog}`}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </aside>

        {/* Product Grid (md:col-span-3 lg:col-span-4) */}
        <div className="md:col-span-3 lg:col-span-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-between text-xs text-red-200 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => loadData(selectedCategory, searchQuery)}
                className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 ml-4 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {loading ? (
            <LoadingState label="Loading marketplace products..." />
          ) : filteredAndSortedProducts.length === 0 ? (
            <EmptyState
              title="No Products Found"
              description={
                searchQuery
                  ? `No products matched "${searchQuery}". Try modifying your search or clearing active filters.`
                  : 'No garments matched your selected criteria. Reset filters to explore all collections.'
              }
              actionLabel="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            /* 2 cols mobile, 3 tablet, 4 desktop/xl */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Mobile Filter Drawer / Bottom Sheet */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#09090B] border-l border-[#27272A] h-full flex flex-col p-5 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
                <span>Marketplace Filters</span>
              </h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    handleCategorySelect('all');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                    selectedCategory === 'all'
                      ? 'bg-[#D4AF37] text-zinc-950 font-bold'
                      : 'text-zinc-300 bg-[#121215]'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      handleCategorySelect(c.slug);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                      selectedCategory === c.slug
                        ? 'bg-[#D4AF37] text-zinc-950 font-bold'
                        : 'text-zinc-300 bg-[#121215]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Availability */}
            <div className="space-y-2 border-t border-[#27272A] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Availability
              </h3>
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={availabilityFilter === 'in_stock'}
                  onChange={(e) => setAvailabilityFilter(e.target.checked ? 'in_stock' : 'all')}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#D4AF37]"
                />
                <span>In Stock Only</span>
              </label>
            </div>

            {/* Mobile Verified Sellers */}
            <div className="space-y-2 border-t border-[#27272A] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Sellers
              </h3>
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#D4AF37]"
                />
                <span>Verified Ateliers Only</span>
              </label>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-6 border-t border-[#27272A] flex items-center gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl border border-[#27272A] text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-zinc-950 font-bold text-xs"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
