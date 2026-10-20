-- ==============================================================================
-- D-ELYNX TAILORS HUB - SECURITY VERIFICATION TARGETED CORRECTIONS
-- Migration: 20260904000002_verification_fixes.sql
-- Description: Targeted database-level protections for order financial tampering,
--              seller status/reputation elevation, review purchase spoofing,
--              and inventory variant reassignment.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PREVENT SELLER STATUS, REPUTATION, AND VERIFICATION TAMPERING
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_seller_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If not an administrator, freeze privileged columns to existing values
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.status := OLD.status;
    NEW.verification_status := OLD.verification_status;
    NEW.rating := OLD.rating;
    NEW.rating_count := OLD.rating_count;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_seller_tampering ON public.sellers;
CREATE TRIGGER trg_prevent_seller_tampering
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_seller_tampering();


-- ------------------------------------------------------------------------------
-- 2. PREVENT ORDER FINANCIAL TAMPERING & UNAUTHORIZED STATUS CHANGES
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_order_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If not an administrator, prevent buyer from altering monetary values or fabricating paid status
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.total := OLD.total;
    NEW.subtotal := OLD.subtotal;
    NEW.shipping_fee := OLD.shipping_fee;
    NEW.tax := OLD.tax;
    NEW.currency := OLD.currency;
    NEW.user_id := OLD.user_id;
    NEW.order_number := OLD.order_number;

    -- Buyers can only transition status from pending_payment to cancelled
    IF OLD.status = 'pending_payment' AND NEW.status = 'cancelled' THEN
      -- Allowed cancellation
      NULL;
    ELSE
      -- Disallow changing to paid, confirmed, processing, shipped, or delivered
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_order_tampering ON public.orders;
CREATE TRIGGER trg_prevent_order_tampering
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_order_tampering();

-- Tighten orders UPDATE policy
DROP POLICY IF EXISTS "Authorized users can update orders" ON public.orders;
CREATE POLICY "Authorized users can update orders"
  ON public.orders FOR UPDATE
  USING (
    public.is_admin(auth.uid())
    OR (auth.uid() = user_id AND status = 'pending_payment')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (auth.uid() = user_id AND status IN ('pending_payment', 'cancelled'))
  );


-- ------------------------------------------------------------------------------
-- 3. AUTOMATIC VERIFIED PURCHASE BADGE ENFORCEMENT ON REVIEWS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_review_verified_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Non-admins cannot self-certify verified_purchase
  IF NOT public.is_admin(auth.uid()) THEN
    -- Verify against actual completed orders in database
    NEW.verified_purchase := EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      WHERE o.user_id = NEW.user_id
        AND oi.product_id = NEW.product_id
        AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_verified_purchase ON public.reviews;
CREATE TRIGGER trg_enforce_review_verified_purchase
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_review_verified_purchase();


-- ------------------------------------------------------------------------------
-- 4. HARDEN INVENTORY WITH EXPLICIT WITH CHECK CONDITION
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Sellers can update own inventory" ON public.inventory;
CREATE POLICY "Sellers can update own inventory"
  ON public.inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      JOIN public.sellers s ON p.seller_id = s.id
      WHERE pv.id = inventory.variant_id
        AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      JOIN public.sellers s ON p.seller_id = s.id
      WHERE pv.id = inventory.variant_id
        AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );


-- ------------------------------------------------------------------------------
-- 5. ADMIN PAYMENTS AUDIT & GOVERNANCE POLICY
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ------------------------------------------------------------------------------
-- 6. CUSTOMER PROFILE SENSITIVE DATA ISOLATION
-- ------------------------------------------------------------------------------

-- Remove broad visibility of all profiles to any authenticated user
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

-- Only professional/creator profiles are visible across the ecosystem
CREATE POLICY "Professional profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (
    status = 'active'
    AND professional_role IN ('designer', 'tailor', 'seller', 'manufacturer', 'buyer_retailer', 'instructor_mentor')
  );

-- Private customer profiles are strictly isolated to the owning customer and admins
CREATE POLICY "Customer profiles viewable by owner or admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin(auth.uid())
  );

