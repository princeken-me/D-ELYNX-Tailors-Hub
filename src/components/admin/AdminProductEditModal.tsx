import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Image as ImageIcon, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product, ProductStatus } from '../../types/ecommerce';
import { AdminGovernanceService } from '../../services/admin.service';
import { Button } from '../ui/Button';

interface AdminProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
}

const CATEGORY_OPTIONS = [
  { id: 'cat-bespoke-suits', name: 'Bespoke Suiting & Tailoring' },
  { id: 'cat-evening-gowns', name: 'Haute Couture Evening Wear' },
  { id: 'cat-outerwear', name: 'Luxury Overcoats & Trench' },
  { id: 'cat-accessories', name: 'Sartorial Accessories & Silk' },
  { id: 'cat-traditional-bespoke', name: 'Traditional & Ceremonial Bespoke' },
];

export const AdminProductEditModal: React.FC<AdminProductEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !product) return null;

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || '');
  const [basePrice, setBasePrice] = useState(product.base_price.toString());
  const [currency, setCurrency] = useState(product.currency || 'NGN');
  const [categoryId, setCategoryId] = useState(product.category_id || CATEGORY_OPTIONS[0].id);
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [featured, setFeatured] = useState<boolean>(Boolean(product.featured));
  const [heroImage, setHeroImage] = useState(product.hero_image || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setBasePrice(product.base_price.toString());
      setCurrency(product.currency || 'NGN');
      setCategoryId(product.category_id || CATEGORY_OPTIONS[0].id);
      setStatus(product.status);
      setFeatured(Boolean(product.featured));
      setHeroImage(product.hero_image || '');
      setError(null);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product title is required.');
      return;
    }

    const priceNum = parseFloat(basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please provide a valid non-negative base price.');
      return;
    }

    setSaving(true);
    setError(null);

    const selectedCategory = CATEGORY_OPTIONS.find((c) => c.id === categoryId);

    const updates: Partial<Product> = {
      name: name.trim(),
      description: description.trim(),
      base_price: priceNum,
      currency,
      category_id: categoryId,
      status,
      featured,
      hero_image: heroImage.trim() || undefined,
      category: selectedCategory
        ? {
            id: selectedCategory.id,
            name: selectedCategory.name,
            slug: selectedCategory.id.replace('cat-', ''),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : product.category,
    };

    try {
      const res = await AdminGovernanceService.updateProduct(product.id, updates);
      if (res.success && res.product) {
        onSuccess(res.product);
        onClose();
      } else {
        setError(res.error || 'Failed to update garment listing.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error updating garment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-amber-500/30 shadow-2xl p-6 sm:p-8 space-y-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Control Center & Management • Front-End Edit</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-zinc-100 mt-1">
              Edit Garment Listing
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Authoritatively update marketplace catalog content, pricing, and availability.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Garment Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Piece / Garment Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category & Price Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Fashion Discipline / Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Base Retail Price ({currency}) *
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Status & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
              >
                <option value="active">Active (Visible in Marketplace)</option>
                <option value="draft">Draft (Unpublished)</option>
                <option value="archived">Archived (Delisted)</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div className="pt-5 sm:pt-4">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-400"
                />
                <span className="font-semibold text-amber-300">Feature on Homepage Curations</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Garment Description & Craftsmanship Details
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Hero Image URL & Preview */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Hero Image URL
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
              />
              {heroImage && (
                <img
                  src={heroImage}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Catalog...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
