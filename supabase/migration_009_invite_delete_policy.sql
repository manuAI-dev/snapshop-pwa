-- ============================================================
-- SnapShop: Invite permissions — only owner can invite/delete
-- Migration 009
--
-- Nur der Haushalt-Owner darf Einladungen erstellen und löschen.
-- Mitglieder sind Nutzniesser ohne Verwaltungsrechte.
-- ============================================================

-- INSERT: Nur Owner des Haushalts kann einladen
DROP POLICY IF EXISTS "invites_insert" ON household_invites;
CREATE POLICY "invites_insert" ON household_invites
  FOR INSERT WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- DELETE: Nur Owner kann Einladungen widerrufen
DROP POLICY IF EXISTS "invites_delete" ON household_invites;
CREATE POLICY "invites_delete" ON household_invites
  FOR DELETE USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );
