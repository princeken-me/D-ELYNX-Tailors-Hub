import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Address, CartItem, Order, OrderItem, OrderStatus } from '../types/ecommerce';
import { DEV_SAMPLE_PRODUCTS } from './catalog.service';

export interface CreateOrderParams {
  userId: string;
  addressId: string;
  shippingAddress: Address;
  items: CartItem[];
  idempotencyKey?: string;
  cartId?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  order?: Order;
  error?: string;
}

const LOCAL_ORDERS_KEY = 'delynx_orders_registry';
const LOCAL_INVENTORY_KEY = 'delynx_local_inventory';

export interface CancelOrderResponse {
  success: boolean;
  code: 'SUCCESS' | 'ALREADY_CANCELLED' | 'NOT_CANCELLABLE' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'NETWORK_ERROR';
  message: string;
}

export class OrderService {
  /**
   * Authoritative Order Creation
   * Validates product availability, locks/reserves inventory, calculates totals server-side.
   */
  static async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const { userId, addressId, shippingAddress, items, idempotencyKey, cartId } = params;

    if (!items || items.length === 0) {
      return { success: false, error: 'Cannot create an order with an empty bag.' };
    }

    if (!addressId || !shippingAddress) {
      return { success: false, error: 'A valid delivery destination address is required.' };
    }

    const supabase = getSupabase();

