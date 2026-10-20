// D-ELYNX TAILORS HUB - Supabase Schema & Security Audit Catalog
// Run the migrations in supabase/migrations/ via your Supabase SQL Editor:
// 1. 20260904000000_initial_schema.sql (15 tables, enums, initial RLS)
// 2. 20260904000001_security_hardening.sql (RLS hardening, search_path fixes, privilege guards, storage policies)
// 3. 20260904000002_verification_fixes.sql (Order financial protection, seller status freeze, review verified purchase enforcement)
// 4. 20260904000003_order_checkout_foundation.sql (Commerce authority, inventory reservation lock, secure checkout & cancellation)
// 5. 20260905000000_comprehensive_security_hardening.sql (B2B RFQs, quotations, refunds, payouts, audit ledger, webhook idempotency)

export const SUPABASE_SCHEMA_CATALOG = {
  version: "1.4.0",
  migrations: [
    "20260904000000_initial_schema.sql",
    "20260904000001_security_hardening.sql",
    "20260904000002_verification_fixes.sql",
    "20260904000003_order_checkout_foundation.sql",
    "20260905000000_comprehensive_security_hardening.sql"
  ],
  tablesCount: 23,
  enums: [
    "user_professional_role",
    "user_account_status",
    "seller_verification_status",
    "product_status_type",
    "order_status_type",
    "payment_status_type"
  ],
  tables: [
    "profiles",
    "sellers",
    "categories",
    "products",
    "product_variants",
    "inventory",
    "carts",
    "cart_items",
    "wishlists",
    "wishlist_items",
    "addresses",
    "orders",
    "order_items",
    "payments",
    "reviews",
    "businesses",
    "refunds",
    "rfqs",
    "quotations",
    "seller_payouts",
    "notifications",
    "payment_webhook_events",
    "security_audit_logs"
  ],
  securityDefinerFunctions: [
    "public.is_admin(user_id UUID)",
    "public.is_seller(user_id UUID)",
    "public.is_moderator(user_id UUID)",
    "public.handle_new_user()",
    "public.prevent_profile_tampering()",
    "public.prevent_seller_tampering()",
    "public.prevent_order_tampering()",
    "public.prevent_refund_tampering()",
    "public.enforce_review_verified_purchase()",
    "public.update_timestamp_column()",
    "public.create_order_secure()",
    "public.cancel_order_secure()",
    "public.update_seller_order_status()",
    "public.record_security_event()"
  ],
  storageBuckets: [
    {
      name: "garment-media",
      public: true,
      maxSize: "10MB",
      types: ["image/jpeg", "image/png", "image/webp", "image/avif"]
    },
    {
      name: "avatars",
      public: true,
      maxSize: "2MB",
      types: ["image/jpeg", "image/png", "image/webp"]
    },
    {
      name: "seller-documents",
      public: false,
      maxSize: "10MB",
      types: ["application/pdf", "image/jpeg", "image/png"]
    }
  ]
};
