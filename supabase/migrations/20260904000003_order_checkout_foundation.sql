-- ==============================================================================
-- D-ELYNX TAILORS HUB - MIGRATION 20260904000003
-- Phase 2: Order & Checkout Foundation (Commerce Authority & Inventory Safety)
-- ==============================================================================

-- 1. SCHEMA HARDENING ON ORDERS & ORDER ITEMS
-- ------------------------------------------------------------------------------

-- Default currency to Nigerian Naira (NGN)
ALTER TABLE public.orders ALTER COLUMN currency SET DEFAULT 'NGN';

-- Add idempotency_key for preventing duplicate order submissions on double-clicks or retries
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_idempotency
  ON public.orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Snapshot SKU on order_items for long-term historical auditability
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS sku TEXT;

-- ------------------------------------------------------------------------------
-- 2. COMMERCE AUTHORITY: ATOMIC SECURE ORDER CREATION
-- ------------------------------------------------------------------------------
-- Calculates authoritative prices from products/variants tables.
-- Acquires FOR UPDATE lock on inventory to prevent overselling race conditions.
-- Validates delivery address ownership.
-- Generates order snapshot and decrements available inventory atomically.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_address_id UUID,
  p_cart_id UUID DEFAULT NULL,
  p_items JSONB DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_address RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC(12, 2) := 0.00;
  v_shipping NUMERIC(12, 2) := 0.00;
  v_tax NUMERIC(12, 2) := 0.00;
  v_total NUMERIC(12, 2) := 0.00;
  v_currency VARCHAR(3) := 'NGN';
  v_existing_order RECORD;
  v_cart_item RECORD;
  v_product RECORD;
  v_variant RECORD;
  v_inv RECORD;
  v_unit_price NUMERIC(12, 2);
  v_line_total NUMERIC(12, 2);
  v_sku TEXT;
  v_variant_desc TEXT;
  v_item_count INT := 0;
  v_target_cart_id UUID := p_cart_id;
