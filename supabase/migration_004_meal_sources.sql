-- ============================================================
-- SnapShop: Meal Planner — Quellen-Info + Verschieben
-- Migration 004: source_url, source_name für meal_slots
-- ============================================================

-- 1) Quellen-Info Spalten hinzufügen
ALTER TABLE meal_slots ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE meal_slots ADD COLUMN IF NOT EXISTS source_name TEXT;
  -- z.B. "Fooby", "Betty Bossi", "Migusto", "Swissmilk"
