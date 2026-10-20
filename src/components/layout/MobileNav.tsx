import React from 'react';
import { Home, Compass, Globe, ShoppingBag, Sparkles, User } from 'lucide-react';
import { useRouter, Link } from '../../lib/router/RouterContext';
import { useCart } from '../../contexts/CartContext';

export const MobileNav: React.FC = () => {
  const { path } = useRouter();
  const { totalItems } = useCart();

  const tabs = [
    { label: 'Home', to: '/', icon: Home },
    { label: 'Market', to: '/marketplace', icon: Compass },
    { label: 'Studio', to: '/studio', icon: Sparkles },
    { label: 'Network', to: '/network', icon: Globe },
    { label: 'Cart', to: '/account/cart', icon: ShoppingBag, badge: totalItems },
    { label: 'Account', to: '/account', icon: User },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090B]/95 border-t border-[#27272A] backdrop-blur-xl pb-safe"
    >
      <div className="grid grid-cols-6 h-16 items-center px-0.5">
        {tabs.map((tab) => {
          const isActive =
            tab.to === '/'
              ? path === '/'
              : path === tab.to || path.startsWith(tab.to + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              to={tab.to}
              id={`mobile-nav-${tab.label.toLowerCase()}`}
              className={`relative flex flex-col items-center justify-center h-full py-1 transition-all min-h-[44px] ${
                isActive ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#D4AF37]' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-[#D4AF37] text-zinc-950 font-bold text-[9px] flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-wide mt-1 font-medium ${isActive ? 'font-semibold text-[#D4AF37]' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-[#D4AF37]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

