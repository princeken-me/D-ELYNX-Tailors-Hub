import React from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  MapPin,
  RotateCcw,
  Package,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/ecommerce';
import { useRouter } from '../../lib/router/RouterContext';

interface OrderCardProps {
  order: Order;
  onCancelRequest?: (order: Order) => void;
  onViewDetails?: (order: Order) => void;
  isCancelling?: boolean;
}

export const formatOrderCurrency = (amount: number, currency = 'NGN'): string => {
  const loc = currency === 'NGN' ? 'en-NG' : 'en-US';
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getOrderStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'pending_payment':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pending Payment
        </span>
      );
    case 'processing':
    case 'in_production':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1">
          In Production
        </span>
      );
    case 'ready_for_dispatch':
    case 'shipped':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
          Dispatched
        </span>
      );
    case 'delivered':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
          Cancelled
        </span>
      );
    case 'refunded':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30">
          Refunded
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300">
          {status}
        </span>
      );
  }
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onCancelRequest,
  onViewDetails,
  isCancelling = false,
}) => {
  const { navigate } = useRouter();

  const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const primaryItem = order.items?.[0];
  const primarySeller = (primaryItem as any)?.product?.seller?.business_name;

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(order);
    } else {
      navigate(`/account/orders/${order.id}`);
    }
  };

  return (
    <div
      id={`order-card-${order.order_number}`}
      className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition space-y-4"
    >
      {/* Top row: Order Number, Status, Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-zinc-100">
              {order.order_number}
            </span>
            {getOrderStatusBadge(order.status)}
          </div>
          <p className="text-[11px] text-zinc-500">
            Placed on{' '}
            {new Date(order.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex items-center gap-4 sm:self-auto self-start">
          <div className="text-left sm:text-right">
            <span className="text-sm font-bold text-zinc-100 block">
              {formatOrderCurrency(order.total, order.currency)}
            </span>
            <span className="text-[11px] text-zinc-500">
              {itemCount} {itemCount === 1 ? 'Garment' : 'Garments'}
            </span>
          </div>

          <button
            onClick={handleCardClick}
            id={`btn-view-order-${order.order_number}`}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Order Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Item preview section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Thumbnail preview if item image is available */}
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center text-zinc-600">
            {(primaryItem as any)?.product?.hero_image ? (
              <img
                src={(primaryItem as any).product.hero_image}
                alt={primaryItem?.product_name || 'Garment'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Package className="w-5 h-5 text-zinc-600" />
            )}
          </div>

          <div className="space-y-0.5 min-w-0">
            <h4 className="text-xs font-semibold text-zinc-200 truncate">
              {primaryItem?.product_name || 'Tailored Garment Order'}
              {order.items && order.items.length > 1 && (
                <span className="text-zinc-500 font-normal"> + {order.items.length - 1} more</span>
              )}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
              {primarySeller && (
                <span className="text-zinc-400">
                  Seller: <span className="text-zinc-300 font-medium">{primarySeller}</span>
                </span>
              )}
              {order.shipping_address && (
                <span className="flex items-center gap-1 text-zinc-500">
                  <MapPin className="w-3 h-3 text-amber-400/80" />
                  <span>
                    {order.shipping_address.city}, {order.shipping_address.country}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cancellation action if eligible */}
        {order.status === 'pending_payment' && onCancelRequest && (
          <div className="self-end sm:self-center">
            <button
              onClick={() => onCancelRequest(order)}
              disabled={isCancelling}
              id={`btn-cancel-${order.order_number}`}
              className="text-xs text-zinc-500 hover:text-rose-400 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
