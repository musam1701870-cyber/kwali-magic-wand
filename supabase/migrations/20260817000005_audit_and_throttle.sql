-- =============================================================================
-- Audit log and request throttling
-- =============================================================================
-- The platform had no audit trail of any kind. Once money can be raised and
-- confirmed through several channels, "who confirmed this payment, and when"
-- has to be answerable after the fact -- both for agent accountability and to
-- investigate a disputed receipt.
--
-- The throttle lives in Postgres rather than in process memory because the app
-- runs as serverless functions on Vercel: each request may hit a different cold
-- instance, so an in-memory counter would reset constantly and enforce nothing.
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. audit_log
-- ---------------------------------------------------------------------------
-- actor_id is nullable on purpose: public (unauthenticated) lookups and system
-- actions such as a webhook confirmation have no user behind them.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           BIGSERIAL PRIMARY KEY,
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role   TEXT,
  action       TEXT NOT NULL,        -- payment.confirmed | receipt.issued | public.lookup | ...
  entity_table TEXT,
  entity_id    UUID,
  entity_ref   TEXT,
  detail       JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Hashed, never raw: enough to rate-limit and correlate abuse without
  -- retaining an identifiable address for every citizen who checks a bill.
  ip_hash      TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Read-only to staff; no INSERT grant, so the trail cannot be written or
-- rewritten from a browser session. Writes go through log_audit() only.
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_staff_select" ON public.audit_log;
CREATE POLICY "audit_log_staff_select" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'chairman', 'officer']));

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log(entity_table, entity_id);

-- An authenticated caller cannot forge another actor: auth.uid() always wins
-- when present. Only the service role (server routes, webhooks) may attribute
-- an action to someone else or to nobody.
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action       TEXT,
  p_entity_table TEXT DEFAULT NULL,
  p_entity_id    UUID DEFAULT NULL,
  p_entity_ref   TEXT DEFAULT NULL,
  p_detail       JSONB DEFAULT '{}'::jsonb,
  p_actor        UUID DEFAULT NULL,
  p_ip_hash      TEXT DEFAULT NULL,
  p_user_agent   TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor UUID := COALESCE(auth.uid(), p_actor);
  role_txt TEXT;
  new_id BIGINT;
BEGIN
  IF actor IS NOT NULL THEN
    SELECT string_agg(role::text, ',' ORDER BY role::text) INTO role_txt
      FROM public.user_roles WHERE user_id = actor;
  END IF;

  INSERT INTO public.audit_log (
    actor_id, actor_role, action, entity_table, entity_id, entity_ref,
    detail, ip_hash, user_agent
  )
  VALUES (
    actor, COALESCE(role_txt, 'system'), p_action, p_entity_table, p_entity_id,
    p_entity_ref, COALESCE(p_detail, '{}'::jsonb), p_ip_hash, left(p_user_agent, 400)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END $$;

REVOKE ALL ON FUNCTION public.log_audit(TEXT, TEXT, UUID, TEXT, JSONB, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit(TEXT, TEXT, UUID, TEXT, JSONB, UUID, TEXT, TEXT)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Automatic audit of every ledger movement
-- ---------------------------------------------------------------------------
-- A trigger, not scattered application calls, so no channel can move money
-- without leaving a trace.
CREATE OR REPLACE FUNCTION public.tg_payments_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit(
      'payment.' || NEW.status, 'payments', NEW.id, NEW.ref,
      jsonb_build_object(
        'amount', NEW.amount, 'channel', NEW.channel,
        'revenue_type', NEW.revenue_type, 'collector_role', NEW.collector_role,
        'source_table', NEW.source_table, 'source_ref', NEW.source_ref
      ),
      COALESCE(NEW.collector_id, NEW.payer_id)
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_audit(
      'payment.status_changed', 'payments', NEW.id, NEW.ref,
      jsonb_build_object(
        'from', OLD.status, 'to', NEW.status,
        'amount', NEW.amount, 'provider_ref', NEW.provider_ref
      ),
      COALESCE(NEW.collector_id, NEW.payer_id)
    );
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS payments_audit ON public.payments;
CREATE TRIGGER payments_audit AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payments_audit();

CREATE OR REPLACE FUNCTION public.tg_receipts_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_audit(
    'receipt.issued', 'receipts', NEW.id, NEW.receipt_no,
    jsonb_build_object('amount', NEW.amount, 'revenue_type', NEW.revenue_type,
                       'entity_ref', NEW.entity_ref, 'payment_id', NEW.payment_id)
  );
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS receipts_audit ON public.receipts;
CREATE TRIGGER receipts_audit AFTER INSERT ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.tg_receipts_audit();

-- ---------------------------------------------------------------------------
-- 3. Request throttling
-- ---------------------------------------------------------------------------
-- Fixed-window counter keyed on "<action>:<hashed ip>". No grants to
-- authenticated or anon: only the service role behind the API routes touches it.
CREATE TABLE IF NOT EXISTS public.request_throttle (
  bucket       TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count        INT NOT NULL DEFAULT 0
);
GRANT ALL ON public.request_throttle TO service_role;
ALTER TABLE public.request_throttle ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_throttle_window ON public.request_throttle(window_start);

-- Returns TRUE when the request is allowed. Single statement, so concurrent
-- requests cannot both slip past the limit.
CREATE OR REPLACE FUNCTION public.check_throttle(
  p_bucket         TEXT,
  p_limit          INT DEFAULT 20,
  p_window_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur INT;
BEGIN
  INSERT INTO public.request_throttle AS rt (bucket, window_start, count)
  VALUES (p_bucket, now(), 1)
  ON CONFLICT (bucket) DO UPDATE SET
    window_start = CASE
      WHEN rt.window_start < now() - make_interval(secs => p_window_seconds)
      THEN now() ELSE rt.window_start END,
    count = CASE
      WHEN rt.window_start < now() - make_interval(secs => p_window_seconds)
      THEN 1 ELSE rt.count + 1 END
  RETURNING rt.count INTO cur;

  RETURN cur <= p_limit;
END $$;

REVOKE ALL ON FUNCTION public.check_throttle(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_throttle(TEXT, INT, INT) TO service_role;

-- Housekeeping helper: drop buckets nobody has touched for a day.
CREATE OR REPLACE FUNCTION public.prune_throttle()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INT;
BEGIN
  DELETE FROM public.request_throttle WHERE window_start < now() - INTERVAL '1 day';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.prune_throttle() TO service_role;
