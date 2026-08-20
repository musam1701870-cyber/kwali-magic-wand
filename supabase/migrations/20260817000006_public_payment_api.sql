
-- =============================================================================
-- Public payment API: lookup, payment reference, receipt verification
-- =============================================================================
-- This is the backend half of the no-login "MAKE PAYMENT" flow -- a market trader
-- with a printed ID and a basic phone, no account, no app.
--
-- Two structural security decisions:
--
--   1. These functions are SECURITY DEFINER but are granted to service_role
--      ONLY -- deliberately not to anon. Anonymous callers reach them exclusively
--      through the API routes in src/routes/api/public/, which is where the IP
--      throttle, the audit entry and input validation live. Granting them to
--      anon would expose them directly to anyone holding the publishable key
--      (which ships inside the client bundle) with no rate limit and no
--      visibility -- exactly the enumeration hole this design has to close.
--
--   2. A printed reference alone is never sufficient. Refs are sequential, so
--      possessing one proves nothing; it must be paired with the last 4 digits of
--      the registered phone. A scanned QR token is 122 bits of randomness, so
--      holding it IS the proof and no challenge is required. "Not found" and
--      "wrong challenge" return the byte-identical response, so an attacker
--      cannot walk the ref space to discover which IDs exist.
--
-- Amounts are always read from the database. The client never sends a price.
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Name masking
-- ---------------------------------------------------------------------------
-- Enough for a payer to recognise themselves ("Grace A***"), useless for
-- harvesting a name list.
CREATE OR REPLACE FUNCTION public.mask_name(p_name TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE parts TEXT[]; out_parts TEXT[] := '{}'; i INT;
BEGIN
  IF COALESCE(trim(p_name), '') = '' THEN
    RETURN 'Registered taxpayer';
  END IF;
  parts := regexp_split_to_array(trim(p_name), '\s+');
  out_parts := array_append(out_parts, parts[1]);
  FOR i IN 2 .. COALESCE(array_length(parts, 1), 1) LOOP
    out_parts := array_append(out_parts, left(parts[i], 1) || '***');
  END LOOP;
  RETURN array_to_string(out_parts, ' ');
END $$;

-- ---------------------------------------------------------------------------
-- 2. resolve_verified_entity() -- the challenge gate
-- ---------------------------------------------------------------------------
-- Returns zero rows for an unknown id AND for a failed challenge, so callers
-- physically cannot distinguish the two cases. Never returns the phone number it
-- checked against.
CREATE OR REPLACE FUNCTION public.resolve_verified_entity(
  p_public_id TEXT,
  p_challenge TEXT DEFAULT NULL
)
RETURNS TABLE (
  source_table TEXT,
  entity_id    UUID,
  ref          TEXT,
  qr_token     TEXT,
  display_name TEXT,
  entity_label TEXT,
  ward         TEXT,
  status       TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e      RECORD;
  digits TEXT;
  given  TEXT;
  ok     BOOLEAN := FALSE;
BEGIN
  SELECT * INTO e FROM public.find_entity(p_public_id);
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF lower(regexp_replace(COALESCE(p_public_id, ''), '[^A-Za-z0-9]', '', 'g')) = e.qr_token THEN
    -- Scanned/typed the opaque token: possession is the proof.
    ok := TRUE;
  ELSE
    digits := regexp_replace(COALESCE(e.contact_phone, ''), '[^0-9]', '', 'g');
    given  := regexp_replace(COALESCE(p_challenge, ''), '[^0-9]', '', 'g');
    ok := length(digits) >= 4 AND length(given) = 4 AND right(digits, 4) = given;
  END IF;

  IF NOT ok THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT e.source_table, e.entity_id, e.ref, e.qr_token,
                      e.display_name, e.entity_label, e.ward, e.status;
END $$;

-- ---------------------------------------------------------------------------
-- 3. public_lookup() -- "what do I owe?"
-- ---------------------------------------------------------------------------
-- Returns the minimum a payer needs to recognise themselves and choose what to
-- pay. Deliberately absent: phone, email, owner_id, internal entity uuid, street
-- address. The internal uuid is withheld so the follow-up call has to re-prove
-- the challenge rather than carry a bearer handle.
CREATE OR REPLACE FUNCTION public.public_lookup(
  p_public_id TEXT,
  p_challenge TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e   RECORD;
  obl JSONB;
BEGIN
  SELECT * INTO e FROM public.resolve_verified_entity(p_public_id, p_challenge);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'revenueType', o.revenue_type,
           'label',       o.label,
           'amount',      o.amount,
           'period',      o.period,
           'periodLabel', o.period_label,
           'paid',        o.paid,
           'receiptNo',   o.receipt_no
         )), '[]'::jsonb)
    INTO obl
    FROM public.entity_obligations(e.source_table, e.entity_id) o;

  RETURN jsonb_build_object(
    'found',       true,
    'lookupId',    e.ref,
    'sourceTable', e.source_table,
    'name',        public.mask_name(e.display_name),
    'entityLabel', e.entity_label,
    'ward',        e.ward,
    'status',      e.status,
    'obligations', obl
  );
END $$;

