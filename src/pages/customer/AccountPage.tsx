import React, { useEffect, useState } from 'react';
import {
  User,
  ShieldCheck,
  ShoppingBag,
  Heart,
  MapPin,
  LogOut,
  Lock,
  ChevronRight,
  Scissors,
  Store,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, Link } from '../../lib/router/RouterContext';
import { OrderService } from '../../services/order.service';
import { AddressService } from '../../services/address.service';
import { Order } from '../../types/ecommerce';
import { OrderCard } from '../../components/orders/OrderCard';
import { CancelOrderModal } from '../../components/orders/CancelOrderModal';
import { EmptyState } from '../../components/feedback/EmptyState';

export const AccountPage: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const { navigate } = useRouter();
  const userId = user?.id || profile?.id || 'usr_guest_demo';

  const [orders, setOrders] = useState<Order[]>([]);
  const [addressCount, setAddressCount] = useState<number>(0);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const isSellerOrTailor =
    profile?.role === 'seller' ||
    profile?.role === 'tailor' ||
    profile?.role === 'designer' ||
    profile?.role === 'manufacturer' ||
    (profile as any)?.professional_role === 'seller' ||
    (profile as any)?.professional_role === 'tailor';

  const loadDashboardData = async () => {
    setLoadingOrders(true);
    try {
      const [orderList, addresses] = await Promise.all([
        OrderService.getCustomerOrders(userId),
        AddressService.getUserAddresses(userId),
      ]);
      setOrders(orderList);
      setAddressCount(addresses.length);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const handleSignOut = async () => {
    await logout();
    navigate('/signin');
  };

  // Compute stats
  const totalOrders = orders.length;
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'refunded'
  ).length;

  const recentOrders = orders.slice(0, 3);

  return (
    <div id="customer-account-hub" className="space-y-8 pb-12">
      {/* 1. Profile Summary Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-zinc-950 border-2 border-amber-500/40 overflow-hidden shrink-0 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/20">
              {profile?.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile?.display_name || 'Customer'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-600/30 to-amber-900/40 flex items-center justify-center font-serif text-2xl font-bold text-amber-300">
                  {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100">
                  {profile?.display_name || 'Sartorial Patron'}
                </h1>

                {/* Role Badge */}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-serif uppercase tracking-wider font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {profile?.role || (profile as any)?.professional_role || 'Customer'}
                </span>

                {/* Account Status Badge */}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{profile?.account_status || 'Active Member'}</span>
                </span>
              </div>

              <p className="text-xs text-zinc-400 font-mono">
                {user?.email || profile?.email || 'customer@example.com'}
              </p>

              {profile?.phone_number && (
                <p className="text-xs text-zinc-400">
                  Contact: <span className="text-zinc-300 font-medium">{profile.phone_number}</span>
                </p>
              )}

              {profile?.bio && (
                <p className="text-xs text-zinc-400 italic pt-1 max-w-xl line-clamp-1">
                  "{profile.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Sign out / Profile link */}
          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <Link
              to="/account/profile"
              id="btn-edit-profile-quick"
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              Edit Profile
            </Link>
            <button
              onClick={handleSignOut}
              id="btn-account-signout"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-rose-950/40 hover:border-rose-800/60 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-zinc-800/80">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-center sm:text-left">
            <span className="text-[10px] uppercase font-serif tracking-wider text-zinc-500 block">
              Total Orders
            </span>
            <span className="font-serif text-lg sm:text-2xl font-bold text-zinc-100">
              {totalOrders}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-center sm:text-left">
            <span className="text-[10px] uppercase font-serif tracking-wider text-amber-500/90 block">
              Active Orders
            </span>
            <span className="font-serif text-lg sm:text-2xl font-bold text-amber-400">
              {activeOrders}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-center sm:text-left">
            <span className="text-[10px] uppercase font-serif tracking-wider text-zinc-500 block">
              Saved Destinations
            </span>
            <span className="font-serif text-lg sm:text-2xl font-bold text-zinc-100">
              {addressCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation / Quick Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-serif uppercase tracking-widest text-zinc-400 font-semibold">
          Account Navigation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Orders */}
          <Link
            to="/account/orders"
            id="nav-account-orders"
            className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-sm font-semibold text-zinc-200 block group-hover:text-amber-300 transition-colors">
                  My Orders
                </span>
                <span className="text-[11px] text-zinc-500">
                  Track stages, dispatch & cancellation
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
          </Link>

          {/* Delivery Addresses */}
          <Link
            to="/account/addresses"
            id="nav-account-addresses"
            className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-sm font-semibold text-zinc-200 block group-hover:text-amber-300 transition-colors">
                  Delivery Addresses
                </span>
                <span className="text-[11px] text-zinc-500">
                  Manage shipping & fitting salons
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
          </Link>

          {/* Profile Settings */}
          <Link
            to="/account/profile"
            id="nav-account-profile"
            className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-sm font-semibold text-zinc-200 block group-hover:text-amber-300 transition-colors">
                  Profile Settings
                </span>
                <span className="text-[11px] text-zinc-500">
                  Personal identity, avatar & bio
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
          </Link>

          {/* Security Settings */}
          <Link
            to="/account/security"
            id="nav-account-security"
            className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-sm font-semibold text-zinc-200 block group-hover:text-amber-300 transition-colors">
                  Security Settings
                </span>
                <span className="text-[11px] text-zinc-500">
                  Password & authenticated sessions
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
          </Link>

          {/* Wishlist */}
          <Link
            to="/account/wishlist"
            id="nav-account-wishlist"
            className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-sm font-semibold text-zinc-200 block group-hover:text-amber-300 transition-colors">
                  Saved Wishlist
                </span>
                <span className="text-[11px] text-zinc-500">
                  Curated garments & luxury wishlist
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
          </Link>

          {/* Measurements Profile */}
          <Link
            to="/account/measurements"
            id="nav-account-measurements"
            className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-sm font-semibold text-zinc-200 block group-hover:text-amber-300 transition-colors">
                  Custom Measurements
                </span>
                <span className="text-[11px] text-zinc-500">
                  Bespoke anatomical dimensions
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
          </Link>

          {/* Seller / Tailor Hub shortcut if applicable */}
          {isSellerOrTailor ? (
            <Link
              to="/seller"
              id="nav-account-seller-hub"
              className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-900/10 border border-amber-500/30 hover:border-amber-400 transition group flex items-center justify-between sm:col-span-2 lg:col-span-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-serif text-sm font-semibold text-amber-300 block">
                    Access Atelier / Seller Studio
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Manage your catalog, atelier commissions, and order fulfillments
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </Link>
          ) : (
            <Link
              to="/seller"
              id="nav-account-become-seller"
              className="p-4 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 hover:border-zinc-700 transition group flex items-center justify-between sm:col-span-2 lg:col-span-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-serif text-sm font-semibold text-zinc-300 block">
                    Are you a Tailor, Designer, or Fashion Brand?
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Open your atelier storefront on D-ELYNX Hub
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition" />
            </Link>
          )}
        </div>
      </div>

      {/* 3. Recent Orders Preview */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-serif uppercase tracking-widest text-zinc-400 font-semibold">
              Recent Orders
            </h2>
            <p className="text-xs text-zinc-500">
              Your latest garment purchases and bespoke tailoring orders.
            </p>
          </div>

          {orders.length > 0 && (
            <Link
              to="/account/orders"
              id="link-view-all-orders"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
            >
              <span>View All Orders ({orders.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loadingOrders ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Loading recent orders...
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
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancelRequest={(o) => setOrderToCancel(o)}
                onViewDetails={(o) => navigate(`/account/orders/${o.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        order={orderToCancel}
        userId={userId}
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onCancelled={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
};
