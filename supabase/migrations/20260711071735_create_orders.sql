/*
# Create orders table

1. New Tables
  - `orders`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK → profiles.id, cascade delete, defaults to auth.uid())
    - `order_no` (text, not null) — human-readable order number, e.g. "ORD-20250711-001"
    - `title` (text, not null) — order item name, e.g. "北京红色旅游套餐"
    - `image_url` (text, nullable) — optional product image
    - `amount` (numeric(10,2), not null) — order total in CNY
    - `status` (text, not null) — one of 'pending_payment', 'paid', 'cancelled'
    - `description` (text, default '') — optional order description
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

2. Security
  - Enable RLS on `orders`.
  - Owner-scoped CRUD: each authenticated user can only access rows they own.
  - user_id defaults to auth.uid() so client inserts omitting user_id still pass WITH CHECK.

3. Notes
  - Includes a CHECK constraint on status to enforce valid values.
  - Index on user_id for efficient per-user queries.
*/

CREATE TABLE IF NOT EXISTS orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  order_no    text NOT NULL,
  title       text NOT NULL,
  image_url   text,
  amount      numeric(10,2) NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'cancelled')),
  description text DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_orders" ON orders;
CREATE POLICY "delete_own_orders" ON orders
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
