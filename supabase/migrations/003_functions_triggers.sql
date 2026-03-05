-- ============================================================
-- 003_functions_triggers.sql
-- Bamie Kiddies - DB functions and triggers
-- ============================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_delivery_regions_updated_at
  BEFORE UPDATE ON delivery_regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Atomic inventory decrement ────────────────────────────────
-- Called after payment confirmed; GREATEST prevents negative stock
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_variant_id UUID,
  p_quantity   INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET quantity = GREATEST(0, quantity - p_quantity)
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Generate human-readable order number ─────────────────────
-- Format: BME-YYYYMMDD-XXXX (sequential per day)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_date_part TEXT;
  v_seq_num   INTEGER;
  v_seq_part  TEXT;
BEGIN
  v_date_part := TO_CHAR(now() AT TIME ZONE 'Africa/Lagos', 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_seq_num
  FROM orders
  WHERE (created_at AT TIME ZONE 'Africa/Lagos')::date =
        (now() AT TIME ZONE 'Africa/Lagos')::date;
  v_seq_part := LPAD(v_seq_num::TEXT, 4, '0');
  RETURN 'BME-' || v_date_part || '-' || v_seq_part;
END;
$$ LANGUAGE plpgsql;

-- ── Analytics helper: daily revenue summary ──────────────────
CREATE OR REPLACE FUNCTION get_revenue_by_day(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  sale_date       DATE,
  order_count     BIGINT,
  revenue         NUMERIC,
  profit          NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (o.created_at AT TIME ZONE 'Africa/Lagos')::date AS sale_date,
    COUNT(DISTINCT o.id)                             AS order_count,
    SUM(o.total_amount)                              AS revenue,
    SUM(oi.subtotal - COALESCE(oi.unit_cost, 0) * oi.quantity) AS profit
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE
    o.payment_status = 'paid'
    AND o.created_at >= now() - (p_days || ' days')::INTERVAL
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
