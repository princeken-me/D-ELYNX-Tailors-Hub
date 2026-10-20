import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  UserCheck,
  Settings,
  Store,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Link, useRouter } from '../../lib/router/RouterContext';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';

export interface SellerStudioLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  sellerName?: string;
  isVerified?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
  tooltip?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'nav-seller-overview',
    label: 'Overview',
    path: '/seller',
    icon: LayoutDashboard,
  },
  {
    id: 'nav-seller-products',
    label: 'Products',
    path: '/seller/products',
    icon: Package,
  },
  {
    id: 'nav-seller-inventory',
    label: 'Inventory',
    path: '/seller/inventory',
    icon: Layers,
  },
  {
    id: 'nav-seller-orders',
    label: 'Orders',
    path: '/seller/orders',
    icon: ShoppingBag,
  },
  {
    id: 'nav-seller-profile',
    label: 'Store Profile',
    path: '/seller/profile',
    icon: UserCheck,
  },
  {
    id: 'nav-seller-settings',
    label: 'Settings',
    path: '/seller/settings',
    icon: Settings,
  },
];

export const SellerStudioLayout: React.FC<SellerStudioLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  sellerName,
  isVerified = true,
}) => {
  const { path } = useRouter();
  const { profile } = useAuth();

  const displayStoreName = sellerName || profile?.display_name || 'Atelier Studio';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Seller Studio Masthead */}
      <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm shadow-xl shadow-black/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-amber-500/30 flex items-center justify-center font-serif text-lg font-bold text-amber-400 shrink-0 shadow-inner">
              <Store className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
                  {displayStoreName}
                </span>
                {isVerified && (
                  <Badge variant="gold" className="text-[10px] py-0.5">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verified Atelier
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>D-ELYNX Sartorial Merchant Hub</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500">Role: {profile?.professional_role || 'seller'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Link
              to="/marketplace"
              id="link-view-marketplace"
              className="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300 hover:text-zinc-100 text-xs font-medium transition cursor-pointer inline-flex items-center gap-1.5 min-h-[44px]"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Public Catalog</span>
            </Link>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>

        {/* 2. Unified Navigation Bar (Mobile-First Horizontal Scroll + Desktop Segmented) */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <nav
            aria-label="Seller Studio Navigation"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-1 -mb-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = path === item.path;

              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    id={item.id}
                    title={item.tooltip}
                    aria-disabled="true"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 bg-zinc-950/40 border border-zinc-900 cursor-not-allowed select-none whitespace-nowrap min-h-[44px] shrink-0"
                  >
                    <Icon className="w-4 h-4 opacity-50" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-500 font-mono uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  id={item.id}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap min-h-[44px] shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/5 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 3. Page Title & Subtitle (if specified) */}
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            {title && (
              <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-100">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. Child Content */}
      <div className="w-full">{children}</div>
    </div>
  );
};
