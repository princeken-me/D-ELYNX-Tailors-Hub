import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Link, useRouter } from '../../lib/router/RouterContext';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { OrderService } from '../../services/order.service';
import { Order } from '../../types/ecommerce';
import { OrderCard } from '../../components/orders/OrderCard';
import { CancelOrderModal } from '../../components/orders/CancelOrderModal';

export const OrdersPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const userId = user?.id || profile?.id || 'usr_guest_demo';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getCustomerOrders(userId);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const handleOrderCancelled = async () => {
    setCancelFeedback('Order cancelled successfully. Reserved atelier inventory has been restored.');
    await loadOrders();
  };

  return (
    <div id="customer-orders-page" className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <Link
          to="/account"
          id="btn-back-to-account"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </Link>

        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
              Client Portal
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              My Orders
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Track your tailored garments, production stages, and delivery status.
            </p>
          </div>

          <button
            onClick={() => navigate('/marketplace')}
            id="btn-explore-marketplace"
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
          >
            Explore Marketplace
          </button>
        </div>
      </div>

      {cancelFeedback && (
        <div
          id="cancel-feedback-banner"
          className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cancelFeedback}</span>
          </div>
          <button
            onClick={() => setCancelFeedback(null)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">
          Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="You haven't placed an order yet."
          description="Your placed orders, atelier commissions, and garment purchases will appear here."
          actionLabel="Explore Marketplace"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCancelRequest={(o) => setOrderToCancel(o)}
              onViewDetails={(o) => navigate(`/account/orders/${o.id}`)}
            />
          ))}
        </div>
      )}

      {/* Confirmation modal for cancellation */}
      <CancelOrderModal
        order={orderToCancel}
        userId={userId}
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onCancelled={handleOrderCancelled}
      />
    </div>
  );
};
