-- Seller listing properties + $49/mo listing subscriptions (roadmap #5)
-- Separate from buyer Unlimited (stripe_memberships).

CREATE TABLE IF NOT EXISTS seller_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  price NUMERIC,
  bedrooms NUMERIC,
  bathrooms NUMERIC,
  square_footage NUMERIC,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_payment', 'active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_properties_user
  ON seller_properties(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_seller_properties_status
  ON seller_properties(status);

ALTER TABLE seller_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own seller properties" ON seller_properties;
CREATE POLICY "Users read own seller properties"
  ON seller_properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own seller properties" ON seller_properties;
CREATE POLICY "Users insert own seller properties"
  ON seller_properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own seller properties" ON seller_properties;
CREATE POLICY "Users update own seller properties"
  ON seller_properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own seller properties" ON seller_properties;
CREATE POLICY "Users delete own seller properties"
  ON seller_properties FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS seller_listing_subscriptions (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_listing_subscriptions_sub
  ON seller_listing_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_seller_listing_subscriptions_status
  ON seller_listing_subscriptions(status);

ALTER TABLE seller_listing_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own seller listing subscription" ON seller_listing_subscriptions;
CREATE POLICY "Users read own seller listing subscription"
  ON seller_listing_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_active_seller_listing_subscription()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM seller_listing_subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_seller_listing_subscription() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_seller_listing_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_seller_listing_subscription() TO service_role;

COMMENT ON TABLE seller_properties IS
  'User-owned for-sale draft/active listings (Sell On Your Own).';
COMMENT ON TABLE seller_listing_subscriptions IS
  'Stripe $49/mo seller listing entitlements. Separate from buyer Unlimited.';
