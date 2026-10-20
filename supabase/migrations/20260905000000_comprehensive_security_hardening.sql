-- ==============================================================================
-- D-ELYNX TAILORS HUB - COMPREHENSIVE SECURITY HARDENING & GOVERNANCE
-- Migration: 20260905000000_comprehensive_security_hardening.sql
--
-- Extends Row Level Security (RLS), RBAC, B2B RFQs, Refunds, Seller Payouts,
-- Webhook Event Idempotency, and Immutable Audit Logging.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS & RBAC EXTENSIONS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_moderator(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND professional_role IN ('moderator', 'admin', 'super_admin')
      AND status = 'active'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. B2B & BUSINESSES TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  registration_number TEXT,
  tax_id TEXT,
  business_type TEXT DEFAULT 'atelier', -- atelier, fabric_mill, machinery, trim_supplier
  contact_email TEXT,
  contact_phone TEXT,
  verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- active, suspended, pending
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified active businesses"
  ON public.businesses FOR SELECT
  USING (status = 'active' AND verified = TRUE);

CREATE POLICY "Owners can view their own businesses"
  ON public.businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert their business"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their business details"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all businesses"
  ON public.businesses FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 3. REFUNDS & FINANCIAL REMEDIATION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, processed
  approved_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  gateway_refund_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own refunds"
  ON public.refunds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sellers can view refunds for orders containing their items"
  ON public.refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.sellers s ON oi.seller_id = s.id
      WHERE oi.order_id = public.refunds.order_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all refunds"
  ON public.refunds FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Trigger to prevent customers from tampering with or approving refunds
CREATE OR REPLACE FUNCTION public.prevent_refund_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    -- Only admins can change status from pending to approved/processed
    IF OLD.status != NEW.status AND NEW.status IN ('approved', 'processed') THEN
      RAISE EXCEPTION 'FORBIDDEN: Only authorized platform administrators can approve or process refunds.';
    END IF;
    -- Amount, order_id, user_id are immutable
    NEW.amount := OLD.amount;
    NEW.order_id := OLD.order_id;
    NEW.user_id := OLD.user_id;
    NEW.currency := OLD.currency;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_refund_tampering ON public.refunds;
CREATE TRIGGER trg_prevent_refund_tampering
BEFORE UPDATE ON public.refunds
FOR EACH ROW EXECUTE FUNCTION public.prevent_refund_tampering();

-- ------------------------------------------------------------------------------
-- 4. B2B RFQS & PROPOSALS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  target_quantity INTEGER NOT NULL CHECK (target_quantity > 0),
  budget_min NUMERIC(12, 2) CHECK (budget_min >= 0),
  budget_max NUMERIC(12, 2) CHECK (budget_max >= budget_min),
  currency TEXT NOT NULL DEFAULT 'NGN',
  deadline TIMESTAMPTZ,
  specifications TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, closed, awarded, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public or sellers can view open RFQs"
  ON public.rfqs FOR SELECT
  USING (status = 'open' OR buyer_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Buyers can insert their RFQs"
  ON public.rfqs FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own RFQs"
  ON public.rfqs FOR UPDATE
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price > 0),
  total_price NUMERIC(12, 2) NOT NULL CHECK (total_price > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  lead_time_days INTEGER NOT NULL CHECK (lead_time_days > 0),
  proposal_notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, accepted, rejected, withdrawn
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Competitor quotation isolation: Only quotation author, RFQ buyer, or admin can read
CREATE POLICY "Sellers can view their own quotations"
  ON public.quotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = public.quotations.seller_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "RFQ buyers can view quotations on their RFQ"
  ON public.quotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs r
      WHERE r.id = public.quotations.rfq_id AND r.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can submit quotations"
  ON public.quotations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = seller_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all quotations"
  ON public.quotations FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 5. SELLER PAYOUTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  commission_deducted NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12, 2) NOT NULL CHECK (net_amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  payout_reference TEXT UNIQUE,
  destination_account_masked TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own payouts"
  ON public.seller_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = public.seller_payouts.seller_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payouts"
  ON public.seller_payouts FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 6. NOTIFICATIONS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'order', -- order, payment, security, atelier, b2b
  read_at TIMESTAMPTZ,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. PAYMENT WEBHOOK EVENTS & IDEMPOTENCY LEDGER
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- paystack, flutterwave, monnify
  event_type TEXT NOT NULL,
  event_reference TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_id UUID REFERENCES public.orders(id),
  status TEXT NOT NULL DEFAULT 'processed' -- processed, failed, duplicate
);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events"
  ON public.payment_webhook_events FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 8. IMMUTABLE SECURITY AUDIT LOGS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  severity TEXT DEFAULT 'info', -- info, warning, high, critical
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security audit logs"
  ON public.security_audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Disallow updates or deletes on audit logs: Append-only ledger
CREATE OR REPLACE FUNCTION public.freeze_security_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'FORBIDDEN: Security audit logs are immutable and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_freeze_security_audit_logs ON public.security_audit_logs;
CREATE TRIGGER trg_freeze_security_audit_logs
BEFORE UPDATE OR DELETE ON public.security_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.freeze_security_audit_logs();

-- Helper function to record audit event safely
CREATE OR REPLACE FUNCTION public.record_security_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_severity TEXT DEFAULT 'info',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    actor_id,
    action,
    resource_type,
    resource_id,
    severity,
    metadata
  )
  VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_severity,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;
