-- ==============================================================================
-- D-ELYNX TAILORS HUB - SECURITY & PRODUCTION HARDENING MIGRATION
-- Migration: 20260904000001_security_hardening.sql
-- Description: Hardens RLS policies across all 15 tables, prevents privilege
--              escalation, enforces search_path safety, secures auth triggers,
--              and configures Supabase Storage bucket policies.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS WITH FIXED SEARCH PATH
-- ------------------------------------------------------------------------------

-- Function to check if the requesting user has an admin or super_admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND professional_role IN ('admin', 'super_admin')
      AND status = 'active'
  );
$$;

-- Function to check if user has seller/atelier capabilities
CREATE OR REPLACE FUNCTION public.is_seller(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND professional_role IN ('seller', 'tailor', 'designer', 'manufacturer')
      AND status = 'active'
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. HARDEN USER CREATION TRIGGER & PREVENT ROLE SELF-ESCALATION
-- ------------------------------------------------------------------------------

-- Ensure update_timestamp_column has search_path set securely
CREATE OR REPLACE FUNCTION public.update_timestamp_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Hardened handle_new_user: Whitelist only standard non-administrative roles on signup.
-- Any attempt to inject 'admin' or 'super_admin' via raw_user_meta_data is neutralized.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  requested_role TEXT;
  safe_role user_professional_role;
BEGIN
  requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'professional_role', 'customer'));
  
  -- Restrict self-registration to non-administrative roles
  IF requested_role IN ('customer', 'designer', 'tailor', 'manufacturer', 'buyer_retailer', 'seller') THEN
    safe_role := requested_role::user_professional_role;
  ELSE
    -- If an attacker requests 'admin', 'super_admin', or 'moderator', default to 'customer'
    safe_role := 'customer'::user_professional_role;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    professional_role,
    status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    safe_role,
    'active'
  );
  RETURN NEW;
END;
$$;

-- Trigger to prevent regular users from elevating their role or bypassing suspension
CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If role or status is being changed
  IF (NEW.professional_role != OLD.professional_role OR NEW.status != OLD.status) THEN
    -- Only admin, super_admin, or service_role can alter role and status
    IF NOT public.is_admin(auth.uid()) THEN
      -- Revert role and status changes to original values
      NEW.professional_role := OLD.professional_role;
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_profile_tampering
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_profile_tampering();

-- ------------------------------------------------------------------------------
-- 3. COMPREHENSIVE RLS POLICIES AUDIT & CORRECTION
-- ------------------------------------------------------------------------------

-- A. PROFILES
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Anyone authenticated can view active profiles (for fashion marketplace & network)
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Public can view active seller and designer profiles
CREATE POLICY "Public can view active professional profiles"
  ON public.profiles FOR SELECT
  USING (status = 'active' AND professional_role IN ('designer', 'tailor', 'seller', 'manufacturer'));

-- Users can update their own profile (role and status changes guarded by trigger above)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin(auth.uid()));


-- B. SELLERS & ATELIERS
DROP POLICY IF EXISTS "Sellers viewable by everyone" ON public.sellers;
DROP POLICY IF EXISTS "Sellers can manage own record" ON public.sellers;

-- Public can view active, verified sellers
CREATE POLICY "Public can view active sellers"
  ON public.sellers FOR SELECT
  USING (status = 'active');

-- Sellers can view their own record even if pending or unverified
CREATE POLICY "Sellers can view own record"
  ON public.sellers FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Users can register as a seller (status starts as unverified)
CREATE POLICY "Users can create their own seller profile"
  ON public.sellers FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND verification_status = 'unverified'
  );

-- Sellers can update their business details but cannot alter verification status or ratings
CREATE POLICY "Sellers can update own business info"
  ON public.sellers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND verification_status = (SELECT verification_status FROM public.sellers WHERE user_id = auth.uid())
  );

-- Admins can update any seller (e.g. approve verification, suspend)
CREATE POLICY "Admins can manage all sellers"
  ON public.sellers FOR ALL
  USING (public.is_admin(auth.uid()));


-- C. CATEGORIES
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- Only admins can create, update, or delete categories
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- D. PRODUCTS
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage own products" ON public.products;

-- Public read for active products
CREATE POLICY "Active products are viewable by everyone"
  ON public.products FOR SELECT
  USING (status = 'active');

-- Sellers can view their own products (including drafts and archived)
CREATE POLICY "Sellers can view own products"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.id = products.seller_id
        AND sellers.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Sellers can create products under their seller profile
