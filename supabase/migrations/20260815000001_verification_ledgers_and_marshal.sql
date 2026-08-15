-- Add marshal role to enum
ALTER TYPE public.app_role ADD VALUE 'marshal';

-- Transport ticket verifications
CREATE TABLE public.transport_ticket_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marshal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  plate_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  ticket_ref TEXT,
  is_valid BOOLEAN NOT NULL,
  verification_method TEXT NOT NULL DEFAULT 'qr_scan', -- qr_scan, manual, ussd
  location_lat TEXT,
  location_lng TEXT,
  ward TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.transport_ticket_verifications TO authenticated;
GRANT ALL ON public.transport_ticket_verifications TO service_role;
ALTER TABLE public.transport_ticket_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marshal_verifications_select" ON public.transport_ticket_verifications FOR SELECT TO authenticated
  USING (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "marshal_verifications_insert" ON public.transport_ticket_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "marshal_verifications_admin" ON public.transport_ticket_verifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_transport_verifications_marshal ON public.transport_ticket_verifications(marshal_id);
CREATE INDEX idx_transport_verifications_vehicle ON public.transport_ticket_verifications(vehicle_id);
CREATE INDEX idx_transport_verifications_plate ON public.transport_ticket_verifications(plate_number);
CREATE INDEX idx_transport_verifications_created ON public.transport_ticket_verifications(created_at DESC);


-- Market payment verifications
CREATE TABLE public.market_payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marshal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stall_id UUID REFERENCES public.market_stalls(id) ON DELETE SET NULL,
  trader_name TEXT NOT NULL,
  market_name TEXT NOT NULL,
  stall_number TEXT,
  payment_ref TEXT,
  is_valid BOOLEAN NOT NULL,
  verification_method TEXT NOT NULL DEFAULT 'qr_scan', -- qr_scan, manual, receipt_check
  location_lat TEXT,
  location_lng TEXT,
  ward TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.market_payment_verifications TO authenticated;
GRANT ALL ON public.market_payment_verifications TO service_role;
ALTER TABLE public.market_payment_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marshal_market_verifications_select" ON public.market_payment_verifications FOR SELECT TO authenticated
  USING (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "marshal_market_verifications_insert" ON public.market_payment_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "marshal_market_verifications_admin" ON public.market_payment_verifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_market_verifications_marshal ON public.market_payment_verifications(marshal_id);
CREATE INDEX idx_market_verifications_stall ON public.market_payment_verifications(stall_id);
CREATE INDEX idx_market_verifications_created ON public.market_payment_verifications(created_at DESC);


-- Enforcement incidents
CREATE TABLE public.enforcement_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marshal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL, -- transport_ticket_evasion, market_fee_evasion, illegal_structure, illegal_dumping, obstruction, other
  subject_type TEXT NOT NULL, -- transport_vehicle, market_stall, property, business, person
  subject_id UUID, -- reference to the specific entity
  subject_name TEXT,
  subject_identifier TEXT, -- plate number, stall number, property ref, etc.
  location_lat TEXT,
  location_lng TEXT,
  ward TEXT,
  description TEXT NOT NULL,
  evidence_photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open', -- open, under_review, resolved, dismissed
  penalty_amount NUMERIC DEFAULT 0,
  penalty_paid BOOLEAN DEFAULT false,
  assigned_officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.enforcement_incidents TO authenticated;
GRANT ALL ON public.enforcement_incidents TO service_role;
ALTER TABLE public.enforcement_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marshal_incidents_select" ON public.enforcement_incidents FOR SELECT TO authenticated
  USING (auth.uid() = marshal_id OR auth.uid() = assigned_officer_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "marshal_incidents_insert" ON public.enforcement_incidents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = marshal_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "marshal_incidents_update" ON public.enforcement_incidents FOR UPDATE TO authenticated
  USING (auth.uid() = marshal_id OR auth.uid() = assigned_officer_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "marshal_incidents_admin" ON public.enforcement_incidents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_enforcement_marshal ON public.enforcement_incidents(marshal_id);
CREATE INDEX idx_enforcement_officer ON public.enforcement_incidents(assigned_officer_id);
CREATE INDEX idx_enforcement_status ON public.enforcement_incidents(status);
CREATE INDEX idx_enforcement_type ON public.enforcement_incidents(incident_type);
CREATE INDEX idx_enforcement_subject ON public.enforcement_incidents(subject_type, subject_id);
CREATE INDEX idx_enforcement_created ON public.enforcement_incidents(created_at DESC);

CREATE TRIGGER enforcement_incidents_updated_at BEFORE UPDATE ON public.enforcement_incidents
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();


-- Marshal dashboard metrics view
CREATE OR REPLACE VIEW public.marshal_dashboard_stats AS
SELECT 
  m.id as marshal_id,
  m.full_name,
  m.ward,
  COUNT(tv.id) as transport_verifications_today,
  COUNT(mv.id) as market_verifications_today,
  COUNT(ei.id) as incidents_today,
  COUNT(CASE WHEN ei.status = 'open' THEN 1 END) as open_incidents
FROM public.profiles m
LEFT JOIN public.transport_ticket_verifications tv ON tv.marshal_id = m.id AND tv.created_at >= CURRENT_DATE
LEFT JOIN public.market_payment_verifications mv ON mv.marshal_id = m.id AND mv.created_at >= CURRENT_DATE
LEFT JOIN public.enforcement_incidents ei ON ei.marshal_id = m.id AND ei.created_at >= CURRENT_DATE
WHERE public.has_role(m.id, 'marshal')
GROUP BY m.id, m.full_name, m.ward;