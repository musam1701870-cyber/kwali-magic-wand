-- Widen SELECT policies on registration tables to include 'marshal'.
--
-- The market management and transport pages read market_stalls,
-- transport_vehicles, businesses, properties, hospitality_permits,
-- pos_operators and sanitation_subscriptions on behalf of signed-in staff.
-- The original SELECT policies only allowed the owner, admin or officer, so a
-- marshal scanning the register got a 403. Officers already had access on some
-- tables but not all; this makes the staff read path uniform.
--
-- Idempotent: DROP first so a fresh apply or a re-run both succeed.

-- ---------------------------------------------------------------------------
-- 0. Fix "permission denied for function has_role"
-- ---------------------------------------------------------------------------
-- Migration 20260608100508 revoked EXECUTE on has_role() from authenticated in
-- the name of hardening. That breaks every RLS policy that calls it: in
-- Postgres, a function referenced by a policy runs with the *invoking* user's
-- EXECUTE privilege, so revoking it makes each such policy raise
-- "permission denied for function has_role" for every signed-in user.
--
-- Both helpers are SECURITY DEFINER and only read public.user_roles — they leak
-- nothing beyond the boolean the policy needs — so granting EXECUTE back to
-- authenticated is safe and is what the policies require to run at all.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(UUID, TEXT[]) TO authenticated;

DO $$
DECLARE
  t TEXT;
  reg_tables TEXT[] := ARRAY[
    'businesses', 'properties', 'transport_vehicles', 'market_stalls',
    'hospitality_permits', 'pos_operators', 'sanitation_subscriptions'
  ];
BEGIN
  FOREACH t IN ARRAY reg_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_owner_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
         USING (auth.uid() = owner_id
            OR public.has_role(auth.uid(), ''admin'')
            OR public.has_role(auth.uid(), ''officer'')
            OR public.has_role(auth.uid(), ''marshal''));',
      t || '_owner_select', t);
  END LOOP;
END $$;

-- The payments ledger read path excludes marshals (see payment_lifecycle's
-- payments_select). Restate it with marshal included so field staff can see
-- confirmed collections on the management pages.
DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "payments_select" ON public.payments;';
    EXECUTE 'CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
      USING (
        auth.uid() = payer_id
        OR auth.uid() = collector_id
        OR public.has_any_role(auth.uid(), ARRAY[''admin'', ''chairman'', ''officer'', ''marshal''])
      );';
  END IF;
END $$;
