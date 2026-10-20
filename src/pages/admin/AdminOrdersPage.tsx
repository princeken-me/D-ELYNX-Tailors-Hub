import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { EmptyState } from '../../components/feedback/EmptyState';
import { OrderService } from '../../services/order.service';
import { Order, OrderStatus } from '../../types/ecommerce';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getAdminOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const success = await OrderService.updateOrderStatus(orderId, newStatus);
      if (success) {
        await loadOrders();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount: number, currency = 'NGN') => {
    const loc = currency === 'NGN' ? 'en-NG' : 'en-US';
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 pb-12">
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
              Platform Transactions & Fulfillment Governance
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Global Order Governance
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Comprehensive audit trail of all customer orders and atelier fulfillment states.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase text-zinc-500 block">Total Ecosystem Orders</span>
            <span className="font-mono text-lg font-bold text-amber-400">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by order # or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          {['all', 'pending_payment', 'in_production', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs capitalize whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">
          Loading global order governance logs...
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Orders Match Criteria"
          description="Try adjusting your status filter or search parameters."
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
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
                      User ID: <span className="font-mono text-zinc-400">{order.user_id}</span> •{' '}
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-zinc-100 block">
                        {formatCurrency(order.total, order.currency)}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        VAT: {formatCurrency(order.tax, order.currency)} • {itemCount} items
                      </span>
                    </div>

                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="processing">Processing</option>
                      <option value="in_production">In Production</option>
                      <option value="ready_for_dispatch">Ready for Dispatch</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Items & Delivery Snapshot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                      Order Garments ({order.items?.length || 0})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {(order.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 flex justify-between"
                        >
                          <div>
                            <p className="font-medium text-zinc-200">{item.product_name}</p>
                            <p className="text-[10px] text-zinc-500">
                              Qty: {item.quantity} • Seller: {item.seller_id.slice(0, 14)}...
                            </p>
                          </div>
                          <span className="font-medium text-zinc-300">
                            {formatCurrency(item.total_price, order.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                      Delivery Destination
                    </span>
                    {order.shipping_address ? (
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-0.5 text-zinc-400">
                        <p className="font-semibold text-zinc-200">
                          {order.shipping_address.recipient_name} ({order.shipping_address.phone})
                        </p>
                        <p className="text-[11px]">
                          {order.shipping_address.street_address}, {order.shipping_address.city},{' '}
                          {order.shipping_address.country}
                        </p>
                      </div>
                    ) : (
                      <p className="text-zinc-500 italic">No destination record</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
