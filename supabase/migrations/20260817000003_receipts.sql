-- =============================================================================
-- Receipts: issued by the database, one per verified payment
-- =============================================================================
-- The governing business rule is:
--   ONE VERIFIED PAYMENT -> ONE CENTRAL RECORD -> ONE RECEIPT -> ONE UPDATED ACCOUNT
-- regardless of how the money arrived (cash to a marshal, POS, cafe, bank
-- transfer, a sub-admin, a business dashboard, or a future card gateway).
--
-- Issuance therefore lives in the DATABASE, not in application code. If it lived
-- in app code every channel would have to remember to call it -- and the one
-- that forgets produces revenue with no receipt, while a retry produces two
-- receipts for one payment. Instead:
--   * receipts.payment_id is UNIQUE, so a second receipt is physically impossible
--   * a trigger on payments fires the moment status becomes 'confirmed'
--   * issue_receipt() is idempotent and returns the existing receipt if present
-- Every current and future channel gets correct receipts for free.
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Receipt number sequence
-- ---------------------------------------------------------------------------
-- Format RCP-2026-XXXXXXXX. A sequence, not Math.random() (which is what the
-- app's genRef() uses and which has no collision protection at all).
CREATE SEQUENCE IF NOT EXISTS public.receipt_no_seq START 1;

CREATE OR REPLACE FUNCTION public.next_receipt_no()
RETURNS TEXT LANGUAGE SQL VOLATILE SET search_path = public AS $$
  SELECT 'RCP-' || to_char(now(), 'YYYY') || '-'
         || lpad(nextval('public.receipt_no_seq')::TEXT, 8, '0')
$$;

-- Opaque, unguessable public token (32 hex chars / 122 bits of entropy).
-- Built from gen_random_uuid() rather than pgcrypto's gen_random_bytes() so it
-- resolves without depending on the extensions schema being on search_path.
CREATE OR REPLACE FUNCTION public.new_opaque_token()
RETURNS TEXT LANGUAGE SQL VOLATILE AS $$
  SELECT replace(gen_random_uuid()::TEXT, '-', '')
$$;

-- ---------------------------------------------------------------------------
-- 2. The receipts table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- UNIQUE is the structural guarantee of one-receipt-per-payment.
  payment_id   UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
  receipt_no   TEXT NOT NULL UNIQUE,   -- RCP-2026-00000001, shown to the payer
  -- Separate from receipt_no on purpose: receipt numbers are sequential and
  -- therefore guessable, so they must never be the credential that proves a
  -- receipt genuine. verify_token is what the QR code and /verify URL carry.
  -- It encodes nothing -- no name, no phone, no amount, no id.
  verify_token TEXT NOT NULL UNIQUE,
  -- Immutable snapshot: a receipt must still read correctly years later even if
  -- the underlying registration is renamed, re-rated, or deleted.
  payer_name   TEXT,
  entity_ref   TEXT,
  revenue_type TEXT,
  amount       NUMERIC NOT NULL,
  channel      TEXT,
  ward         TEXT,
  snapshot     JSONB NOT NULL DEFAULT '{}'::jsonb,
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A reversed payment must not keep verifying as valid.
  voided_at    TIMESTAMPTZ,
  void_reason  TEXT
);

-- Read-only to the app. There is deliberately no INSERT/UPDATE/DELETE grant to
-- authenticated: receipts are system-issued and immutable, so no client -- not
-- even an admin's browser session -- can forge or edit one.
GRANT SELECT ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receipts_select" ON public.receipts;
CREATE POLICY "receipts_select" ON public.receipts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = receipts.payment_id
        AND (
          p.payer_id = auth.uid()
          OR p.collector_id = auth.uid()
          OR public.has_any_role(auth.uid(), ARRAY['admin', 'chairman', 'officer'])
        )
    )
  );

