import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import crest from "@/shared/assets/kwali-crest.png";
import { businessCategories, wards } from "@/shared/lib/kwali-mock";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/hooks/useAuth";
import { LocationPicker } from "@/shared/components/ui/LocationPicker";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { TaxpayerIdCard } from "@/shared/components/ui/TaxpayerIdCard";
import { insertRegistration } from "@/shared/lib/api/registration.functions";
import { createTaxpayerAccount } from "@/shared/lib/api/taxpayer-account.functions";

export const Route = createFileRoute("/(public)/register")({
  head: () => ({ meta: [{ title: "Taxpayer Registration — Kwali Smart Revenue Platform" }] }),
  validateSearch: (search) => ({
    category: search.category as string | undefined,
  }),
  component: RegisterPage,
});

// ---------- Domain ----------
const taxpayerTypes: { id: string; title: string; desc: string; icon: string; tag: string }[] = [
  {
    id: "individual",
    title: "Individual Taxpayer",
    desc: "Personal income & development levy",
    icon: "👤",
    tag: "Personal",
  },
  {
    id: "sole",
    title: "Sole Proprietor",
    desc: "Owner-operated small business",
    icon: "🧑‍💼",
    tag: "Business",
  },
  {
    id: "cac",
    title: "CAC Registered Business",
    desc: "Auto-verify via RC number",
    icon: "🏛️",
    tag: "Business",
  },
  {
    id: "llc",
    title: "Limited Liability Company",
    desc: "Private / public limited company",
    icon: "🏢",
    tag: "Company",
  },
  {
    id: "hotel",
    title: "Hotel / Lodge",
    desc: "Hospitality establishment",
    icon: "🏨",
    tag: "Hospitality",
  },
  {
    id: "restaurant",
    title: "Restaurant / Eatery",
    desc: "Food & beverage outlet",
    icon: "🍽️",
    tag: "Hospitality",
  },
  {
    id: "filling",
    title: "Filling Station",
    desc: "Petroleum products dealer",
    icon: "⛽",
    tag: "Hazard",
  },
  {
    id: "event",
    title: "Event Centre",
    desc: "Halls, banquet, conference",
    icon: "🎪",
    tag: "Hospitality",
  },
  {
    id: "complex",
    title: "Shopping Complex",
    desc: "Plaza / mall management",
    icon: "🏬",
    tag: "Property",
  },
  {
    id: "supermarket",
    title: "Supermarket",
    desc: "Retail chain or independent",
    icon: "🛍️",
    tag: "Retail",
  },
  {
    id: "market",
    title: "Market Authority",
    desc: "Council-owned market",
    icon: "🏪",
    tag: "Market",
  },
  {
    id: "trader",
    title: "Market Trader",
    desc: "Stall / lockup operator",
    icon: "🧺",
    tag: "Market",
  },
  { id: "lockup", title: "Lockup Shop", desc: "Lease & rates", icon: "🔐", tag: "Market" },
  { id: "pos", title: "POS Operator", desc: "Agency banking", icon: "💳", tag: "Financial" },
  {
    id: "professional",
    title: "Professional Firm",
    desc: "Law, audit, consult, ICT",
    icon: "💼",
    tag: "Services",
  },
  {
    id: "school",
    title: "School",
    desc: "Private nursery / primary / secondary",
    icon: "🏫",
    tag: "Education",
  },
  {
    id: "hospital",
    title: "Hospital / Clinic",
    desc: "Private healthcare",
    icon: "🏥",
    tag: "Health",
  },
  {
    id: "pharmacy",
    title: "Pharmacy",
    desc: "Patent medicine / pharmacy",
    icon: "💊",
    tag: "Health",
  },
  {
    id: "manufacturing",
    title: "Manufacturing",
    desc: "Factory / production",
    icon: "🏭",
    tag: "Industrial",
  },
  {
    id: "warehouse",
    title: "Warehouse",
    desc: "Storage & logistics",
    icon: "📦",
    tag: "Industrial",
  },
  {
    id: "construction",
    title: "Construction Co.",
    desc: "Engineering & building",
    icon: "🏗️",
    tag: "Industrial",
  },
  {
    id: "religious",
    title: "Religious Organization",
    desc: "Church / mosque / mission",
    icon: "🛐",
    tag: "Non-Profit",
  },
  { id: "ngo", title: "NGO", desc: "Non-governmental org", icon: "🤝", tag: "Non-Profit" },
  {
    id: "association",
    title: "Association / Union",
    desc: "Trade or community group",
    icon: "👥",
    tag: "Non-Profit",
  },
  {
    id: "motorcycle",
    title: "Motorcycle (Okada)",
    desc: "Commercial bike rider",
    icon: "🏍️",
    tag: "Transport",
  },
  {
    id: "tricycle",
    title: "Tricycle (Keke)",
    desc: "Commercial tricycle",
    icon: "🛺",
    tag: "Transport",
  },
  {
    id: "commercial-vehicle",
    title: "Commercial Vehicle",
    desc: "Bus / taxi / haulage",
    icon: "🚌",
    tag: "Transport",
  },
  {
    id: "property-owner",
    title: "Property Owner",
    desc: "Tenement rate payer",
    icon: "🏠",
    tag: "Property",
  },
  {
    id: "landlord",
    title: "Landlord",
    desc: "Rental property income",
    icon: "🔑",
    tag: "Property",
  },
  {
    id: "developer",
    title: "Property Developer",
    desc: "Real estate development",
    icon: "📐",
    tag: "Property",
  },
];

const obligationsMap: Record<string, string[]> = {
  hotel: [
    "Hotel Operating Permit",
    "Business Premises Levy",
    "Tenement Rate",
    "Environmental Levy",
    "Signage Permit",
    "Waste Management Fee",
    "Fire Compliance",
    "Tourism Levy",
  ],
  filling: [
    "Business Premises Levy",
    "Tenement Rate",
    "Environmental Levy",
    "Hazard Compliance Levy",
    "Signage Permit",
    "Operational Permit",
    "Fire Compliance",
  ],
  restaurant: [
    "Business Premises Levy",
    "Tenement Rate",
    "Food Hygiene Permit",
    "Signage Permit",
    "Waste Management Fee",
  ],
  event: [
    "Operating Permit",
    "Tenement Rate",
    "Noise Compliance",
    "Waste Management",
    "Signage Permit",
  ],
  supermarket: [
    "Business Premises Levy",
    "Tenement Rate",
    "Signage Permit",
    "Waste Management",
    "Weights & Measures",
  ],
  complex: ["Tenement Rate", "Signage Permit", "Waste Management", "Property Management Levy"],
  market: ["Daily Toll Collection", "Stall Allocation Fee", "Sanitation Levy"],
  trader: ["Daily Market Toll", "Sanitation Levy", "Stall Fee"],
  lockup: ["Annual Lockup Rent", "Sanitation Levy"],
  pos: ["POS Operator Permit", "Signage Permit", "Sanitation Levy"],
  professional: ["Business Premises Levy", "Practice Permit"],
  school: ["School Operating Permit", "Tenement Rate", "Sanitation"],
  hospital: ["Health Facility Permit", "Tenement Rate", "Medical Waste Levy"],
  pharmacy: ["Pharmacy Permit", "Business Premises Levy", "Signage Permit"],
  manufacturing: ["Factory Permit", "Environmental Levy", "Tenement Rate", "Hazard Levy"],
  warehouse: ["Storage Permit", "Tenement Rate", "Environmental Levy"],
  construction: ["Building Approval", "Site Levy", "Environmental Levy"],
  religious: ["Sanitation Levy"],
  ngo: ["Operating Permit"],
  association: ["Annual Registration"],
  motorcycle: ["Rider Permit", "Vehicle Sticker", "Park Levy"],
  tricycle: ["Operator Permit", "Vehicle Sticker", "Park Levy"],
  "commercial-vehicle": ["Operator Permit", "Loading Levy", "Park Levy"],
  "property-owner": ["Tenement Rate", "Ground Rent"],
  landlord: ["Tenement Rate", "Rental Income Levy"],
  developer: ["Building Approval", "Development Levy", "Tenement Rate"],
  individual: ["Personal Development Levy"],
  sole: ["Business Premises Levy", "Personal Development Levy"],
  cac: ["Business Premises Levy", "Signage Permit"],
  llc: ["Business Premises Levy", "Signage Permit", "Tenement Rate"],
};

const documentsMap: Record<string, string[]> = {
  default: [
    "Valid ID (NIN slip / Passport / Driver's License)",
    "Utility Bill",
    "Passport Photograph",
  ],
  business: [
    "CAC Certificate",
    "MEMART",
    "Tax Clearance Certificate",
    "Utility Bill",
    "Passport Photograph",
    "Site Photographs",
  ],
  property: ["Property Title Document", "Survey Plan", "Building Approval", "Utility Bill"],
  hazard: [
    "DPR / NMDPRA License",
    "Fire Safety Certificate",
    "Environmental Impact Assessment",
    "CAC Certificate",
  ],
};

