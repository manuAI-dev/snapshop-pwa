-- ============================================================
-- SnapShop: Complete Household Data Sharing Fix
-- Migration 011
--
-- Stellt sicher, dass ALLE Tabellen (shopping_items, recipes,
-- meal_slots) korrekte RLS-Policies haben, damit Haushaltsmitglieder
-- gegenseitig alle Daten sehen/bearbeiten/löschen können.
--
-- Diese Migration ist idempotent und kann gefahrlos wiederholt werden.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. SHOPPING ITEMS — Vollständige RLS für Household-Sharing
-- ══════════════════════════════════════════════════════════════

-- Alle alten Policies entfernen
DROP POLICY IF EXISTS "shopping_select" ON shopping_items;
DROP POLICY IF EXISTS "shopping_insert" ON shopping_items;
DROP POLICY IF EXISTS "shopping_update" ON shopping_items;
DROP POLICY IF EXISTS "shopping_delete" ON shopping_items;
DROP POLICY IF EXISTS "Users can view own shopping_items" ON shopping_items;
DROP POLICY IF EXISTS "Users can insert own shopping_items" ON shopping_items;
DROP POLICY IF EXISTS "Users can update own shopping_items" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete own shopping_items" ON shopping_items;

-- RLS aktivieren (falls noch nicht)
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- SELECT: Eigene Items + alle Items von Haushaltsmitgliedern
CREATE POLICY "shopping_select" ON shopping_items FOR SELECT USING (
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

-- INSERT: Eigene Items oder Haushalt-Items
CREATE POLICY "shopping_insert" ON shopping_items FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE: Eigene Items + alle Items von Haushaltsmitgliedern (abhaken etc.)
CREATE POLICY "shopping_update" ON shopping_items FOR UPDATE USING (
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

-- DELETE: Eigene Items + alle Items von Haushaltsmitgliedern
CREATE POLICY "shopping_delete" ON shopping_items FOR DELETE USING (
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


-- ══════════════════════════════════════════════════════════════
-- 2. RECIPES — Vollständige RLS für Household-Sharing
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "recipes_select" ON recipes;
DROP POLICY IF EXISTS "recipes_insert" ON recipes;
DROP POLICY IF EXISTS "recipes_update" ON recipes;
DROP POLICY IF EXISTS "recipes_delete" ON recipes;
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (
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

CREATE POLICY "recipes_insert" ON recipes FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "recipes_update" ON recipes FOR UPDATE USING (
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

CREATE POLICY "recipes_delete" ON recipes FOR DELETE USING (
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


-- ══════════════════════════════════════════════════════════════
-- 3. MEAL SLOTS — Vollständige RLS für Household-Sharing
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "meal_slots_select" ON meal_slots;
DROP POLICY IF EXISTS "meal_slots_insert" ON meal_slots;
DROP POLICY IF EXISTS "meal_slots_update" ON meal_slots;
DROP POLICY IF EXISTS "meal_slots_delete" ON meal_slots;
DROP POLICY IF EXISTS "Users can view own meal_slots" ON meal_slots;
DROP POLICY IF EXISTS "Users can insert own meal_slots" ON meal_slots;
DROP POLICY IF EXISTS "Users can update own meal_slots" ON meal_slots;
DROP POLICY IF EXISTS "Users can delete own meal_slots" ON meal_slots;

ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_slots_select" ON meal_slots FOR SELECT USING (
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

CREATE POLICY "meal_slots_insert" ON meal_slots FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "meal_slots_update" ON meal_slots FOR UPDATE USING (
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

CREATE POLICY "meal_slots_delete" ON meal_slots FOR DELETE USING (
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


-- ══════════════════════════════════════════════════════════════
-- 4. BACKFILL: household_id für alle Mitglieder-Daten setzen
-- ══════════════════════════════════════════════════════════════

-- Shopping Items: household_id setzen wo NULL
UPDATE shopping_items si
SET household_id = hm.household_id
FROM household_members hm
WHERE si.user_id = hm.user_id
  AND si.household_id IS NULL;

-- Recipes: household_id setzen wo NULL
UPDATE recipes r
SET household_id = hm.household_id
FROM household_members hm
WHERE r.user_id = hm.user_id
  AND r.household_id IS NULL;

-- Meal Slots: household_id setzen wo NULL
UPDATE meal_slots ms
SET household_id = hm.household_id
FROM household_members hm
WHERE ms.user_id = hm.user_id
  AND ms.household_id IS NULL;
