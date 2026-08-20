-- =============================================================================
-- Payment status lifecycle, idempotency, and a hardened INSERT policy
-- =============================================================================
-- The ledger (migration 20260815000005) only ever held 'confirmed' rows because
-- recordPayment() hardcodes that status. A multi-channel platform needs the full
-- lifecycle: a payment can be INITIATED, sit PENDING while a bank transfer
-- clears, then land on a terminal state.
--
-- 'confirmed' IS the terminal success state and keeps that name. Every existing
-- read filters .eq("status","confirmed") -- fetchCollectorTotals,
-- fetchCollectorLeaderboard, the marshal dashboard, the executive summaries --
-- so renaming it to 'successful' would silently zero out every revenue figure
-- in the app. The lifecycle is therefore purely ADDITIVE.
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lifecycle + idempotency columns
-- ---------------------------------------------------------------------------
-- idempotency_key   a caller-supplied key that makes "record this payment"
--                   safe to retry. A future gateway webhook passes the provider
--                   event id here, so a redelivered event cannot create a second
--                   payment, a second receipt, or double-count revenue.
-- provider_ref      the external transaction/teller reference (gateway txn id,
--                   bank transfer narration) used for reconciliation.
-- confirmed_at      when money was actually verified (vs. created_at = when the
--                   intent was raised). Revenue reporting should use this.
-- expires_at        pay-by-reference quotes go stale; a sweep can expire them.
-- obligation_period the period this payment settles: '2026' | '2026-08' |
--                   '2026-08-17'. Together with (source_id, revenue_type) this
--                   is what makes "is this levy already paid?" answerable.
-- payer_name        display name for an informal payer with no auth account
--                   (a market trader onboarded by a marshal), so a receipt is
--                   self-contained without a profiles join.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS idempotency_key   TEXT,
  ADD COLUMN IF NOT EXISTS provider_ref      TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS obligation_period TEXT,
  ADD COLUMN IF NOT EXISTS payer_name        TEXT;

-- One payment per idempotency key. Partial so the vast majority of rows
-- (staff cash collections, which need no key) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_idempotency_key
  ON public.payments(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_confirmed ON public.payments(confirmed_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON public.payments(provider_ref)
  WHERE provider_ref IS NOT NULL;
-- Answers "has this obligation already been settled for this period?"
CREATE INDEX IF NOT EXISTS idx_payments_obligation
  ON public.payments(source_table, source_id, revenue_type, obligation_period);

-- Historical rows were confirmed the moment they were written.
UPDATE public.payments SET confirmed_at = created_at
  WHERE status = 'confirmed' AND confirmed_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Constrain status to the lifecycle
-- ---------------------------------------------------------------------------
-- Fail loudly and legibly if the live table holds a status outside the set,
-- rather than emitting a bare constraint violation.
DO $$
DECLARE bad INT;
BEGIN
  SELECT count(*) INTO bad FROM public.payments
   WHERE status IS NULL OR status NOT IN
     ('initiated', 'pending', 'confirmed', 'failed', 'cancelled', 'expired', 'reversed');
  IF bad > 0 THEN
    RAISE EXCEPTION
      'payments.status holds % row(s) outside the new lifecycle. Inspect with: '
      'SELECT DISTINCT status FROM public.payments;', bad;
  END IF;
END $$;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_chk;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_chk CHECK (
  status IN ('initiated', 'pending', 'confirmed', 'failed', 'cancelled', 'expired', 'reversed')
);

-- ---------------------------------------------------------------------------
-- 3. Stamp confirmed_at automatically
-- ---------------------------------------------------------------------------
-- Applies to every channel, including the existing recordPayment() call sites,
-- with no application change.
CREATE OR REPLACE FUNCTION public.tg_payments_stamp_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS payments_stamp_confirmed ON public.payments;
CREATE TRIGGER payments_stamp_confirmed BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payments_stamp_confirmed();

-- ---------------------------------------------------------------------------
-- 4. Harden the INSERT policy: a payer cannot self-confirm
-- ---------------------------------------------------------------------------
-- The original policy allowed any authenticated user to insert a row with
-- payer_id = self. Because status DEFAULTs to 'confirmed', that let a taxpayer
-- mint a settled payment for themselves straight from the browser -- and once
-- receipts are trigger-issued (next migration) that would mint a valid receipt
-- for money nobody paid. "Never trust frontend payment success" has to be
-- enforced here, not in the UI.
--
-- Self-service inserts are now restricted to non-settled statuses. Confirmation
-- happens only via confirm_payment() (staff/service role) or the future gateway
-- webhook. Staff cash collection is unchanged: collector_id = self plus the
-- matching role still writes 'confirmed' directly.
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin'])
    OR (
      auth.uid() = collector_id
      AND public.has_any_role(auth.uid(), ARRAY['officer', 'marshal', 'chairman'])
    )
    OR (
      auth.uid() = payer_id
      AND status IN ('initiated', 'pending')
    )
  );

-- Payer/collector/staff read (unchanged in effect; restated so chairman is
-- included and the policy sits alongside the tightened INSERT).
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
  USING (
    auth.uid() = payer_id
    OR auth.uid() = collector_id
    OR public.has_any_role(auth.uid(), ARRAY['admin', 'chairman', 'officer'])
  );
