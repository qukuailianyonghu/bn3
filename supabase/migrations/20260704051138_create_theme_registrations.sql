CREATE TABLE IF NOT EXISTS theme_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  theme_id text NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, theme_id)
);

ALTER TABLE theme_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_reg_select" ON theme_registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "theme_reg_insert" ON theme_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "theme_reg_delete" ON theme_registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_theme_reg_theme_id ON theme_registrations(theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_reg_user_id ON theme_registrations(user_id);
