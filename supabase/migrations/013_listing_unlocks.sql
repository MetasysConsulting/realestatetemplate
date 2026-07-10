-- Listing unlock entitlements (per-user, per-listing).
-- Stripe webhooks / service role grant rows; members can only SELECT their own.

CREATE TABLE IF NOT EXISTS listing_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'stripe_one_time'
    CHECK (source IN ('stripe_one_time', 'stripe_subscription', 'admin_grant', 'promo')),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'usd',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_unlocks_user
  ON listing_unlocks(user_id);

CREATE INDEX IF NOT EXISTS idx_listing_unlocks_listing
  ON listing_unlocks(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_unlocks_active
  ON listing_unlocks(user_id, listing_id)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_unlocks_stripe_session
  ON listing_unlocks(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

ALTER TABLE listing_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own unlocks" ON listing_unlocks;
CREATE POLICY "Users read own unlocks"
  ON listing_unlocks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated — service role / webhook only.

CREATE OR REPLACE FUNCTION public.has_listing_unlock(p_listing_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM listing_unlocks u
    WHERE u.user_id = auth.uid()
      AND u.listing_id = p_listing_id
      AND u.revoked_at IS NULL
      AND (u.expires_at IS NULL OR u.expires_at > NOW())
  );
$$;

REVOKE ALL ON FUNCTION public.has_listing_unlock(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_listing_unlock(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_listing_unlock(TEXT) TO service_role;

COMMENT ON TABLE listing_unlocks IS
  'Per-user listing unlock entitlements. Written by Stripe webhook / admin grant; readable by owner.';
