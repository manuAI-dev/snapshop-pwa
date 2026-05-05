-- ============================================================
-- SnapShop: Fix Shopping/Recipe/Planner sync for household members
-- Migration 010
--
-- Problem: Mitglieder sehen keine Items anderer Haushaltsmitglieder,
-- wenn diese Items kein household_id gesetzt haben.
--
-- Lösung: RLS-Policies erweitern — alle Items von Usern im selben
-- Haushalt sind sichtbar, unabhängig von household_id.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- Shopping Items: Mitglieder sehen ALLE Items aller Haushaltsmitglieder
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "shopping_select" ON shopping_items;
CREATE POLICY "shopping_select" ON shopping_items FOR SELECT USING (
  user_id = auth.uid()
  OR household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  OR user_id IN (
    SELECT hm2.user_id FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
  )
);

-- Shopping Update: Haushaltsmitglieder können gegenseitig Items abhaken
DROP POLICY IF EXISTS "shopping_update" ON shopping_items;
CREATE POLICY "shopping_update" ON shopping_items FOR UPDATE USING (
  user_id = auth.uid()
  OR household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  OR user_id IN (
    SELECT hm2.user_id FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
  )
);

-- Shopping Delete: Haushaltsmitglieder können gegenseitig Items löschen
DROP POLICY IF EXISTS "shopping_delete" ON shopping_items;
CREATE POLICY "shopping_delete" ON shopping_items FOR DELETE USING (
  user_id = auth.uid()
  OR household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  OR user_id IN (
    SELECT hm2.user_id FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
  )
);

-- ══════════════════════════════════════════════════════════════
-- Recipes: Gleicher Fix
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "recipes_select" ON recipes;
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (
  user_id = auth.uid()
  OR household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  OR user_id IN (
    SELECT hm2.user_id FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
  )
);

-- ══════════════════════════════════════════════════════════════
-- Meal Slots: Gleicher Fix
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "meal_slots_select" ON meal_slots;
DROP POLICY IF EXISTS "Users can view own meal_slots" ON meal_slots;
CREATE POLICY "meal_slots_select" ON meal_slots FOR SELECT USING (
  user_id = auth.uid()
  OR household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  OR user_id IN (
    SELECT hm2.user_id FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
  )
);
