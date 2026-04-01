-- ============================================================
-- SnapShop: Familienplaner auf Steroiden
-- Migration 003: Haushaltsprofil + Meal Planner Upgrade
-- ============================================================

-- 1) Haushaltsprofil-Spalten zu households hinzufügen
ALTER TABLE households ADD COLUMN IF NOT EXISTS adults INTEGER NOT NULL DEFAULT 2;
ALTER TABLE households ADD COLUMN IF NOT EXISTS children INTEGER NOT NULL DEFAULT 0;
ALTER TABLE households ADD COLUMN IF NOT EXISTS dietary TEXT[] NOT NULL DEFAULT '{}';
  -- z.B. {'vegetarisch', 'laktosefrei'}
ALTER TABLE households ADD COLUMN IF NOT EXISTS allergies TEXT[] NOT NULL DEFAULT '{}';
  -- z.B. {'Nüsse', 'Gluten'}
ALTER TABLE households ADD COLUMN IF NOT EXISTS cooking_time_weekday INTEGER NOT NULL DEFAULT 30;
  -- Minuten verfügbar an Wochentagen
ALTER TABLE households ADD COLUMN IF NOT EXISTS cooking_time_weekend INTEGER NOT NULL DEFAULT 60;
  -- Minuten verfügbar am Wochenende

-- 2) household_id zu meal_slots hinzufügen
ALTER TABLE meal_slots ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_meal_slots_household ON meal_slots(household_id);

-- 3) RLS für meal_slots (mit get_my_household_id)
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_slots_select" ON meal_slots;
DROP POLICY IF EXISTS "meal_slots_insert" ON meal_slots;
DROP POLICY IF EXISTS "meal_slots_update" ON meal_slots;
DROP POLICY IF EXISTS "meal_slots_delete" ON meal_slots;
DROP POLICY IF EXISTS "Users can view own meal slots" ON meal_slots;
DROP POLICY IF EXISTS "Users can insert own meal slots" ON meal_slots;
DROP POLICY IF EXISTS "Users can update own meal slots" ON meal_slots;
DROP POLICY IF EXISTS "Users can delete own meal slots" ON meal_slots;

CREATE POLICY "meal_slots_select" ON meal_slots FOR SELECT USING (
  user_id = auth.uid() OR household_id = get_my_household_id()
);
CREATE POLICY "meal_slots_insert" ON meal_slots FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "meal_slots_update" ON meal_slots FOR UPDATE USING (
  user_id = auth.uid() OR household_id = get_my_household_id()
);
CREATE POLICY "meal_slots_delete" ON meal_slots FOR DELETE USING (
  user_id = auth.uid() OR household_id = get_my_household_id()
);
