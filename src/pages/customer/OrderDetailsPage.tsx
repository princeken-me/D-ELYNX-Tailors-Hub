import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Package,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Link, useRouter } from '../../lib/router/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { OrderService } from '../../services/order.service';
import { CatalogService } from '../../services/catalog.service';
import { Order, OrderItem } from '../../types/ecommerce';
import { OrderStatusTimeline } from '../../components/orders/OrderStatusTimeline';
import { getOrderStatusBadge, formatOrderCurrency } from '../../components/orders/OrderCard';
import { CancelOrderModal } from '../../components/orders/CancelOrderModal';
import { EmptyState } from '../../components/feedback/EmptyState';

interface OrderDetailsPageProps {
  orderId?: string;
}

export const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({ orderId: propOrderId }) => {
  const { currentRoute, navigate } = useRouter();
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const userId = user?.id || profile?.id || 'usr_guest_demo';

  // Determine order ID from prop or router pathname
  const orderId =
    propOrderId ||
    (currentRoute.startsWith('/account/orders/')
      ? currentRoute.replace('/account/orders/', '').split('/')[0]
      : '');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderFeedback, setReorderFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  const loadOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const found = await OrderService.getOrderById(orderId, userId);
      // Ownership protection: only display if user matches or is admin
      if (found && (found.user_id === userId || profile?.role === 'admin')) {
        setOrder(found);
      } else {
        setOrder(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId, userId]);

  const handleOrderCancelled = async () => {
    setSuccessMessage('Order cancelled successfully. Reserved atelier inventory has been restored.');
    await loadOrder();
  };

  // Reorder ("Buy Again") functionality: verify product availability before adding to cart
  const handleReorderItem = async (item: OrderItem) => {
    setReordering(true);
    setReorderFeedback(null);

    try {
      const product = await CatalogService.getProductById(item.product_id);

      if (!product) {
        setReorderFeedback({
          type: 'error',
          text: `"${item.product_name}" is no longer active or available in the atelier collection.`,
        });
        return;
      }

      if (product.status !== 'active') {
        setReorderFeedback({
          type: 'warning',
          text: `"${item.product_name}" is currently ${product.status.replace('_', ' ')} and cannot be purchased.`,
        });
        return;
      }

      // Check variant if item had variant_id
      let selectedVariant = undefined;
      if (item.variant_id) {
        const variants = await CatalogService.getProductVariants(item.product_id);
        selectedVariant = variants.find((v) => v.id === item.variant_id);

        if (!selectedVariant) {
          setReorderFeedback({
            type: 'warning',
            text: `The exact variant (${item.variant_description || 'selected option'}) is currently unavailable. Please review options in the boutique.`,
          });
          return;
        }

        const availability = await CatalogService.getProductAvailability(selectedVariant.id, product.status);
        if (!availability.inStock) {
          setReorderFeedback({
            type: 'warning',
            text: `The variant "${selectedVariant.title || item.variant_description}" is out of stock.`,
          });
          return;
        }
      }

      // Add to cart with snapshot quantity or 1
      addItem(product, selectedVariant, Math.min(item.quantity, 1));
      setReorderFeedback({
        type: 'success',
        text: `Added "${item.product_name}" to your shopping bag. You can review it before placing an order.`,
      });
    } catch (err: any) {
      setReorderFeedback({
        type: 'error',
        text: err?.message || 'Unable to check garment availability at this time.',
      });
    } finally {
      setReordering(false);
    }
  };

  // Reorder all items in order
  const handleReorderAll = async () => {
    if (!order || !order.items || order.items.length === 0) return;

    setReordering(true);
    setReorderFeedback(null);
    let addedCount = 0;
    let unavailableCount = 0;

    try {
      for (const item of order.items) {
        const product = await CatalogService.getProductById(item.product_id);
        if (!product || product.status !== 'active') {
          unavailableCount++;
          continue;
        }

        let selectedVariant = undefined;
        if (item.variant_id) {
          const variants = await CatalogService.getProductVariants(item.product_id);
          selectedVariant = variants.find((v) => v.id === item.variant_id);
          if (selectedVariant) {
            const avail = await CatalogService.getProductAvailability(selectedVariant.id, product.status);
            if (!avail.inStock) {
              unavailableCount++;
              continue;
            }
          }
        }

        addItem(product, selectedVariant, 1);
        addedCount++;
      }

      if (addedCount > 0 && unavailableCount === 0) {
        setReorderFeedback({
          type: 'success',
          text: `All ${addedCount} garments from this order have been added to your shopping bag.`,
        });
      } else if (addedCount > 0 && unavailableCount > 0) {
        setReorderFeedback({
          type: 'warning',
          text: `Added ${addedCount} garments to your shopping bag. ${unavailableCount} item(s) are currently out of stock or archived.`,
        });
      } else {
        setReorderFeedback({
          type: 'error',
          text: 'The garments in this historical order are no longer available for reorder.',
        });
      }
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          to="/account/orders"
          id="btn-back-to-orders-not-found"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>
        <EmptyState
          title="Order Not Found"
          description="The requested order could not be located, or you do not have permission to access it."
          actionLabel="View All Orders"
          onAction={() => navigate('/account/orders')}
        />
      </div>
    );
  }

  return (
    <div id="order-details-container" className="space-y-8 pb-12">
      {/* Header & Back Link */}
      <div>
        <Link
          to="/account/orders"
          id="btn-back-to-orders"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>

        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
                Order Summary
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 font-mono font-medium">
                {order.order_number}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
              <span>Order Details</span>
              {getOrderStatusBadge(order.status)}
            </h1>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                Placed on{' '}
                {new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Reorder All button */}
            <button
              onClick={handleReorderAll}
              disabled={reordering}
              id="btn-reorder-all"
              className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{reordering ? 'Verifying...' : 'Reorder All Items'}</span>
            </button>

            {/* Cancel Order button if eligible */}
            {order.status === 'pending_payment' && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                id="btn-trigger-cancel-order"
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-900/60 hover:text-rose-400 text-zinc-400 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success / Reorder Notification Banners */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {reorderFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            reorderFeedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : reorderFeedback.type === 'warning'
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {reorderFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{reorderFeedback.text}</span>
          </div>

          {reorderFeedback.type === 'success' && (
            <button
              onClick={() => navigate('/cart')}
              className="underline font-semibold hover:text-white shrink-0"
            >
              View Shopping Bag
            </button>
          )}
        </div>
      )}

      {/* 1. Order Status Journey Timeline */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
        <OrderStatusTimeline
          status={order.status}
          createdAt={order.created_at}
          updatedAt={order.updated_at}
        />
      </div>

      {/* 2. Main content grid: Line items (left) + Order & Financial Summary (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Line Items Snapshot */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif uppercase tracking-wider text-zinc-300 font-bold">
              Ordered Garments ({order.items?.length || 0})
            </h3>
            <span className="text-[11px] text-zinc-500">
              Authoritative historical pricing snapshot
            </span>
          </div>

          <div className="space-y-3">
            {(order.items || []).map((item) => (
              <div
                key={item.id}
                id={`order-item-${item.id}`}
                className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700/80 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center text-zinc-600">
                    {(item as any)?.product?.hero_image ? (
                      <img
                        src={(item as any).product.hero_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-serif text-sm font-semibold text-zinc-100">
                      {item.product_name}
                    </h4>
                    {item.variant_description && (
                      <p className="text-xs text-amber-400/90 font-medium">
                        {item.variant_description}
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-400">
                      Quantity: <span className="text-zinc-200 font-semibold">{item.quantity}</span>{' '}
                      × {formatOrderCurrency(item.unit_price, order.currency)}
                    </p>
                    {item.product_id && (
                      <p className="text-[10px] text-zinc-600 font-mono">
                        Product SKU: {item.product_id.substring(0, 8).toUpperCase()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                  <span className="font-bold text-sm text-zinc-100">
                    {formatOrderCurrency(item.total_price, order.currency)}
                  </span>

                  {/* Individual Reorder Button */}
                  <button
                    onClick={() => handleReorderItem(item)}
                    disabled={reordering}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Buy Again</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Address Snapshot */}
          {order.shipping_address && (
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-zinc-300 font-semibold">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Delivery Destination (Order Snapshot)</span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/60 text-xs space-y-1 text-zinc-300">
                <p className="font-semibold text-zinc-100 text-sm">
                  {order.shipping_address.recipient_name}
                </p>
                <p className="text-zinc-400 font-medium">
                  Contact: {order.shipping_address.phone}
                </p>
                <p className="text-zinc-400">
                  {order.shipping_address.street_address}
                  {order.shipping_address.apartment_suite && `, ${order.shipping_address.apartment_suite}`}
                </p>
                <p className="text-zinc-400">
                  {order.shipping_address.city}
                  {order.shipping_address.state_province ? `, ${order.shipping_address.state_province}` : ''},{' '}
                  {order.shipping_address.country}
                  {order.shipping_address.postal_code ? ` (${order.shipping_address.postal_code})` : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Authoritative Financial Summary (Read-Only) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-5">
            <h3 className="text-sm font-serif uppercase tracking-wider text-zinc-300 font-bold border-b border-zinc-800/80 pb-3">
              Financial Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Items Subtotal</span>
                <span className="text-zinc-200 font-medium">
                  {formatOrderCurrency(order.subtotal, order.currency)}
                </span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Shipping Fee</span>
                <span className="text-emerald-400 font-medium">
                  {order.shipping_fee > 0
                    ? formatOrderCurrency(order.shipping_fee, order.currency)
                    : 'Complimentary Delivery'}
                </span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>VAT (7.5%)</span>
                <span className="text-zinc-200">
                  {formatOrderCurrency(order.tax, order.currency)}
                </span>
              </div>

              <div className="border-t border-zinc-800/80 pt-3 flex justify-between items-baseline">
                <span className="font-serif text-sm font-bold text-zinc-100">Total</span>
                <div className="text-right">
                  <span className="font-serif text-lg font-bold text-amber-400">
                    {formatOrderCurrency(order.total, order.currency)}
                  </span>
                  <span className="block text-[10px] text-zinc-500 font-mono">
                    Currency: {order.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Authoritative Security Badge */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">
                Authoritative record secured on D-ELYNX platform ledger. Historical values are immutable.
              </span>
            </div>

            {/* Informational Notice for Pending Payment Phase */}
            {order.status === 'pending_payment' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-amber-200">Payment Gateway Integration Pending</span>
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    This order is securely registered in <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">pending_payment</code> status. Payment gateways (Paystack, Flutterwave, Monnify) will be connected in a subsequent release phase. No card has been charged for this order.
                  </p>
                </div>
              </div>
            )}

            {/* Reorder Action */}
            <button
              onClick={handleReorderAll}
              disabled={reordering}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{reordering ? 'Checking Availability...' : 'Buy Again (Add to Bag)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        order={order}
        userId={userId}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onCancelled={handleOrderCancelled}
      />
    </div>
  );
};
