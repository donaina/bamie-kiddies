-- ============================================================
-- 005_discount_percent.sql
-- Add discount_percent column to products
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (discount_percent >= 0 AND discount_percent <= 100);
