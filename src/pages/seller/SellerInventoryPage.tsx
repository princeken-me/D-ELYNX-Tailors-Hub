import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '../../lib/router/RouterContext';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Package,
  Lock,
  ArrowUpRight,
  TrendingDown,
  AlertCircle,
  XCircle,
  Plus,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SellerStudioLayout } from '../../components/seller/SellerStudioLayout';
import { AdjustStockModal } from '../../components/seller/AdjustStockModal';
import { useAuth } from '../../contexts/AuthContext';
import {
  SellerCatalogService,
  SellerRecord,
  SellerInventoryItem,
} from '../../services/seller-catalog.service';

export const SellerInventoryPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [seller, setSeller] = useState<SellerRecord | null>(null);
  const [inventoryItems, setInventoryItems] = useState<SellerInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  // Stock Adjustment Modal
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<SellerInventoryItem | null>(null);

  const loadData = async (isManualRefresh = false) => {
    const effectiveUserId = user?.id || profile?.id || profile?.auth_user_id;
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const sellerProfile = await SellerCatalogService.getSellerProfile(effectiveUserId);
      setSeller(sellerProfile);

      if (sellerProfile) {
        const items = await SellerCatalogService.getSellerInventory(sellerProfile.id);
        setInventoryItems(items);
      } else {
        setInventoryItems([]);
      }
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError('Unable to load atelier inventory allocations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, profile]);

  const handleManualSync = () => {
    loadData(true);
    setNotification({
      type: 'info',
      text: 'Synchronizing stock allocations with PostgreSQL vault ledger...',
    });
    setTimeout(() => {
      setNotification((prev) => (prev?.type === 'info' ? null : prev));
    }, 2500);
  };

  const handleAdjustmentSuccess = (updatedItem: SellerInventoryItem, message: string) => {
    setInventoryItems((prev) =>
      prev.map((item) => (item.variant_id === updatedItem.variant_id ? updatedItem : item))
    );
    setNotification({
      type: 'success',
      text: message,
    });
    setTimeout(() => {
      setNotification((prev) => (prev?.type === 'success' ? null : prev));
    }, 6000);
  };

  // Distinct products for filter dropdown
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, string>();
    inventoryItems.forEach((item) => {
      if (!map.has(item.product_id)) {
        map.set(item.product_id, item.product_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [inventoryItems]);

  // Filtered inventory list
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      // 1. Search filter (garment name, sku, size, color, material)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.product_name.toLowerCase().includes(q);
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesSize = (item.size || '').toLowerCase().includes(q);
        const matchesColor = (item.color || '').toLowerCase().includes(q);
        const matchesMaterial = (item.material || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesSize && !matchesColor && !matchesMaterial) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // 3. Product filter
      if (productFilter !== 'all' && item.product_id !== productFilter) {
        return false;
      }

      return true;
    });
  }, [inventoryItems, searchQuery, statusFilter, productFilter]);

  // Aggregate Metrics
  const totalTrackedVariants = inventoryItems.length;
  const totalAvailableUnits = inventoryItems.reduce((acc, curr) => acc + curr.quantity_available, 0);
  const totalReservedUnits = inventoryItems.reduce((acc, curr) => acc + curr.quantity_reserved, 0);
  const totalVaultUnits = totalAvailableUnits + totalReservedUnits;
  const lowStockCount = inventoryItems.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = inventoryItems.filter((i) => i.status === 'out_of_stock').length;

  return (
    <SellerStudioLayout
      sellerName={seller?.business_name}
      isVerified={seller?.verification_status === 'verified'}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleManualSync}
            disabled={refreshing || loading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            id="btn-sync-inventory"
          >
            {refreshing ? 'Synchronizing...' : 'Sync Inventory'}
          </Button>
          <Link to="/seller/products">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Layers className="w-3.5 h-3.5" />}
              id="btn-nav-products"
            >
              Garment Catalog
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Header Title */}
        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-semibold">
              Atelier Vault Allocation & Logistics
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Inventory & Stock Management
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Authoritative inventory tracking across garment variants, physical vault stock, and patron order reservations.
            </p>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-red-950/80 border border-red-500/40 text-red-200'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-200'
            }`}
            role="status"
          >
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {notification.type === 'error' && (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              {notification.type === 'info' && (
                <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
              )}
              <span className="font-medium leading-relaxed">{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-0.5 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => loadData()}>
              Retry
            </Button>
          </div>
        )}

        {/* Summary Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block">
              Tracked SKUs
            </span>
            <div className="font-serif text-2xl font-bold text-zinc-100">
              {loading ? '—' : totalTrackedVariants}
            </div>
            <p className="text-[10px] text-zinc-500">Active variant listings</p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider block">
              Available Units
            </span>
            <div className="font-serif text-2xl font-bold text-emerald-300">
              {loading ? '—' : totalAvailableUnits}
            </div>
            <p className="text-[10px] text-zinc-500">Ready for instant purchase</p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              Reserved Stock
            </span>
            <div className="font-serif text-2xl font-bold text-amber-300">
              {loading ? '—' : totalReservedUnits}
            </div>
            <p className="text-[10px] text-zinc-500">Locked for patron checkout</p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block">
              Stock Warnings
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`font-serif text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
                {loading ? '—' : lowStockCount}
              </span>
              {outOfStockCount > 0 && (
                <span className="text-xs font-mono text-rose-400">
                  ({outOfStockCount} out of stock)
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500">At or below reorder alert</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by garment title, SKU, size, or material..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/80 transition"
                id="input-inventory-search"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Product Filter Dropdown */}
            {uniqueProducts.length > 1 && (
              <div className="w-full md:w-64 shrink-0">
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/80 transition"
                  id="select-product-filter"
                >
                  <option value="all">All Garment Pieces ({uniqueProducts.length})</option>
                  {uniqueProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.length > 32 ? `${p.name.substring(0, 32)}...` : p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              id="tab-filter-all"
            >
              All Variants ({inventoryItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'in_stock'
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              id="tab-filter-in-stock"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              In Stock ({inventoryItems.filter((i) => i.status === 'in_stock').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('low_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'low_stock'
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              id="tab-filter-low-stock"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Low Stock ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('out_of_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'out_of_stock'
                  ? 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              id="tab-filter-out-of-stock"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="py-16 text-center space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/20">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <div className="font-serif text-sm font-medium text-zinc-300">
              Retrieving atelier inventory allocations...
            </div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Querying authenticated PostgreSQL inventory vaults and order reservation ledgers.
            </p>
          </div>
        ) : inventoryItems.length === 0 ? (
          /* Empty State: No Products / Variants in Atelier */
          <div className="py-16 px-6 text-center space-y-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Package className="w-6 h-6 text-amber-400/80" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-zinc-200">
                No Inventory Tracked in Atelier
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                You haven't listed any garment variants with inventory tracking yet. Create bespoke tailored pieces in your catalog to manage vault stock allocations.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/seller/products">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Create Garment Listing
                </Button>
              </Link>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty Search Results */
          <div className="py-12 px-6 text-center space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <Search className="w-6 h-6 text-zinc-600 mx-auto" />
            <h4 className="font-serif text-base font-semibold text-zinc-300">
              No matching inventory found
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No variants match your current filter and search query. Try broadening your criteria or reset filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setProductFilter('all');
              }}
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table Layout (hidden on mobile) */}
            <div className="hidden md:block rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 bg-zinc-950/70 font-serif text-[10px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-5 py-3.5">Garment Piece</th>
                    <th className="px-5 py-3.5">SKU & Specs</th>
                    <th className="px-5 py-3.5">Available</th>
                    <th className="px-5 py-3.5">Reserved</th>
                    <th className="px-5 py-3.5">Total Vault</th>
                    <th className="px-5 py-3.5">Threshold</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredItems.map((item) => (
                    <tr key={item.variant_id} className="hover:bg-zinc-800/30 transition group">
                      {/* Garment Piece */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.hero_image ? (
                              <img
                                src={item.hero_image}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-serif font-medium text-zinc-100 max-w-xs truncate">
                              {item.product_name}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500">
                              {new Intl.NumberFormat(item.currency === 'NGN' ? 'en-NG' : 'en-US', {
                                style: 'currency',
                                currency: item.currency,
                                maximumFractionDigits: 0,
                              }).format(item.price_override || item.base_price)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Specs */}
                      <td className="px-5 py-4">
                        <div className="font-mono text-[11px] text-zinc-300 font-semibold">
                          {item.sku}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-zinc-400">
                          {item.size && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                              {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                              {item.color}
                            </span>
                          )}
                          {item.material && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 truncate max-w-[120px]">
                              {item.material}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Available */}
                      <td className="px-5 py-4">
                        <div
                          className={`font-serif text-sm font-bold ${
                            item.quantity_available <= 0
                              ? 'text-rose-400'
                              : item.quantity_available <= item.reorder_threshold
                              ? 'text-amber-400'
                              : 'text-zinc-100'
                          }`}
                        >
                          {item.quantity_available}{' '}
                          <span className="text-[10px] font-sans font-normal text-zinc-500">units</span>
                        </div>
                      </td>

                      {/* Reserved */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                          <Lock className="w-3 h-3 text-amber-400/80" />
                          <span>{item.quantity_reserved} units</span>
                        </div>
                      </td>

                      {/* Total Vault */}
                      <td className="px-5 py-4 text-zinc-300 font-mono text-xs">
                        {item.quantity_total} units
                      </td>

                      {/* Threshold */}
                      <td className="px-5 py-4 text-zinc-400 font-mono text-xs">
                        {item.reorder_threshold} units
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        {item.status === 'out_of_stock' ? (
                          <Badge variant="error">Out of Stock</Badge>
                        ) : item.status === 'low_stock' ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </td>

                      {/* Quick Adjust Button */}
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItemForAdjust(item)}
                          className="hover:border-amber-400/80"
                          id={`btn-adjust-${item.sku}`}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Layout (stacked, no horizontal scroll) */}
            <div className="md:hidden space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.variant_id}
                  className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3.5 shadow-lg"
                >
                  {/* Top Header: Image + Name + SKU */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.hero_image ? (
                        <img
                          src={item.hero_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-amber-400 font-semibold truncate">
                          {item.sku}
                        </span>
                        {item.status === 'out_of_stock' ? (
                          <Badge variant="error">Out of Stock</Badge>
                        ) : item.status === 'low_stock' ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </div>
                      <h3 className="font-serif text-sm font-semibold text-zinc-100 truncate mt-0.5">
                        {item.product_name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-zinc-400">
                        {item.size && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                            {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                            {item.color}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-center">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-zinc-400 block">Available</span>
                      <span
                        className={`font-serif text-sm font-bold block mt-0.5 ${
                          item.quantity_available <= 0
                            ? 'text-rose-400'
                            : item.quantity_available <= item.reorder_threshold
                            ? 'text-amber-400'
                            : 'text-zinc-100'
                        }`}
                      >
                        {item.quantity_available}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-zinc-400 block">Reserved</span>
                      <span className="font-serif text-sm font-bold text-zinc-300 block mt-0.5">
                        {item.quantity_reserved}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-zinc-400 block">Total</span>
                      <span className="font-serif text-sm font-bold text-zinc-200 block mt-0.5">
                        {item.quantity_total}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-zinc-400 block">Alert ≤</span>
                      <span className="font-serif text-sm font-bold text-amber-300 block mt-0.5">
                        {item.reorder_threshold}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Touch Button (>44px height for touch ergonomics) */}
                  <button
                    type="button"
                    onClick={() => setSelectedItemForAdjust(item)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                    id={`btn-mobile-adjust-${item.sku}`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Adjust Stock Allocation</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedItemForAdjust && seller && (
        <AdjustStockModal
          item={selectedItemForAdjust}
          sellerId={seller.id}
          isOpen={Boolean(selectedItemForAdjust)}
          onClose={() => setSelectedItemForAdjust(null)}
          onSuccess={handleAdjustmentSuccess}
        />
      )}
    </SellerStudioLayout>
  );
};