BEGIN
  -- A. Identify and authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Authentication is required to place an order';
  END IF;

  -- B. Idempotency Check: Return existing order if identical key was already submitted
  IF p_idempotency_key IS NOT NULL AND TRIM(p_idempotency_key) != '' THEN
    SELECT id, order_number, total, subtotal, tax, currency, status
    INTO v_existing_order
    FROM public.orders
    WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'status', v_existing_order.status,
        'total', v_existing_order.total,
        'subtotal', v_existing_order.subtotal,
        'tax', v_existing_order.tax,
        'currency', v_existing_order.currency
      );
    END IF;
  END IF;

  -- C. Verify Delivery Address & Ownership
  IF p_address_id IS NULL THEN
    RAISE EXCEPTION 'MISSING_ADDRESS: Delivery destination address is required';
  END IF;

  SELECT * INTO v_address
  FROM public.addresses
  WHERE id = p_address_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ADDRESS: Specified delivery address is invalid or does not belong to the user';
  END IF;

  -- D. Generate Human-Readable Order Reference
  v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', ''), 1, 6));

  -- Create order record shell
  INSERT INTO public.orders (
    order_number,
    user_id,
    status,
    subtotal,
    shipping_fee,
    tax,
    total,
    currency,
    shipping_address,
    idempotency_key
  ) VALUES (
    v_order_number,
    v_user_id,
    'pending_payment',
    0.00,
    0.00,
    0.00,
    0.00,
    'NGN',
    to_jsonb(v_address),
    p_idempotency_key
  ) RETURNING id INTO v_order_id;

  -- E. Process Items (either from explicit p_items or user cart)
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_cart_item IN
      SELECT
        (elem->>'product_id')::UUID AS product_id,
        NULLIF(elem->>'variant_id', '')::UUID AS variant_id,
        GREATEST(1, COALESCE((elem->>'quantity')::INT, 1)) AS quantity
      FROM jsonb_array_elements(p_items) AS elem
    LOOP
      v_item_count := v_item_count + 1;

      -- AUTHORITATIVE PRODUCT LOOKUP
      SELECT * INTO v_product
      FROM public.products
      WHERE id = v_cart_item.product_id
      FOR SHARE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Product % does not exist', v_cart_item.product_id;
      END IF;

      IF v_product.status != 'active' THEN
        RAISE EXCEPTION 'PRODUCT_UNAVAILABLE: Garment "%" is not active for purchase (status: %)', v_product.name, v_product.status;
      END IF;

      v_unit_price := v_product.base_price;
      v_currency := COALESCE(v_product.currency, 'NGN');
      v_sku := 'SKU-' || UPPER(SUBSTRING(REPLACE(v_product.id::text, '-', ''), 1, 8));
      v_variant_desc := NULL;

      -- AUTHORITATIVE VARIANT & INVENTORY CHECK
      IF v_cart_item.variant_id IS NOT NULL THEN
        SELECT * INTO v_variant
        FROM public.product_variants
        WHERE id = v_cart_item.variant_id AND product_id = v_cart_item.product_id
        FOR SHARE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'VARIANT_NOT_FOUND: Variant % does not exist for product "%"', v_cart_item.variant_id, v_product.name;
        END IF;

        IF v_variant.price_override IS NOT NULL AND v_variant.price_override > 0 THEN
          v_unit_price := v_variant.price_override;
        END IF;

        v_sku := v_variant.sku;
        v_variant_desc := TRIM(CONCAT_WS(' • ',
          CASE WHEN v_variant.size IS NOT NULL THEN 'Size: ' || v_variant.size ELSE NULL END,
          CASE WHEN v_variant.color IS NOT NULL THEN 'Color: ' || v_variant.color ELSE NULL END,
          CASE WHEN v_variant.material IS NOT NULL THEN 'Material: ' || v_variant.material ELSE NULL END
        ));

        -- ATOMIC INVENTORY CHECK & RESERVATION (Pessimistic lock)
        SELECT * INTO v_inv
        FROM public.inventory
        WHERE variant_id = v_cart_item.variant_id
        FOR UPDATE;

        IF FOUND THEN
          IF v_inv.quantity_available < v_cart_item.quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_INVENTORY: Insufficient stock for garment "%" (available: %, requested: %)',
              v_product.name, v_inv.quantity_available, v_cart_item.quantity;
          END IF;

          UPDATE public.inventory
          SET
            quantity_available = quantity_available - v_cart_item.quantity,
            quantity_reserved = quantity_reserved + v_cart_item.quantity,
            updated_at = NOW()
          WHERE id = v_inv.id;
        END IF;
      END IF;

      v_line_total := v_unit_price * v_cart_item.quantity;
      v_subtotal := v_subtotal + v_line_total;

      -- INSERT ORDER ITEM SNAPSHOT
      INSERT INTO public.order_items (
        order_id,
        product_id,
        variant_id,
        seller_id,
        product_name,
        variant_description,
        unit_price,
        quantity,
        total_price,
        sku
      ) VALUES (
        v_order_id,
        v_product.id,
        v_cart_item.variant_id,
        v_product.seller_id,
        v_product.name,
        v_variant_desc,
        v_unit_price,
        v_cart_item.quantity,
        v_line_total,
        v_sku
      );
    END LOOP;

  ELSE
    -- Resolve User's Cart
    IF v_target_cart_id IS NULL THEN
      SELECT id INTO v_target_cart_id FROM public.carts WHERE user_id = v_user_id;
    END IF;

    IF v_target_cart_id IS NULL THEN
      RAISE EXCEPTION 'EMPTY_CART: No active shopping cart found for user';
    END IF;

    FOR v_cart_item IN
      SELECT ci.product_id, ci.variant_id, ci.quantity
      FROM public.cart_items ci
      WHERE ci.cart_id = v_target_cart_id
    LOOP
      v_item_count := v_item_count + 1;

      -- AUTHORITATIVE PRODUCT LOOKUP
      SELECT * INTO v_product
      FROM public.products
      WHERE id = v_cart_item.product_id
      FOR SHARE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Product % does not exist', v_cart_item.product_id;
      END IF;

      IF v_product.status != 'active' THEN
        RAISE EXCEPTION 'PRODUCT_UNAVAILABLE: Garment "%" is not active for purchase (status: %)', v_product.name, v_product.status;
      END IF;

      v_unit_price := v_product.base_price;
      v_currency := COALESCE(v_product.currency, 'NGN');
      v_sku := 'SKU-' || UPPER(SUBSTRING(REPLACE(v_product.id::text, '-', ''), 1, 8));
      v_variant_desc := NULL;

      -- AUTHORITATIVE VARIANT & INVENTORY CHECK
      IF v_cart_item.variant_id IS NOT NULL THEN
        SELECT * INTO v_variant
        FROM public.product_variants
        WHERE id = v_cart_item.variant_id AND product_id = v_cart_item.product_id
        FOR SHARE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'VARIANT_NOT_FOUND: Variant % does not exist for product "%"', v_cart_item.variant_id, v_product.name;
        END IF;

        IF v_variant.price_override IS NOT NULL AND v_variant.price_override > 0 THEN
          v_unit_price := v_variant.price_override;
        END IF;

        v_sku := v_variant.sku;
        v_variant_desc := TRIM(CONCAT_WS(' • ',
          CASE WHEN v_variant.size IS NOT NULL THEN 'Size: ' || v_variant.size ELSE NULL END,
          CASE WHEN v_variant.color IS NOT NULL THEN 'Color: ' || v_variant.color ELSE NULL END,
          CASE WHEN v_variant.material IS NOT NULL THEN 'Material: ' || v_variant.material ELSE NULL END
        ));

        -- ATOMIC INVENTORY CHECK & RESERVATION
        SELECT * INTO v_inv
        FROM public.inventory
        WHERE variant_id = v_cart_item.variant_id
        FOR UPDATE;

        IF FOUND THEN
          IF v_inv.quantity_available < v_cart_item.quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_INVENTORY: Insufficient stock for garment "%" (available: %, requested: %)',
              v_product.name, v_inv.quantity_available, v_cart_item.quantity;
          END IF;

          UPDATE public.inventory
          SET
            quantity_available = quantity_available - v_cart_item.quantity,
            quantity_reserved = quantity_reserved + v_cart_item.quantity,
            updated_at = NOW()
          WHERE id = v_inv.id;
        END IF;
      END IF;

      v_line_total := v_unit_price * v_cart_item.quantity;
      v_subtotal := v_subtotal + v_line_total;

      -- INSERT ORDER ITEM SNAPSHOT
      INSERT INTO public.order_items (
        order_id,
        product_id,
        variant_id,
        seller_id,
        product_name,
        variant_description,
        unit_price,
        quantity,
        total_price,
        sku
      ) VALUES (
        v_order_id,
        v_product.id,
        v_cart_item.variant_id,
        v_product.seller_id,
        v_product.name,
        v_variant_desc,
        v_unit_price,
        v_cart_item.quantity,
        v_line_total,
        v_sku
      );
    END LOOP;

    -- Clear purchased items from user's cart
    DELETE FROM public.cart_items WHERE cart_id = v_target_cart_id;
  END IF;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'EMPTY_ORDER: Cannot create an order with zero items';
  END IF;

  -- F. Compute Authoritative Financial Totals
  v_tax := ROUND(v_subtotal * 0.075, 2); -- Standard 7.5% Nigerian VAT
  v_shipping := 0.00; -- Complimentary luxury atelier delivery
  v_total := v_subtotal + v_shipping + v_tax;

  -- G. Finalize Order Record
  UPDATE public.orders
  SET
    subtotal = v_subtotal,
    shipping_fee = v_shipping,
    tax = v_tax,
    total = v_total,
    currency = v_currency,
    updated_at = NOW()
  WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending_payment',
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping,
    'tax', v_tax,
    'total', v_total,
    'currency', v_currency,
    'items_count', v_item_count
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. ORDER CANCELLATION & INVENTORY RESTORATION
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_order_secure(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
  v_item RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Authentication required';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: Order does not exist';
  END IF;

  IF v_order.user_id != v_user_id AND NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Cannot cancel another client''s order';
  END IF;

  IF v_order.status != 'pending_payment' THEN
    RAISE EXCEPTION 'INVALID_STATUS: Only pending orders can be cancelled (current status: %)', v_order.status;
  END IF;

  -- Restore reserved inventory for each line item
  FOR v_item IN
    SELECT variant_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id AND variant_id IS NOT NULL
  LOOP
    UPDATE public.inventory
    SET
      quantity_available = quantity_available + v_item.quantity,
      quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
      updated_at = NOW()
    WHERE variant_id = v_item.variant_id;
  END LOOP;

  -- Update status to cancelled
  UPDATE public.orders
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'cancelled'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. SELLER FULFILLMENT STATUS WORKFLOW
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_seller_order_status(
  p_order_id UUID,
  p_new_status order_status_type
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_seller BOOLEAN;
  v_is_admin BOOLEAN;
  v_order RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Authentication required';
  END IF;

  v_is_admin := public.is_admin(v_user_id);
  v_is_seller := EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.sellers s ON oi.seller_id = s.id
    WHERE oi.order_id = p_order_id AND s.user_id = v_user_id
  );

  IF NOT (v_is_admin OR v_is_seller) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only authorized sellers or admins can update order status';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: Order does not exist';
  END IF;

  -- Non-admins cannot manipulate refund status
  IF NOT v_is_admin THEN
    IF p_new_status IN ('refunded') THEN
      RAISE EXCEPTION 'FORBIDDEN_STATUS: Sellers cannot issue refunds or alter financial settlement status directly';
    END IF;
  END IF;

  UPDATE public.orders
  SET
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'new_status', p_new_status
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. COORDINATED ORDER INTEGRITY TRIGGER
-- ------------------------------------------------------------------------------
-- Upgrades prevent_order_tampering to coordinate with authorized seller fulfillment
-- transitions while strictly guaranteeing that buyers and sellers CANNOT tamper
-- with prices, subtotals, VAT, shipping, currency, user ownership, or declare "paid".
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_order_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
  v_is_seller BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin(v_caller_id);

  IF NOT v_is_admin THEN
    -- Financial invariants are completely frozen against non-admin modification
    NEW.total := OLD.total;
    NEW.subtotal := OLD.subtotal;
    NEW.shipping_fee := OLD.shipping_fee;
    NEW.tax := OLD.tax;
    NEW.currency := OLD.currency;
    NEW.user_id := OLD.user_id;
    NEW.order_number := OLD.order_number;

    -- Check if caller is an authorized seller with line items in this order
    v_is_seller := EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.sellers s ON oi.seller_id = s.id
      WHERE oi.order_id = OLD.id AND s.user_id = v_caller_id
    );

    IF v_is_seller THEN
      -- Sellers can only advance fulfillment statuses; cannot refund, declare paid, or manipulate
      IF NEW.status IN ('processing', 'in_production', 'ready_for_dispatch', 'shipped', 'delivered') THEN
        NULL; -- Authorized fulfillment transition
      ELSE
        NEW.status := OLD.status;
      END IF;
    ELSIF v_caller_id = OLD.user_id THEN
      -- Customers can only cancel an unpaid order
      IF OLD.status = 'pending_payment' AND NEW.status = 'cancelled' THEN
        NULL; -- Authorized customer cancellation
      ELSE
        NEW.status := OLD.status;
      END IF;
    ELSE
      -- All other parties cannot modify order status
      NEW.status := OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

