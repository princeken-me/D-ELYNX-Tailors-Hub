import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  Search,
  Filter,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { Badge } from '../../components/ui/Badge';
import { CatalogService } from '../../services/catalog.service';
import { AdminGovernanceService } from '../../services/admin.service';
import { Product } from '../../types/ecommerce';
import { LoadingState } from '../../components/feedback/LoadingState';
import { AdminProductEditModal } from '../../components/admin/AdminProductEditModal';
import { AdminDeleteConfirmModal } from '../../components/admin/AdminDeleteConfirmModal';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit and Delete Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAdminProducts = async () => {
    setLoading(true);
    try {
      const items = await CatalogService.getProducts();
      setProducts(items);
    } catch (err) {
      console.error('AdminProductsPage error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminProducts();
  }, []);

  const handleStatusToggle = async (product: Product) => {
    setActionInProgress(product.id);
    setFeedback(null);
    const newStatus = product.status === 'active' ? 'archived' : 'active';
    try {
      const res = await AdminGovernanceService.updateProductStatus(product.id, newStatus);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Garment status updated to '${newStatus}'.`,
        });
        await loadAdminProducts();
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Failed to update product status.',
        });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleProductUpdated = (updated: Product) => {
    setFeedback({
      type: 'success',
      text: `Successfully updated "${updated.name}".`,
    });
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const res = await AdminGovernanceService.deleteProduct(deletingProduct.id);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Successfully deleted "${deletingProduct.name}" from catalog.`,
        });
        setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
        setDeletingProduct(null);
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Failed to delete piece.',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.seller?.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="admin-products-page" className="space-y-8">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Hub</span>
        </Link>

        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
              Catalogue Moderation & Quality Standard
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Global Product Governance
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time oversight of garments, bespoke pieces, and atelier listings across the marketplace.
            </p>
          </div>

          <button
            onClick={loadAdminProducts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:text-white transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by piece title, maison, or category..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Pieces</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading Global Product Database..." />
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30 text-xs text-zinc-400">
          No products found matching criteria.
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/60 font-serif text-[10px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3.5">Piece Title</th>
                <th className="px-5 py-3.5">Atelier House</th>
                <th className="px-5 py-3.5">Discipline</th>
                <th className="px-5 py-3.5">Base Price</th>
                <th className="px-5 py-3.5">Variants</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-4 font-medium text-zinc-100 font-serif">
                    <div className="flex items-center gap-2.5">
                      {p.hero_image && (
                        <img
                          src={p.hero_image}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-7 h-9 rounded object-cover border border-zinc-800"
                        />
                      )}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-400">
                    {p.seller?.business_name || 'Independent Atelier'}
                  </td>
                  <td className="px-5 py-4 text-zinc-400">{p.category?.name || 'Unassigned'}</td>
                  <td className="px-5 py-4 font-serif font-bold text-zinc-200">
                    {(() => {
                      const cur = p.currency || 'NGN';
                      return new Intl.NumberFormat(cur === 'NGN' ? 'en-NG' : 'en-US', {
                        style: 'currency',
                        currency: cur,
                        maximumFractionDigits: 0,
                      }).format(p.base_price);
                    })()}
                  </td>
                  <td className="px-5 py-4 text-zinc-400 font-mono text-[11px]">
                    {p.variants?.length || 0} variant(s)
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/product/${p.slug}`}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition"
                        title="Inspect piece in storefront"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
                        title="Edit garment details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingProduct(p)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                        title="Delete garment listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        disabled={actionInProgress === p.id}
                        onClick={() => handleStatusToggle(p)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                          p.status === 'active'
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-rose-300'
                            : 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/40'
                        }`}
                      >
                        {actionInProgress === p.id ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : p.status === 'active' ? (
                          'Archive'
                        ) : (
                          'Publish'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Edit Modal */}
      <AdminProductEditModal
        product={editingProduct}
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSuccess={handleProductUpdated}
      />

      {/* Admin Delete Confirmation Modal */}
      <AdminDeleteConfirmModal
        product={deletingProduct}
        isOpen={Boolean(deletingProduct)}
        isDeleting={isDeleting}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
