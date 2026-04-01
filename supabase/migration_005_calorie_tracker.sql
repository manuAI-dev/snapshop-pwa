-- ============================================================
-- SnapShop: Kalorien-Tracker
-- Migration 005: calorie_entries Tabelle
-- ============================================================

CREATE TABLE IF NOT EXISTS calorie_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('frühstück', 'mittagessen', 'abendessen', 'snack')),
  title TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein REAL,
  carbs REAL,
  fat REAL,
  photo_url TEXT,
  recipe_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_calorie_entries_user_date ON calorie_entries(user_id, date);

-- RLS
ALTER TABLE calorie_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calorie_entries_select" ON calorie_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "calorie_entries_insert" ON calorie_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "calorie_entries_update" ON calorie_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "calorie_entries_delete" ON calorie_entries
  FOR DELETE USING (user_id = auth.uid());
