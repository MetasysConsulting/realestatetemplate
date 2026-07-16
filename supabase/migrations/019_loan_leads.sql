-- Find a Loan wizard submissions for admin review (roadmap #7)

CREATE TABLE IF NOT EXISTS loan_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'assigned', 'closed_won', 'closed_lost')),
  assigned_to TEXT,
  purpose TEXT NOT NULL,
  property_type TEXT,
  timeline TEXT,
  purchase_price NUMERIC,
  down_payment_percent NUMERIC,
  rehab_budget NUMERIC,
  after_repair_value NUMERIC,
  expected_monthly_rent NUMERIC,
  property_city TEXT,
  property_state TEXT,
  credit_band TEXT,
  experience TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  estimate JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_leads_created
  ON loan_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loan_leads_status
  ON loan_leads(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loan_leads_email
  ON loan_leads(lower(email));

ALTER TABLE loan_leads ENABLE ROW LEVEL SECURITY;

-- Public site inserts via service role only; no anon/auth policies for reads.
DROP POLICY IF EXISTS "No direct client access to loan_leads" ON loan_leads;

COMMENT ON TABLE loan_leads IS 'Find a Loan wizard submissions; admin reads via service role.';
