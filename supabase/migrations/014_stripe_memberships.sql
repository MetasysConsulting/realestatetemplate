-- Active Stripe subscriptions (unlimited access) per user.
-- Written by Stripe webhooks (service role); members can SELECT their own row.

CREATE TABLE IF NOT EXISTS stripe_memberships (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_memberships_subscription
  ON stripe_memberships(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_memberships_status
  ON stripe_memberships(status);

ALTER TABLE stripe_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own membership" ON stripe_memberships;
CREATE POLICY "Users read own membership"
  ON stripe_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_active_membership()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM stripe_memberships m
    WHERE m.user_id = auth.uid()
      AND m.status IN ('active', 'trialing')
      AND (m.current_period_end IS NULL OR m.current_period_end > NOW())
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_membership() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_membership() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_membership() TO service_role;

COMMENT ON TABLE stripe_memberships IS
  'Stripe subscription entitlements for unlimited listing access. Written by webhook.';
