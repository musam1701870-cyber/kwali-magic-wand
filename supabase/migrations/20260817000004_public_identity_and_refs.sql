-- =============================================================================
-- Public identity: QR tokens, collision-safe references, derived obligations
-- =============================================================================
-- Three things stood between a registered trader and paying without an account:
--
--   1. No QR identity. Only transport_vehicles had a qr_sticker_code column and
--      nothing ever read or wrote it; every "QR code" in the app was a decorative
--      grid drawn from a character-sum seed. Adding qr_token to all seven
--      registration tables gives one opaque handle and therefore one verify path.
--
--   2. References were generated with Math.random() in the browser -- no
--      collision protection, no retry -- and the public wizard stamped every
--      entity type as KWL-TIN-*, so a ref could not even tell you what it was.
--      next_ref() replaces that with per-type Postgres sequences.
--
--   3. Obligations existed only as rate columns with no way to ask "what does
--      this person owe right now, and is it already paid?". entity_obligations()
--      answers that from the columns ALREADY on each table -- deliberately no
--      new fee-configuration table to drift out of sync with the registrations.
--
-- Existing refs are never rewritten: every ID already printed on a sticker or
-- told to a trader keeps working.
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tolerant public-ID matching
-- ---------------------------------------------------------------------------
-- A trader reading an ID card off a phone will type "kwl trd 2026 001234" or
-- "KWLTRD2026001234". Normalising both sides makes all of those resolve.
-- Defined first because the lookup indexes below are built on this expression.
CREATE OR REPLACE FUNCTION public.normalize_public_id(p_id TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT upper(regexp_replace(coalesce(p_id, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

-- ---------------------------------------------------------------------------
-- 2. qr_token on every registration table
-- ---------------------------------------------------------------------------
-- Opaque and unguessable, so a QR code can carry a verify URL and nothing else.
-- It is NOT the ref: a ref is sequential and printed in the open, so it must
-- never be the thing that proves identity.
DO $$
DECLARE
  t TEXT;
  reg_tables TEXT[] := ARRAY[
    'businesses', 'properties', 'transport_vehicles', 'market_stalls',
    'hospitality_permits', 'pos_operators', 'sanitation_subscriptions'
  ];
BEGIN
  FOREACH t IN ARRAY reg_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS qr_token TEXT;', t);
    EXECUTE format(
      'UPDATE public.%I SET qr_token = public.new_opaque_token() WHERE qr_token IS NULL;', t);
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN qr_token SET DEFAULT public.new_opaque_token();', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN qr_token SET NOT NULL;', t);
    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS uq_%s_qr_token ON public.%I(qr_token);', t, t);
    -- Public lookup matches on a normalised ref, so index that expression.
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_ref_norm ON public.%I(public.normalize_public_id(ref));',
      t, t);
  END LOOP;
END $$;

-- The pre-existing sticker column finally means something: point it at the token
-- so printed transport stickers and the new verify path agree.
UPDATE public.transport_vehicles
   SET qr_sticker_code = qr_token
 WHERE qr_sticker_code IS NULL OR qr_sticker_code = '';

-- ---------------------------------------------------------------------------
-- 3. Collision-safe, type-encoded references
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.ref_seq_biz START 1000;
CREATE SEQUENCE IF NOT EXISTS public.ref_seq_prp START 1000;
CREATE SEQUENCE IF NOT EXISTS public.ref_seq_trp START 1000;
CREATE SEQUENCE IF NOT EXISTS public.ref_seq_trd START 1000;
CREATE SEQUENCE IF NOT EXISTS public.ref_seq_hsp START 1000;
CREATE SEQUENCE IF NOT EXISTS public.ref_seq_pos START 1000;
CREATE SEQUENCE IF NOT EXISTS public.ref_seq_san START 1000;
CREATE SEQUENCE IF NOT EXISTS public.ref_seq_pay START 1000;

CREATE OR REPLACE FUNCTION public.ref_type_for_table(p_table TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE p_table
    WHEN 'businesses'               THEN 'BIZ'
    WHEN 'properties'               THEN 'PRP'
    WHEN 'transport_vehicles'       THEN 'TRP'
    WHEN 'market_stalls'            THEN 'TRD'
    WHEN 'hospitality_permits'      THEN 'HSP'
    WHEN 'pos_operators'            THEN 'POS'
    WHEN 'sanitation_subscriptions' THEN 'SAN'
  END
$$;

CREATE OR REPLACE FUNCTION public.next_ref(p_type TEXT)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE code TEXT; seq TEXT;
BEGIN
  code := upper(coalesce(p_type, ''));
  seq := CASE code
    WHEN 'BIZ' THEN 'ref_seq_biz' WHEN 'PRP' THEN 'ref_seq_prp'
    WHEN 'TRP' THEN 'ref_seq_trp' WHEN 'TRD' THEN 'ref_seq_trd'
    WHEN 'HSP' THEN 'ref_seq_hsp' WHEN 'POS' THEN 'ref_seq_pos'
    WHEN 'SAN' THEN 'ref_seq_san' WHEN 'PAY' THEN 'ref_seq_pay'
  END;
  IF seq IS NULL THEN
    RAISE EXCEPTION 'next_ref: unknown reference type %', p_type;
  END IF;
  RETURN 'KWL-' || code || '-' || to_char(now(), 'YYYY') || '-'
         || lpad(nextval('public.' || seq)::TEXT, 6, '0');
END $$;

-- Advance each sequence past any numeric suffix already present in that table,
-- so the new generator can never collide with an id issued by the old
-- Math.random() scheme.
DO $$
DECLARE
  t TEXT; code TEXT; seq TEXT; hi BIGINT;
  reg_tables TEXT[] := ARRAY[
    'businesses', 'properties', 'transport_vehicles', 'market_stalls',
    'hospitality_permits', 'pos_operators', 'sanitation_subscriptions'
  ];
BEGIN
  FOREACH t IN ARRAY reg_tables LOOP
    code := public.ref_type_for_table(t);
    seq  := 'public.ref_seq_' || lower(code);
    EXECUTE format(
      $q$SELECT COALESCE(MAX(regexp_replace(ref, '^.*-', '')::BIGINT), 0)
           FROM public.%I
          WHERE ref ~ '^KWL-[A-Z]+-[0-9]{4}-[0-9]+$'$q$, t) INTO hi;
    IF hi >= 1000 THEN
      PERFORM setval(seq, hi + 1, false);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. find_entity() -- resolve a printed ref or a scanned QR token
-- ---------------------------------------------------------------------------
-- Returns the internal handles plus the one contact detail needed to challenge
-- the caller. NOT exposed to clients: it returns a real phone number, which is
-- why only the service role may execute it and why the public-facing wrapper
-- (next migration) never passes it through.
CREATE OR REPLACE FUNCTION public.find_entity(p_public_id TEXT)
RETURNS TABLE (
  source_table  TEXT,
  entity_id     UUID,
  ref           TEXT,
  qr_token      TEXT,
  display_name  TEXT,
  entity_label  TEXT,
  ward          TEXT,
  status        TEXT,
  contact_phone TEXT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH k AS (
    SELECT public.normalize_public_id(p_public_id) AS norm,
           lower(regexp_replace(coalesce(p_public_id, ''), '[^A-Za-z0-9]', '', 'g')) AS tok
  )
  SELECT 'market_stalls'::TEXT, ms.id, ms.ref, ms.qr_token,
         ms.trader_name::TEXT, 'Market trader'::TEXT, ms.ward::TEXT, ms.status::TEXT,
         COALESCE(NULLIF(ms.trader_phone, ''),
                  (SELECT phone FROM public.profiles WHERE id = ms.owner_id))::TEXT
    FROM public.market_stalls ms, k
   WHERE public.normalize_public_id(ms.ref) = k.norm OR ms.qr_token = k.tok
  UNION ALL
  SELECT 'transport_vehicles', tv.id, tv.ref, tv.qr_token,
         COALESCE(NULLIF(tv.operator_name, ''), tv.plate_number), 'Transport operator',
         tv.ward, tv.status,
         COALESCE(NULLIF(tv.operator_phone, ''),
                  (SELECT phone FROM public.profiles WHERE id = tv.owner_id))
    FROM public.transport_vehicles tv, k
   WHERE public.normalize_public_id(tv.ref) = k.norm OR tv.qr_token = k.tok
  UNION ALL
  SELECT 'businesses', b.id, b.ref, b.qr_token,
         b.business_name, 'Business', b.ward, b.status,
         COALESCE(NULLIF(b.phone, ''),
                  (SELECT phone FROM public.profiles WHERE id = b.owner_id))
    FROM public.businesses b, k
   WHERE public.normalize_public_id(b.ref) = k.norm OR b.qr_token = k.tok
  UNION ALL
  SELECT 'properties', pr.id, pr.ref, pr.qr_token,
         COALESCE(NULLIF(pr.property_name, ''), pr.address), 'Property', pr.ward, pr.status,
         (SELECT phone FROM public.profiles WHERE id = pr.owner_id)
    FROM public.properties pr, k
   WHERE public.normalize_public_id(pr.ref) = k.norm OR pr.qr_token = k.tok
  UNION ALL
  SELECT 'hospitality_permits', hp.id, hp.ref, hp.qr_token,
         hp.establishment_name, 'Hospitality', hp.ward, hp.status,
         (SELECT phone FROM public.profiles WHERE id = hp.owner_id)
    FROM public.hospitality_permits hp, k
   WHERE public.normalize_public_id(hp.ref) = k.norm OR hp.qr_token = k.tok
  UNION ALL
  SELECT 'pos_operators', po.id, po.ref, po.qr_token,
         COALESCE(NULLIF(po.business_name, ''), po.operator_name), 'POS operator',
         po.ward, po.status,
         COALESCE(NULLIF(po.phone, ''),
                  (SELECT phone FROM public.profiles WHERE id = po.owner_id))
    FROM public.pos_operators po, k
   WHERE public.normalize_public_id(po.ref) = k.norm OR po.qr_token = k.tok
  UNION ALL
  SELECT 'sanitation_subscriptions', ss.id, ss.ref, ss.qr_token,
         ss.subscriber_name, 'Sanitation', ss.ward, ss.status,
         COALESCE(NULLIF(ss.phone, ''),
                  (SELECT phone FROM public.profiles WHERE id = ss.owner_id))
    FROM public.sanitation_subscriptions ss, k
   WHERE public.normalize_public_id(ss.ref) = k.norm OR ss.qr_token = k.tok
  LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- 5. entity_obligations() -- what is owed, and what is already settled
-- ---------------------------------------------------------------------------
-- Amounts come from the rate columns each table already carries. "Paid" is
-- answered against the central ledger: a confirmed payment for the same
-- (entity, revenue_type, period) with a receipt that has not been voided.
-- This is what makes server-side amount validation possible -- the client never
-- gets to say what something costs.
CREATE OR REPLACE FUNCTION public.entity_obligations(p_table TEXT, p_id UUID)
RETURNS TABLE (
  revenue_type TEXT,
  label        TEXT,
  amount       NUMERIC,
  period       TEXT,
  period_label TEXT,
  paid         BOOLEAN,
  receipt_no   TEXT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH lines AS (
    SELECT 'daily_ticket'::TEXT AS revenue_type, 'Daily market ticket'::TEXT AS label,
           ms.daily_toll::NUMERIC AS amount,
           to_char(now(), 'YYYY-MM-DD')::TEXT AS period, 'Today'::TEXT AS period_label
      FROM public.market_stalls ms
     WHERE p_table = 'market_stalls' AND ms.id = p_id AND COALESCE(ms.daily_toll, 0) > 0
    UNION ALL
    SELECT 'market_rent', 'Monthly stall rent', ms.monthly_rent,
           to_char(now(), 'YYYY-MM'), to_char(now(), 'FMMonth YYYY')
      FROM public.market_stalls ms
     WHERE p_table = 'market_stalls' AND ms.id = p_id AND COALESCE(ms.monthly_rent, 0) > 0
    UNION ALL
    SELECT 'sanitation_levy', 'Sanitation levy', ms.sanitation_levy,
           to_char(now(), 'YYYY-MM'), to_char(now(), 'FMMonth YYYY')
      FROM public.market_stalls ms
     WHERE p_table = 'market_stalls' AND ms.id = p_id AND COALESCE(ms.sanitation_levy, 0) > 0
    UNION ALL
    SELECT 'daily_ticket', 'Daily transport ticket', tv.daily_ticket_price,
           to_char(now(), 'YYYY-MM-DD'), 'Today'
      FROM public.transport_vehicles tv
     WHERE p_table = 'transport_vehicles' AND tv.id = p_id
       AND COALESCE(tv.daily_ticket_price, 0) > 0
    UNION ALL
    SELECT 'tenement_rate', 'Annual tenement rate', pr.annual_rate,
           to_char(now(), 'YYYY'), to_char(now(), 'YYYY')
      FROM public.properties pr
     WHERE p_table = 'properties' AND pr.id = p_id AND COALESCE(pr.annual_rate, 0) > 0
    UNION ALL
    SELECT 'business_levy', 'Annual business permit', b.annual_rate,
           to_char(now(), 'YYYY'), to_char(now(), 'YYYY')
      FROM public.businesses b
     WHERE p_table = 'businesses' AND b.id = p_id AND COALESCE(b.annual_rate, 0) > 0
    UNION ALL
    SELECT 'permit_fee', 'Annual hospitality permit', hp.annual_permit_fee,
           to_char(now(), 'YYYY'), to_char(now(), 'YYYY')
      FROM public.hospitality_permits hp
     WHERE p_table = 'hospitality_permits' AND hp.id = p_id
       AND COALESCE(hp.annual_permit_fee, 0) > 0
    UNION ALL
    SELECT 'permit_fee', 'Annual POS operator permit', po.annual_permit_fee,
           to_char(now(), 'YYYY'), to_char(now(), 'YYYY')
      FROM public.pos_operators po
     WHERE p_table = 'pos_operators' AND po.id = p_id
       AND COALESCE(po.annual_permit_fee, 0) > 0
    UNION ALL
    SELECT 'sanitation_levy', 'Monthly sanitation fee', ss.monthly_fee,
           to_char(now(), 'YYYY-MM'), to_char(now(), 'FMMonth YYYY')
      FROM public.sanitation_subscriptions ss
     WHERE p_table = 'sanitation_subscriptions' AND ss.id = p_id
       AND COALESCE(ss.monthly_fee, 0) > 0
  )
  SELECT l.revenue_type, l.label, l.amount, l.period, l.period_label,
         (r.receipt_no IS NOT NULL), r.receipt_no
    FROM lines l
    LEFT JOIN LATERAL (
      SELECT rc.receipt_no
        FROM public.payments p
        JOIN public.receipts rc ON rc.payment_id = p.id
       WHERE p.source_table = p_table
         AND p.source_id = p_id
         AND p.revenue_type = l.revenue_type
         AND p.obligation_period = l.period
         AND p.status = 'confirmed'
         AND rc.voided_at IS NULL
       ORDER BY p.confirmed_at DESC
       LIMIT 1
    ) r ON TRUE
   ORDER BY (r.receipt_no IS NOT NULL), l.amount DESC
$$;

REVOKE ALL ON FUNCTION public.find_entity(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.entity_obligations(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_entity(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.entity_obligations(TEXT, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.next_ref(TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_public_id(TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.ref_type_for_table(TEXT) TO service_role, authenticated;
