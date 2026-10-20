import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Search, Menu, X, User, ChevronDown, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { useRouter, Link } from '../../lib/router/RouterContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { RoleSwitcher } from '../ui/RoleSwitcher';
import { CatalogService } from '../../services/catalog.service';
import { Category } from '../../types/ecommerce';

export const Header: React.FC = () => {
  const { path, query, navigate } = useRouter();
  const { totalItems, subtotal, cart } = useCart();
  const { wishlist } = useWishlist();
  const { profile, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(query.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    CatalogService.getCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {});
  }, []);

  // Sync search input with URL query param if present
  useEffect(() => {
    const q = query.get('q');
    if (q !== null && q !== undefined) {
      setSearchTerm(q);
    }
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTerm = searchTerm.trim();
    if (selectedCategory && selectedCategory !== 'all') {
      navigate(`/marketplace?q=${encodeURIComponent(cleanTerm)}&cat=${encodeURIComponent(selectedCategory)}`);
    } else {
      navigate(`/marketplace?q=${encodeURIComponent(cleanTerm)}`);
    }
  };

  // Role-based contextual navigation links
  const role = profile?.professional_role;
  const isSellerRole = role === 'seller' || role === 'tailor' || role === 'designer' || role === 'manufacturer';
  const isAdminRole = role === 'admin' || role === 'super_admin';

  const headerCurrency = cart.currency || 'NGN';
  const formattedSubtotal = new Intl.NumberFormat(headerCurrency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency',
    currency: headerCurrency,
    maximumFractionDigits: 0,
  }).format(subtotal);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#27272A] bg-[#09090B]/95 backdrop-blur-xl transition-all">
      {/* 1. Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" id="brand-logo-link" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-[#D4AF37]/40 flex items-center justify-center p-1.5 shadow-md group-hover:border-[#D4AF37] transition-colors">
                <img
                  src="/icon.svg"
                  alt="D-ELYNX Emblem"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base sm:text-lg font-bold tracking-wider text-zinc-100 uppercase group-hover:text-[#D4AF37] transition-colors leading-none">
                  D-ELYNX
                </span>
                <span className="text-[9px] tracking-[0.2em] uppercase text-zinc-400 font-medium mt-1 leading-none">
                  Tailors Hub
                </span>
              </div>
            </Link>
          </div>

          {/* Prominent Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            id="form-header-search"
            className="hidden md:flex flex-1 max-w-2xl items-center relative"
          >
            <div className="w-full flex items-center rounded-xl bg-[#121215] border border-[#27272A] focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37]/30 transition-all overflow-hidden">
              {/* Category Filter Dropdown */}
              <div className="relative border-r border-[#27272A] hidden lg:block">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs text-zinc-300 py-2.5 pl-3 pr-7 focus:outline-none cursor-pointer appearance-none"
                  aria-label="Filter by category"
                >
                  <option value="all" className="bg-[#121215] text-zinc-200">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug} className="bg-[#121215] text-zinc-200">
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Text Input */}
              <div className="relative flex-1 flex items-center">
                <input
                  id="input-header-search-desktop"
                  type="text"
                  placeholder="Search products, tailors, designers, fabrics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 py-2.5 pl-3.5 pr-8 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-zinc-500 hover:text-zinc-300 p-1 mr-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Submit Button */}
              <button
                type="submit"
                id="btn-header-search-submit"
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c59b27] text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer min-h-[40px]"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right Action Icons & Commercial Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Seller Studio / Become a Seller Shortcut */}
            <Link
              to={isSellerRole ? '/seller' : '/signup'}
              id="header-seller-link"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272A] hover:border-[#D4AF37]/50 text-[11px] font-medium text-zinc-300 hover:text-[#D4AF37] transition-colors"
            >
              <span>{isSellerRole ? 'Seller Studio' : 'Sell on D-ELYNX'}</span>
            </Link>

            {/* Professional Identity Role Switcher */}
            <RoleSwitcher />

            {/* Wishlist Link with Count */}
            <Link
              to="/account/wishlist"
              id="header-wishlist-btn"
              className="relative p-2 rounded-xl text-zinc-300 hover:text-[#D4AF37] hover:bg-[#121215] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.items.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D4AF37] text-zinc-950 font-bold text-[10px] flex items-center justify-center">
                  {wishlist.items.length}
                </span>
              )}
            </Link>

            {/* Shopping Cart Link with Count and Value */}
            <Link
              to="/account/cart"
              id="header-cart-btn"
              className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl text-zinc-200 hover:text-[#D4AF37] hover:bg-[#121215] border border-transparent hover:border-[#27272A] transition-colors min-h-[44px]"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#D4AF37] text-zinc-950 font-bold text-[10px] flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left text-xs">
                <span className="text-[10px] text-zinc-400 leading-none">Cart</span>
                <span className="font-semibold text-zinc-200 leading-none mt-0.5">{formattedSubtotal}</span>
              </div>
            </Link>

            {/* User Account / Sign In */}
            <Link
              to="/account"
              id="header-account-btn"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-zinc-200 hover:text-[#D4AF37] hover:bg-[#121215] transition-colors hidden sm:flex items-center gap-2 min-h-[44px]"
              title="User Account"
            >
              <User className="w-5 h-5" />
              <div className="hidden lg:flex flex-col text-left text-xs">
                <span className="text-[10px] text-zinc-400 leading-none">
                  {user ? 'Welcome' : 'Sign In'}
                </span>
                <span className="font-semibold text-zinc-200 leading-none mt-0.5 truncate max-w-[90px]">
                  {profile?.display_name?.split(' ')[0] || 'Account'}
                </span>
              </div>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-[#121215] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 2. Mobile Search Bar (Directly visible beneath top row on phones) */}
        <div className="md:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="flex items-center rounded-xl bg-[#121215] border border-[#27272A] focus-within:border-[#D4AF37] overflow-hidden">
            <input
              id="input-header-search-mobile"
              type="text"
              placeholder="Search fashion products, tailors, fabrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 py-2.5 px-3.5 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2.5 bg-[#D4AF37] text-zinc-950 font-bold min-h-[40px] flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Category Navigation Bar (Desktop e-commerce sub-bar) */}
      <div className="hidden md:block border-t border-[#27272A] bg-[#09090B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto py-2 text-xs text-zinc-300 scrollbar-none">
            <Link
              to="/marketplace"
              id="nav-cat-all-products"
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                path === '/marketplace' && !query.get('cat')
                  ? 'bg-[#D4AF37] text-zinc-950 font-bold'
                  : 'hover:text-[#D4AF37] hover:bg-[#121215]'
              }`}
            >
              All Products
            </Link>

            {categories.map((cat) => {
              const isActive = query.get('cat') === cat.slug || path === `/marketplace/category/${cat.slug}`;
              return (
                <Link
                  key={cat.id}
                  to={`/marketplace?cat=${cat.slug}`}
                  id={`nav-cat-${cat.slug}`}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#D4AF37] text-zinc-950 font-bold'
                      : 'hover:text-[#D4AF37] hover:bg-[#121215]'
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}

            <div className="h-4 w-px bg-[#27272A] mx-2 shrink-0" />

            <Link
              to="/network"
              id="nav-sub-network"
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                path.startsWith('/network') ? 'text-[#D4AF37] font-semibold' : 'hover:text-[#D4AF37] hover:bg-[#121215]'
              }`}
            >
              Tailor & Mill Network
            </Link>

            <Link
              to="/studio"
              id="nav-sub-studio"
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                path.startsWith('/studio') ? 'text-[#D4AF37] font-semibold' : 'hover:text-[#D4AF37] hover:bg-[#121215]'
              }`}
            >
              AI Studio
            </Link>

            <Link
              to="/academy"
              id="nav-sub-academy"
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                path.startsWith('/academy') ? 'text-[#D4AF37] font-semibold' : 'hover:text-[#D4AF37] hover:bg-[#121215]'
              }`}
            >
              Academy
            </Link>
          </nav>
        </div>
      </div>

      {/* 4. Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#27272A] bg-[#09090B] px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200">
          <div className="space-y-1">
            <span className="px-3 text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block">
              Marketplace Categories
            </span>
            <Link
              to="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:bg-[#121215]"
            >
              Browse All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/marketplace?cat=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs text-zinc-300 hover:bg-[#121215]"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[#27272A] space-y-1">
            <span className="px-3 text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block">
              Platform Features
            </span>
            <Link
              to="/network"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-[#121215]"
            >
              Artisan & Mill Directory
            </Link>
            <Link
              to="/studio"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-[#121215]"
            >
              AI Fashion Studio
            </Link>
            <Link
              to="/academy"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-[#121215]"
            >
              Sartorial Academy
            </Link>
          </div>

          <div className="pt-3 border-t border-[#27272A] space-y-1">
            <span className="px-3 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
              Account & Portals
            </span>
            <Link
              to="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-[#121215]"
            >
              My Account & Orders
            </Link>
            <Link
              to="/account/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-[#121215]"
            >
              Shopping Cart ({totalItems})
            </Link>
            <Link
              to="/account/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-[#121215]"
            >
              Wishlist ({wishlist.items.length})
            </Link>
            <Link
              to="/seller"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium text-[#D4AF37] hover:bg-[#121215]"
            >
              Seller Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