-- ---------------------------------------------------------------------------
-- 4. create_payment_reference() -- raise a pending payment
-- ---------------------------------------------------------------------------
-- The amount is taken from entity_obligations(), never from the caller. The row
-- lands as 'pending': money has NOT been received yet. It becomes revenue only
-- when confirm_payment() runs -- from an officer clearing the transfer, an agent
-- collecting cash against the reference, the reconciliation queue, or (later, and
-- with no change to this function) a gateway webhook. That is the whole point of
-- the seam.
--
-- Re-requesting the same obligation returns the SAME live reference rather than
-- minting a second one, so a trader tapping twice does not create two debts.
CREATE OR REPLACE FUNCTION public.create_payment_reference(
  p_public_id    TEXT,
  p_challenge    TEXT,
  p_revenue_type TEXT,
  p_channel      TEXT DEFAULT 'transfer'
)
RETURNS JSONB
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e        RECORD;
  ob       RECORD;
  existing RECORD;
  pay_ref  TEXT;
  pay_id   UUID;
  expiry   TIMESTAMPTZ;
  chan     TEXT := lower(COALESCE(NULLIF(p_channel, ''), 'transfer'));
BEGIN
  IF chan NOT IN ('transfer', 'ussd', 'cash', 'pos') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unsupported_channel');
  END IF;

  SELECT * INTO e FROM public.resolve_verified_entity(p_public_id, p_challenge);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  -- Server-side amount validation: the obligation must exist and be unpaid.
  SELECT * INTO ob
    FROM public.entity_obligations(e.source_table, e.entity_id) o
   WHERE o.revenue_type = p_revenue_type AND NOT o.paid
   ORDER BY o.amount DESC
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_open_obligation');
  END IF;

  SELECT * INTO existing
    FROM public.payments
   WHERE source_table = e.source_table
     AND source_id = e.entity_id
     AND revenue_type = ob.revenue_type
     AND obligation_period = ob.period
     AND status IN ('initiated', 'pending')
     AND (expires_at IS NULL OR expires_at > now())
   ORDER BY created_at DESC
   LIMIT 1;

  IF FOUND THEN
    pay_ref := existing.ref;
    pay_id  := existing.id;
    expiry  := existing.expires_at;
  ELSE
    pay_ref := public.next_ref('PAY');
    expiry  := now() + INTERVAL '72 hours';
    INSERT INTO public.payments (
      ref, payer_name, source_table, source_id, source_ref, revenue_type,
      amount, channel, ward, status, collector_role, obligation_period,
      expires_at, notes, payload
    )
    VALUES (
      pay_ref, e.display_name, e.source_table, e.entity_id, e.ref, ob.revenue_type,
      ob.amount, chan, e.ward, 'pending', 'online', ob.period,
      expiry, 'Self-service payment reference',
      jsonb_build_object('origin', 'public_pay', 'obligation_label', ob.label)
    )
    RETURNING id INTO pay_id;
  END IF;

  RETURN jsonb_build_object(
    'ok',          true,
    'paymentRef',  pay_ref,
    'amount',      ob.amount,
    'revenueType', ob.revenue_type,
    'label',       ob.label,
    'periodLabel', ob.period_label,
    'name',        public.mask_name(e.display_name),
    'ward',        e.ward,
    'channel',     chan,
    'expiresAt',   expiry
  );
END $$;

-- ---------------------------------------------------------------------------
-- 5. verify_receipt() -- is this receipt genuine?
-- ---------------------------------------------------------------------------
-- Two entry points with deliberately different disclosure:
--   * verify_token (from the QR / receipt link) -- unguessable, so the fuller
--     masked view is returned.
--   * receipt_no (typed off a paper receipt) -- sequential and guessable, so it
--     confirms authenticity and amount but discloses no payer or ward.
-- An unknown value returns a plain "not valid" with no hint either way.
CREATE OR REPLACE FUNCTION public.verify_receipt(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r       RECORD;
  by_token BOOLEAN := FALSE;
  tok     TEXT := lower(regexp_replace(COALESCE(p_token, ''), '[^A-Za-z0-9]', '', 'g'));
BEGIN
  IF tok = '' THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT * INTO r FROM public.receipts WHERE verify_token = tok;
  IF FOUND THEN
    by_token := TRUE;
  ELSE
    SELECT * INTO r FROM public.receipts
     WHERE public.normalize_public_id(receipt_no) = public.normalize_public_id(p_token);
    IF NOT FOUND THEN
      RETURN jsonb_build_object('valid', false);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid',       r.voided_at IS NULL,
    'voided',      r.voided_at IS NOT NULL,
    'voidReason',  r.void_reason,
    'receiptNo',   r.receipt_no,
    'amount',      r.amount,
    'revenueType', r.revenue_type,
    'channel',     r.channel,
    'issuedAt',    r.issued_at,
    'period',      r.snapshot->>'obligation_period',
    -- Only the unguessable token unlocks payer/ward/entity context.
    'payerName',   CASE WHEN by_token THEN public.mask_name(r.payer_name) END,
    'ward',        CASE WHEN by_token THEN r.ward END,
    'entityRef',   CASE WHEN by_token THEN r.entity_ref END
  );
END $$;

-- ---------------------------------------------------------------------------
-- 6. Grants -- service_role only; the API routes are the public surface
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.resolve_verified_entity(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_lookup(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_payment_reference(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_receipt(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.resolve_verified_entity(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.public_lookup(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_payment_reference(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_receipt(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mask_name(TEXT) TO service_role, authenticated;
