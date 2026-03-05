-- ============================================================
-- 002_rls_policies.sql
-- Bamie Kiddies - Row Level Security policies
-- ============================================================

-- Helper: check if current user is an active admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── products ─────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "admins_manage_products"
  ON products FOR ALL
  USING (is_admin());

-- ── product_images ────────────────────────────────────────────
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_product_images"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_images.product_id AND is_active = true
    )
  );

CREATE POLICY "admins_manage_product_images"
  ON product_images FOR ALL
  USING (is_admin());

-- ── product_variants ──────────────────────────────────────────
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_variants"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_variants.product_id AND is_active = true
    )
  );

CREATE POLICY "admins_manage_variants"
  ON product_variants FOR ALL
  USING (is_admin());

-- ── delivery_regions ─────────────────────────────────────────
ALTER TABLE delivery_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_regions"
  ON delivery_regions FOR SELECT
  USING (is_active = true);

CREATE POLICY "admins_manage_regions"
  ON delivery_regions FOR ALL
  USING (is_admin());

-- ── orders ────────────────────────────────────────────────────
-- No public SELECT — orders only readable via service_role (server-side)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_all_orders"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "admins_update_orders"
  ON orders FOR UPDATE
  USING (is_admin());

-- ── order_items ───────────────────────────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_order_items"
  ON order_items FOR SELECT
  USING (is_admin());

-- ── admin_users ───────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_own_record"
  ON admin_users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "super_admin_manage_all"
  ON admin_users FOR ALL
  USING (is_super_admin());

-- ── webhook_events ────────────────────────────────────────────
-- Only service_role (bypasses RLS) accesses this table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_user_access"
  ON webhook_events FOR ALL
  USING (false);

-- ── site_settings ─────────────────────────────────────────────
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "admins_manage_settings"
  ON site_settings FOR ALL
  USING (is_admin());
