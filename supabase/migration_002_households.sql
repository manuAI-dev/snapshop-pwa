-- ============================================================
-- SnapShop: Multi-User / Haushalt Feature
-- Migration 002: Households, Members, Invites
-- ============================================================

-- 1) Haushalte
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Mein Haushalt',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(4), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Haushalt-Mitglieder
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- 3) Einladungen (E-Mail + Link)
CREATE TABLE IF NOT EXISTS household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email TEXT,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

-- 4) household_id zu recipes hinzufügen
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL;

-- 5) household_id zu shopping_items hinzufügen
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL;

-- 6) Indizes
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invites_token ON household_invites(token);
CREATE INDEX IF NOT EXISTS idx_household_invites_email ON household_invites(email);
CREATE INDEX IF NOT EXISTS idx_recipes_household ON recipes(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_household ON shopping_items(household_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Households: Nur Mitglieder sehen ihren Haushalt
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_select" ON households FOR SELECT USING (
  id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
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

-- Household Members: Mitglieder sehen alle Mitglieder ihres Haushalts
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select" ON household_members FOR SELECT USING (
  household_id IN (SELECT household_id FROM household_members hm WHERE hm.user_id = auth.uid())
);
CREATE POLICY "members_insert" ON household_members FOR INSERT WITH CHECK (
  -- Owner kann Mitglieder hinzufügen, oder User fügt sich selbst hinzu (Join)
  user_id = auth.uid() OR
  household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
);
CREATE POLICY "members_delete" ON household_members FOR DELETE USING (
  -- Owner kann Mitglieder entfernen, oder User entfernt sich selbst
  user_id = auth.uid() OR
  household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
);

-- Household Invites: Nur Ersteller und Eingeladene sehen Einladungen
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select" ON household_invites FOR SELECT USING (
  invited_by = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);
CREATE POLICY "invites_insert" ON household_invites FOR INSERT WITH CHECK (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);
CREATE POLICY "invites_update" ON household_invites FOR UPDATE USING (
  invited_by = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Recipes: Erweitere bestehende Policy für Haushalt-Sharing
-- (Erst bestehende Policy droppen falls vorhanden, dann neu erstellen)
DROP POLICY IF EXISTS "recipes_select" ON recipes;
DROP POLICY IF EXISTS "recipes_insert" ON recipes;
DROP POLICY IF EXISTS "recipes_update" ON recipes;
DROP POLICY IF EXISTS "recipes_delete" ON recipes;
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;

CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (
  user_id = auth.uid() OR
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);
CREATE POLICY "recipes_insert" ON recipes FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "recipes_update" ON recipes FOR UPDATE USING (
  user_id = auth.uid() OR
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);
CREATE POLICY "recipes_delete" ON recipes FOR DELETE USING (
  user_id = auth.uid()
);

-- Shopping Items: Erweitere für Haushalt-Sharing
DROP POLICY IF EXISTS "shopping_select" ON shopping_items;
DROP POLICY IF EXISTS "shopping_insert" ON shopping_items;
DROP POLICY IF EXISTS "shopping_update" ON shopping_items;
DROP POLICY IF EXISTS "shopping_delete" ON shopping_items;
DROP POLICY IF EXISTS "Users can view own shopping items" ON shopping_items;
DROP POLICY IF EXISTS "Users can insert own shopping items" ON shopping_items;
DROP POLICY IF EXISTS "Users can update own shopping items" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete own shopping items" ON shopping_items;

CREATE POLICY "shopping_select" ON shopping_items FOR SELECT USING (
  user_id = auth.uid() OR
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);
CREATE POLICY "shopping_insert" ON shopping_items FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "shopping_update" ON shopping_items FOR UPDATE USING (
  user_id = auth.uid() OR
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);
CREATE POLICY "shopping_delete" ON shopping_items FOR DELETE USING (
  user_id = auth.uid() OR
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);

-- ============================================================
-- Helper: Funktion um bestehende Rezepte/Items einem Haushalt zuzuordnen
-- Wird aufgerufen wenn ein User einem Haushalt beitritt
-- ============================================================
CREATE OR REPLACE FUNCTION assign_user_data_to_household(p_user_id UUID, p_household_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE recipes SET household_id = p_household_id WHERE user_id = p_user_id AND household_id IS NULL;
  UPDATE shopping_items SET household_id = p_household_id WHERE user_id = p_user_id AND household_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
