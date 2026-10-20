import React from 'react';
import { RouterProvider, useRouter } from './lib/router/RouterContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { AppShell } from './components/layout/AppShell';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { MarketplacePage } from './pages/public/MarketplacePage';
import { CategoryPage } from './pages/public/CategoryPage';
import { ProductDetailsPage } from './pages/public/ProductDetailsPage';
import { NetworkPage } from './pages/public/NetworkPage';
import { StudioPage } from './pages/public/StudioPage';
import { AcademyPage } from './pages/public/AcademyPage';
import { SignInPage } from './pages/public/SignInPage';
import { SignUpPage } from './pages/public/SignUpPage';

// Customer Pages
import { AccountPage } from './pages/customer/AccountPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { OrderDetailsPage } from './pages/customer/OrderDetailsPage';
import { ProfileSettingsPage } from './pages/customer/ProfileSettingsPage';
import { SecuritySettingsPage } from './pages/customer/SecuritySettingsPage';
import { MeasurementsPage } from './pages/customer/MeasurementsPage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { CartPage } from './pages/customer/CartPage';
import { AddressesPage } from './pages/customer/AddressesPage';

// Seller Foundation Pages
import { SellerDashboardPage } from './pages/seller/SellerDashboardPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { SellerInventoryPage } from './pages/seller/SellerInventoryPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerProfilePage } from './pages/seller/SellerProfilePage';
import { SellerSettingsPage } from './pages/seller/SellerSettingsPage';

// Admin Foundation Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminSellersPage } from './pages/admin/AdminSellersPage';
import { AdminSupabaseSettingsPage } from './pages/admin/AdminSupabaseSettingsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { path } = useRouter();

  const renderRoute = () => {
    // Root & Public Pages
    if (path === '/' || path === '') return <HomePage />;
    if (path === '/marketplace') return <MarketplacePage />;
    if (path.startsWith('/marketplace/category/')) return <CategoryPage />;
    if (path.startsWith('/product/')) return <ProductDetailsPage />;
    if (path === '/network') return <NetworkPage />;
    if (path === '/studio') return <StudioPage />;
    if (path === '/academy') return <AcademyPage />;
    if (path === '/signin') return <SignInPage />;
    if (path === '/signup') return <SignUpPage />;

    // Customer Portal Pages (Protected: Authentication required)
    if (path === '/account') {
      return (
        <ProtectedRoute clearanceName="Customer Profile & Account">
          <AccountPage />
        </ProtectedRoute>
      );
    }
    if (path.startsWith('/account/orders/')) {
      return (
        <ProtectedRoute clearanceName="Order Details & Tracking">
          <OrderDetailsPage />
        </ProtectedRoute>
      );
    }
    if (path === '/account/orders') {
      return (
        <ProtectedRoute clearanceName="Customer Orders Ledger">
          <OrdersPage />
        </ProtectedRoute>
      );
    }
    if (path === '/account/profile') {
      return (
        <ProtectedRoute clearanceName="Profile Settings">
          <ProfileSettingsPage />
        </ProtectedRoute>
      );
    }
    if (path === '/account/security') {
      return (
        <ProtectedRoute clearanceName="Security Settings">
          <SecuritySettingsPage />
        </ProtectedRoute>
      );
    }
    if (path === '/account/measurements' || path === '/measurements') {
      return (
        <ProtectedRoute clearanceName="Bespoke Measurements Profile">
          <MeasurementsPage />
        </ProtectedRoute>
      );
    }
    if (path === '/account/wishlist' || path === '/wishlist') {
      return (
        <ProtectedRoute clearanceName="Curated Wishlist">
          <WishlistPage />
        </ProtectedRoute>
      );
    }
    if (path === '/account/cart' || path === '/cart') {
      return (
        <ProtectedRoute clearanceName="Shopping Cart">
          <CartPage />
        </ProtectedRoute>
      );
    }
    if (path === '/account/addresses') {
      return (
        <ProtectedRoute clearanceName="Delivery Addresses">
          <AddressesPage />
        </ProtectedRoute>
      );
    }

    // Seller Studio Foundation Pages (Protected: Seller / Atelier / Manufacturer clearance)
    const sellerRoles = ['seller', 'tailor', 'designer', 'manufacturer', 'admin', 'super_admin'] as const;
    if (path === '/seller') {
      return (
        <ProtectedRoute allowedRoles={[...sellerRoles]} clearanceName="Seller & Atelier Studio">
          <SellerDashboardPage />
        </ProtectedRoute>
      );
    }
    if (path === '/seller/products') {
      return (
        <ProtectedRoute allowedRoles={[...sellerRoles]} clearanceName="Atelier Product Catalog">
          <SellerProductsPage />
        </ProtectedRoute>
      );
    }
    if (path === '/seller/inventory') {
      return (
        <ProtectedRoute allowedRoles={[...sellerRoles]} clearanceName="Atelier Inventory Management">
          <SellerInventoryPage />
        </ProtectedRoute>
      );
    }
    if (path === '/seller/orders') {
      return (
        <ProtectedRoute allowedRoles={[...sellerRoles]} clearanceName="Atelier Orders & Fulfillment">
          <SellerOrdersPage />
        </ProtectedRoute>
      );
    }
    if (path === '/seller/profile') {
      return (
        <ProtectedRoute allowedRoles={[...sellerRoles]} clearanceName="Atelier Store Profile Management">
          <SellerProfilePage />
        </ProtectedRoute>
      );
    }
    if (path === '/seller/settings') {
      return (
        <ProtectedRoute allowedRoles={[...sellerRoles]} clearanceName="Atelier Operational Settings">
          <SellerSettingsPage />
        </ProtectedRoute>
      );
    }

    // Admin Governance Foundation Pages (Protected: Admin / Super Admin clearance)
    const adminRoles = ['admin', 'super_admin'] as const;
    if (path === '/admin' || path === '/control-center') {
      return (
        <ProtectedRoute allowedRoles={[...adminRoles]} clearanceName="Control Center & Management">
          <AdminDashboardPage />
        </ProtectedRoute>
      );
    }
    if (path === '/admin/users') {
      return (
        <ProtectedRoute allowedRoles={[...adminRoles]} clearanceName="User Management & Identity Authorization">
          <AdminUsersPage />
        </ProtectedRoute>
      );
    }
    if (path === '/admin/products') {
      return (
        <ProtectedRoute allowedRoles={[...adminRoles]} clearanceName="Global Product Curation">
          <AdminProductsPage />
        </ProtectedRoute>
      );
    }
    if (path === '/admin/orders') {
      return (
        <ProtectedRoute allowedRoles={[...adminRoles]} clearanceName="Order Governance & Fulfillment Oversight">
          <AdminOrdersPage />
        </ProtectedRoute>
      );
    }
    if (path === '/admin/sellers') {
      return (
        <ProtectedRoute allowedRoles={[...adminRoles]} clearanceName="Maison & Seller Verification">
          <AdminSellersPage />
        </ProtectedRoute>
      );
    }
    if (path === '/admin/settings/supabase' || path === '/admin/settings') {
      return (
        <ProtectedRoute allowedRoles={[...adminRoles]} clearanceName="Backend & Supabase Governance">
          <AdminSupabaseSettingsPage />
        </ProtectedRoute>
      );
    }

    // Default Fallback
    return <HomePage />;
  };

  return <AppShell>{renderRoute()}</AppShell>;
};

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRoutes />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
