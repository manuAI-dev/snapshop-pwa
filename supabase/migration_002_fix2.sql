-- FIX 2: household SELECT muss auch Owner erlauben (vor membership insert)
DROP POLICY IF EXISTS "household_select" ON households;

CREATE POLICY "household_select" ON households FOR SELECT USING (
  owner_id = auth.uid() OR id = get_my_household_id()
);
