-- ============================================================
-- SnapShop: Fix ALL Household RLS Policies
-- Migration 007
--
-- Probleme:
-- 1) household_members hat eine selbstreferenzierende SELECT-Policy
--    die zu zirkulären Abfragen führt → 0 Mitglieder werden angezeigt
-- 2) households/household_invites blockieren Nicht-Mitglieder beim Join
-- 3) profiles nur für eigenes Profil sichtbar → keine Mitglieder-Namen
--
-- Lösung: Ersetze problematische Policies durch einfache, funktionierende
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- FIX 1: household_members — Selbstreferenz entfernen
-- ══════════════════════════════════════════════════════════════

-- Alte selbstreferenzierende Policy löschen
DROP POLICY IF EXISTS "members_select" ON household_members;

-- Neue einfache Policy: Jeder eingeloggte User kann Mitglieder sehen
-- (Mitgliedschaftsdaten sind nicht sensitiv in einer Familien-App)
CREATE POLICY "members_select" ON household_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════
-- FIX 2: households — Neue User können Haushalt per Code finden
-- ══════════════════════════════════════════════════════════════

-- Alte restriktive Policy droppen (nur Mitglieder konnten sehen)
DROP POLICY IF EXISTS "household_select" ON households;

-- Jeder eingeloggte User darf Haushalte sehen (für invite_code Lookup)
CREATE POLICY "household_select" ON households
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════
-- FIX 3: household_invites — Eingeladene können Invite per Token finden
-- ══════════════════════════════════════════════════════════════

-- Alte restriktive Policy droppen
DROP POLICY IF EXISTS "invites_select" ON household_invites;

-- Jeder eingeloggte User darf Einladungen sehen
CREATE POLICY "invites_select" ON household_invites
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Alte Update-Policy droppen (nur Ersteller/Eingeladener konnte updaten)
DROP POLICY IF EXISTS "invites_update" ON household_invites;

-- Jeder eingeloggte User darf pending Einladungen akzeptieren
CREATE POLICY "invites_update" ON household_invites
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════
-- FIX 4: profiles — Haushaltsmitglieder sehen gegenseitig ihre Profile
-- ══════════════════════════════════════════════════════════════

-- Jeder eingeloggte User darf Profile sehen
-- (für Mitglieder-Anzeige mit Name und Bild)
CREATE POLICY "profiles_visible_to_authenticated" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════
-- Aufräumen: Falls die vorherigen Versuche Policies erstellt haben
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "household_join_lookup" ON households;
DROP POLICY IF EXISTS "invites_join_by_token" ON household_invites;
DROP POLICY IF EXISTS "invites_accept_on_join" ON household_invites;
DROP POLICY IF EXISTS "profiles_household_members" ON profiles;
