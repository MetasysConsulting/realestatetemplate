-- Allow members to create their own profile row if the signup trigger missed it.
-- Needed for upsert from Account Settings (name + phone).

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
