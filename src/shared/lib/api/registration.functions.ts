import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { TablesInsert } from "@/integrations/supabase/types";

// NOTE: Input schemas use camelCase (matching the registration wizard's form
// state). The DB columns are snake_case, so each handler branch maps the
// validated object to the exact column names via TablesInsert<...>. Passing the
// camelCase object straight to .insert() silently fails (no such columns).

const attribution = {
  registeredBy: z.string().uuid().optional(),
};

const TransportVehicleSchema = z.object({
  ...attribution,
  ownerId: z.string().uuid(),
  ref: z.string(),
  vehicleType: z.enum(["motorcycle", "tricycle", "commercial-vehicle"]),
  plateNumber: z.string(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  color: z.string().optional(),
  operatorName: z.string(),
  operatorPhone: z.string().optional(),
  operatorNin: z.string().optional(),
  ward: z.string(),
  route: z.string().optional(),
  dailyTicketPrice: z.number().default(100),
  status: z.enum(["Pending", "Active"]).default("Pending"),
});

const PropertySchema = z.object({
  ...attribution,
  ownerId: z.string().uuid(),
  ref: z.string(),
  propertyType: z.string(),
  propertyName: z.string(),
  address: z.string(),
  ward: z.string(),
  district: z.string().optional(),
  street: z.string().optional(),
  building: z.string().optional(),
  landmark: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  propertyClass: z.string().optional(),
  assessmentRef: z.string().optional(),
  assessedValue: z.number().default(0),
  annualRate: z.number().default(0),
  outstanding: z.number().default(0),
  status: z.enum(["Pending", "Active"]).default("Pending"),
});

const MarketStallSchema = z.object({
  ...attribution,
  ownerId: z.string().uuid(),
  ref: z.string(),
  marketName: z.string(),
  stallNumber: z.string(),
  stallType: z.string().optional(),
  traderName: z.string(),
  traderPhone: z.string().optional(),
  traderNin: z.string().optional(),
  ward: z.string(),
  goodsCategory: z.string().optional(),
  dailyToll: z.number().default(100),
  monthlyRent: z.number().default(0),
  sanitationLevy: z.number().default(500),
  status: z.enum(["Pending", "Active"]).default("Pending"),
});

const HospitalityPermitSchema = z.object({
  ...attribution,
  ownerId: z.string().uuid(),
  ref: z.string(),
  establishmentName: z.string(),
  establishmentType: z.string(),
  address: z.string(),
  ward: z.string(),
  rooms: z.number().optional(),
  capacity: z.number().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  annualPermitFee: z.number().default(0),
  status: z.enum(["Pending", "Active"]).default("Pending"),
});

const PosOperatorSchema = z.object({
  ...attribution,
  ownerId: z.string().uuid(),
  ref: z.string(),
  operatorName: z.string(),
  businessName: z.string().optional(),
  phone: z.string(),
  email: z.string().optional(),
  ward: z.string(),
  location: z.string().optional(),
  terminalCount: z.number().default(1),
  annualPermitFee: z.number().default(0),
  status: z.enum(["Pending", "Active"]).default("Pending"),
});

const SanitationSubscriptionSchema = z.object({
  ...attribution,
  ownerId: z.string().uuid(),
  ref: z.string(),
  subscriberName: z.string(),
  phone: z.string(),
  address: z.string(),
  ward: z.string(),
  serviceType: z.string().optional(),
  pickupFrequency: z.string().optional(),
  monthlyFee: z.number().default(500),
  status: z.enum(["Pending", "Active"]).default("Pending"),
});

const BusinessSchema = z.object({
  ...attribution,
  ownerId: z.string().uuid(),
  ref: z.string(),
  taxpayerType: z.string(),
  businessName: z.string(),
  tradingName: z.string().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  rcNumber: z.string().optional(),
  tin: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  ownerName: z.string().optional(),
  nin: z.string().optional(),
  bvn: z.string().optional(),
  ward: z.string().optional(),
  district: z.string().optional(),
  street: z.string().optional(),
  building: z.string().optional(),
  landmark: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  propertyClass: z.string().optional(),
  assessmentRef: z.string().optional(),
  annualRate: z.number().default(0),
  obligations: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([]),
  status: z.enum(["Pending", "Active"]).default("Pending"),
});

const RegistrationInputSchema = z.discriminatedUnion("table", [
  z.object({ table: z.literal("transport_vehicles"), data: TransportVehicleSchema }),
  z.object({ table: z.literal("properties"), data: PropertySchema }),
  z.object({ table: z.literal("market_stalls"), data: MarketStallSchema }),
  z.object({ table: z.literal("hospitality_permits"), data: HospitalityPermitSchema }),
  z.object({ table: z.literal("pos_operators"), data: PosOperatorSchema }),
  z.object({ table: z.literal("sanitation_subscriptions"), data: SanitationSubscriptionSchema }),
  z.object({ table: z.literal("businesses"), data: BusinessSchema }),
]);

// ---- camelCase (form) -> snake_case (column) mappers ------------------------

const undef = <T>(v: T | undefined) => (v === undefined ? null : v);

function mapTransport(d: z.infer<typeof TransportVehicleSchema>): TablesInsert<"transport_vehicles"> {
  return {
    owner_id: d.ownerId,
    ref: d.ref,
    vehicle_type: d.vehicleType,
    plate_number: d.plateNumber,
    chassis_number: undef(d.chassisNumber),
    engine_number: undef(d.engineNumber),
    make: undef(d.make),
    model: undef(d.model),
    year: undef(d.year),
    color: undef(d.color),
    operator_name: d.operatorName,
    operator_phone: undef(d.operatorPhone),
    operator_nin: undef(d.operatorNin),
    ward: d.ward,
    route: undef(d.route),
    daily_ticket_price: d.dailyTicketPrice,
    status: d.status,
    registered_by: undef(d.registeredBy),
  };
}

function mapProperty(d: z.infer<typeof PropertySchema>): TablesInsert<"properties"> {
  return {
    owner_id: d.ownerId,
    ref: d.ref,
    property_type: d.propertyType,
    property_name: d.propertyName,
    address: d.address,
    ward: d.ward,
    district: undef(d.district),
    street: undef(d.street),
    building: undef(d.building),
    landmark: undef(d.landmark),
    lat: undef(d.lat),
    lng: undef(d.lng),
    property_class: undef(d.propertyClass),
    assessment_ref: undef(d.assessmentRef),
    assessed_value: d.assessedValue,
    annual_rate: d.annualRate,
    outstanding: d.outstanding,
    status: d.status,
    registered_by: undef(d.registeredBy),
  };
}

function mapMarketStall(d: z.infer<typeof MarketStallSchema>): TablesInsert<"market_stalls"> {
  return {
    owner_id: d.ownerId,
    ref: d.ref,
    market_name: d.marketName,
    stall_number: d.stallNumber,
    stall_type: undef(d.stallType),
    trader_name: d.traderName,
    trader_phone: undef(d.traderPhone),
    trader_nin: undef(d.traderNin),
    ward: d.ward,
    goods_category: undef(d.goodsCategory),
    daily_toll: d.dailyToll,
    monthly_rent: d.monthlyRent,
    sanitation_levy: d.sanitationLevy,
    status: d.status,
    registered_by: undef(d.registeredBy),
  };
}

function mapHospitality(d: z.infer<typeof HospitalityPermitSchema>): TablesInsert<"hospitality_permits"> {
  return {
    owner_id: d.ownerId,
    ref: d.ref,
    establishment_name: d.establishmentName,
    establishment_type: d.establishmentType,
    address: d.address,
    ward: d.ward,
    rooms: undef(d.rooms),
    capacity: undef(d.capacity),
    annual_permit_fee: d.annualPermitFee,
    status: d.status,
    registered_by: undef(d.registeredBy),
    // contactPerson / contactPhone have no dedicated columns -> keep in payload.
    payload: { contactPerson: d.contactPerson ?? null, contactPhone: d.contactPhone ?? null },
  };
}

function mapPos(d: z.infer<typeof PosOperatorSchema>): TablesInsert<"pos_operators"> {
  return {
    owner_id: d.ownerId,
    ref: d.ref,
    operator_name: d.operatorName,
    business_name: undef(d.businessName),
    phone: d.phone,
    email: undef(d.email),
    ward: d.ward,
    location: undef(d.location),
    terminal_count: d.terminalCount,
    annual_permit_fee: d.annualPermitFee,
    status: d.status,
    registered_by: undef(d.registeredBy),
  };
}

function mapSanitation(d: z.infer<typeof SanitationSubscriptionSchema>): TablesInsert<"sanitation_subscriptions"> {
  return {
    owner_id: d.ownerId,
    ref: d.ref,
    subscriber_name: d.subscriberName,
    phone: d.phone,
    address: d.address,
    ward: d.ward,
    service_type: undef(d.serviceType),
    pickup_frequency: undef(d.pickupFrequency),
    monthly_fee: d.monthlyFee,
    status: d.status,
    registered_by: undef(d.registeredBy),
  };
}

function mapBusiness(d: z.infer<typeof BusinessSchema>): TablesInsert<"businesses"> {
  return {
    owner_id: d.ownerId,
    ref: d.ref,
    taxpayer_type: d.taxpayerType,
    business_name: d.businessName,
    trading_name: undef(d.tradingName),
    category: undef(d.category),
    industry: undef(d.industry),
    rc_number: undef(d.rcNumber),
    tin: undef(d.tin),
    phone: undef(d.phone),
    email: undef(d.email),
    website: undef(d.website),
    owner_name: undef(d.ownerName),
    nin: undef(d.nin),
    bvn: undef(d.bvn),
    ward: undef(d.ward),
    district: undef(d.district),
    street: undef(d.street),
    building: undef(d.building),
    landmark: undef(d.landmark),
    lat: undef(d.lat),
    lng: undef(d.lng),
    property_class: undef(d.propertyClass),
    assessment_ref: undef(d.assessmentRef),
    annual_rate: d.annualRate,
    obligations: d.obligations,
    documents: d.documents,
    status: d.status,
    registered_by: undef(d.registeredBy),
  };
}

export const insertRegistration = createServerFn({ method: "POST" })
  .validator(RegistrationInputSchema)
  .handler(async ({ data }) => {
    // Each branch pairs the literal table with its correctly-typed row so the
    // Supabase client can type-check the insert. Return the qr_token alongside the
    // ref so the caller can render the ID card immediately — anonymous self-service
    // users cannot re-read the row through RLS, so the server must hand it back.
    let ref: string | null = null;
    let qrToken: string | null = null;
    let error: { message: string } | null = null;

    const pick = (r: { data: { ref?: string; qr_token?: string } | null; error: { message: string } | null }) => {
      error = r.error;
      ref = r.data?.ref ?? null;
      qrToken = r.data?.qr_token ?? null;
    };

    switch (data.table) {
      case "transport_vehicles": {
        pick(await supabaseAdmin.from("transport_vehicles").insert(mapTransport(data.data)).select("ref, qr_token").single());
        break;
      }
      case "properties": {
        pick(await supabaseAdmin.from("properties").insert(mapProperty(data.data)).select("ref, qr_token").single());
        break;
      }
      case "market_stalls": {
        pick(await supabaseAdmin.from("market_stalls").insert(mapMarketStall(data.data)).select("ref, qr_token").single());
        break;
      }
      case "hospitality_permits": {
        pick(await supabaseAdmin.from("hospitality_permits").insert(mapHospitality(data.data)).select("ref, qr_token").single());
        break;
      }
      case "pos_operators": {
        pick(await supabaseAdmin.from("pos_operators").insert(mapPos(data.data)).select("ref, qr_token").single());
        break;
      }
      case "sanitation_subscriptions": {
        pick(await supabaseAdmin.from("sanitation_subscriptions").insert(mapSanitation(data.data)).select("ref, qr_token").single());
        break;
      }
      case "businesses": {
        pick(await supabaseAdmin.from("businesses").insert(mapBusiness(data.data)).select("ref, qr_token").single());
        break;
      }
    }

    if (error) {
      throw new Error(error.message);
    }
    return { success: true, ref, qrToken };
  });