CREATE INDEX IF NOT EXISTS idx_receipts_issued ON public.receipts(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_entity_ref ON public.receipts(entity_ref);

-- ---------------------------------------------------------------------------
-- 3. issue_receipt() -- idempotent
-- ---------------------------------------------------------------------------
-- Returns the existing receipt when one has already been issued, so it is safe
-- to call any number of times from any channel. Returns NULL for a payment that
-- is not confirmed: an unverified payment never earns a receipt.
CREATE OR REPLACE FUNCTION public.issue_receipt(p_payment_id UUID)
RETURNS public.receipts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pay  public.payments;
  rec  public.receipts;
  disp TEXT;
BEGIN
  SELECT * INTO pay FROM public.payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'issue_receipt: payment % not found', p_payment_id;
  END IF;

  IF pay.status <> 'confirmed' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO rec FROM public.receipts WHERE payment_id = p_payment_id;
  IF FOUND THEN
    RETURN rec;
  END IF;

  disp := COALESCE(
    NULLIF(pay.payer_name, ''),
    (SELECT NULLIF(full_name, '') FROM public.profiles WHERE id = pay.payer_id),
    'Taxpayer'
  );

  INSERT INTO public.receipts (
    payment_id, receipt_no, verify_token, payer_name,
    entity_ref, revenue_type, amount, channel, ward, snapshot
  )
  VALUES (
    p_payment_id, public.next_receipt_no(), public.new_opaque_token(), disp,
    pay.source_ref, pay.revenue_type, pay.amount, pay.channel, pay.ward,
    jsonb_build_object(
      'payment_ref',       pay.ref,
      'source_table',      pay.source_table,
      'source_id',         pay.source_id,
      'obligation_period', pay.obligation_period,
      'collector_role',    pay.collector_role,
      'confirmed_at',      COALESCE(pay.confirmed_at, pay.created_at)
    )
  )
  ON CONFLICT (payment_id) DO NOTHING
  RETURNING * INTO rec;

  -- Lost a race against a concurrent confirmation: read back the winner's row
  -- rather than returning nothing.
  IF rec.id IS NULL THEN
    SELECT * INTO rec FROM public.receipts WHERE payment_id = p_payment_id;
  END IF;

  RETURN rec;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Trigger: confirmation issues the receipt, reversal voids it
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_payments_sync_receipt()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    PERFORM public.issue_receipt(NEW.id);
  ELSIF NEW.status = 'reversed' THEN
    UPDATE public.receipts
       SET voided_at = COALESCE(voided_at, now()),
           void_reason = COALESCE(void_reason, NULLIF(NEW.notes, ''), 'Payment reversed')
     WHERE payment_id = NEW.id AND voided_at IS NULL;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS payments_issue_receipt ON public.payments;
DROP TRIGGER IF EXISTS payments_sync_receipt ON public.payments;
CREATE TRIGGER payments_sync_receipt
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW
  WHEN (NEW.status IN ('confirmed', 'reversed'))
  EXECUTE FUNCTION public.tg_payments_sync_receipt();

-- ---------------------------------------------------------------------------
-- 5. confirm_payment() -- the single confirmation seam
-- ---------------------------------------------------------------------------
-- Every path that turns a raised payment into settled revenue goes through here:
-- an officer clearing a bank transfer, an agent confirming an assisted payment,
-- the reconciliation queue, and -- with no schema change whatsoever -- a future
-- gateway webhook.
--
-- Idempotent by construction: already-confirmed payments return their existing
-- receipt instead of erroring or double-counting, which is exactly what a
-- provider redelivering the same webhook event needs.
--
-- SELECT ... FOR UPDATE takes a row lock, so two simultaneous confirmations
-- serialise rather than racing.
CREATE OR REPLACE FUNCTION public.confirm_payment(
  p_payment_id   UUID,
  p_provider_ref TEXT DEFAULT NULL,
  p_actor        UUID DEFAULT NULL,
  p_channel      TEXT DEFAULT NULL
)
RETURNS public.receipts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pay   public.payments;
  actor UUID := COALESCE(p_actor, auth.uid());
BEGIN
  -- Backend-enforced permission. auth.uid() is NULL when called by the service
  -- role (server routes, webhooks), which is trusted; an authenticated caller
  -- must actually hold a collecting role. Hiding the button is not a control.
  IF auth.uid() IS NOT NULL
     AND NOT public.has_any_role(auth.uid(), ARRAY['admin', 'chairman', 'officer', 'marshal']) THEN
    RAISE EXCEPTION 'confirm_payment: not permitted';
  END IF;

  SELECT * INTO pay FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'confirm_payment: payment % not found', p_payment_id;
  END IF;

  IF pay.status = 'confirmed' THEN
    RETURN public.issue_receipt(p_payment_id);
  END IF;

  IF pay.status NOT IN ('initiated', 'pending') THEN
    RAISE EXCEPTION 'confirm_payment: payment % is % and cannot be confirmed',
      pay.ref, pay.status;
  END IF;

  UPDATE public.payments SET
    status       = 'confirmed',
    confirmed_at = now(),
    provider_ref = COALESCE(p_provider_ref, provider_ref),
    channel      = COALESCE(p_channel, channel),
    collector_id = COALESCE(collector_id, actor),
    collector_role = CASE
      WHEN collector_id IS NULL AND actor IS NOT NULL THEN 'officer'
      ELSE collector_role
    END
  WHERE id = p_payment_id;

  RETURN public.issue_receipt(p_payment_id);
END $$;

REVOKE ALL ON FUNCTION public.issue_receipt(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_payment(UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_payment(UUID, TEXT, UUID, TEXT)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.issue_receipt(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Backfill receipts for payments already in the ledger
-- ---------------------------------------------------------------------------
-- Existing confirmed collections predate this table; issue their receipts once
-- so history is complete and the admin receipts view is not half empty.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT p.id FROM public.payments p
           LEFT JOIN public.receipts rc ON rc.payment_id = p.id
           WHERE p.status = 'confirmed' AND rc.id IS NULL
           ORDER BY p.created_at
  LOOP
    PERFORM public.issue_receipt(r.id);
  END LOOP;
END $$;
