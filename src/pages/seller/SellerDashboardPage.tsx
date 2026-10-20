import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  ShoppingBag,
  ArrowUpRight,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { SellerCatalogService, SellerRecord } from '../../services/seller-catalog.service';
import { OrderService } from '../../services/order.service';
import { Product, Order } from '../../types/ecommerce';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { SellerStudioLayout } from '../../components/seller/SellerStudioLayout';

export const SellerDashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [seller, setSeller] = useState<SellerRecord | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const effectiveUserId = user?.id || profile?.id || profile?.auth_user_id;
      if (!effectiveUserId) {
        setError('Authentication credentials not detected. Please sign in as an authorized atelier or seller.');
        setLoading(false);
        return;
      }

      // 1. Retrieve seller profile
      const sellerProfile = await SellerCatalogService.getSellerProfile(effectiveUserId);
      setSeller(sellerProfile);

      if (sellerProfile) {
        // 2. Concurrently fetch seller-owned products and seller-relevant orders
        const [sellerProducts, sellerOrders] = await Promise.all([
          SellerCatalogService.getSellerProducts(sellerProfile.id),
          OrderService.getSellerOrders(sellerProfile.id),
        ]);

        setProducts(sellerProducts);
        setOrders(sellerOrders);
      } else {
        setProducts([]);
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Error loading seller dashboard metrics:', err);
      setError(err?.message || 'Unable to synchronize atelier metrics. Please verify network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, profile]);

  if (loading) {
    return (
      <SellerStudioLayout
        title="Seller Dashboard"
        subtitle="Synchronizing atelier catalog, inventory allocations, and client commissions..."
      >
        <LoadingState
          label="Loading Atelier Studio"
          sublabel="Retrieving verified seller metrics and inventory status..."
        />
      </SellerStudioLayout>
    );
  }

  if (error) {
    return (
      <SellerStudioLayout
        title="Seller Dashboard"
        subtitle="Atelier synchronization status"
      >
        <ErrorState
          title="Atelier Data Service Interruption"
          message={error}
          onRetry={loadDashboardData}
        />
      </SellerStudioLayout>
    );
  }

  // --- Real Metric Computations (No fabricated statistics) ---
  // Products
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const draftProducts = products.filter((p) => p.status === 'draft').length;

  // Variants & Inventory
  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      ...v,
      productName: p.name,
    }))
  );
  const totalVariants = allVariants.length;
  const lowStockCount = allVariants.filter(
    (v) => v.inventory && v.inventory.quantity_available <= (v.inventory.reorder_threshold ?? 5)
  ).length;

  // Orders
  const totalOrders = orders.length;
  const activeFulfillmentOrders = orders.filter((o) =>
    ['processing', 'in_production', 'ready_for_dispatch', 'shipped'].includes(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === 'delivered').length;

  // Formatted currency helper
  const formatAmount = (amount: number, currency = 'NGN') => {
    return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isCompletelyEmpty = totalProducts === 0 && totalOrders === 0;

  return (
    <SellerStudioLayout
      sellerName={seller?.business_name}
      isVerified={seller?.verification_status === 'verified'}
      actions={
        <Link
          to="/seller/products"
          id="btn-new-listing"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition cursor-pointer inline-flex items-center gap-1.5 min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Listing</span>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Products */}
          <Link
            to="/seller/products"
            id="metric-card-products"
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/40 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-zinc-400 text-xs font-serif">
                <span className="font-semibold uppercase tracking-wider text-zinc-300">
                  Products & Garments
                </span>
                <Package className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-100">
                {totalProducts}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {activeProducts} active • {draftProducts} draft
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-amber-300 transition-colors">
              <span>View catalog listings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Orders */}
          <Link
            to="/seller/orders"
            id="metric-card-orders"
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/40 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-zinc-400 text-xs font-serif">
                <span className="font-semibold uppercase tracking-wider text-zinc-300">
                  Orders & Commissions
                </span>
                <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-100">
                {totalOrders}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {activeFulfillmentOrders} in fulfillment • {completedOrders} completed
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-amber-300 transition-colors">
              <span>Fulfillment queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Inventory */}
          <Link
            to="/seller/inventory"
            id="metric-card-inventory"
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/40 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-zinc-400 text-xs font-serif">
                <span className="font-semibold uppercase tracking-wider text-zinc-300">
                  Tracked Variants & Stock
                </span>
                <Layers className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-100">
                {totalVariants}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {lowStockCount > 0 ? (
                  <Badge variant="warning" className="text-[10px] py-0.5">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {lowStockCount} Low Stock
                  </Badge>
                ) : (
                  <span className="text-xs text-zinc-400">Inventory levels synchronized</span>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-amber-300 transition-colors">
              <span>View stock allocations</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Empty State Banner if no products or orders */}
        {isCompletelyEmpty && (
          <EmptyState
            id="seller-empty-state"
            icon={Package}
            title="Welcome to Your Atelier Studio"
            description="Your atelier catalog does not have any garment listings or client orders yet. Publish your bespoke designs to begin accepting commissions."
            actionLabel="Create First Garment Listing"
            onAction={() => {
              window.location.href = '/seller/products';
            }}
          />
        )}

        {/* Quick Links / Studio Section Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Link
            to="/seller/products"
            id="link-seller-products"
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group"
          >
            <div>
              <Package className="w-5 h-5 text-amber-400 mb-2" />
              <h3 className="font-serif text-base font-semibold text-zinc-100 group-hover:text-amber-300">
                Product & Garment Management
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Create and manage listings, size grading, hero media, and pricing.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-300">
              <span>Open Studio</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/seller/inventory"
            id="link-seller-inventory"
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group"
          >
            <div>
              <Layers className="w-5 h-5 text-amber-400 mb-2" />
              <h3 className="font-serif text-base font-semibold text-zinc-100 group-hover:text-amber-300">
                Inventory & Yardage Stock
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Stock levels, fabric meters in reserve, and reorder thresholds.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-300">
              <span>Open Inventory</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/seller/orders"
            id="link-seller-orders"
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group"
          >
            <div>
              <ShoppingBag className="w-5 h-5 text-amber-400 mb-2" />
              <h3 className="font-serif text-base font-semibold text-zinc-100 group-hover:text-amber-300">
                Orders & Commissions
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Fulfillment queue, measurement sheets, and dispatch tracking.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-300">
              <span>Open Orders</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Live Recent Orders Section (Rendered only if actual orders exist) */}
        {orders.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-semibold text-zinc-100">
                  Recent Atelier Orders
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Live orders containing your atelier's handcrafted items.
                </p>
              </div>
              <Link
                to="/seller/orders"
                className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium"
              >
                <span>View All ({orders.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 bg-zinc-950/40 font-serif text-[10px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-800/20 transition">
                      <td className="px-4 py-3 font-mono font-medium text-amber-300">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3">
                        {order.items?.length || 1} item(s)
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-100">
                        {formatAmount(order.total, order.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            order.status === 'delivered'
                              ? 'success'
                              : order.status === 'cancelled'
                              ? 'error'
                              : 'warning'
                          }
                          className="text-[10px]"
                        >
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live Recent Garments Section (Rendered only if actual products exist) */}
        {products.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-semibold text-zinc-100">
                  Active Catalogue Releases
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Garments currently in your atelier catalogue.
                </p>
              </div>
              <Link
                to="/seller/products"
                className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium"
              >
                <span>Manage All ({products.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.slice(0, 3).map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 flex gap-3 items-center"
                >
                  {prod.hero_image ? (
                    <img
                      src={prod.hero_image}
                      alt={prod.name}
                      className="w-14 h-14 rounded-lg object-cover bg-zinc-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif text-xs font-semibold text-zinc-100 truncate">
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-amber-400 font-mono mt-0.5">
                      {formatAmount(prod.base_price, prod.currency)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant={prod.status === 'active' ? 'success' : 'default'}
                        className="text-[9px] py-0 px-1.5"
                      >
                        {prod.status}
                      </Badge>
                      <span className="text-[10px] text-zinc-500">
                        {prod.variants?.length || 0} variant(s)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SellerStudioLayout>
  );
};
