-- ============================================================
-- FIX: Infinite Recursion in household_members RLS
-- Problem: Policy auf household_members referenziert household_members
-- Lösung: SECURITY DEFINER Funktion umgeht RLS-Check
-- ============================================================

-- 1) Helper-Funktion: Gibt die household_id des aktuellen Users zurück
--    SECURITY DEFINER = läuft mit DB-Owner Rechten, umgeht RLS
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2) ALLE Policies droppen (inklusive der aus migration_002_households.sql)
-- Households
DROP POLICY IF EXISTS "household_select" ON households;
DROP POLICY IF EXISTS "household_insert" ON households;
DROP POLICY IF EXISTS "household_update" ON households;
DROP POLICY IF EXISTS "household_delete" ON households;
-- Members
DROP POLICY IF EXISTS "members_select" ON household_members;
DROP POLICY IF EXISTS "members_insert" ON household_members;
DROP POLICY IF EXISTS "members_delete" ON household_members;
-- Invites
DROP POLICY IF EXISTS "invites_select" ON household_invites;
DROP POLICY IF EXISTS "invites_insert" ON household_invites;
DROP POLICY IF EXISTS "invites_update" ON household_invites;
-- Recipes (alle möglichen Namen)
DROP POLICY IF EXISTS "recipes_select" ON recipes;
DROP POLICY IF EXISTS "recipes_insert" ON recipes;
DROP POLICY IF EXISTS "recipes_update" ON recipes;
DROP POLICY IF EXISTS "recipes_delete" ON recipes;
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;
-- Shopping (alle möglichen Namen)
DROP POLICY IF EXISTS "shopping_select" ON shopping_items;
DROP POLICY IF EXISTS "shopping_insert" ON shopping_items;
DROP POLICY IF EXISTS "shopping_update" ON shopping_items;
DROP POLICY IF EXISTS "shopping_delete" ON shopping_items;
DROP POLICY IF EXISTS "Users can view own shopping items" ON shopping_items;
DROP POLICY IF EXISTS "Users can insert own shopping items" ON shopping_items;
DROP POLICY IF EXISTS "Users can update own shopping items" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete own shopping items" ON shopping_items;

-- 3) Neue Policies MIT der Helper-Funktion (keine Rekursion mehr)

-- Households
CREATE POLICY "household_select" ON households FOR SELECT USING (
  id = get_my_household_id()
);
CREATE POLICY "household_insert" ON households FOR INSERT WITH CHECK (
  owner_id = auth.uid()
);
CREATE POLICY "household_update" ON households FOR UPDATE USING (
  owner_id = auth.uid()
);
CREATE POLICY "household_delete" ON households FOR DELETE USING (
  owner_id = auth.uid()
);

-- Household Members: Kein Self-Join mehr!
CREATE POLICY "members_select" ON household_members FOR SELECT USING (
  household_id = get_my_household_id()
);
CREATE POLICY "members_insert" ON household_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
);
CREATE POLICY "members_delete" ON household_members FOR DELETE USING (
  user_id = auth.uid() OR
  household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
);

-- Household Invites
CREATE POLICY "invites_select" ON household_invites FOR SELECT USING (
  invited_by = auth.uid() OR
  household_id = get_my_household_id()
);
CREATE POLICY "invites_insert" ON household_invites FOR INSERT WITH CHECK (
  household_id = get_my_household_id()
);
CREATE POLICY "invites_update" ON household_invites FOR UPDATE USING (
  invited_by = auth.uid()
);

-- Recipes: Eigene + Haushalt
CREATE POLICY "recipes_insert" ON recipes FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (
  user_id = auth.uid() OR
  household_id = get_my_household_id()
);
CREATE POLICY "recipes_update" ON recipes FOR UPDATE USING (
  user_id = auth.uid() OR
  household_id = get_my_household_id()
);
CREATE POLICY "recipes_delete" ON recipes FOR DELETE USING (
  user_id = auth.uid()
);

-- Shopping Items: Eigene + Haushalt
CREATE POLICY "shopping_insert" ON shopping_items FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "shopping_select" ON shopping_items FOR SELECT USING (
  user_id = auth.uid() OR
  household_id = get_my_household_id()
);
CREATE POLICY "shopping_update" ON shopping_items FOR UPDATE USING (
  user_id = auth.uid() OR
  household_id = get_my_household_id()
);
CREATE POLICY "shopping_delete" ON shopping_items FOR DELETE USING (
  user_id = auth.uid() OR
  household_id = get_my_household_id()
);