// Track definitions with their specific steps
const TRACK_STEPS: Record<string, string[]> = {
  // Transport tracks
  motorcycle: ["Taxpayer Type", "Vehicle Information", "Owner Information", "Location & Route", "Revenue Classification", "Documents", "Review & Submit"],
  tricycle: ["Taxpayer Type", "Vehicle Information", "Owner Information", "Location & Route", "Revenue Classification", "Documents", "Review & Submit"],
  "commercial-vehicle": ["Taxpayer Type", "Vehicle Information", "Owner Information", "Location & Route", "Revenue Classification", "Documents", "Review & Submit"],
  
  // Market tracks
  trader: ["Taxpayer Type", "Business Information", "Trader Information", "Location & Stall", "Revenue Classification", "Documents", "Review & Submit"],
  lockup: ["Taxpayer Type", "Business Information", "Trader Information", "Location & Stall", "Revenue Classification", "Documents", "Review & Submit"],
  market: ["Taxpayer Type", "Business Information", "Trader Information", "Location & Stall", "Revenue Classification", "Documents", "Review & Submit"],
  
  // Property tracks
  "property-owner": ["Taxpayer Type", "Property Information", "Owner Information", "Location & Assessment", "Revenue Classification", "Documents", "Review & Submit"],
  landlord: ["Taxpayer Type", "Property Information", "Owner Information", "Location & Assessment", "Revenue Classification", "Documents", "Review & Submit"],
  developer: ["Taxpayer Type", "Property Information", "Owner Information", "Location & Assessment", "Revenue Classification", "Documents", "Review & Submit"],
  
  // Business tracks
  sole: ["Taxpayer Type", "Business Information", "Owner Information", "Location Information", "Revenue Classification", "Documents", "Review & Submit"],
  individual: ["Taxpayer Type", "Personal Information", "Location Information", "Revenue Classification", "Documents", "Review & Submit"],
  
  // CAC tracks
  cac: ["Taxpayer Type", "Business Information", "Corporate Information", "Location Information", "Revenue Classification", "Documents", "Review & Submit"],
  llc: ["Taxpayer Type", "Business Information", "Corporate Information", "Location Information", "Revenue Classification", "Documents", "Review & Submit"],
  
  // Hospitality
  hotel: ["Taxpayer Type", "Establishment Information", "Contact Information", "Location Information", "Revenue Classification", "Documents", "Review & Submit"],
  restaurant: ["Taxpayer Type", "Establishment Information", "Contact Information", "Location Information", "Revenue Classification", "Documents", "Review & Submit"],
  event: ["Taxpayer Type", "Establishment Information", "Contact Information", "Location Information", "Revenue Classification", "Documents", "Review & Submit"],
  
  // POS
  pos: ["Taxpayer Type", "Operator Information", "Location Information", "Revenue Classification", "Documents", "Review & Submit"],
  
  // Default fallback
  default: ["Taxpayer Type", "Business Information", "Ownership Information", "Location Information", "Property & Tenement", "Revenue Classification", "Documents & Verification", "Review & Submit"],
};

// Current track's steps (computed from form.type)
function getStepsForType(type: string): string[] {
  return TRACK_STEPS[type] || TRACK_STEPS.default;
}

type FormState = {
  type: string;
  // step 2
  businessName: string;
  tradingName: string;
  category: string;
  industry: string;
  rc: string;
  tin: string;
  incorporated: string;
  size: string;
  employees: string;
  turnover: string;
  phone: string;
  email: string;
  website: string;
  cacVerified: boolean;
  // step 3
  ownerName: string;
  directors: string;
  nin: string;
  bvn: string;
  ownerPhone: string;
  ownerEmail: string;
  nationality: string;
  residential: string;
  emergency: string;
  // step 4 - location (shared)
  state: string;
  lga: string;
  ward: string;
  district: string;
  street: string;
  building: string;
  lat: string;
  lng: string;
  landmark: string;
  // transport-specific fields
  plateNumber: string;
  chassisNumber: string;
  engineNumber: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  routePark: string;
  // market-specific fields
  marketName: string;
  stallNumber: string;
  stallType: string;
  goodsCategory: string;
  traderAssociation: string;
  // property-specific fields
  propertyType: string;
  priorAssessmentRef: string;
  // hospitality-specific fields
  establishmentType: string;
  contactPerson: string;
  contactPhone: string;
  // pos-specific fields
  terminalCount: string;
  // step 5
  propertyMatched: boolean;
  assessmentRef: string;
  propertyValue: string;
  annualRate: string;
  outstanding: string;
  propertyClass: string;
  // step 6
  obligations: string[];
  // step 7
  uploaded: string[];
  // consent
  consent: boolean;
};

const empty: FormState = {
  type: "",
  businessName: "",
  tradingName: "",
  category: "",
  industry: "",
  rc: "",
  tin: "",
  incorporated: "",
  size: "",
  employees: "",
  turnover: "",
  phone: "",
  email: "",
  website: "",
  cacVerified: false,
  ownerName: "",
  directors: "",
  nin: "",
  bvn: "",
  ownerPhone: "",
  ownerEmail: "",
  nationality: "Nigerian",
  residential: "",
  emergency: "",
  state: "FCT",
  lga: "Kwali",
  ward: "",
  district: "",
  street: "",
  building: "",
  lat: "",
  lng: "",
  landmark: "",
  // transport-specific
  plateNumber: "",
  chassisNumber: "",
  engineNumber: "",
  vehicleType: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleColor: "",
  routePark: "",
  // market-specific
  marketName: "",
  stallNumber: "",
  stallType: "",
  goodsCategory: "",
  traderAssociation: "",
  // property-specific
  propertyType: "",
  priorAssessmentRef: "",
  // hospitality-specific
  establishmentType: "",
  contactPerson: "",
  contactPhone: "",
  // pos-specific
  terminalCount: "",
  propertyMatched: false,
  assessmentRef: "",
  propertyValue: "",
  annualRate: "",
  outstanding: "",
  propertyClass: "",
  obligations: [],
  uploaded: [],
  consent: false,
};

const STORAGE_KEY = "ksrp-registration-draft";

