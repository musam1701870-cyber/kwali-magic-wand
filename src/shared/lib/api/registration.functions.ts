import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TransportVehicleSchema = z.object({
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

export const insertRegistration = createServerFn({ method: "POST" })
  .validator(RegistrationInputSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from(data.table).insert(data.data);
    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  });