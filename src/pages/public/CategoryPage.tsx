import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, Link } from '../../lib/router/RouterContext';
import { CatalogService } from '../../services/catalog.service';
import { Product, Category } from '../../types/ecommerce';
import { ProductCard } from '../../components/ui/ProductCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { path, navigate } = useRouter();
  // Extract slug from /marketplace/category/:slug
  const slug = path.replace('/marketplace/category/', '').split('/')[0] || 'bespoke-suits';

  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_stock'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');

  useEffect(() => {
    async function loadCategoryData() {
      setLoading(true);
      try {
        const [catData, allCats, prods] = await Promise.all([
          CatalogService.getCategoryBySlug(slug),
          CatalogService.getCategories(),
          CatalogService.getProducts({ categorySlug: slug }),
        ]);

        setCategory(catData);
        setCategories(allCats);
        setProducts(prods);
      } catch (err: any) {
        console.error('Error loading category data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryData();
  }, [slug]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (availabilityFilter === 'in_stock') {
      result = result.filter((p) => p.status !== 'out_of_stock');
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
  }, [products, availabilityFilter, sortBy]);

  if (!loading && !category) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-12">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#D4AF37] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
        <EmptyState
          title="Category Not Found"
          description={`The category "${slug}" could not be located in our catalog.`}
          actionLabel="View All Products"
          onAction={() => navigate('/marketplace')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Navigation Breadcrumb */}
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
          <Link to="/" className="hover:text-[#D4AF37] transition">Home</Link>
          <span>/</span>
          <Link to="/marketplace" className="hover:text-[#D4AF37] transition">Marketplace</Link>
          <span>/</span>
          <span className="text-zinc-200">{category?.name || 'Category'}</span>
        </nav>

        <div className="border-b border-[#27272A] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                {category?.name || 'Product Category'}
              </h1>
              {products.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#121215] border border-[#27272A] text-zinc-300">
                  {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
                </span>
              )}
            </div>
            {category?.description && (
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>

          {/* Quick Controls: Filter & Sort */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setAvailabilityFilter(availabilityFilter === 'all' ? 'in_stock' : 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer min-h-[36px] ${
                availabilityFilter === 'in_stock'
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-amber-300'
                  : 'bg-[#121215] border-[#27272A] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>In Stock Only</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-[#121215] border border-[#27272A] text-xs text-zinc-300 focus:outline-none focus:border-[#D4AF37] cursor-pointer min-h-[36px]"
              aria-label="Sort category products"
            >
              <option value="featured">Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Other Categories Lateral Navigation Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
            <span className="text-[11px] text-zinc-500 shrink-0">Other Categories:</span>
            {categories
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.id}
                  to={`/marketplace/category/${c.slug}`}
                  className="px-2.5 py-1 rounded-lg text-xs bg-[#121215] border border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 whitespace-nowrap"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* 2. Responsive Product Grid: 2 cols on mobile, 3 on tablet, 4 on desktop, 5 on xl */}
      {loading ? (
        <LoadingState label="Loading category products..." />
      ) : filteredAndSortedProducts.length === 0 ? (
        <EmptyState
          title="No Products in this Category"
          description="Sellers have not listed items in this category yet. Check back soon or browse our full catalog."
          actionLabel="View All Products"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
