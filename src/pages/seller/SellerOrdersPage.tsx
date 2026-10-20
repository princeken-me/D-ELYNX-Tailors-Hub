import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Send,
  Scissors,
  Check,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { OrderService } from '../../services/order.service';
import { Order, OrderItem, OrderStatus } from '../../types/ecommerce';
import { SellerStudioLayout } from '../../components/seller/SellerStudioLayout';

import { SellerCatalogService, SellerRecord } from '../../services/seller-catalog.service';

export const SellerOrdersPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [seller, setSeller] = useState<SellerRecord | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const initSeller = async () => {
      const effectiveUserId = user?.id || profile?.id || profile?.auth_user_id || 'usr-seller-demo';
      const record = await SellerCatalogService.getSellerProfile(effectiveUserId);
      if (record) {
        setSeller(record);
      }
    };
    initSeller();
  }, [user?.id, profile?.id]);

  const loadSellerOrders = async () => {
    if (!seller?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await OrderService.getSellerOrders(seller.id);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (seller?.id) {
      loadSellerOrders();
    }
  }, [seller?.id]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const success = await OrderService.updateOrderStatus(orderId, newStatus);
      if (success) {
        await loadSellerOrders();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (amount: number, currency = 'NGN') => {
    const loc = currency === 'NGN' ? 'en-NG' : 'en-US';
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <SellerStudioLayout
      sellerName={seller?.business_name}
      isVerified={seller?.verification_status === 'verified'}
      actions={
        <button
          onClick={loadSellerOrders}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 transition"
        >
          <Clock className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      }
    >
      <div className="space-y-8 pb-12">
        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
              Seller Orders
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Atelier Orders & Fulfillment
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Fulfill customer garment orders. Strictly scoped to your atelier's line items.
            </p>
          </div>
        </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">
          Loading atelier orders and fulfillment queue...
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Merchant Orders for this Atelier"
          description="When clients place bespoke garment orders or purchase ready-to-wear designs from this atelier, orders will appear here for cutting, tailoring, and dispatch."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            // Seller only sees their OWN items
            const atelierItems = (order.items || []).filter(
              (item) => item.seller_id === seller?.id
            );
            const atelierSubtotal = atelierItems.reduce((sum, item) => sum + item.total_price, 0);

            return (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-zinc-100">
                        {order.order_number}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Ordered on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-zinc-500 block">Atelier Revenue</span>
                      <span className="text-sm font-bold text-amber-400">
                        {formatCurrency(atelierSubtotal, order.currency)}
                      </span>
                    </div>

                    {/* Status update workflow */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                      >
                        <option value="pending_payment">Pending Payment</option>
                        <option value="processing">In Processing</option>
                        <option value="in_production">In Production (Cutting & Stitching)</option>
                        <option value="ready_for_dispatch">Ready for Dispatch</option>
                        <option value="shipped">Dispatched / Shipped</option>
                        <option value="delivered">Delivered to Client</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Seller's Line Items ONLY */}
                <div className="space-y-2">
                  <span className="text-[11px] font-serif uppercase tracking-wider text-zinc-400 font-semibold block">
                    Garments Assigned to this Atelier ({atelierItems.length})
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {atelierItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1"
                      >
                        <div className="flex justify-between font-semibold text-zinc-200">
                          <span className="truncate">{item.product_name}</span>
                          <span className="shrink-0 ml-2">
                            {formatCurrency(item.total_price, order.currency)}
                          </span>
                        </div>
                        {item.variant_description && (
                          <p className="text-[11px] text-zinc-400">{item.variant_description}</p>
                        )}
                        <p className="text-[10px] text-zinc-500">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price, order.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Destination */}
                {order.shipping_address && (
                  <div className="pt-2 border-t border-zinc-800/60 text-xs text-zinc-400 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-300">
                        Fitting / Delivery Destination:
                      </span>{' '}
                      {order.shipping_address.recipient_name} ({order.shipping_address.phone}) —{' '}
                      {order.shipping_address.street_address}, {order.shipping_address.city},{' '}
                      {order.shipping_address.country}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </SellerStudioLayout>
  );
};
