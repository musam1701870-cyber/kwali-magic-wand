-- Update businesses table RLS policies to include 'marshal' role

CREATE POLICY "businesses_owner_select" ON public.businesses FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));
CREATE POLICY "businesses_owner_insert" ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marshal'));
CREATE POLICY "businesses_owner_update" ON public.businesses FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marshal'));