    // 1. Try Supabase Atomic RPC
    if (supabase && isSupabaseConfigured) {
      try {
        const payloadItems = items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id || null,
          quantity: i.quantity,
        }));

        const { data, error } = await supabase.rpc('create_order_secure', {
          p_address_id: addressId,
          p_cart_id: cartId || null,
          p_items: payloadItems,
          p_idempotency_key: idempotencyKey || null,
        });

        if (error) {
          console.warn('OrderService: Supabase RPC error:', error.message);
          return { success: false, error: error.message };
        }

        if (data && data.success) {
          // Fetch the full order object with items
          const fullOrder = await this.getOrderById(data.order_id, userId);

          return {
            success: true,
            orderId: data.order_id,
            orderNumber: data.order_number,
            order: fullOrder || undefined,
          };
        }
      } catch (err: any) {
        console.warn('OrderService: Exception during Supabase order creation:', err);
        return { success: false, error: err.message || 'An unexpected error occurred during order creation.' };
      }
    }

    // 2. Authoritative Fallback for Development/Preview Mode
    // Re-calculates and re-validates against catalog records — never trusts client prices.
    return this.createOrderLocalAuthoritative(params);
  }

  /**
   * Fallback Authoritative Validation Engine
   * Strictly verifies catalog records, stock levels, and computes VAT/totals independently.
   */
  private static createOrderLocalAuthoritative(params: CreateOrderParams): CreateOrderResult {
    const { userId, shippingAddress, items, idempotencyKey } = params;

    // Idempotency check
    const existingOrders = this.getAllLocalOrders();
    if (idempotencyKey) {
      const match = existingOrders.find(
        (o) => o.user_id === userId && (o as any).idempotency_key === idempotencyKey
      );
      if (match) {
        return {
          success: true,
          orderId: match.id,
          orderNumber: match.order_number,
          order: match,
        };
      }
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${dateStr}-${randomHex}`;

    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    const localStock = this.getLocalInventory();

    for (const item of items) {
      // Re-read product from authoritative catalog
      const catalogProduct = DEV_SAMPLE_PRODUCTS.find((p) => p.id === item.product_id);
      if (!catalogProduct) {
        return {
          success: false,
          error: `Garment item with ID ${item.product_id} no longer exists in atelier catalog.`,
        };
      }

      if (catalogProduct.status !== 'active') {
        return {
          success: false,
          error: `Garment "${catalogProduct.name}" is currently unavailable for purchase.`,
        };
      }

      let authoritativeUnitPrice = catalogProduct.base_price;
      let sku = `SKU-${catalogProduct.id.slice(0, 8).toUpperCase()}`;
      let variantDescription: string | null = null;

      if (item.variant_id) {
        const variant = catalogProduct.variants?.find((v) => v.id === item.variant_id);
        if (!variant) {
          return {
            success: false,
            error: `Selected sizing/variant for "${catalogProduct.name}" is invalid or discontinued.`,
          };
        }

        if (variant.price_override && variant.price_override > 0) {
          authoritativeUnitPrice = variant.price_override;
        }
        sku = variant.sku;
        variantDescription = [
          variant.size ? `Size: ${variant.size}` : null,
          variant.color ? `Color: ${variant.color}` : null,
          variant.material ? `Material: ${variant.material}` : null,
        ]
          .filter(Boolean)
          .join(' • ');

        // Inventory stock check
        const variantStock = localStock[variant.id] ?? variant.inventory?.quantity_available ?? 15;
        if (variantStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${catalogProduct.name} (${variant.size || variant.sku})". Available: ${variantStock}, Requested: ${item.quantity}.`,
          };
        }

        // Atomically decrement / reserve
        localStock[variant.id] = Math.max(0, variantStock - item.quantity);
      }

      const lineTotal = authoritativeUnitPrice * item.quantity;
      subtotal += lineTotal;

      const orderItemRecord: OrderItem = {
        id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_id: orderId,
        product_id: catalogProduct.id,
        variant_id: item.variant_id || null,
        seller_id: catalogProduct.seller_id,
        product_name: catalogProduct.name,
        variant_description: variantDescription,
        unit_price: authoritativeUnitPrice,
        quantity: item.quantity,
        total_price: lineTotal,
        created_at: new Date().toISOString(),
      };

      orderItems.push(orderItemRecord);
    }

    this.saveLocalInventory(localStock);

    const tax = Math.round(subtotal * 0.075); // 7.5% Nigerian VAT
    const shippingFee = 0; // Complimentary luxury delivery
    const total = subtotal + shippingFee + tax;

    const newOrder: Order & { idempotency_key?: string } = {
      id: orderId,
      order_number: orderNumber,
      user_id: userId,
      status: 'pending_payment',
      subtotal,
      shipping_fee: shippingFee,
      tax,
      total,
      currency: 'NGN',
      shipping_address: shippingAddress,
      items: orderItems,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    existingOrders.unshift(newOrder);
    this.saveAllLocalOrders(existingOrders);

    return {
      success: true,
      orderId,
      orderNumber,
      order: newOrder,
    };
  }

  /**
   * Fetch all orders for the authenticated customer
   */
  static async getCustomerOrders(userId: string): Promise<Order[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            user_id,
            status,
            subtotal,
            shipping_fee,
            tax,
            total,
            currency,
            shipping_address,
            billing_address,
            created_at,
            updated_at,
            items:order_items(
              id,
              order_id,
              product_id,
              variant_id,
              seller_id,
              product_name,
              variant_description,
              unit_price,
              quantity,
              total_price,
              created_at,
              product:products(
                id,
                name,
                hero_image,
                seller:sellers(id, business_name, country)
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('OrderService: Supabase error getting customer orders:', error.message);
        } else if (data && data.length > 0) {
          return data as unknown as Order[];
        }
      } catch (err) {
        console.warn('OrderService: Unexpected error getting customer orders:', err);
      }
    }

    // Local fallback
    const all = this.getAllLocalOrders();
    return all.filter((o) => o.user_id === userId);
  }

  /**
   * Fetch a single order by ID with authorization verification
   */
  static async getOrderById(orderId: string, userId?: string): Promise<Order | null> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            user_id,
            status,
            subtotal,
            shipping_fee,
            tax,
            total,
            currency,
            shipping_address,
            created_at,
            updated_at,
            items:order_items(
              id,
              order_id,
              product_id,
              variant_id,
              seller_id,
              product_name,
              variant_description,
              unit_price,
              quantity,
              total_price,
              created_at
            )
          `)
          .eq('id', orderId)
          .maybeSingle();

        if (!error && data) {
          return data as unknown as Order;
        }
      } catch (err) {
        console.warn('OrderService: Error getting order by id:', err);
      }
    }

    const all = this.getAllLocalOrders();
    const found = all.find((o) => o.id === orderId);
    if (found && (found.user_id === userId || !userId)) {
      return found;
    }
    return null;
  }

  /**
   * Fetch orders for a seller atelier
   * Only returns order items and orders that belong to the seller.
   */
  static async getSellerOrders(sellerId: string): Promise<Order[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            user_id,
            status,
            subtotal,
            shipping_fee,
            tax,
            total,
            currency,
            shipping_address,
            created_at,
            updated_at,
            items:order_items!inner(
              id,
              order_id,
              product_id,
              variant_id,
              seller_id,
              product_name,
              variant_description,
              unit_price,
              quantity,
              total_price,
              created_at
            )
          `)
          .eq('items.seller_id', sellerId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as unknown as Order[];
        }
      } catch (err) {
        console.warn('OrderService: Error fetching seller orders:', err);
      }
    }

    // Local fallback: Filter orders that have items from this seller
    const all = this.getAllLocalOrders();
    return all
      .map((order) => {
        const sellerItems = (order.items || []).filter((item) => item.seller_id === sellerId);
        if (sellerItems.length === 0) return null;
        return {
          ...order,
          items: sellerItems,
        };
      })
      .filter(Boolean) as Order[];
  }

  /**
   * Fetch all ecosystem orders for platform governance / admin
   */
  static async getAdminOrders(): Promise<Order[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            user_id,
            status,
            subtotal,
            shipping_fee,
            tax,
            total,
            currency,
            shipping_address,
            created_at,
            updated_at,
            items:order_items(
              id,
              order_id,
              product_id,
              variant_id,
              seller_id,
              product_name,
              variant_description,
              unit_price,
              quantity,
              total_price,
              created_at
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as unknown as Order[];
        }
      } catch (err) {
        console.warn('OrderService: Error fetching admin orders:', err);
      }
    }

    return this.getAllLocalOrders();
  }

  /**
   * Cancel an order in pending_payment status and restore inventory, returning detailed outcome
   */
  static async cancelCustomerOrder(orderId: string, userId: string): Promise<CancelOrderResponse> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('cancel_order_secure', {
          p_order_id: orderId,
        });

        if (!error && data?.success) {
          return {
            success: true,
            code: 'SUCCESS',
            message: 'Order cancelled successfully. Reserved atelier inventory has been restored.',
          };
        }

        if (error) {
          const errMsg = error.message || '';
          if (errMsg.includes('UNAUTHENTICATED') || errMsg.includes('UNAUTHORIZED')) {
            return {
              success: false,
              code: 'UNAUTHORIZED',
              message: 'You are not authorized to cancel this order.',
            };
          }
          if (errMsg.includes('ORDER_NOT_FOUND')) {
            return {
              success: false,
              code: 'NOT_FOUND',
              message: 'The requested order could not be found.',
            };
          }
          if (errMsg.includes('INVALID_STATUS')) {
            return {
              success: false,
              code: 'NOT_CANCELLABLE',
              message: 'Only pending orders can be cancelled. This order has already moved into production or dispatch.',
            };
          }
          return {
            success: false,
            code: 'NETWORK_ERROR',
            message: error.message || 'Unable to cancel order due to a backend error.',
          };
        }
      } catch (err: any) {
        console.warn('OrderService: Error cancelling order via RPC:', err);
        return {
          success: false,
          code: 'NETWORK_ERROR',
          message: err?.message || 'A network error occurred while communicating with the server.',
        };
      }
    }

    // Local fallback
    const all = this.getAllLocalOrders();
    const existingOrder = all.find((o) => o.id === orderId);

    if (!existingOrder) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: 'The requested order could not be found in your order history.',
      };
    }

    if (existingOrder.user_id !== userId) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'You are not authorized to cancel another client’s order.',
      };
    }

    if (existingOrder.status === 'cancelled') {
      return {
        success: false,
        code: 'ALREADY_CANCELLED',
        message: 'This order has already been cancelled.',
      };
    }

    if (existingOrder.status !== 'pending_payment') {
      return {
        success: false,
        code: 'NOT_CANCELLABLE',
        message: 'This order cannot be cancelled as it has already moved into production or fulfillment.',
      };
    }

    // Restore stock
    const localStock = this.getLocalInventory();
    for (const item of existingOrder.items || []) {
      if (item.variant_id) {
        localStock[item.variant_id] = (localStock[item.variant_id] || 0) + item.quantity;
      }
    }
    this.saveLocalInventory(localStock);

    existingOrder.status = 'cancelled';
    existingOrder.updated_at = new Date().toISOString();
    const orderIndex = all.findIndex((o) => o.id === orderId);
    all[orderIndex] = existingOrder;
    this.saveAllLocalOrders(all);

    return {
      success: true,
      code: 'SUCCESS',
      message: 'Order cancelled successfully. Reserved atelier inventory has been restored.',
    };
  }

  /**
   * Cancel an order in pending_payment status and restore inventory (boolean return for backward compatibility)
   */
  static async cancelOrder(orderId: string, userId: string): Promise<boolean> {
    const res = await this.cancelCustomerOrder(orderId, userId);
    return res.success;
  }

  /**
   * Update order status (for seller fulfillment or admin)
   */
  static async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('update_seller_order_status', {
          p_order_id: orderId,
          p_new_status: newStatus,
        });

        if (!error && data?.success) {
          return true;
        }
      } catch (err) {
        console.warn('OrderService: Error updating order status via RPC:', err);
      }
    }

    // Local fallback
    const all = this.getAllLocalOrders();
    const order = all.find((o) => o.id === orderId);
    if (order) {
      order.status = newStatus;
      order.updated_at = new Date().toISOString();
      this.saveAllLocalOrders(all);
      return true;
    }

    return false;
  }

  /**
   * Mark order as paid and transition to processing status after authoritative payment verification
   */
  static async markOrderPaid(orderId: string, paymentReference: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', orderId);
        if (!error) return true;
      } catch (err) {
        console.warn('OrderService: markOrderPaid error:', err);
      }
    }

    const all = this.getAllLocalOrders();
    const order = all.find((o) => o.id === orderId);
    if (order) {
      order.status = 'processing';
      order.updated_at = new Date().toISOString();
      this.saveAllLocalOrders(all);
      return true;
    }
    return false;
  }

  // Local storage helpers
  private static getAllLocalOrders(): Order[] {
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static saveAllLocalOrders(orders: Order[]): void {
    try {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }

  private static getLocalInventory(): Record<string, number> {
    try {
      const raw = localStorage.getItem(LOCAL_INVENTORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private static saveLocalInventory(stock: Record<string, number>): void {
    try {
      localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(stock));
    } catch {
      // ignore
    }
  }
}
