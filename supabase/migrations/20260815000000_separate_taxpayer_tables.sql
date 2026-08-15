-- Separate tables for different taxpayer types

-- Properties table (tenement rates)
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref TEXT NOT NULL UNIQUE,
  property_type TEXT NOT NULL, -- residential, commercial, mixed-use, industrial
  property_name TEXT,
  address TEXT NOT NULL,
  ward TEXT NOT NULL,
  district TEXT,
  street TEXT,
  building TEXT,
  landmark TEXT,
  lat TEXT,
  lng TEXT,
  property_class TEXT, -- Residential, Commercial, Mixed-use, Hazard/Industrial, Institutional
  assessment_ref TEXT,
  assessed_value NUMERIC DEFAULT 0,
  annual_rate NUMERIC DEFAULT 0,
  outstanding NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_owner_select" ON public.properties FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "properties_owner_insert" ON public.properties FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "properties_owner_update" ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "properties_admin_delete" ON public.properties FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();


-- Transport vehicles table (keke, okada, commercial vehicles)
CREATE TABLE public.transport_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL, -- motorcycle, tricycle, commercial-vehicle
  plate_number TEXT,
  chassis_number TEXT,
  engine_number TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  operator_name TEXT,
  operator_phone TEXT,
  operator_nin TEXT,
  ward TEXT NOT NULL,
  route TEXT,
  parking_location TEXT,
  daily_ticket_price NUMERIC DEFAULT 100,
  qr_sticker_code TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_vehicles TO authenticated;
GRANT ALL ON public.transport_vehicles TO service_role;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transport_owner_select" ON public.transport_vehicles FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "transport_owner_insert" ON public.transport_vehicles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "transport_owner_update" ON public.transport_vehicles FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "transport_admin_delete" ON public.transport_vehicles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER transport_vehicles_updated_at BEFORE UPDATE ON public.transport_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();


-- Market stalls table (market traders)
CREATE TABLE public.market_stalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref TEXT NOT NULL UNIQUE,
  market_name TEXT NOT NULL,
  stall_number TEXT,
  stall_type TEXT, -- lockup, open, table-top
  trader_name TEXT NOT NULL,
  trader_phone TEXT,
  trader_nin TEXT,
  ward TEXT NOT NULL,
  goods_category TEXT, -- food, clothing, electronics, etc.
  daily_toll NUMERIC DEFAULT 0,
  monthly_rent NUMERIC DEFAULT 0,
  sanitation_levy NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_stalls TO authenticated;
GRANT ALL ON public.market_stalls TO service_role;
ALTER TABLE public.market_stalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_owner_select" ON public.market_stalls FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "market_owner_insert" ON public.market_stalls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "market_owner_update" ON public.market_stalls FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "market_admin_delete" ON public.market_stalls FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER market_stalls_updated_at BEFORE UPDATE ON public.market_stalls
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();


-- Hospitality permits table (hotels, event centres)
CREATE TABLE public.hospitality_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref TEXT NOT NULL UNIQUE,
  establishment_name TEXT NOT NULL,
  establishment_type TEXT NOT NULL, -- hotel, lodge, event-centre, restaurant
  address TEXT NOT NULL,
  ward TEXT NOT NULL,
  rooms INTEGER,
  capacity INTEGER,
  annual_permit_fee NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospitality_permits TO authenticated;
GRANT ALL ON public.hospitality_permits TO service_role;
ALTER TABLE public.hospitality_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hospitality_owner_select" ON public.hospitality_permits FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "hospitality_owner_insert" ON public.hospitality_permits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "hospitality_owner_update" ON public.hospitality_permits FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "hospitality_admin_delete" ON public.hospitality_permits FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER hospitality_permits_updated_at BEFORE UPDATE ON public.hospitality_permits
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();


-- POS operators table
CREATE TABLE public.pos_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref TEXT NOT NULL UNIQUE,
  operator_name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  ward TEXT NOT NULL,
  location TEXT,
  terminal_count INTEGER DEFAULT 1,
  annual_permit_fee NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_operators TO authenticated;
GRANT ALL ON public.pos_operators TO service_role;
ALTER TABLE public.pos_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_owner_select" ON public.pos_operators FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "pos_owner_insert" ON public.pos_operators FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pos_owner_update" ON public.pos_operators FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pos_admin_delete" ON public.pos_operators FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pos_operators_updated_at BEFORE UPDATE ON public.pos_operators
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();


-- Sanitation subscriptions table
CREATE TABLE public.sanitation_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref TEXT NOT NULL UNIQUE,
  subscriber_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  ward TEXT NOT NULL,
  service_type TEXT, -- residential, commercial
  pickup_frequency TEXT, -- weekly, bi-weekly, monthly
  monthly_fee NUMERIC DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'Pending',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sanitation_subscriptions TO authenticated;
GRANT ALL ON public.sanitation_subscriptions TO service_role;
ALTER TABLE public.sanitation_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sanitation_owner_select" ON public.sanitation_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
CREATE POLICY "sanitation_owner_insert" ON public.sanitation_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sanitation_owner_update" ON public.sanitation_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sanitation_admin_delete" ON public.sanitation_subscriptions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER sanitation_subscriptions_updated_at BEFORE UPDATE ON public.sanitation_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();