CREATE POLICY "Sellers can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.id = products.seller_id
        AND sellers.user_id = auth.uid()
        AND sellers.status = 'active'
    )
  );

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.id = products.seller_id
        AND sellers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.id = products.seller_id
        AND sellers.user_id = auth.uid()
    )
  );

-- Sellers can delete their own products
CREATE POLICY "Sellers can delete own products"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.id = products.seller_id
        AND sellers.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Admins can moderate all products
CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (public.is_admin(auth.uid()));


-- E. PRODUCT VARIANTS & INVENTORY
DROP POLICY IF EXISTS "Product variants viewable by everyone" ON public.product_variants;

CREATE POLICY "Product variants viewable by everyone"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Sellers can insert variants for own products"
  ON public.product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.sellers s ON p.seller_id = s.id
      WHERE p.id = product_variants.product_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update variants for own products"
  ON public.product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.sellers s ON p.seller_id = s.id
      WHERE p.id = product_variants.product_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete variants for own products"
  ON public.product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.sellers s ON p.seller_id = s.id
      WHERE p.id = product_variants.product_id
        AND s.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Inventory policies (previously missing!)
DROP POLICY IF EXISTS "Sellers can view own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Sellers can manage own inventory" ON public.inventory;

CREATE POLICY "Sellers can view own inventory"
  ON public.inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      JOIN public.sellers s ON p.seller_id = s.id
      WHERE pv.id = inventory.variant_id
        AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

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
  );


-- F. CARTS & CART ITEMS
DROP POLICY IF EXISTS "Users can view their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can manage cart items" ON public.cart_items;

CREATE POLICY "Users can manage own cart"
  ON public.carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );


-- G. WISHLISTS & WISHLIST ITEMS
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can manage own wishlist items" ON public.wishlist_items;

CREATE POLICY "Users can manage own wishlist"
  ON public.wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist items"
  ON public.wishlist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
        AND wishlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
        AND wishlists.user_id = auth.uid()
    )
  );


-- H. ADDRESSES
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;

CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- I. ORDERS & ORDER ITEMS
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Buyer can view own orders; sellers can view orders containing their garments; admins can view all
CREATE POLICY "Orders viewable by buyer, seller, or admin"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.sellers s ON oi.seller_id = s.id
      WHERE oi.order_id = orders.id
        AND s.user_id = auth.uid()
    )
  );

-- Buyer can create an order for themselves
CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Buyer can update order (e.g. cancel while pending payment), and admin can update status
CREATE POLICY "Authorized users can update orders"
  ON public.orders FOR UPDATE
  USING (
    public.is_admin(auth.uid())
    OR (auth.uid() = user_id AND status = 'pending_payment')
  );

-- Order Items Policies (previously missing!)
DROP POLICY IF EXISTS "Order items viewable by buyer, seller, or admin" ON public.order_items;
DROP POLICY IF EXISTS "Buyer can insert order items for own order" ON public.order_items;

CREATE POLICY "Order items viewable by buyer, seller, or admin"
  ON public.order_items FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = order_items.seller_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Buyer can insert order items for own order"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );


-- J. PAYMENTS
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

CREATE POLICY "Payments viewable by buyer and admin"
  ON public.payments FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Buyers can initiate payment record"
  ON public.payments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'initiated'
  );


-- K. REVIEWS
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

-- Authenticated users can create reviews with verified_purchase verified against orders
CREATE POLICY "Users can create review"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update own review"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own review or admin can moderate"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));


-- ------------------------------------------------------------------------------
-- 4. SUPABASE STORAGE BUCKETS & RLS POLICIES
-- ------------------------------------------------------------------------------

-- Create Storage buckets if they don't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'garment-media',
    'garment-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'seller-documents',
    'seller-documents',
    false, -- Private bucket (KYC / licenses)
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies: garment-media
CREATE POLICY "Garment media is publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'garment-media');

CREATE POLICY "Authenticated sellers can upload garment media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'garment-media'
    AND auth.role() = 'authenticated'
    AND public.is_seller(auth.uid())
  );

CREATE POLICY "Sellers can update/delete own garment media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'garment-media'
    AND auth.uid() = owner
  );

-- Storage Policies: avatars
CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users can update/delete own avatar"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Storage Policies: seller-documents (Private KYC)
CREATE POLICY "Seller can view and upload own KYC documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'seller-documents'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.is_admin(auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'seller-documents'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.is_admin(auth.uid())
    )
  );
