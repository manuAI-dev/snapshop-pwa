-- ============================================================
-- SnapShop: Recipe Lists — Rezeptlisten in Supabase statt localStorage
-- Migration 012
-- ============================================================

CREATE TABLE IF NOT EXISTS recipe_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#F2894F',
  recipe_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE recipe_lists ENABLE ROW LEVEL SECURITY;

-- SELECT: Eigene + Haushalt
CREATE POLICY "recipe_lists_select" ON recipe_lists FOR SELECT USING (
  user_id = auth.uid()
  OR household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
  OR user_id IN (
    SELECT hm2.user_id
    FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
  )
);

-- INSERT
CREATE POLICY "recipe_lists_insert" ON recipe_lists FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE
CREATE POLICY "recipe_lists_update" ON recipe_lists FOR UPDATE USING (
  user_id = auth.uid()
  OR household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
  OR user_id IN (
    SELECT hm2.user_id
    FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
  )
);

-- DELETE: Nur eigene Listen löschen
CREATE POLICY "recipe_lists_delete" ON recipe_lists FOR DELETE USING (
  user_id = auth.uid()
);
