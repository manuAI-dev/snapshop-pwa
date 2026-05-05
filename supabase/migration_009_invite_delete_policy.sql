-- ============================================================
-- SnapShop: Fix household_invites INSERT + add DELETE policy
-- Migration 009
--
-- Probleme:
-- 1) Mitglieder können keine Einladungen erstellen (INSERT Policy zu restriktiv)
-- 2) Einladungen können nicht gelöscht/widerrufen werden (keine DELETE Policy)
-- ============================================================

-- Fix INSERT: Alle eingeloggten Haushaltsmitglieder können einladen
DROP POLICY IF EXISTS "invites_insert" ON household_invites;
CREATE POLICY "invites_insert" ON household_invites
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add DELETE: Einladungen können widerrufen werden
DROP POLICY IF EXISTS "invites_delete" ON household_invites;
CREATE POLICY "invites_delete" ON household_invites
  FOR DELETE USING (auth.uid() IS NOT NULL);
