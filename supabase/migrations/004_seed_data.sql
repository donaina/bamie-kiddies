-- ============================================================
-- 004_seed_data.sql
-- Bamie Kiddies - Initial seed data
-- ============================================================

-- Site settings
INSERT INTO site_settings (key, value) VALUES
  ('store_name',      'Bamie Kiddies'),
  ('currency',        'NGN'),
  ('currency_symbol', '₦'),
  ('pickup_address',  'Contact us for pickup address'),
  ('support_email',   'support@bamiekiddies.com'),
  ('support_phone',   '+234 000 000 0000')
ON CONFLICT (key) DO NOTHING;

-- Sample delivery regions (admin can update/add more)
INSERT INTO delivery_regions (name, state, delivery_fee, estimated_days) VALUES
  ('Lagos Island',    'Lagos',  2000, '1-2 business days'),
  ('Lagos Mainland',  'Lagos',  1500, '1-2 business days'),
  ('Lekki / Ajah',   'Lagos',  2500, '1-2 business days'),
  ('Abuja (FCT)',     'Abuja',  4500, '2-4 business days'),
  ('Port Harcourt',  'Rivers', 5000, '3-5 business days'),
  ('Ibadan',         'Oyo',    4000, '2-4 business days'),
  ('Kano',           'Kano',   5500, '3-5 business days'),
  ('Enugu',          'Enugu',  5000, '3-5 business days'),
  ('Other Locations', NULL,    6000, '3-7 business days')
ON CONFLICT (name) DO NOTHING;