function RegisterPage() {
  const { user, isAdmin, roles, loading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/(public)/register" });
  // Staff registering on behalf of a taxpayer keep the dashboard chrome (sidebar
  // stays visible); anonymous self-service users get the standalone public layout.
  const isStaff = isAdmin || roles.includes("chairman") || roles.includes("officer") || roles.includes("marshal");
  
  // Map category from URL to taxpayer type
  const categoryToType: Record<string, string> = {
    business: "sole",
    property: "property-owner",
    market: "trader",
    transport: "tricycle",
    hospitality: "hotel",
    sanitation: "individual",
    pos: "pos",
  };
  
  const initialType = search.category ? categoryToType[search.category] || "" : "";
  
  const [step, setStep] = useState(initialType ? 1 : 0);
  const [form, setForm] = useState<FormState>({ ...empty, type: initialType });
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [submittedQrToken, setSubmittedQrToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [matching, setMatching] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // No auth required - this is a public registration page
  // User can register without being logged in
  // Auth will be created after form submission if needed

  // Load draft
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setForm({ ...empty, ...d.form });
        setStep(d.step ?? 0);
      } catch (_) {
        // Ignore parse errors, use defaults
      }
    }
  }, []);
  // Auto-save
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form, step, savedAt: new Date().toISOString() }),
    );
  }, [form, step]);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  // Get track-specific steps
  const currentSteps = useMemo(() => getStepsForType(form.type), [form.type]);
  
  const completeness = useMemo(() => {
    const required = [
      form.type,
      form.businessName || form.ownerName,
      form.phone || form.ownerPhone,
      form.ward,
      form.street,
      form.obligations.length > 0,
      form.uploaded.length > 0,
    ];
    const done = required.filter(Boolean).length;
    return Math.round((done / required.length) * 100);
  }, [form]);

  // Informal taxpayers (transport, market, POS, individual) — only identity and
  // the vehicle/stall marker are compulsory. Location/GPS is optional for them.
  const informalTypes = ["motorcycle", "tricycle", "commercial-vehicle", "trader", "lockup", "market", "pos", "individual", "sole"];
  const isInformal = informalTypes.includes(form.type);

  const risk = useMemo(() => {
    let score = 100;
    if (!form.cacVerified && ["cac", "llc"].includes(form.type)) score -= 25;
    if (!form.nin) score -= 15;
    if (!form.uploaded.length) score -= 20;
    // GPS is optional for informal taxpayers, so don't penalise them for skipping it.
    if (!isInformal && (!form.lat || !form.lng)) score -= 10;
    if (!form.tin) score -= 10;
    return Math.max(5, score);
  }, [form, isInformal]);

  const verifyCAC = async () => {
    if (!form.rc) return;
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 900));
    update({
      cacVerified: true,
      businessName: form.businessName || "Kwali Heritage Resources Ltd",
      incorporated: form.incorporated || "2019-04-12",
      industry: form.industry || "General Commerce",
      directors: form.directors || "A. Musa, J. Okeke, B. Ibrahim",
    });
    setVerifying(false);
  };

  const matchProperty = async () => {
    setMatching(true);
    await new Promise((r) => setTimeout(r, 900));
    const value = 120_000_000;
    update({
      propertyMatched: true,
      assessmentRef: `KWL-PRP-2026-${Math.floor(1000 + Math.random() * 8999)}`,
      propertyValue: value.toLocaleString(),
      annualRate: (value * 0.02).toLocaleString(),
      outstanding: "800,000",
      propertyClass:
        form.type === "filling" || form.type === "manufacturing"
          ? "Hazard / Industrial"
          : "Commercial",
    });
    setMatching(false);
  };

  const next = () => setStep((s) => Math.min(currentSteps.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Per-step gate: blocks Continue until that step's compulsory fields are filled.
  const stepName = currentSteps[step];
  const stepValid = useMemo(() => {
    if (step === 0) return !!form.type;
    switch (stepName) {
      case "Vehicle Information":
        return !!form.plateNumber.trim() && !!(form.vehicleType || form.type);
      case "Owner Information":
      case "Personal Information":
        return !!form.ownerName.trim() && !!form.nin.trim() && !!(form.ownerPhone || form.phone).trim();
      case "Trader Information":
        return !!form.marketName && !!form.goodsCategory;
      case "Location & Route":
      case "Location & Stall":
      case "Location Information":
        // Informal: whole step optional. Formal/property: ward required.
        return isInformal ? true : !!form.ward;
      default:
        return true;
    }
  }, [stepName, step, form, isInformal]);

  const submit = async () => {
    if (!form.consent) return;
    setSaving(true);
    setSaveError(null);
    const ref = `KWL-TIN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
    const annual = Number((form.annualRate || "0").replace(/[^\d.]/g, "")) || 0;

    let ownerId = user?.id;

    // Every registration creates a real taxpayer account via the service role.
    // A staff member registering someone else must keep their own session — so we
    // never call supabase.auth.signUp() here (that would sign the staff member out
    // and into the new account). Self-service users get the same treatment: the
    // account is created server-side and they sign in afterwards on their own.
    const email = (form.email || form.ownerEmail || "").trim();
    if (!ownerId || isStaff) {
      if (!email) {
        setSaveError("An email address is required to create the taxpayer's account.");
        setSaving(false);
        return;
      }
      try {
        const account = await createTaxpayerAccount({
          data: {
            fullName: form.ownerName || form.businessName || "Taxpayer",
            email,
            phone: form.phone || form.ownerPhone || undefined,
            ward: form.ward || undefined,
            nin: form.nin || undefined,
            accountType: form.type || undefined,
          },
        });
        // Staff registering on behalf: the new account owns the record, not the staff member.
        // Self-service public user: the account is theirs.
        if (!user || isStaff) ownerId = account.userId;
        setEmailSent(account.emailSent !== false);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Failed to create account.");
        setSaving(false);
        return;
      }
    }

    if (!ownerId) {
      setSaveError("Failed to create account. Please try again.");
      setSaving(false);
      return;
    }

    // Route to appropriate table based on taxpayer type
    let serverError: string | null = null;

    const propertyTypes = ["property-owner", "landlord", "developer"];
    const transportTypes = ["motorcycle", "tricycle", "commercial-vehicle"];
    const marketTypes = ["trader", "lockup", "market"];
    const hospitalityTypes = ["hotel", "restaurant", "event"];
    const posTypes = ["pos"];
    const sanitationTypes = ["individual", "sole"]; // individuals can also subscribe to sanitation

    const status = isAdmin ? "Active" : "Pending";
    let capturedQrToken: string | null = null;

    try {
      if (propertyTypes.includes(form.type)) {
        const r = await insertRegistration({
          data: {
            table: "properties",
            data: {
              ownerId,
              ref,
              propertyType: form.propertyType || (form.type === "developer" ? "industrial" : "residential"),
              propertyName: form.businessName || form.ownerName || "Property",
              address: `${form.building} ${form.street}, ${form.district}, ${form.ward}`,
              ward: form.ward,
              district: form.district,
              street: form.street,
              building: form.building,
              landmark: form.landmark,
              lat: form.lat,
              lng: form.lng,
              propertyClass: form.propertyClass,
              assessmentRef: form.priorAssessmentRef || form.assessmentRef,
              assessedValue: Number((form.propertyValue || "0").replace(/[^\d.]/g, "")) || 0,
              annualRate: annual,
              outstanding: Number((form.outstanding || "0").replace(/[^\d.]/g, "")) || 0,
              status,
            },
          },
        });
        capturedQrToken = r.qrToken ?? null;
      } else if (transportTypes.includes(form.type)) {
        const r = await insertRegistration({
          data: {
            table: "transport_vehicles",
            data: {
              ownerId,
              ref,
              vehicleType: form.type as "motorcycle" | "tricycle" | "commercial-vehicle",
              plateNumber: form.plateNumber,
              chassisNumber: form.chassisNumber,
              engineNumber: form.engineNumber,
              make: form.vehicleMake,
              model: form.vehicleModel,
              year: form.vehicleYear ? parseInt(form.vehicleYear) : undefined,
              color: form.vehicleColor,
              operatorName: form.ownerName,
              operatorPhone: form.ownerPhone || form.phone,
              operatorNin: form.nin,
              ward: form.ward,
              route: form.routePark || form.category,
              dailyTicketPrice: 100,
              status,
            },
          },
        });
        capturedQrToken = r.qrToken ?? null;
      } else if (marketTypes.includes(form.type)) {
        const r = await insertRegistration({
          data: {
            table: "market_stalls",
            data: {
              ownerId,
              ref,
              marketName: form.marketName || "Kwali Market",
              stallNumber: form.stallNumber,
              stallType: form.stallType || (form.type === "lockup" ? "lockup" : form.type === "market" ? "open" : "table-top"),
              traderName: form.ownerName,
              traderPhone: form.ownerPhone || form.phone,
              traderNin: form.nin,
              ward: form.ward,
              goodsCategory: form.goodsCategory || form.category,
              dailyToll: 100,
              monthlyRent: form.stallType === "lockup" ? 5000 : 0,
              sanitationLevy: 500,
              status,
            },
          },
        });
        capturedQrToken = r.qrToken ?? null;
      } else if (hospitalityTypes.includes(form.type)) {
        const r = await insertRegistration({
          data: {
            table: "hospitality_permits",
            data: {
              ownerId,
              ref,
              establishmentName: form.businessName,
              establishmentType: form.establishmentType || (form.type === "hotel" ? "hotel" : form.type === "restaurant" ? "restaurant" : "event-centre"),
              address: `${form.building} ${form.street}, ${form.district}, ${form.ward}`,
              ward: form.ward,
              rooms: form.employees ? parseInt(form.employees) : 0,
              capacity: form.turnover ? parseInt(form.turnover) : 0,
              contactPerson: form.contactPerson,
              contactPhone: form.contactPhone,
              annualPermitFee: annual,
              status,
            },
          },
        });
        capturedQrToken = r.qrToken ?? null;
      } else if (posTypes.includes(form.type)) {
        const r = await insertRegistration({
          data: {
            table: "pos_operators",
            data: {
              ownerId,
              ref,
              operatorName: form.ownerName,
              businessName: form.businessName,
              phone: form.phone,
              email: form.email,
              ward: form.ward,
              location: `${form.building} ${form.street}, ${form.district}`,
              terminalCount: form.terminalCount ? parseInt(form.terminalCount) : (form.employees ? parseInt(form.employees) : 1),
              annualPermitFee: annual,
              status,
            },
          },
        });
        capturedQrToken = r.qrToken ?? null;
      } else if (sanitationTypes.includes(form.type) && form.obligations.some(o => o.toLowerCase().includes("sanitation"))) {
        const r = await insertRegistration({
          data: {
            table: "sanitation_subscriptions",
            data: {
              ownerId,
              ref,
              subscriberName: form.ownerName || form.businessName,
              phone: form.phone,
              address: `${form.building} ${form.street}, ${form.district}, ${form.ward}`,
              ward: form.ward,
              serviceType: form.type === "individual" ? "residential" : "commercial",
              pickupFrequency: "weekly",
              monthlyFee: 500,
              status,
            },
          },
        });
        capturedQrToken = r.qrToken ?? null;
      } else {
        // Default to businesses table for business permits
        const r = await insertRegistration({
          data: {
            table: "businesses",
            data: {
              ownerId,
              ref,
              taxpayerType: form.type,
              businessName: form.businessName || form.ownerName || "Unnamed",
              tradingName: form.tradingName,
              category: form.category,
              industry: form.industry,
              rcNumber: form.rc,
              tin: form.tin,
              phone: form.phone,
              email: form.email,
              website: form.website,
              ownerName: form.ownerName,
              nin: form.nin,
              bvn: form.bvn,
              ward: form.ward,
              district: form.district,
              street: form.street,
              building: form.building,
              landmark: form.landmark,
              lat: form.lat,
              lng: form.lng,
              propertyClass: form.propertyClass,
              assessmentRef: form.assessmentRef,
              annualRate: annual,
              obligations: form.obligations,
              documents: form.uploaded,
              status,
            },
          },
        });
        capturedQrToken = r.qrToken ?? null;
      }
    } catch (err) {
      serverError = err instanceof Error ? err.message : "Registration failed. Please try again.";
    }

    setSaving(false);
    if (serverError) {
      setSaveError(serverError);
      return;
    }
    setSubmitted(ref);
    setSubmittedQrToken(capturedQrToken);
    localStorage.removeItem(STORAGE_KEY);
    const registeredEmail = (form.email || form.ownerEmail || "").trim();
    toast.success("Registration submitted", {
      description: registeredEmail
        ? emailSent
          ? `We sent a verification link to ${registeredEmail}. Please verify the email to activate the account.`
          : `Account created for ${registeredEmail}. Use "Forgot password" on the login page to get a verification link.`
        : "Your registration is being reviewed.",
      duration: 8000,
    });
  };

  if (submitted) return <SuccessScreen id={submitted} form={form} isStaff={isStaff} qrToken={submittedQrToken} emailSent={emailSent} />;

  return (
    <RegisterShell isStaff={isStaff}>
    <div className={isStaff ? "" : "min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background"}>
      {/* Top bar — public only; staff get the dashboard header from the shell */}
      {!isStaff && (
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={crest} alt="" className="h-9 w-9" />
            <div className="leading-tight">
              <div className="font-display text-sm font-bold text-ink">Kwali Area Council</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Smart Revenue Platform
              </div>
            </div>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <div className="text-right text-xs">
              <div className="text-muted-foreground">Draft auto-saved</div>
              <div className="font-semibold text-primary">{completeness}% complete</div>
            </div>
            <Link
              to={isAdmin ? "/executive" : "/portal"}
              className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
            Taxpayer Registration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guided onboarding for every revenue category in Kwali Area Council.
          </p>
        </div>

        <Stepper step={step} onJump={(i) => i < step && setStep(i)} steps={currentSteps} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            {/* Dynamic step rendering based on track */}
            {currentSteps[step] === "Taxpayer Type" && <Step1 form={form} update={update} />}
            
            {/* Business/Operator/Establishment/Property Information steps */}
            {currentSteps[step] === "Business Information" && (
              <Step2 form={form} update={update} verifying={verifying} verifyCAC={verifyCAC} />
            )}
            {currentSteps[step] === "Vehicle Information" && (
              <StepVehicle form={form} update={update} />
            )}
            {currentSteps[step] === "Trader Information" && (
              <StepTrader form={form} update={update} />
            )}
            {currentSteps[step] === "Property Information" && (
              <StepProperty form={form} update={update} />
            )}
            {currentSteps[step] === "Establishment Information" && (
              <StepEstablishment form={form} update={update} />
            )}
            {currentSteps[step] === "Operator Information" && (
              <StepPOS form={form} update={update} />
            )}
            {currentSteps[step] === "Personal Information" && (
              <StepPersonal form={form} update={update} />
            )}
            {currentSteps[step] === "Corporate Information" && (
              <StepCorporate form={form} update={update} />
            )}
            {currentSteps[step] === "Contact Information" && (
              <StepContact form={form} update={update} />
            )}
            
            {/* Ownership/Operator/Trader Information steps */}
            {currentSteps[step] === "Owner Information" && (
              <StepOwner form={form} update={update} />
            )}
            {currentSteps[step] === "Ownership Information" && <Step3 form={form} update={update} />}
            
            {/* Location steps */}
            {currentSteps[step] === "Location Information" && <Step4 form={form} update={update} />}
            {currentSteps[step] === "Location & Route" && <StepLocationRoute form={form} update={update} />}
            {currentSteps[step] === "Location & Stall" && <StepLocationStall form={form} update={update} />}
            {currentSteps[step] === "Location & Assessment" && <StepLocationAssessment form={form} update={update} />}
            
            {/* Property Assessment step */}
            {currentSteps[step] === "Property & Tenement" && (
              <Step5
                form={form}
                update={update}
                matching={matching}
                matchProperty={matchProperty}
              />
            )}
            
            {/* Revenue Classification step */}
            {currentSteps[step] === "Revenue Classification" && <Step6 form={form} update={update} />}
            
            {/* Documents step */}
            {currentSteps[step] === "Documents & Verification" && <Step7 form={form} update={update} />}
            {currentSteps[step] === "Documents" && <Step7 form={form} update={update} />}
            
            {/* Review step */}
            {currentSteps[step] === "Review & Submit" && (
              <Step8
                form={form}
                update={update}
                risk={risk}
                completeness={completeness}
                submit={submit}
              />
            )}

            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              <button
                onClick={back}
                disabled={step === 0}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                ← Back
              </button>
              <div className="text-xs text-muted-foreground">
                Step {step + 1} of {currentSteps.length}
              </div>
              {step < currentSteps.length - 1 ? (
                <button
                  onClick={next}
                  disabled={!stepValid}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                >
                  Continue →
                </button>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  {saveError && <div className="text-xs text-rose-600">{saveError}</div>}
                  <button
                    onClick={submit}
                    disabled={!form.consent || saving}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    {saving ? "Submitting…" : "Submit Registration"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <SidePanel form={form} step={step} completeness={completeness} risk={risk} steps={currentSteps} />
        </div>
      </main>
    </div>
    </RegisterShell>
  );
}

// ---------- Shell wrapper ----------
// Staff (admin/officer/marshal/chairman) registering on behalf of a taxpayer keep
// the dashboard chrome so the sidebar never disappears; the public get the
// standalone layout. requireAdmin={false} so any signed-in staff role renders.
function RegisterShell({ isStaff, children }: { isStaff: boolean; children: ReactNode }) {
  if (!isStaff) return <>{children}</>;
  return (
    <DashboardShell title="Register Taxpayer" subtitle="Guided onboarding" requireAdmin={false}>
      <div className="bg-gradient-to-b from-secondary/30 via-background to-background -m-6 min-h-full p-6">
        {children}
      </div>
    </DashboardShell>
  );
}

// ---------- Stepper ----------
function Stepper({ step, onJump, steps }: { step: number; onJump: (i: number) => void; steps: string[] }) {
  const pct = Math.round(((step + 1) / steps.length) * 100);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="font-semibold text-primary">
          Step {step + 1} of {steps.length} · {steps[step]}
        </div>
        <div className="font-semibold text-ink">
          {pct}% complete{" "}
          <span className="font-normal text-muted-foreground">· {100 - pct}% to go</span>
        </div>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {steps.map((s, i) => {
          const done = i < step,
            active = i === step;
          return (
            <li key={s}>
              <button
                onClick={() => onJump(i)}
                disabled={i > step}
                className={
                  "w-full rounded-lg border px-2 py-2 text-left text-[11px] transition " +
                  (active
                    ? "border-primary bg-primary/5 text-primary"
                    : done
                      ? "border-border bg-surface text-foreground hover:bg-secondary"
                      : "border-border bg-card text-muted-foreground")
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " +
                      (done
                        ? "bg-primary text-primary-foreground"
                        : active
                          ? "border-2 border-primary text-primary"
                          : "bg-secondary")
                    }
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="font-semibold leading-tight">{s}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------- Side Panel ----------
function SidePanel({
  form,
  step,
  completeness,
  risk,
  steps,
}: {
  form: FormState;
  step: number;
  completeness: number;
  risk: number;
  steps: string[];
}) {
  const selectedType = taxpayerTypes.find((t) => t.id === form.type);
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Onboarding Summary
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
            {selectedType?.icon ?? "🪪"}
          </div>
          <div>
            <div className="text-sm font-bold">{selectedType?.title ?? "Select a category"}</div>
            <div className="text-xs text-muted-foreground">
              {form.businessName || form.ownerName || "Untitled draft"}
            </div>
          </div>
        </div>
        <dl className="mt-4 space-y-2 text-xs">
          <Row k="Ward" v={form.ward || "—"} />
          <Row k="RC Number" v={form.rc || "—"} />
          <Row k="TIN" v={form.tin || "—"} />
          <Row k="Obligations" v={String(form.obligations.length)} />
          <Row k="Documents" v={String(form.uploaded.length)} />
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Completeness
        </div>
        <div className="mt-2 text-2xl font-bold">{completeness}%</div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-emerald-500" style={{ width: `${completeness}%` }} />
        </div>
        <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Compliance Readiness
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div
            className={
              "text-2xl font-bold " +
              (risk >= 75 ? "text-emerald-600" : risk >= 50 ? "text-amber-600" : "text-rose-600")
            }
          >
            {risk}
          </div>
          <div className="text-xs text-muted-foreground">/ 100 score</div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-xs">
        <div className="font-bold text-primary">Need help?</div>
        <p className="mt-1 text-muted-foreground">
          {(() => {
            const currentStepName = steps[step];
            if (!currentStepName) return "Complete each step to finish your registration.";
            
            const helpTexts: Record<string, string> = {
              "Taxpayer Type": "Pick the category that best matches your activity. We'll tailor the rest of the form.",
              "Business Information": "Enter your RC number for instant CAC verification, or fill manually.",
              "Vehicle Information": "Enter your vehicle details including plate number, chassis, and engine numbers.",
              "Trader Information": "Provide your market, stall number, and goods category.",
              "Property Information": "Enter your property type, address, and any prior assessment reference.",
              "Establishment Information": "Provide your establishment name, type, and capacity details.",
              "Operator Information": "Enter your operator details, terminal count, and location.",
              "Personal Information": "Provide your personal details and contact information.",
              "Corporate Information": "Enter your company directors, RC number, and corporate details.",
              "Contact Information": "Provide contact person details for the establishment.",
              "Owner Information": "Provide accurate principal officer details — NIN/BVN improve trust score.",
              "Ownership Information": "Provide accurate principal officer details — NIN/BVN improve trust score.",
              "Location Information": "Drop a pin on the map; we use coordinates to attach the right ward & district.",
              "Location & Route": "Enter your operating route/park and drop a pin for your base location.",
              "Location & Stall": "Enter your market, stall number, and drop a pin for your location.",
              "Location & Assessment": "Enter your property location and any prior assessment details.",
              "Property & Tenement": "We try to match existing tenement assessments so you don't pay twice.",
              "Revenue Classification": "We automatically suggest the levies and permits applicable to your category.",
              "Documents & Verification": "Drag & drop your documents. We accept PDF, JPG and PNG up to 10MB each.",
              "Documents": "Drag & drop your documents. We accept PDF, JPG and PNG up to 10MB each.",
              "Review & Submit": "Review every section. Submission generates a Taxpayer ID and revenue account.",
            };
            return helpTexts[currentStepName] || "Complete this step to continue.";
          })()}
        </p>
        <a href="/contact" className="mt-3 inline-block font-semibold text-primary">
          Call a revenue officer →
        </a>
      </div>
    </aside>
  );
}
const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="flex justify-between gap-3">
    <dt className="text-muted-foreground">{k}</dt>
    <dd className="font-semibold">{v}</dd>
  </div>
);

// ---------- Inputs ----------
function Field({
  label,
  hint,
  children,
  span = 1,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  span?: 1 | 2;
}) {
  return (
    <label className={"block " + (span === 2 ? "md:col-span-2" : "")}>
      <div className="mb-1 text-xs font-semibold text-foreground">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </label>
  );
}
const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

// ---------- STEP 1 ----------
function Step1({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const [q, setQ] = useState("");
  const filtered = taxpayerTypes.filter(
    (t) =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.tag.toLowerCase().includes(q.toLowerCase()),
  );
  const selectedType = taxpayerTypes.find((t) => t.id === form.type);
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Who are you registering today?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a category — we'll tailor the rest of the wizard.
      </p>
      {form.type && (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span>✓ Pre-selected:</span>
            <span className="font-bold">{selectedType?.title}</span>
            <span className="text-muted-foreground">({selectedType?.tag})</span>
          </div>
        </div>
      )}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search categories (e.g. hotel, POS, market)…"
        className={"mt-4 " + inputCls}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const active = form.type === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ type: t.id })}
              className={
                "rounded-xl border p-4 text-left transition " +
                (active
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-sm")
              }
            >
              <div className="flex items-start justify-between">
                <div className="text-2xl">{t.icon}</div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  {t.tag}
                </span>
              </div>
              <div className="mt-3 text-sm font-bold">{t.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t.desc}</div>
              {active && (
                <div className="mt-3 text-[11px] font-semibold text-primary">✓ Selected</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- STEP 2 ----------
function Step2({
  form,
  update,
  verifying,
  verifyCAC,
}: {
  form: FormState;
  update: (p: Partial<FormState>) => void;
  verifying: boolean;
  verifyCAC: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Business Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your RC number for instant CAC verification, or fill manually.
      </p>

      <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="RC Number (CAC)" hint="We'll auto-fill verified company details">
            <input
              value={form.rc}
              onChange={(e) => update({ rc: e.target.value, cacVerified: false })}
              placeholder="e.g. RC 1234567"
              className={inputCls + " w-56"}
            />
          </Field>
          <button
            onClick={verifyCAC}
            disabled={verifying || !form.rc}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {verifying ? "Verifying…" : form.cacVerified ? "Re-verify" : "Verify with CAC"}
          </button>
          {form.cacVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              ✓ Verified • CAC Match Successful
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Business Name">
          <input
            value={form.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Trading Name (optional)">
          <input
            value={form.tradingName}
            onChange={(e) => update({ tradingName: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Business Category">
          <select
            value={form.category}
            onChange={(e) => update({ category: e.target.value })}
            className={inputCls}
          >
            <option value="">Select…</option>
            {businessCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Industry Type">
          <input
            value={form.industry}
            onChange={(e) => update({ industry: e.target.value })}
            className={inputCls}
            placeholder="e.g. Hospitality"
          />
        </Field>
        <Field label="TIN (FIRS)">
          <input
            value={form.tin}
            onChange={(e) => update({ tin: e.target.value })}
            className={inputCls}
            placeholder="e.g. 12345678-0001"
          />
        </Field>
        <Field label="Date of Incorporation">
          <input
            type="date"
            value={form.incorporated}
            onChange={(e) => update({ incorporated: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Business Size">
          <select
            value={form.size}
            onChange={(e) => update({ size: e.target.value })}
            className={inputCls}
          >
            <option value="">Select…</option>
            <option>Micro</option>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </Field>
        <Field label="Number of Employees">
          <input
            type="number"
            value={form.employees}
            onChange={(e) => update({ employees: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Annual Turnover Range">
          <select
            value={form.turnover}
            onChange={(e) => update({ turnover: e.target.value })}
            className={inputCls}
          >
            <option value="">Select…</option>
            <option>Below ₦5M</option>
            <option>₦5M – ₦25M</option>
            <option>₦25M – ₦100M</option>
            <option>₦100M – ₦500M</option>
            <option>Above ₦500M</option>
          </select>
        </Field>
        <Field label="Phone Number">
          <input
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className={inputCls}
            placeholder="0803-000-0000"
          />
        </Field>
        <Field label="Email Address">
          <input
            type="email"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Website (optional)">
          <input
            value={form.website}
            onChange={(e) => update({ website: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}

// ---------- STEP 3 ----------
function Step3({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Ownership Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Principal officer / proprietor identity & contact.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Owner / Principal Officer Name">
          <input
            value={form.ownerName}
            onChange={(e) => update({ ownerName: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Directors / Shareholders">
          <input
            value={form.directors}
            onChange={(e) => update({ directors: e.target.value })}
            className={inputCls}
            placeholder="Comma separated"
          />
        </Field>
        <Field label="NIN" hint="11-digit National Identification Number">
          <input
            value={form.nin}
            onChange={(e) => update({ nin: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="BVN">
          <input
            value={form.bvn}
            onChange={(e) => update({ bvn: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Owner Phone">
          <input
            value={form.ownerPhone}
            onChange={(e) => update({ ownerPhone: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Owner Email">
          <input
            type="email"
            value={form.ownerEmail}
            onChange={(e) => update({ ownerEmail: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Nationality">
          <input
            value={form.nationality}
            onChange={(e) => update({ nationality: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Residential Address" span={2}>
          <input
            value={form.residential}
            onChange={(e) => update({ residential: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Emergency Contact" span={2}>
          <input
            value={form.emergency}
            onChange={(e) => update({ emergency: e.target.value })}
            className={inputCls}
            placeholder="Name & phone"
          />
        </Field>
      </div>
    </div>
  );
}

// ---------- STEP 4 ----------
function Step4({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const latNum = parseFloat(form.lat);
  const lngNum = parseFloat(form.lng);
  const value =
    Number.isFinite(latNum) && Number.isFinite(lngNum) ? { lat: latNum, lng: lngNum } : null;

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Location Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Search, use your location, or tap the map to drop the pin on your exact premises — confirm
        the place name is right.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State">
            <input
              value={form.state}
              onChange={(e) => update({ state: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="LGA / Area Council">
            <input
              value={form.lga}
              onChange={(e) => update({ lga: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Ward">
            <select
              value={form.ward}
              onChange={(e) => update({ ward: e.target.value })}
              className={inputCls}
            >
              <option value="">Select ward…</option>
              {wards.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </Field>
          <Field label="District / Community">
            <input
              value={form.district}
              onChange={(e) => update({ district: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Street" span={2}>
            <input
              value={form.street}
              onChange={(e) => update({ street: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Building Number">
            <input
              value={form.building}
              onChange={(e) => update({ building: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Landmark">
            <input
              value={form.landmark}
              onChange={(e) => update({ landmark: e.target.value })}
              className={inputCls}
              placeholder="Near…"
            />
          </Field>
          <Field label="Latitude">
            <input
              value={form.lat}
              onChange={(e) => update({ lat: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Longitude">
            <input
              value={form.lng}
              onChange={(e) => update({ lng: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <LocationPicker
            value={value}
            height={300}
            onChange={(v, meta) => {
              update({
                lat: v.lat.toFixed(6),
                lng: v.lng.toFixed(6),
                ...(meta?.ward && wards.includes(meta.ward) ? { ward: meta.ward } : {}),
                ...(meta?.placeName && !form.landmark ? { landmark: meta.placeName } : {}),
              });
            }}
          />
          <div className="mt-2 text-[11px] text-muted-foreground">
            GIS coordinates attach the correct ward &amp; assessment zone automatically.
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- STEP 5 ----------
function Step5({
  form,
  update,
  matching,
  matchProperty,
}: {
  form: FormState;
  update: (p: Partial<FormState>) => void;
  matching: boolean;
  matchProperty: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Property & Tenement Assessment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We match existing assessments using RC number, address, GPS and property identifiers to
        prevent duplicate billing.
      </p>

      <button
        onClick={matchProperty}
        disabled={matching}
        className="mt-4 rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50"
      >
        {matching ? "Searching property records…" : "🔎 Run smart property match"}
      </button>

      {form.propertyMatched && (
        <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-emerald-800">✓ Existing Assessment Found</div>
            <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Confidence 94%
            </span>
          </div>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <Row k="Assessment Ref" v={form.assessmentRef} />
            <Row k="Property Class" v={form.propertyClass} />
            <Row k="Assessed Value" v={`₦${form.propertyValue}`} />
            <Row k="Annual Tenement Rate" v={`₦${form.annualRate}`} />
            <Row k="Outstanding" v={`₦${form.outstanding}`} />
            <Row
              k="Status"
              v={<span className="text-amber-700">Active — payment outstanding</span>}
            />
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Assessment Reference (manual)">
          <input
            value={form.assessmentRef}
            onChange={(e) => update({ assessmentRef: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Property Classification">
          <select
            value={form.propertyClass}
            onChange={(e) => update({ propertyClass: e.target.value })}
            className={inputCls}
          >
            <option value="">Select…</option>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Mixed-use</option>
            <option>Hazard / Industrial</option>
            <option>Institutional</option>
          </select>
        </Field>
        <Field label="Assessed Property Value (₦)">
          <input
            value={form.propertyValue}
            onChange={(e) => update({ propertyValue: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Annual Tenement Rate (₦)">
          <input
            value={form.annualRate}
            onChange={(e) => update({ annualRate: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}

// ---------- STEP 6 ----------
function Step6({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const suggested = obligationsMap[form.type] ?? ["Business Premises Levy"];
  const toggle = (o: string) => {
    update({
      obligations: form.obligations.includes(o)
        ? form.obligations.filter((x) => x !== o)
        : [...form.obligations, o],
    });
  };
  useEffect(() => {
    if (form.obligations.length === 0) update({ obligations: suggested });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type]);

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Revenue Classification</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on your category, the system suggests the following obligations. Toggle as needed.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {suggested.map((o) => {
          const on = form.obligations.includes(o);
          return (
            <label
              key={o}
              className={
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 " +
                (on ? "border-primary bg-primary/5" : "border-border bg-card")
              }
            >
              <input type="checkbox" checked={on} onChange={() => toggle(o)} className="mt-1" />
              <div>
                <div className="text-sm font-bold">{o}</div>
                <div className="text-[11px] text-muted-foreground">
                  Calculated annually based on classification & ward.
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ---------- STEP 7 ----------
function Step7({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const isProperty = ["property-owner", "landlord", "developer", "complex"].includes(form.type);
  const isHazard = ["filling", "manufacturing", "warehouse"].includes(form.type);
  const docs = [
    ...(isHazard
      ? documentsMap.hazard
      : ["cac", "llc", "sole"].includes(form.type)
        ? documentsMap.business
        : documentsMap.default),
    ...(isProperty ? documentsMap.property : []),
  ];
  const add = (name: string) => update({ uploaded: Array.from(new Set([...form.uploaded, name])) });
  const remove = (name: string) => update({ uploaded: form.uploaded.filter((u) => u !== name) });

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Documents & Verification</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Drag & drop or click to upload. PDF, JPG, PNG up to 10MB.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {docs.map((d) => {
          const uploaded = form.uploaded.includes(d);
          return (
            <div
              key={d}
              className={
                "rounded-xl border-2 border-dashed p-4 " +
                (uploaded ? "border-emerald-400 bg-emerald-50" : "border-border bg-card")
              }
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold">{d}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {uploaded ? "Uploaded — preview available" : "Required for compliance"}
                  </div>
                </div>
                <div className="text-2xl">{uploaded ? "📄" : "⬆️"}</div>
              </div>
              {uploaded ? (
                <button
                  onClick={() => remove(d)}
                  className="mt-3 text-xs font-semibold text-rose-600"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => add(d)}
                  className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Choose file
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- STEP 8 ----------
function Step8({
  form,
  update,
  risk,
  completeness,
  submit,
}: {
  form: FormState;
  update: (p: Partial<FormState>) => void;
  risk: number;
  completeness: number;
  submit: () => void;
}) {
  const selectedType = taxpayerTypes.find((t) => t.id === form.type);
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Review & Submit</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Confirm everything looks right. You can edit any section.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Completeness" value={`${completeness}%`} tone="primary" />
        <Stat
          label="Compliance Readiness"
          value={`${risk}/100`}
          tone={risk >= 75 ? "good" : risk >= 50 ? "warn" : "bad"}
        />
        <Stat label="Obligations" value={String(form.obligations.length)} tone="primary" />
      </div>

      <div className="mt-6 space-y-3">
        <ReviewBlock title="Taxpayer Category" body={selectedType?.title ?? "—"} />
        <ReviewBlock
          title="Business"
          body={`${form.businessName || "—"} • ${form.category || "—"} • RC ${form.rc || "—"} • TIN ${form.tin || "—"}`}
        />
        <ReviewBlock
          title="Ownership"
          body={`${form.ownerName || "—"} • NIN ${form.nin || "—"} • ${form.ownerPhone || "—"}`}
        />
        <ReviewBlock
          title="Location"
          body={`${form.building || ""} ${form.street || "—"}, ${form.ward || "—"} ward • ${form.lat || "?"}, ${form.lng || "?"}`}
        />
        <ReviewBlock
          title="Property & Tenement"
          body={
            form.propertyMatched
              ? `${form.assessmentRef} • ₦${form.annualRate}/yr (${form.propertyClass})`
              : "No prior assessment matched"
          }
        />
        <ReviewBlock title="Revenue Obligations" body={form.obligations.join(" • ") || "—"} />
        <ReviewBlock
          title="Documents"
          body={form.uploaded.length ? form.uploaded.join(" • ") : "None uploaded"}
        />
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update({ consent: e.target.checked })}
          className="mt-1"
        />
        <span>
          I declare that the information provided is true and accurate. I authorise Kwali Area
          Council to verify these details with CAC, FIRS, NIMC and relevant agencies, and to assess
          applicable revenue obligations.
        </span>
      </label>
</div>
  );
}

// ---------- Track-Specific Step Components ----------

// Vehicle Information (for transport: motorcycle, tricycle, commercial-vehicle)
function StepVehicle({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Vehicle Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your vehicle details. Plate number is required — RC is not used for vehicles.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Plate Number / Local ID" hint="Required for all transport operators">
          <input
            value={form.plateNumber}
            onChange={(e) => update({ plateNumber: e.target.value })}
            className={inputCls}
            placeholder="e.g. KWL-123-AB"
            required
          />
        </Field>
        <Field label="Vehicle Type">
          <select
            value={form.vehicleType || form.type}
            onChange={(e) => update({ vehicleType: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Select…</option>
            <option value="motorcycle">Motorcycle (Okada)</option>
            <option value="tricycle">Tricycle (Keke)</option>
            <option value="commercial-vehicle">Commercial Vehicle (Bus/Taxi)</option>
          </select>
        </Field>
        <Field label="Chassis Number">
          <input
            value={form.chassisNumber}
            onChange={(e) => update({ chassisNumber: e.target.value })}
            className={inputCls}
            placeholder="Optional"
          />
        </Field>
        <Field label="Engine Number">
          <input
            value={form.engineNumber}
            onChange={(e) => update({ engineNumber: e.target.value })}
            className={inputCls}
            placeholder="Optional"
          />
        </Field>
        <Field label="Make">
          <input
            value={form.vehicleMake}
            onChange={(e) => update({ vehicleMake: e.target.value })}
            className={inputCls}
            placeholder="e.g. Bajaj, TVS, Honda"
          />
        </Field>
        <Field label="Model">
          <input
            value={form.vehicleModel}
            onChange={(e) => update({ vehicleModel: e.target.value })}
            className={inputCls}
            placeholder="e.g. Boxer, King, Accord"
          />
        </Field>
        <Field label="Year">
          <input
            type="number"
            value={form.vehicleYear}
            onChange={(e) => update({ vehicleYear: e.target.value })}
            className={inputCls}
            placeholder="e.g. 2023"
          />
        </Field>
        <Field label="Color">
          <input
            value={form.vehicleColor}
            onChange={(e) => update({ vehicleColor: e.target.value })}
            className={inputCls}
            placeholder="e.g. Yellow, Black"
          />
        </Field>
      </div>
    </div>
  );
}

// Trader Information (for market: trader, lockup, market)
function StepTrader({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Trader Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your market, stall, and goods details.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Market Name" hint="Which market do you trade in?">
          <select
            value={form.marketName}
            onChange={(e) => update({ marketName: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Select market…</option>
            <option value="Kwali Main Market">Kwali Main Market</option>
            <option value="Yangoji Market">Yangoji Market</option>
            <option value="Kilankwa Market">Kilankwa Market</option>
            <option value="Gawu Market">Gawu Market</option>
            <option value="Wako Market">Wako Market</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Stall Number / Spot" hint="Your assigned stall or spot number">
          <input
            value={form.stallNumber}
            onChange={(e) => update({ stallNumber: e.target.value })}
            className={inputCls}
            placeholder="e.g. A-12, B-5, Spot 23"
            required
          />
        </Field>
        <Field label="Stall Type">
          <select
            value={form.stallType}
            onChange={(e) => update({ stallType: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Select…</option>
            <option value="lockup">Lockup Shop</option>
            <option value="open">Open Stall</option>
            <option value="table-top">Table-top / Hawker</option>
          </select>
        </Field>
        <Field label="Goods Category">
          <select
            value={form.goodsCategory}
            onChange={(e) => update({ goodsCategory: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Select…</option>
            <option value="food">Food & Produce</option>
            <option value="clothing">Clothing & Textiles</option>
            <option value="electronics">Electronics & Phones</option>
            <option value="household">Household Items</option>
            <option value="building">Building Materials</option>
            <option value="autoparts">Auto Parts</option>
            <option value="cosmetics">Cosmetics & Beauty</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Trader Association (optional)">
          <input
            value={form.traderAssociation}
            onChange={(e) => update({ traderAssociation: e.target.value })}
            className={inputCls}
            placeholder="e.g. Kwali Market Traders Union"
          />
        </Field>
      </div>
    </div>
  );
}

// Property Information (for property: property-owner, landlord, developer)
function StepProperty({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Property Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your property details. Prior assessment reference helps avoid duplicate billing.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Property Type">
          <select
            value={form.propertyType}
            onChange={(e) => update({ propertyType: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Select…</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="mixed-use">Mixed-use</option>
            <option value="industrial">Industrial</option>
            <option value="land">Vacant Land</option>
          </select>
        </Field>
        <Field label="Prior Assessment Reference (optional)">
          <input
            value={form.priorAssessmentRef}
            onChange={(e) => update({ priorAssessmentRef: e.target.value })}
            className={inputCls}
            placeholder="e.g. KWL-PRP-2024-00123"
          />
        </Field>
        <Field label="Property Name / Description" span={2}>
          <input
            value={form.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            className={inputCls}
            placeholder="e.g. 3-Bedroom Duplex, Commercial Plaza"
            required
          />
        </Field>
      </div>
    </div>
  );
}

// Establishment Information (for hospitality: hotel, restaurant, event)
function StepEstablishment({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Establishment Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your establishment details.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Establishment Name">
          <input
            value={form.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            className={inputCls}
            required
            placeholder="e.g. Kwali Grand Hotel"
          />
        </Field>
        <Field label="Establishment Type">
          <select
            value={form.establishmentType || form.type}
            onChange={(e) => update({ establishmentType: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Select…</option>
            <option value="hotel">Hotel</option>
            <option value="lodge">Lodge / Guest House</option>
            <option value="event-centre">Event Centre</option>
            <option value="restaurant">Restaurant / Eatery</option>
            <option value="bar">Bar / Lounge</option>
          </select>
        </Field>
        <Field label="Number of Rooms">
          <input
            type="number"
            value={form.employees}
            onChange={(e) => update({ employees: e.target.value })}
            className={inputCls}
            placeholder="0"
          />
        </Field>
        <Field label="Capacity (Guests/Seats)">
          <input
            type="number"
            value={form.turnover}
            onChange={(e) => update({ turnover: e.target.value })}
            className={inputCls}
            placeholder="e.g. 200"
          />
        </Field>
      </div>
    </div>
  );
}

// Contact Information (for hospitality)
function StepContact({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Contact Person</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Primary contact for the establishment.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Contact Person Name">
          <input
            value={form.contactPerson}
            onChange={(e) => update({ contactPerson: e.target.value })}
            className={inputCls}
            required
          />
        </Field>
        <Field label="Contact Phone">
          <input
            value={form.contactPhone}
            onChange={(e) => update({ contactPhone: e.target.value })}
            className={inputCls}
            required
            placeholder="0803-000-0000"
          />
        </Field>
      </div>
    </div>
  );
}

// Operator Information (for POS agents)
function StepPOS({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Operator Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your POS operator details.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Operator Name">
          <input
            value={form.ownerName}
            onChange={(e) => update({ ownerName: e.target.value })}
            className={inputCls}
            required
          />
        </Field>
        <Field label="Business Name (optional)">
          <input
            value={form.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            className={inputCls}
            placeholder="e.g. Ahmed POS Center"
          />
        </Field>
        <Field label="Terminal Count">
          <input
            type="number"
            value={form.terminalCount || form.employees}
            onChange={(e) => update({ terminalCount: e.target.value, employees: e.target.value })}
            className={inputCls}
            defaultValue="1"
            min="1"
          />
        </Field>
        <Field label="Super Agent (optional)">
          <select
            value={form.category}
            onChange={(e) => update({ category: e.target.value })}
            className={inputCls}
          >
            <option value="">Select…</option>
            <option value="opay">OPay</option>
            <option value="palmpay">PalmPay</option>
            <option value="moniepoint">Moniepoint</option>
            <option value="kuda">Kuda</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

// Personal Information (for individual taxpayers)
function StepPersonal({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Personal Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your personal details.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="First Name">
          <input
            value={form.ownerName}
            onChange={(e) => update({ ownerName: e.target.value })}
            className={inputCls}
            required
          />
        </Field>
        <Field label="Last Name">
          <input
            value={form.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            className={inputCls}
            required
          />
        </Field>
        <Field label="Phone Number">
          <input
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className={inputCls}
            required
            placeholder="0803-000-0000"
          />
        </Field>
        <Field label="NIN" hint="11-digit National Identification Number">
          <input
            value={form.nin}
            onChange={(e) => update({ nin: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}

// Corporate Information (for CAC registered companies)
function StepCorporate({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const [verifying, setVerifying] = useState(false);
  
  const verifyCAC = async () => {
    if (!form.rc) return;
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 900));
    update({
      cacVerified: true,
      businessName: form.businessName || "Kwali Heritage Resources Ltd",
      incorporated: form.incorporated || "2019-04-12",
      industry: form.industry || "General Commerce",
      directors: form.directors || "A. Musa, J. Okeke, B. Ibrahim",
    });
    setVerifying(false);
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Corporate Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your company's corporate details. RC verification is required.
      </p>
      <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="RC Number (CAC)" hint="We'll auto-fill verified company details">
            <input
              value={form.rc}
              onChange={(e) => update({ rc: e.target.value, cacVerified: false })}
              placeholder="e.g. RC 1234567"
              className={inputCls + " w-56"}
            />
          </Field>
          <button
            onClick={verifyCAC}
            disabled={verifying || !form.rc}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {verifying ? "Verifying…" : form.cacVerified ? "Re-verify" : "Verify with CAC"}
          </button>
          {form.cacVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              ✓ Verified • CAC Match Successful
            </span>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Directors / Principal Officers">
          <input
            value={form.directors}
            onChange={(e) => update({ directors: e.target.value })}
            className={inputCls}
            placeholder="Comma separated"
            required
          />
        </Field>
        <Field label="TIN (FIRS)">
          <input
            value={form.tin}
            onChange={(e) => update({ tin: e.target.value })}
            className={inputCls}
            placeholder="e.g. 12345678-0001"
            required
          />
        </Field>
        <Field label="Signatory BVN (optional)">
          <input
            value={form.bvn}
            onChange={(e) => update({ bvn: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}

// Owner Information (for transport, market, property)
function StepOwner({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Owner Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Principal officer / proprietor identity & contact.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Owner Name">
          <input
            value={form.ownerName}
            onChange={(e) => update({ ownerName: e.target.value })}
            className={inputCls}
            required
          />
        </Field>
        <Field label="NIN" hint="11-digit National Identification Number">
          <input
            value={form.nin}
            onChange={(e) => update({ nin: e.target.value })}
            className={inputCls}
            required
          />
        </Field>
        <Field label="Phone">
          <input
            value={form.ownerPhone || form.phone}
            onChange={(e) => update({ ownerPhone: e.target.value, phone: e.target.value })}
            className={inputCls}
            required
            placeholder="0803-000-0000"
          />
        </Field>
        <Field label="Emergency Contact" span={2}>
          <input
            value={form.emergency}
            onChange={(e) => update({ emergency: e.target.value })}
            className={inputCls}
            placeholder="Name & phone"
          />
        </Field>
      </div>
    </div>
  );
}

// Location & Route (for transport)
function StepLocationRoute({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const latNum = parseFloat(form.lat);
  const lngNum = parseFloat(form.lng);
  const value = Number.isFinite(latNum) && Number.isFinite(lngNum) ? { lat: latNum, lng: lngNum } : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Location & Route</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
          Optional for transport operators
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your operating route or a base pin if you have one. You can skip this — your plate number
        and NIN are enough to register and start buying daily tickets.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Route / Park" hint="e.g. Kwali-Abuja Route, Kwali Motor Park">
            <input
              value={form.routePark}
              onChange={(e) => update({ routePark: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Ward">
            <select
              value={form.ward}
              onChange={(e) => update({ ward: e.target.value })}
              className={inputCls}
            >
              <option value="">Select ward…</option>
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="District / Community">
            <input
              value={form.district}
              onChange={(e) => update({ district: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Street">
            <input
              value={form.street}
              onChange={(e) => update({ street: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Building / Landmark" span={2}>
            <input
              value={form.building}
              onChange={(e) => update({ building: e.target.value })}
              className={inputCls}
              placeholder="Near…"
            />
          </Field>
          <Field label="Latitude">
            <input value={form.lat} onChange={(e) => update({ lat: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Longitude">
            <input value={form.lng} onChange={(e) => update({ lng: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <LocationPicker
            value={value}
            height={300}
            onChange={(v, meta) => {
              update({
                lat: v.lat.toFixed(6),
                lng: v.lng.toFixed(6),
                ...(meta?.ward && wards.includes(meta.ward) ? { ward: meta.ward } : {}),
                ...(meta?.placeName && !form.building ? { building: meta.placeName } : {}),
              });
            }}
          />
          <div className="mt-2 text-[11px] text-muted-foreground">
            GIS coordinates attach the correct ward & assessment zone automatically.
          </div>
        </div>
      </div>
    </div>
  );
}

// Location & Stall (for market)
function StepLocationStall({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const latNum = parseFloat(form.lat);
  const lngNum = parseFloat(form.lng);
  const value = Number.isFinite(latNum) && Number.isFinite(lngNum) ? { lat: latNum, lng: lngNum } : null;

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Location & Stall</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your market and goods are enough to register. Stall number, ward and the map pin are
        optional — add them if you have them.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Market" hint="Which market?">
            <input
              value={form.marketName}
              onChange={(e) => update({ marketName: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Stall Number" hint="Optional — your spot if you have one">
            <input
              value={form.stallNumber}
              onChange={(e) => update({ stallNumber: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Ward" hint="Optional">
            <select
              value={form.ward}
              onChange={(e) => update({ ward: e.target.value })}
              className={inputCls}
            >
              <option value="">Select ward…</option>
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="District / Community">
            <input
              value={form.district}
              onChange={(e) => update({ district: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Street" span={2}>
            <input
              value={form.street}
              onChange={(e) => update({ street: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Building / Landmark" span={2}>
            <input
              value={form.building}
              onChange={(e) => update({ building: e.target.value })}
              className={inputCls}
              placeholder="Near…"
            />
          </Field>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <LocationPicker
            value={value}
            height={300}
            onChange={(v, meta) => {
              update({
                lat: v.lat.toFixed(6),
                lng: v.lng.toFixed(6),
                ...(meta?.ward && wards.includes(meta.ward) ? { ward: meta.ward } : {}),
                ...(meta?.placeName && !form.building ? { building: meta.placeName } : {}),
              });
            }}
          />
          <div className="mt-2 text-[11px] text-muted-foreground">
            GIS coordinates attach the correct ward automatically.
          </div>
        </div>
      </div>
    </div>
  );
}

// Location & Assessment (for property)
function StepLocationAssessment({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const latNum = parseFloat(form.lat);
  const lngNum = parseFloat(form.lng);
  const value = Number.isFinite(latNum) && Number.isFinite(lngNum) ? { lat: latNum, lng: lngNum } : null;

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Location & Assessment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your property location and any prior assessment details.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ward">
            <select
              value={form.ward}
              onChange={(e) => update({ ward: e.target.value })}
              className={inputCls}
              required
            >
              <option value="">Select ward…</option>
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="District / Community">
            <input
              value={form.district}
              onChange={(e) => update({ district: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Street" span={2}>
            <input
              value={form.street}
              onChange={(e) => update({ street: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Building / Plot Number" span={2}>
            <input
              value={form.building}
              onChange={(e) => update({ building: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Landmark" span={2}>
            <input
              value={form.landmark}
              onChange={(e) => update({ landmark: e.target.value })}
              className={inputCls}
              placeholder="Near…"
            />
          </Field>
          <Field label="Prior Assessment Reference (optional)">
            <input
              value={form.priorAssessmentRef}
              onChange={(e) => update({ priorAssessmentRef: e.target.value })}
              className={inputCls}
              placeholder="e.g. KWL-PRP-2024-00123"
            />
          </Field>
          <Field label="Latitude">
            <input value={form.lat} onChange={(e) => update({ lat: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Longitude">
            <input value={form.lng} onChange={(e) => update({ lng: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <LocationPicker
            value={value}
            height={300}
            onChange={(v, meta) => {
              update({
                lat: v.lat.toFixed(6),
                lng: v.lng.toFixed(6),
                ...(meta?.ward && wards.includes(meta.ward) ? { ward: meta.ward } : {}),
                ...(meta?.placeName && !form.building ? { building: meta.placeName } : {}),
              });
            }}
          />
          <div className="mt-2 text-[11px] text-muted-foreground">
            GIS coordinates attach the correct ward & assessment zone automatically.
          </div>
        </div>
      </div>
    </div>
  );
}

const Stat = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "good" | "warn" | "bad";
}) => {
  const colors = {
    primary: "text-primary",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-rose-600",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={"mt-2 text-2xl font-bold " + colors[tone]}>{value}</div>
    </div>
  );
};
const ReviewBlock = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {title}
    </div>
    <div className="mt-1 text-sm">{body}</div>
  </div>
);

// ---------- Success ----------
// Maps the wizard type to the table it inserted into and the ID card details.
const ID_CARD_TABLES: Record<string, { table: string; kind: string; lines: (f: FormState) => { label: string; value: string }[] }> = {
  trader: { table: "market_stalls", kind: "Market Trader", lines: (f) => [{ label: "Market", value: f.marketName || "—" }, { label: "Stall", value: f.stallNumber || "—" }, { label: "Goods", value: f.goodsCategory || "—" }, { label: "Ward", value: f.ward || "—" }] },
  lockup: { table: "market_stalls", kind: "Market Trader", lines: (f) => [{ label: "Market", value: f.marketName || "—" }, { label: "Stall", value: f.stallNumber || "—" }, { label: "Goods", value: f.goodsCategory || "—" }, { label: "Ward", value: f.ward || "—" }] },
  market: { table: "market_stalls", kind: "Market Trader", lines: (f) => [{ label: "Market", value: f.marketName || "—" }, { label: "Stall", value: f.stallNumber || "—" }, { label: "Goods", value: f.goodsCategory || "—" }, { label: "Ward", value: f.ward || "—" }] },
  motorcycle: { table: "transport_vehicles", kind: "Transport Operator", lines: (f) => [{ label: "Plate", value: f.plateNumber || "—" }, { label: "Vehicle", value: "Motorcycle (Okada)" }, { label: "Route", value: f.routePark || "—" }, { label: "Ward", value: f.ward || "—" }] },
  tricycle: { table: "transport_vehicles", kind: "Transport Operator", lines: (f) => [{ label: "Plate", value: f.plateNumber || "—" }, { label: "Vehicle", value: "Tricycle (Keke)" }, { label: "Route", value: f.routePark || "—" }, { label: "Ward", value: f.ward || "—" }] },
  "commercial-vehicle": { table: "transport_vehicles", kind: "Transport Operator", lines: (f) => [{ label: "Plate", value: f.plateNumber || "—" }, { label: "Vehicle", value: "Commercial Vehicle" }, { label: "Route", value: f.routePark || "—" }, { label: "Ward", value: f.ward || "—" }] },
  pos: { table: "pos_operators", kind: "POS Operator", lines: (f) => [{ label: "Location", value: f.district || f.ward || "—" }, { label: "Ward", value: f.ward || "—" }] },
};

function SuccessScreen({ id, form, isStaff = false, qrToken: qrTokenProp = null, emailSent = true }: { id: string; form: FormState; isStaff?: boolean; qrToken?: string | null; emailSent?: boolean }) {
  const selectedType = taxpayerTypes.find((t) => t.id === form.type);
  const cardCfg = ID_CARD_TABLES[form.type];
  // The server function hands back the qr_token from the just-inserted row, so
  // the card works even for anonymous users who cannot re-read via RLS. Fall
  // back to a fetch only if the prop wasn't provided.
  const [qrToken, setQrToken] = useState<string | null>(qrTokenProp);
  const [cardLoading, setCardLoading] = useState(!!cardCfg && !qrTokenProp);

  useEffect(() => {
    if (!cardCfg || qrTokenProp) return;
    let alive = true;
    // The dynamic table name can't be narrowed by the generated Supabase types;
    // query untyped and read qr_token off the row.
    supabase
      .from(cardCfg.table as never)
      .select("qr_token")
      .eq("ref", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) {
          const row = data as { qr_token?: string } | null;
          setQrToken(row?.qr_token ?? null);
          setCardLoading(false);
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cardName = form.ownerName || form.businessName || "Taxpayer";

  return (
    <RegisterShell isStaff={isStaff}>
    <div className={isStaff ? "" : "min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background"}>
      {!isStaff && (
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={crest} alt="" className="h-9 w-9" />
            <div className="leading-tight">
              <div className="font-display text-sm font-bold text-ink">Kwali Area Council</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Smart Revenue Platform
              </div>
            </div>
          </Link>
        </div>
      </header>
      )}
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✓
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">
            Welcome, {form.businessName || form.ownerName || "Taxpayer"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your registration is being reviewed by a Kwali revenue officer.
          </p>

          {/* Email verification notice */}
          {(form.email || form.ownerEmail) && (
            <div className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-left ${emailSent ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
              <span className="mt-0.5 text-lg">✉️</span>
              <div>
                <div className={`text-sm font-bold ${emailSent ? "text-blue-900" : "text-amber-900"}`}>
                  {emailSent ? "Verify your email" : "Confirm your email"}
                </div>
                <p className={`mt-0.5 text-xs leading-relaxed ${emailSent ? "text-blue-800" : "text-amber-800"}`}>
                  {emailSent ? (
                    <>
                      We sent a verification link to{" "}
                      <span className="font-semibold">{form.email || form.ownerEmail}</span>. Click the
                      link in that email to activate the account. Check your spam folder if you don't
                      see it within a few minutes.
                    </>
                  ) : (
                    <>
                      An account was created for{" "}
                      <span className="font-semibold">{form.email || form.ownerEmail}</span>, but the
                      verification email could not be sent right now. On the login page, use{" "}
                      <span className="font-semibold">Forgot password</span> to receive a fresh link.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Taxpayer ID
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-primary">{id}</div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 text-left">
            <Stat
              label="Category"
              value={selectedType?.title.split(" ")[0] ?? "—"}
              tone="primary"
            />
            <Stat label="Obligations" value={String(form.obligations.length)} tone="good" />
            <Stat label="Documents" value={String(form.uploaded.length)} tone="primary" />
          </div>

          {/* Digital ID card with scannable QR — issued immediately for informal taxpayers */}
          {cardCfg && (
            <div className="mt-6 border-t border-border pt-6 text-left">
              <h3 className="text-center font-display text-base font-bold text-ink">
                Your digital ID card
              </h3>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                Show the QR code to any enforcement officer — it verifies your identity and payment
                standing instantly. Download the PDF to print it.
              </p>
              <div className="mt-4 flex justify-center">
                {cardLoading ? (
                  <div className="h-40 w-[340px] animate-pulse rounded-2xl bg-secondary" />
                ) : (
                  <TaxpayerIdCard
                    refNo={id}
                    qrToken={qrToken}
                    name={cardName}
                    kind={cardCfg.kind}
                    lines={cardCfg.lines(form)}
                    issuedAt={new Date().toISOString().split("T")[0]}
                  />
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/portal"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Back to my portal
            </Link>
            <Link
              to="/register"
              search={{ category: undefined }}
              className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-semibold"
              reloadDocument
            >
              Register another
            </Link>
          </div>
        </div>
      </main>
    </div>
    </RegisterShell>
  );
}
