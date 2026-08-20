-- =============================================================================
-- Staff read access to profiles  +  a multi-role helper
-- =============================================================================
-- profiles shipped with a SELECT-self-only policy, so every staff query that
-- joins profile names silently returned zero rows under RLS. The collector
-- leaderboard (fetchCollectorLeaderboard in src/shared/lib/revenue.ts) is the
-- visible symptom: it aggregates the ledger correctly, then fails to attach a
-- single name.
--
-- Also introduces has_any_role(), a text-based companion to the existing
-- has_role(). Comparing role::text against a text[] means a policy can name a
-- role that is not yet in the app_role enum without a parse error, which keeps
-- these policies safe to apply in any order relative to enum migrations.
--
-- Idempotent: safe to re-run.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles TEXT[])
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = ANY(_roles)
  )
$$;

-- Self OR council staff. Self-service INSERT/UPDATE policies are left untouched:
-- staff can read names, they still cannot edit another user's profile.
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_staff_select" ON public.profiles;
CREATE POLICY "profiles_staff_select" ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_any_role(auth.uid(), ARRAY['admin', 'chairman', 'officer'])
  );
