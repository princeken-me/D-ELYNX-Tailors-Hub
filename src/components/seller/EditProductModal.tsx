import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
  Trash2,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Product, ProductStatus, Category } from '../../types/ecommerce';
import { SellerCatalogService } from '../../services/seller-catalog.service';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sanitizeInput } from '../../lib/security/validation';

interface EditProductModalProps {
  product: Product;
  sellerId: string;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  sellerId,
  categories,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Form fields
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || '');
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [basePrice, setBasePrice] = useState(product.base_price.toString());
  const [currency, setCurrency] = useState(product.currency || 'NGN');
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [featured, setFeatured] = useState(Boolean(product.featured));
  const [heroImage, setHeroImage] = useState<string | null>(product.hero_image || null);
  const [galleryImages, setGalleryImages] = useState<string[]>(product.images || []);

  // UI States
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Sync state if product changes
  useEffect(() => {
    setName(product.name);
    setDescription(product.description || '');
    setCategoryId(product.category_id);
    setBasePrice(product.base_price.toString());
    setCurrency(product.currency || 'NGN');
    setStatus(product.status);
    setFeatured(Boolean(product.featured));
    setHeroImage(product.hero_image || null);
    setGalleryImages(product.images || []);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowDiscardConfirm(false);
  }, [product]);

  if (!isOpen) return null;

  // Check if form is dirty
  const isDirty =
    name !== product.name ||
    description !== (product.description || '') ||
    categoryId !== product.category_id ||
    basePrice !== product.base_price.toString() ||
    currency !== (product.currency || 'NGN') ||
    status !== product.status ||
    featured !== Boolean(product.featured) ||
    heroImage !== (product.hero_image || null) ||
    JSON.stringify(galleryImages) !== JSON.stringify(product.images || []);

  const handleRequestClose = () => {
    if (isDirty && !showDiscardConfirm) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  // Upload hero image
  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHero(true);
    setErrorMessage(null);

    const res = await SellerCatalogService.uploadGarmentImage(file, sellerId);
    setIsUploadingHero(false);

    if (!res.success || !res.url) {
      setErrorMessage(res.error || 'Failed to upload hero image.');
      return;
    }

    setHeroImage(res.url);
  };

  // Upload gallery image
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingGallery(true);
    setErrorMessage(null);

    const res = await SellerCatalogService.uploadGarmentImage(file, sellerId);
    setIsUploadingGallery(false);

    if (!res.success || !res.url) {
      setErrorMessage(res.error || 'Failed to upload gallery image.');
      return;
    }

    setGalleryImages((prev) => [...prev, res.url!]);
  };

  // Remove gallery image
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setGalleryImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Set gallery image as hero
  const handleMakeHeroImage = (url: string) => {
    // swap: old hero goes into gallery if it exists and isn't already there
    const oldHero = heroImage;
    setHeroImage(url);
    if (oldHero && !galleryImages.includes(oldHero)) {
      setGalleryImages((prev) => [...prev.filter((u) => u !== url), oldHero]);
    } else {
      setGalleryImages((prev) => prev.filter((u) => u !== url));
    }
  };

  // Form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const cleanName = sanitizeInput(name.trim());
    if (!cleanName) {
      setErrorMessage('Garment title cannot be empty.');
      return;
    }

    const numPrice = Number(basePrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage('Base price must be a valid non-negative number.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Please select a valid sartorial category.');
      return;
    }

    setIsSaving(true);

    const updatePayload = {
      name: cleanName,
      description: sanitizeInput(description.trim()),
      category_id: categoryId,
      base_price: numPrice,
      currency: currency.toUpperCase().slice(0, 3),
      status,
      featured,
      hero_image: heroImage,
      images: galleryImages,
    };

    const res = await SellerCatalogService.updateProduct(product.id, sellerId, updatePayload);
    setIsSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update garment listing.');
      return;
    }

    setSuccessMessage('Listing updated successfully.');

    // Construct updated product object to return
    const updatedCategory = categories.find((c) => c.id === categoryId) || product.category;
    const updatedProduct: Product = {
      ...product,
      ...updatePayload,
      category: updatedCategory,
      updated_at: new Date().toISOString(),
    };

    setTimeout(() => {
      onSuccess(updatedProduct);
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      id="modal-edit-product"
    >
      <div className="w-full max-w-3xl rounded-2xl sm:rounded-3xl bg-zinc-950 border border-zinc-800 p-5 sm:p-8 space-y-6 my-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
                Atelier Catalog
              </span>
              <Badge
                variant={
                  status === 'active'
                    ? 'success'
                    : status === 'draft'
                    ? 'neutral'
                    : 'danger'
                }
              >
                {status}
              </Badge>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
              Edit Garment Listing
            </h2>
            <p className="text-xs text-zinc-400">
              Refine handcrafted garment details, media assets, and commercial status.
            </p>
          </div>
          <button
            onClick={handleRequestClose}
            className="text-zinc-400 hover:text-zinc-100 p-2 rounded-lg hover:bg-zinc-900 transition"
            title="Close editor"
            id="btn-close-edit-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Discard Changes Confirmation */}
        {showDiscardConfirm && (
          <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Unsaved changes detected</span>
            </div>
            <p className="text-zinc-300">
              You have modified this listing without saving. Are you sure you want to discard your edits?
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-100 font-medium transition cursor-pointer"
                id="btn-confirm-discard"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition cursor-pointer"
                id="btn-cancel-discard"
              >
                Continue Editing
              </button>
            </div>
          </div>
        )}

        {/* Notification alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl border bg-red-950/80 border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl border bg-emerald-950/80 border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-6 text-xs" id="form-edit-product">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-semibold text-zinc-200 uppercase tracking-wider border-b border-zinc-900 pb-2">
              1. Basic Garment Information
            </h3>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                Piece Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Super 160s Double-Breasted Midnight Dinner Suit"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 transition"
                id="input-edit-product-name"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                Sartorial Discipline / Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 transition"
                id="select-edit-product-category"
              >
                <option value="" disabled>Select category discipline</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                Description & Sartorial Notes *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe fabric mill provenance, cut, hand-canvassing details, and tailoring craftsmanship..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 transition resize-y"
                id="textarea-edit-product-desc"
              />
            </div>
          </div>

          {/* Section 2: Commerce & Pricing */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-semibold text-zinc-200 uppercase tracking-wider border-b border-zinc-900 pb-2">
              2. Commercial Pricing & Currency
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                  Base Price *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono transition"
                  id="input-edit-product-price"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                  Currency Code
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono transition"
                  id="select-edit-product-currency"
                >
                  <option value="NGN">NGN (Nigerian Naira - ₦)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                  <option value="GBP">GBP (British Pound - £)</option>
                  <option value="EUR">EUR (Euro - €)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Product Media */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="font-serif text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                3. Garment Imagery & Atelier Media
              </h3>
              <span className="text-[10px] text-zinc-500">Max 10MB JPG, PNG, WEBP</span>
            </div>

            {/* Hero Image */}
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Primary Hero Showcase Image
                </span>
                {heroImage && (
                  <button
                    type="button"
                    onClick={() => setHeroImage(null)}
                    className="text-[11px] text-red-400 hover:text-red-300 transition"
                  >
                    Remove Hero
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {heroImage ? (
                  <div className="relative group w-24 h-32 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-black">
                    <img
                      src={heroImage}
                      alt="Hero preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-32 rounded-lg border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-600 shrink-0 bg-zinc-900/50">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">No hero</span>
                  </div>
                )}

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-3">
                    <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium cursor-pointer transition flex items-center gap-2 text-xs">
                      {isUploadingHero ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingHero ? 'Uploading...' : 'Upload New Hero'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={handleHeroFileUpload}
                        disabled={isUploadingHero}
                        id="input-upload-hero"
                      />
                    </label>
                  </div>
                  <div>
                    <input
                      type="url"
                      placeholder="Or enter direct image URL (https://...)"
                      value={heroImage || ''}
                      onChange={(e) => setHeroImage(e.target.value.trim() || null)}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Images */}
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif font-semibold text-zinc-200">
                  Additional Gallery Images ({galleryImages.length})
                </span>
                <label className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium cursor-pointer transition flex items-center gap-1.5 text-xs">
                  {isUploadingGallery ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  <span>{isUploadingGallery ? 'Uploading...' : 'Add Gallery Photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={handleGalleryFileUpload}
                    disabled={isUploadingGallery}
                    id="input-upload-gallery"
                  />
                </label>
              </div>

              {galleryImages.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic py-2">
                  No additional gallery photos attached. Add photos to showcase seam close-ups and lining.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-lg overflow-hidden border border-zinc-800 bg-black aspect-[3/4]"
                    >
                      <img
                        src={imgUrl}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                        <button
                          type="button"
                          onClick={() => handleMakeHeroImage(imgUrl)}
                          className="self-start px-2 py-1 rounded bg-amber-500/90 text-black text-[10px] font-bold hover:bg-amber-400 transition"
                          title="Set as hero image"
                        >
                          Make Hero
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="self-end p-1 rounded bg-red-900/80 text-red-200 hover:bg-red-800 transition"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Publishing Status & Visibility */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-semibold text-zinc-200 uppercase tracking-wider border-b border-zinc-900 pb-2">
              4. Publishing Status & Showcase Controls
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                  Catalog Publishing Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 font-medium transition"
                  id="select-edit-product-status"
                >
                  <option value="draft">Draft (Private to atelier)</option>
                  <option value="active">Active (Published on marketplace)</option>
                  <option value="out_of_stock">Out of Stock (Temporarily unavailable)</option>
                  <option value="archived">Archived (Delisted from catalog)</option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {status === 'active' && 'Visible to all discerning clients browsing the marketplace.'}
                  {status === 'draft' && 'Private to your atelier while crafting and preparing listings.'}
                  {status === 'out_of_stock' && 'Retains catalog presence while indicating zero allocation.'}
                  {status === 'archived' && 'Delisted permanently unless reactivated.'}
                </p>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 cursor-pointer hover:bg-zinc-900/70 transition">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-zinc-700 bg-zinc-800"
                    id="checkbox-edit-featured"
                  />
                  <div>
                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Featured in Atelier Showcase
                    </span>
                    <span className="block text-[10px] text-zinc-400">
                      Highlight this flagship piece in curated collections.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Associated Variants (Read-Only Inspection) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="font-serif text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                Linked Garment Variants ({product.variants?.length || 0})
              </h3>
              <span className="text-[10px] text-zinc-500">
                Inventory managed via Studio Inventory
              </span>
            </div>

            {!product.variants || product.variants.length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic">
                No distinct size or bespoke color variants attached to this listing.
              </p>
            ) : (
              <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden">
                {product.variants.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 flex items-center justify-between text-[11px] hover:bg-zinc-900/50 transition"
                  >
                    <div>
                      <span className="font-mono font-medium text-zinc-300">{v.sku}</span>
                      <span className="text-zinc-500 ml-2">
                        {[v.size, v.color, v.material].filter(Boolean).join(' • ') || 'Standard Cut'}
                      </span>
                    </div>
                    <div className="font-mono text-zinc-400">
                      {v.inventory ? (
                        <span>{v.inventory.quantity_available} units in vault</span>
                      ) : (
                        <span className="text-zinc-600">Stock unallocated</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium transition cursor-pointer text-xs"
              id="btn-cancel-edit"
            >
              Cancel
            </button>
            <Button
              type="submit"
              size="md"
              disabled={isSaving}
              isLoading={isSaving}
              id="btn-save-edit-product"
              className="w-full sm:w-auto font-medium"
            >
              {isSaving ? 'Saving Changes...' : 'Save Garment Listing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
