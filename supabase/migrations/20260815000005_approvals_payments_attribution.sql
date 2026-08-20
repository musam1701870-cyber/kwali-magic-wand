-- =============================================================================
-- Approvals, payments ledger, and attribution
-- =============================================================================
-- Adds:
--   1. Attribution + approval columns to every registration table
--   2. A real payments/collections ledger (collector, amount, source, ward, ts)
--   3. Officer UPDATE policies so revenue officers can approve/reject
-- Mirrors the has_role() RLS pattern already used across the schema.
-- Idempotent: safe on a clean `supabase db reset`.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Attribution + approval columns
-- ---------------------------------------------------------------------------
-- registered_by  = the staff/self account that onboarded this record (marshal,
--                  officer, or the owner for formal self-service).
-- approved_by    = the officer/admin who approved it.
-- approved_at    = when it went Active.
-- rejected_reason = why it was rejected (if status = 'Rejected').

DO $$
DECLARE
  t TEXT;
  reg_tables TEXT[] := ARRAY[
    'properties',
    'transport_vehicles',
    'market_stalls',
    'hospitality_permits',
    'pos_operators',
    'sanitation_subscriptions',
    'businesses'
  ];
BEGIN
  FOREACH t IN ARRAY reg_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS rejected_reason TEXT;', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_status ON public.%I(status);', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_registered_by ON public.%I(registered_by);', t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Payments / collections ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL UNIQUE,                       -- receipt reference
  payer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,      -- taxpayer (nullable: informal cash payer)
  collector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- marshal/officer who collected (null = online/self)
  collector_role TEXT,                            -- marshal | officer | online | system
  source_table TEXT NOT NULL,                     -- market_stalls | transport_vehicles | properties | businesses | ...
  source_id UUID,                                 -- the entity paid for (nullable for ad-hoc)
  source_ref TEXT,                                -- entity ref for display
  revenue_type TEXT NOT NULL,                     -- daily_ticket | market_toll | tenement_rate | business_levy | permit_fee | sanitation_levy | penalty | other
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  channel TEXT NOT NULL DEFAULT 'cash',           -- cash | pos | transfer | online | ussd
  ward TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',       -- confirmed | pending | reversed
  notes TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payer sees their own receipts; collector sees what they collected;
-- officers/admin see everything.
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
  USING (
    auth.uid() = payer_id
    OR auth.uid() = collector_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'officer')
  );
-- A marshal/officer records a collection (collector_id = self); a taxpayer can
-- log their own online payment (payer_id = self); admin can do anything.
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = collector_id
    OR auth.uid() = payer_id
    OR public.has_role(auth.uid(), 'admin')
  );
-- Only officers/admin can amend (e.g. reversals).
DROP POLICY IF EXISTS "payments_update" ON public.payments;
CREATE POLICY "payments_update" ON public.payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));

CREATE INDEX IF NOT EXISTS idx_payments_collector ON public.payments(collector_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_source ON public.payments(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_payments_ward ON public.payments(ward);
CREATE INDEX IF NOT EXISTS idx_payments_revenue_type ON public.payments(revenue_type);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Officer UPDATE policies (approve / reject)
-- ---------------------------------------------------------------------------
-- Existing *_owner_update policies only allow owner/admin (businesses also
-- marshal). Widen each to include officers so approvals work via RLS too.

DROP POLICY IF EXISTS "properties_owner_update" ON public.properties;
CREATE POLICY "properties_owner_update" ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));

DROP POLICY IF EXISTS "transport_owner_update" ON public.transport_vehicles;
CREATE POLICY "transport_owner_update" ON public.transport_vehicles FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));

DROP POLICY IF EXISTS "market_owner_update" ON public.market_stalls;
CREATE POLICY "market_owner_update" ON public.market_stalls FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));

DROP POLICY IF EXISTS "hospitality_owner_update" ON public.hospitality_permits;
CREATE POLICY "hospitality_owner_update" ON public.hospitality_permits FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));

DROP POLICY IF EXISTS "pos_owner_update" ON public.pos_operators;
CREATE POLICY "pos_owner_update" ON public.pos_operators FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));

DROP POLICY IF EXISTS "sanitation_owner_update" ON public.sanitation_subscriptions;
CREATE POLICY "sanitation_owner_update" ON public.sanitation_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));

DROP POLICY IF EXISTS "businesses_owner_update" ON public.businesses;
CREATE POLICY "businesses_owner_update" ON public.businesses FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));

-- Marshals also need to record informal onboarding into market_stalls /
-- transport_vehicles from the field (owner_id set to the marshal on behalf of
-- an unregistered informal trader). Widen those INSERT policies.
DROP POLICY IF EXISTS "market_owner_insert" ON public.market_stalls;
CREATE POLICY "market_owner_insert" ON public.market_stalls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marshal'));

DROP POLICY IF EXISTS "transport_owner_insert" ON public.transport_vehicles;
CREATE POLICY "transport_owner_insert" ON public.transport_vehicles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marshal'));
