// Front-end mock data for KURCMS. Replace with real API later.

export const wards = [
  "Kwali", "Yangoji", "Yebu", "Ashara", "Dafa",
  "Gumbo", "Kilankwa", "Kundu", "Pai", "Wako",
];

export type Property = {
  id: string;
  pin: string;
  type: "Residential" | "Commercial" | "Mixed-use";
  address: string;
  ward: string;
  annualRate: number;
  status: "Paid" | "Outstanding" | "Overdue";
};

export const properties: Property[] = [
  { id: "p1", pin: "KWL-PRP-2026-0017", type: "Residential", address: "12 Old Garki Road, Kwali", ward: "Kwali", annualRate: 5000, status: "Outstanding" },
  { id: "p2", pin: "KWL-PRP-2026-0018", type: "Commercial", address: "Shop 4 Market Square, Yangoji", ward: "Yangoji", annualRate: 12000, status: "Paid" },
  { id: "p3", pin: "KWL-PRP-2026-0019", type: "Mixed-use", address: "Block C, Dafa Junction", ward: "Dafa", annualRate: 18000, status: "Overdue" },
];

export type Payment = {
  id: string;
  rrr: string;
  category: string;
  amount: number;
  channel: "Card" | "Transfer" | "USSD";
  date: string;
  status: "Successful" | "Pending" | "Failed";
};

export const payments: Payment[] = [
  { id: "pay1", rrr: "REF-9810-2826-1109", category: "Tenement Rate 2026", amount: 5000, channel: "Card", date: "2026-05-12", status: "Successful" },
  { id: "pay2", rrr: "REF-7711-5520-0998", category: "Sanitation Levy · May", amount: 500, channel: "USSD", date: "2026-05-02", status: "Successful" },
  { id: "pay3", rrr: "REF-3340-2188-7702", category: "Tricycle Daily Ticket", amount: 100, channel: "Transfer", date: "2026-06-05", status: "Successful" },
  { id: "pay4", rrr: "REF-1102-9988-4456", category: "Business Premises 2026", amount: 10000, channel: "Card", date: "2026-04-21", status: "Pending" },
];

export type Vehicle = {
  id: string;
  plate: string;
  type: "Tricycle" | "Motorbike" | "Commercial";
  operator: string;
  ward: string;
  daily: number;
  active: boolean;
};

export const vehicles: Vehicle[] = [
  { id: "v1", plate: "KWL-T-2481", type: "Tricycle", operator: "Musa Ibrahim", ward: "Kwali", daily: 100, active: true },
  { id: "v2", plate: "KWL-M-7714", type: "Motorbike", operator: "Yakubu Sani", ward: "Yangoji", daily: 100, active: false },
  { id: "v3", plate: "ABC-321-XY", type: "Commercial", operator: "Dafa Transport Co.", ward: "Dafa", daily: 500, active: true },
];

export type Violation = {
  id: string;
  ref: string;
  plate: string;
  type: string;
  ward: string;
  officer: string;
  fine: number;
  status: "Open" | "Paid" | "Disputed";
  date: string;
};

export const violations: Violation[] = [
  { id: "vio1", ref: "VIO-2026-00112", plate: "KWL-M-7714", type: "Expired daily ticket", ward: "Yangoji", officer: "Ofc. Adamu", fine: 2000, status: "Open", date: "2026-06-06" },
  { id: "vio2", ref: "VIO-2026-00098", plate: "ABC-211-LP", type: "No QR sticker", ward: "Kwali", officer: "Ofc. Bello", fine: 5000, status: "Paid", date: "2026-06-04" },
  { id: "vio3", ref: "VIO-2026-00085", plate: "KWL-T-2210", type: "Tampered sticker", ward: "Pai", officer: "Ofc. Halima", fine: 10000, status: "Disputed", date: "2026-06-01" },
];

export const feeCategories = [
  { code: "TEN", title: "Tenement Rate", price: "From ₦5,000/yr", desc: "Annual property rate for residential and commercial buildings, based on GPS-tagged assessment.", color: "emerald" },
  { code: "BIZ", title: "Business Premises", price: "From ₦10,000/yr", desc: "Annual permit for shops, offices and SMEs operating within Kwali.", color: "amber" },
  { code: "SAN", title: "Sanitation Levy", price: "From ₦500/mo", desc: "Monthly refuse collection and environmental compliance fee.", color: "teal" },
  { code: "TRC", title: "Tricycle Daily Ticket", price: "₦100/day", desc: "Daily route permit with QR-coded windshield sticker.", color: "gold" },
  { code: "MTB", title: "Motorbike Permit", price: "₦100/day", desc: "Annual okada registration plus daily compliance ticket.", color: "rose" },
  { code: "COM", title: "Commercial Vehicle", price: "Tiered", desc: "Loading-bay and route permits for buses and trucks.", color: "violet" },
  { code: "WAS", title: "Commercial Waste Permit", price: "From ₦20,000/yr", desc: "Annual permit for businesses generating above-average waste.", color: "lime" },
  { code: "ENV", title: "Environmental Compliance", price: "From ₦15,000/yr", desc: "Environmental compliance certificate for regulated businesses.", color: "emerald" },
  { code: "ADV", title: "Outdoor Advertisement", price: "Tiered", desc: "Signage and mobile advertisement permits across council wards.", color: "amber" },
];

export const bylaws = [
  "Tenement Rate", "Environmental Sanitation", "Business Premises Regulation",
  "Motorcycle Uses", "Motor Parks", "Parking & Traffic Control", "Wrong Parking",
  "Refuse Operation", "Public Toilet", "Pest Control", "Foodstuff Regulation",
  "Liquor Licensing", "Market Regulation", "Laundry Registration", "House Numbering",
  "Construction Permits", "Borehole Drilling", "Cutting Road Tar",
  "Control of Advertisement", "Mobile Advertisement", "TV License",
  "Marriages, Births & Deaths", "Community Tax", "Commercial POS Operators",
  "Movement & Keeping of Dogs", "Regulated Premises", "Contractors", "Allied Matters",
  "Enabling Law",
];
