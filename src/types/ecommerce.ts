/**
 * Core Ecommerce & Fashion Marketplace Entities for D-ELYNX
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  status: 'active' | 'archived';
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'archived';

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  hero_image?: string | null;
  images?: string[];
  created_at: string;
  updated_at: string;

  // Joined optional relations
  category?: Category;
  seller?: {
    id: string;
    business_name: string;
    country: string;
    city?: string;
    verification_status: string;
  };
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size?: string | null; // e.g. 'EU 38', 'M', 'Custom Bespoke'
  color?: string | null; // e.g. 'Obsidian Black', 'Champagne Gold'
  material?: string | null; // e.g. 'Cashmere', '100% Egyptian Cotton'
  price_override?: number | null;
  weight_grams?: number | null;
  created_at: string;
  updated_at: string;
  inventory?: InventoryRecord;
}

export interface InventoryRecord {
  id: string;
  variant_id: string;
  quantity_available: number;
  quantity_reserved: number;
  reorder_threshold?: number;
  warehouse_location?: string | null;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number;
  product?: Product;
  variant?: ProductVariant;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id?: string | null;
  session_id?: string | null;
  currency: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  items: WishlistItem[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  street_address: string;
  apartment_suite?: string | null;
  city: string;
  state_province?: string | null;
  postal_code: string;
  country: string;
  phone: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'processing'
  | 'in_production'
  | 'ready_for_dispatch'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  seller_id: string;
  product_name: string;
  variant_description?: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  tax: number;
  total: number;
  currency: string;
  shipping_address?: Address | null;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'escrow' | 'bank_transfer' | 'pending';
  status: 'initiated' | 'succeeded' | 'failed' | 'refunded';
  transaction_ref?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number; // 1-5
  headline?: string | null;
  body?: string | null;
  verified_purchase: boolean;
  created_at: string;
}
