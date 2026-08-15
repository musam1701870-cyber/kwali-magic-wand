-- Update RLS policies to include 'marshal' role

-- Transport ticket verifications
CREATE POLICY "marshal_verifications_select" ON public.transport_ticket_verifications FOR SELECT TO authenticated
  USING (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));
CREATE POLICY "marshal_verifications_insert" ON public.transport_ticket_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marshal'));

-- Market payment verifications
CREATE POLICY "marshal_market_verifications_select" ON public.market_payment_verifications FOR SELECT TO authenticated
  USING (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));
CREATE POLICY "marshal_market_verifications_insert" ON public.market_payment_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marshal'));

-- Enforcement incidents
CREATE POLICY "marshal_incidents_select" ON public.enforcement_incidents FOR SELECT TO authenticated
  USING (auth.uid() = marshal_id OR auth.uid() = assigned_officer_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));
CREATE POLICY "marshal_incidents_insert" ON public.enforcement_incidents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marshal'));
CREATE POLICY "marshal_incidents_update" ON public.enforcement_incidents FOR UPDATE TO authenticated
  USING (auth.uid() = marshal_id OR auth.uid() = assigned_officer_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'marshal'));