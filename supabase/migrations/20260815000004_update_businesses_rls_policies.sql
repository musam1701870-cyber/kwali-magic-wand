-- Update businesses table RLS policies to include 'marshal' role.
-- These policy names already exist from the initial migration, so DROP first to
-- stay idempotent and safe on a clean `supabase db reset` / fresh apply.

DROP POLICY IF EXISTS "businesses_owner_select" ON public.businesses;
CREATE POLICY "businesses_owner_select" ON public.businesses FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));
DROP POLICY IF EXISTS "businesses_owner_insert" ON public.businesses;
CREATE POLICY "businesses_owner_insert" ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marshal'));
DROP POLICY IF EXISTS "businesses_owner_update" ON public.businesses;
CREATE POLICY "businesses_owner_update" ON public.businesses FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));
