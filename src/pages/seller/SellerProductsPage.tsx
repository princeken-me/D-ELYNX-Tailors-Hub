import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  Loader2,
  Layers,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import {
  SellerCatalogService,
  SellerRecord,
  CreateProductInput,
} from '../../services/seller-catalog.service';
import { CatalogService } from '../../services/catalog.service';
import { Product, Category, ProductStatus } from '../../types/ecommerce';
import { LoadingState } from '../../components/feedback/LoadingState';
import { SellerStudioLayout } from '../../components/seller/SellerStudioLayout';
import { EditProductModal } from '../../components/seller/EditProductModal';

export const SellerProductsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [seller, setSeller] = useState<SellerRecord | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit and Status state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [statusChangingProductId, setStatusChangingProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for Product Creation
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPrice, setFormPrice] = useState('350000');
  const [formCurrency, setFormCurrency] = useState('NGN');
  const [formStatus, setFormStatus] = useState<ProductStatus>('active');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formHeroImage, setFormHeroImage] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formSize, setFormSize] = useState('EU 50 / US 40R');
  const [formColor, setFormColor] = useState('Midnight Navy');
  const [formMaterial, setFormMaterial] = useState('Super 150s Merino Wool');
  const [formInitialStock, setFormInitialStock] = useState('5');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const effectiveUserId = user?.id || profile?.id || profile?.auth_user_id;
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      const [sellerProfile, cats] = await Promise.all([
        SellerCatalogService.getSellerProfile(effectiveUserId),
        CatalogService.getCategories(),
      ]);
      setSeller(sellerProfile);
      setCategories(cats);

      if (sellerProfile) {
        const prods = await SellerCatalogService.getSellerProducts(sellerProfile.id);
        setProducts(prods);
      }
    } catch (err: any) {
      console.error('Error loading seller products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !seller) return;

    setUploadingImage(true);
    try {
      const res = await SellerCatalogService.uploadGarmentImage(file, seller.id);
      if (res.success && res.url) {
        setFormHeroImage(res.url);
        setNotification({ type: 'success', text: 'Image uploaded to garment storage bucket.' });
      } else {
        setNotification({ type: 'error', text: res.error || 'Upload failed.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Upload failed.' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    setSubmitting(true);
    try {
      const input: CreateProductInput = {
        name: formName,
        description: formDescription,
        category_id: formCategoryId || (categories[0]?.id ?? ''),
        base_price: parseFloat(formPrice) || 0,
        currency: formCurrency,
        status: formStatus,
        featured: formFeatured,
        hero_image: formHeroImage.trim() || null,
        variants: [
          {
            sku: formSku.trim() || `AT-${Date.now().toString().slice(-6)}`,
            size: formSize.trim(),
            color: formColor.trim(),
            material: formMaterial.trim(),
            initial_stock: parseInt(formInitialStock, 10) || 1,
          },
        ],
      };

      const res = await SellerCatalogService.createProduct(seller.id, input);
      if (res.success) {
        setNotification({ type: 'success', text: 'Product listing successfully created.' });
        setModalOpen(false);
        // Reset form
        setFormName('');
        setFormDescription('');
        setFormHeroImage('');
        setFormSku('');
        await loadData();
      } else {
        setNotification({ type: 'error', text: res.error || 'Failed to create listing.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to create listing.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (productId: string, newStatus: ProductStatus) => {
    if (!seller) return;
    setStatusChangingProductId(productId);
    try {
      const res = await SellerCatalogService.updateProduct(productId, seller.id, { status: newStatus });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
        );
        setNotification({
          type: 'success',
          text: `Garment listing status changed to "${newStatus}".`,
        });
      } else {
        setNotification({
          type: 'error',
          text: res.error || 'Failed to update garment status.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to update garment status.',
      });
    } finally {
      setStatusChangingProductId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!seller || !deleteConfirmProduct) return;
    setIsDeleting(true);
    try {
      const res = await SellerCatalogService.deleteProduct(deleteConfirmProduct.id, seller.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteConfirmProduct.id));
        setNotification({ type: 'success', text: `"${deleteConfirmProduct.name}" removed from atelier catalog.` });
        setDeleteConfirmProduct(null);
      } else {
        setNotification({ type: 'error', text: res.error || 'Failed to delete listing.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete listing.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setNotification({
      type: 'success',
      text: `Garment listing "${updatedProduct.name}" updated successfully.`,
    });
  };

  return (
    <SellerStudioLayout
      sellerName={seller?.business_name}
      isVerified={seller?.verification_status === 'verified'}
      actions={
        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          id="btn-create-garment"
        >
          Create Garment Listing
        </Button>
      }
    >
      <div className="space-y-8">
        <div>
          <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
                Product & Garment Catalog
              </span>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
                Atelier Listings
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Publish and manage tailored garments with variants and inventory on the Supabase catalog.
              </p>
            </div>
          </div>
        </div>

      {/* In-app Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-zinc-200 ml-4"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Listings Table */}
      {loading ? (
        <LoadingState label="Loading Atelier Catalog..." />
      ) : products.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-zinc-200">No Listings Published</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Your atelier has no garments published yet. Tap the button below to add your first handcrafted piece.
          </p>
          <Button
            size="sm"
            className="mt-5"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Garment Listing
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (md and above) */}
          <div className="hidden md:block rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 font-serif text-[10px] uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Garment Title</th>
                  <th className="px-5 py-3.5">Discipline</th>
                  <th className="px-5 py-3.5">Base Price</th>
                  <th className="px-5 py-3.5">Variants</th>
                  <th className="px-5 py-3.5">Publishing Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-5 py-4 font-medium text-zinc-100 font-serif">
                      <div className="flex items-center gap-3">
                        {item.hero_image ? (
                          <img
                            src={item.hero_image}
                            alt=""
                            className="w-10 h-12 rounded-lg object-cover border border-zinc-800 bg-black"
                          />
                        ) : (
                          <div className="w-10 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-zinc-100">{item.name}</span>
                          <span className="block text-[10px] font-mono text-zinc-500">
                            slug: {item.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400">{item.category?.name || 'Unassigned'}</td>
                    <td className="px-5 py-4 font-serif font-bold text-zinc-200">
                      {(() => {
                        const itemCur = item.currency || 'NGN';
                        return new Intl.NumberFormat(itemCur === 'NGN' ? 'en-NG' : 'en-US', {
                          style: 'currency',
                          currency: itemCur,
                          maximumFractionDigits: 0,
                        }).format(item.base_price);
                      })()}
                    </td>
                    <td className="px-5 py-4 text-zinc-400 font-mono text-[11px]">
                      {item.variants?.length || 0} variant(s)
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {statusChangingProductId === item.id ? (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          <select
                            value={item.status}
                            onChange={(e) => handleQuickStatusChange(item.id, e.target.value as ProductStatus)}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition focus:outline-none ${
                              item.status === 'active'
                                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                : item.status === 'draft'
                                ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
                                : item.status === 'out_of_stock'
                                ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                                : 'bg-red-950/70 border-red-500/40 text-red-300'
                            }`}
                            title="Change publishing status"
                            id={`select-status-${item.id}`}
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="out_of_stock">Out of Stock</option>
                            <option value="archived">Archived</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingProduct(item);
                          setEditModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-300 border border-zinc-700 text-xs font-medium transition cursor-pointer"
                        title="Edit Garment Details"
                        id={`btn-edit-${item.id}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <Link
                        to={`/product/${item.slug}`}
                        className="inline-block p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 transition"
                        title="View on Marketplace"
                        id={`link-view-${item.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirmProduct(item)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 transition cursor-pointer"
                        title="Delete Listing"
                        id={`btn-delete-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (< md) */}
          <div className="block md:hidden space-y-4">
            {products.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4 shadow-sm"
              >
                {/* Header: Thumbnail + Title + Price */}
                <div className="flex items-start gap-3">
                  {item.hero_image ? (
                    <img
                      src={item.hero_image}
                      alt=""
                      className="w-16 h-20 rounded-xl object-cover border border-zinc-800 bg-black shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-20 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-serif">
                      {item.category?.name || 'Unassigned'}
                    </span>
                    <h3 className="font-serif font-bold text-zinc-100 text-sm leading-snug truncate">
                      {item.name}
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                      slug: {item.slug}
                    </p>
                    <p className="font-serif font-bold text-amber-400 text-sm mt-1.5">
                      {(() => {
                        const itemCur = item.currency || 'NGN';
                        return new Intl.NumberFormat(itemCur === 'NGN' ? 'en-NG' : 'en-US', {
                          style: 'currency',
                          currency: itemCur,
                          maximumFractionDigits: 0,
                        }).format(item.base_price);
                      })()}
                    </p>
                  </div>
                </div>

                {/* Status & Variants bar */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 font-medium">Status:</span>
                    {statusChangingProductId === item.id ? (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <select
                        value={item.status}
                        onChange={(e) => handleQuickStatusChange(item.id, e.target.value as ProductStatus)}
                        className={`text-xs px-2 py-1 rounded-lg border font-medium cursor-pointer transition focus:outline-none ${
                          item.status === 'active'
                            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                            : item.status === 'draft'
                            ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
                            : item.status === 'out_of_stock'
                            ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                            : 'bg-red-950/70 border-red-500/40 text-red-300'
                        }`}
                        id={`select-status-mobile-${item.id}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="archived">Archived</option>
                      </select>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-zinc-500" />
                    {item.variants?.length || 0} variant(s)
                  </span>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => {
                      setEditingProduct(item);
                      setEditModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-300 border border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition min-h-[44px] cursor-pointer"
                    id={`btn-edit-mobile-${item.id}`}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Garment</span>
                  </button>
                  <Link
                    to={`/product/${item.slug}`}
                    className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-amber-400 flex items-center justify-center min-h-[44px] min-w-[44px]"
                    title="View Marketplace Listing"
                    id={`link-view-mobile-${item.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteConfirmProduct(item)}
                    className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer"
                    title="Delete Listing"
                    id={`btn-delete-mobile-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-zinc-950 border border-zinc-800 p-6 md:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="font-serif text-xl font-bold text-zinc-100">
                Create Garment Listing
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                  Piece Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Super 160s Hand-Finished Dinner Suit"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the fabric origin, construction, canvassing, and bespoke detailing..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                    Discipline / Category *
                  </label>
                  <select
                    value={formCategoryId || (categories[0]?.id ?? '')}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                    Base Price (NGN ₦) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 font-serif">
                    Publishing Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="draft">Draft</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Garment Hero Image */}
              <div className="space-y-2 border-t border-zinc-800/80 pt-4">
                <label className="block text-zinc-300 font-semibold font-serif">
                  Garment Hero Photography
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="https://... or upload image"
                    value={formHeroImage}
                    onChange={(e) => setFormHeroImage(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </div>

              {/* Initial Variant Information */}
              <div className="border-t border-zinc-800/80 pt-4 space-y-3">
                <span className="block text-zinc-300 font-semibold font-serif">
                  Initial Variant & Inventory Allocation
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">SKU</label>
                    <input
                      type="text"
                      placeholder="e.g. AT-SUIT-40R"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Size / Cut</label>
                    <input
                      type="text"
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Color</label>
                    <input
                      type="text"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Initial Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formInitialStock}
                      onChange={(e) => setFormInitialStock(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Listing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          id="modal-delete-confirm"
        >
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-100">
                Delete Garment Listing
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-zinc-100">"{deleteConfirmProduct.name}"</span>? This will permanently remove the piece from your atelier catalog and delist it from the marketplace.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition cursor-pointer"
                id="btn-cancel-delete"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                id="btn-confirm-delete"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Listing</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editModalOpen && editingProduct && seller && (
        <EditProductModal
          product={editingProduct}
          sellerId={seller.id}
          categories={categories}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
    </SellerStudioLayout>
  );
};
