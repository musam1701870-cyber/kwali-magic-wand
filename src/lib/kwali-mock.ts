// KSRP — Kwali Smart Revenue Platform
// Front-end mock data. Replace with real APIs later.

// Business categories used in registration dropdowns across the platform.
export const businessCategories = [
  "Retail / General Merchandise",
  "Wholesale / Distribution",
  "Supermarket / Mini Mart",
  "Restaurant / Eatery / Bukka",
  "Hotel / Lodge / Guest House",
  "Event Centre / Hall",
  "Bar / Lounge / Club",
  "Filling Station / Petroleum",
  "Pharmacy / Patent Medicine Store",
  "Hospital / Clinic / Maternity",
  "Private School / Education",
  "Bank / Microfinance",
  "POS Operator / Agent Banking",
  "Telecom / ICT Services",
  "Cyber Café / Business Centre",
  "Printing / Publishing",
  "Construction / Engineering",
  "Real Estate / Property Agency",
  "Manufacturing / Production",
  "Block Industry / Building Materials",
  "Sawmill / Timber",
  "Mechanic / Auto Workshop",
  "Car Wash / Vulcanizer",
  "Transport Company / Logistics",
  "Bakery / Confectionery",
  "Cold Room / Frozen Foods",
  "Boutique / Tailoring / Fashion",
  "Salon / Barbing / Spa",
  "Laundry / Dry Cleaning",
  "Photo Studio / Videography",
  "Agriculture / Poultry / Livestock",
  "Mining / Quarry",
  "Professional Services (Law / Audit / Consult)",
  "NGO / Religious Organization",
  "Other",
] as const;

export const wards = [
  "Kwali", "Yangoji", "Yebu", "Ashara", "Dafa",
  "Gumbo", "Kilankwa", "Kundu", "Pai", "Wako",
];

export const roles = [
  "Chairman",
  "Revenue Director",
  "Revenue Administrator",
  "Assessment Officer",
  "Revenue Officer",
  "Enforcement Officer",
  "Market Supervisor",
  "Transport Manager",
  "Taxpayer",
] as const;
export type Role = (typeof roles)[number];

export type Property = {
  id: string; pin: string; type: "Residential" | "Commercial" | "Mixed-use";
  address: string; ward: string; annualRate: number; status: "Paid" | "Outstanding" | "Overdue";
};

export const properties: Property[] = [
  { id: "p1", pin: "KWL-PRP-2026-0017", type: "Residential", address: "12 Old Garki Road, Kwali", ward: "Kwali", annualRate: 5000, status: "Outstanding" },
  { id: "p2", pin: "KWL-PRP-2026-0018", type: "Commercial", address: "Shop 4 Market Square, Yangoji", ward: "Yangoji", annualRate: 12000, status: "Paid" },
  { id: "p3", pin: "KWL-PRP-2026-0019", type: "Mixed-use", address: "Block C, Dafa Junction", ward: "Dafa", annualRate: 18000, status: "Overdue" },
  { id: "p4", pin: "KWL-PRP-2026-0020", type: "Commercial", address: "Plot 17 Pai Industrial Layout", ward: "Pai", annualRate: 45000, status: "Paid" },
  { id: "p5", pin: "KWL-PRP-2026-0021", type: "Residential", address: "House 9 Kilankwa Rd", ward: "Kilankwa", annualRate: 5000, status: "Outstanding" },
];

export type Payment = {
  id: string; rrr: string; category: string; amount: number;
  channel: "Card" | "Transfer" | "USSD" | "POS" | "Wallet";
  date: string; status: "Successful" | "Pending" | "Failed";
};

export const payments: Payment[] = [
  { id: "pay1", rrr: "REF-9810-2826-1109", category: "Tenement Rate 2026", amount: 5000, channel: "Card", date: "2026-05-12", status: "Successful" },
  { id: "pay2", rrr: "REF-7711-5520-0998", category: "Sanitation Levy · May", amount: 500, channel: "USSD", date: "2026-05-02", status: "Successful" },
  { id: "pay3", rrr: "REF-3340-2188-7702", category: "Tricycle Daily Ticket", amount: 100, channel: "Transfer", date: "2026-06-05", status: "Successful" },
  { id: "pay4", rrr: "REF-1102-9988-4456", category: "Business Premises 2026", amount: 10000, channel: "POS", date: "2026-04-21", status: "Pending" },
  { id: "pay5", rrr: "REF-5512-4471-8821", category: "Hotel Levy Q2", amount: 75000, channel: "Transfer", date: "2026-04-18", status: "Successful" },
  { id: "pay6", rrr: "REF-9921-3361-7710", category: "Market Daily Ticket", amount: 200, channel: "Wallet", date: "2026-06-07", status: "Successful" },
];

export type Vehicle = {
  id: string; plate: string;
  type: "Tricycle" | "Motorbike" | "Commercial" | "Taxi";
  operator: string; ward: string; daily: number; active: boolean;
};

export const vehicles: Vehicle[] = [
  { id: "v1", plate: "KWL-T-2481", type: "Tricycle", operator: "Musa Ibrahim", ward: "Kwali", daily: 100, active: true },
  { id: "v2", plate: "KWL-M-7714", type: "Motorbike", operator: "Yakubu Sani", ward: "Yangoji", daily: 100, active: false },
  { id: "v3", plate: "ABC-321-XY", type: "Commercial", operator: "Dafa Transport Co.", ward: "Dafa", daily: 500, active: true },
  { id: "v4", plate: "KWL-X-0091", type: "Taxi", operator: "Aisha Bello", ward: "Pai", daily: 300, active: true },
];

export type Violation = {
  id: string; ref: string; plate: string; type: string; ward: string;
  officer: string; fine: number; status: "Open" | "Paid" | "Disputed"; date: string;
};

export const violations: Violation[] = [
  { id: "vio1", ref: "VIO-2026-00112", plate: "KWL-M-7714", type: "Expired daily ticket", ward: "Yangoji", officer: "Ofc. Adamu", fine: 2000, status: "Open", date: "2026-06-06" },
  { id: "vio2", ref: "VIO-2026-00098", plate: "ABC-211-LP", type: "No QR sticker", ward: "Kwali", officer: "Ofc. Bello", fine: 5000, status: "Paid", date: "2026-06-04" },
  { id: "vio3", ref: "VIO-2026-00085", plate: "KWL-T-2210", type: "Tampered sticker", ward: "Pai", officer: "Ofc. Halima", fine: 10000, status: "Disputed", date: "2026-06-01" },
];

export const feeCategories = [
  { code: "TEN", title: "Tenement Rate", price: "From ₦5,000/yr", desc: "Annual property rate for residential and commercial buildings, GPS-tagged.", color: "emerald" },
  { code: "BIZ", title: "Business Premises", price: "From ₦10,000/yr", desc: "Annual permit for shops, offices and SMEs operating within Kwali.", color: "amber" },
  { code: "SAN", title: "Sanitation Levy", price: "From ₦500/mo", desc: "Monthly refuse and environmental compliance fee.", color: "teal" },
  { code: "TRC", title: "Tricycle Daily Ticket", price: "₦100/day", desc: "Daily route permit with QR-coded windshield sticker.", color: "gold" },
  { code: "MTB", title: "Motorbike Permit", price: "₦100/day", desc: "Annual okada registration plus daily ticket.", color: "rose" },
  { code: "COM", title: "Commercial Vehicle", price: "Tiered", desc: "Loading-bay and route permits for buses and trucks.", color: "violet" },
  { code: "MKT", title: "Market Daily Ticket", price: "From ₦200/day", desc: "Trader, hawker and stall daily collection.", color: "lime" },
  { code: "HOT", title: "Hotel & Hospitality Levy", price: "From ₦75,000/qtr", desc: "Quarterly levy for hotels, lodges and event centres.", color: "emerald" },
  { code: "ADV", title: "Outdoor Advertisement", price: "Tiered", desc: "Signage, billboard and mobile advert permits.", color: "amber" },
  { code: "CIV", title: "Civil Registry", price: "Fixed", desc: "Marriage, birth and death registration fees.", color: "teal" },
];

export const bylaws = [
  "Tenement Rate","Environmental Sanitation","Business Premises Regulation",
  "Motorcycle Uses","Motor Parks","Parking & Traffic Control","Wrong Parking",
  "Refuse Operation","Public Toilet","Pest Control","Foodstuff Regulation",
  "Liquor Licensing","Market Regulation","Laundry Registration","House Numbering",
  "Construction Permits","Borehole Drilling","Cutting Road Tar",
  "Control of Advertisement","Mobile Advertisement","TV License",
  "Marriages, Births & Deaths","Community Tax","Commercial POS Operators",
  "Movement & Keeping of Dogs","Regulated Premises","Contractors","Allied Matters",
  "Enabling Law",
];

/* ============ KARCIP extended mock ============ */

export const revenueSources = [
  { group: "Property", items: ["Tenement Rates","Property Tax","Commercial Property Levy","Building Approval Fees","Development Levy","Ground Rent","Property Assessment Fees"] },
  { group: "Business", items: ["Business Premises Registration","Business Renewal","Corporate Organization Levy","Hotels & Hospitality","Restaurant Registration","Event Centre Levy","Filling Station Permit","POS Operator Registration"] },
  { group: "Transport", items: ["Motorcycle Daily Ticket","Motorcycle Annual Permit","Tricycle Daily Ticket","Tricycle Annual Permit","Taxi Permit","Commercial Vehicle Permit","Bus Terminal Levy","Motor Park Revenue"] },
  { group: "Market", items: ["Market Stall Fees","Daily Market Ticket","Lockup Shop Fees","Open Space Levy","Hawker Permit"] },
  { group: "Environmental", items: ["Waste Disposal Levy","Environmental Sanitation Levy","Refuse Collection Fees"] },
  { group: "Advertisement", items: ["Signboard Permit","Billboard Permit","Outdoor Advertisement Levy"] },
  { group: "Civil", items: ["Marriage Registration","Birth Registration","Death Registration"] },
  { group: "Special", items: ["Slaughter Slab Fees","Animal Trade Levy","Event Permit","Temporary Trading Permit","Road Closure Permit"] },
];

export type Taxpayer = {
  id: string; tin: string; name: string;
  type: "Individual" | "Corporate" | "Property Owner" | "Business" | "Transport Operator" | "Market Trader";
  ward: string; phone: string; compliance: number; status: "Compliant" | "Partial" | "Defaulting" | "Blacklisted";
  outstanding: number;
};

export const taxpayers: Taxpayer[] = [
  { id: "t1", tin: "TIN-KWL-000112", name: "Musa Ibrahim", type: "Transport Operator", ward: "Kwali", phone: "0803-111-2210", compliance: 92, status: "Compliant", outstanding: 0 },
  { id: "t2", tin: "TIN-KWL-000113", name: "Dafa Mega Hotel Ltd", type: "Corporate", ward: "Dafa", phone: "0809-441-7700", compliance: 64, status: "Partial", outstanding: 125000 },
  { id: "t3", tin: "TIN-KWL-000114", name: "Blessing Ogaji", type: "Business", ward: "Yangoji", phone: "0814-220-9981", compliance: 100, status: "Compliant", outstanding: 0 },
  { id: "t4", tin: "TIN-KWL-000115", name: "Sani Idris", type: "Property Owner", ward: "Pai", phone: "0701-330-9912", compliance: 30, status: "Defaulting", outstanding: 22000 },
  { id: "t5", tin: "TIN-KWL-000116", name: "Pai Filling Station", type: "Corporate", ward: "Pai", phone: "0902-001-7711", compliance: 18, status: "Blacklisted", outstanding: 480000 },
  { id: "t6", tin: "TIN-KWL-000117", name: "Halima Yusuf", type: "Market Trader", ward: "Kwali", phone: "0815-662-1100", compliance: 88, status: "Compliant", outstanding: 0 },
];

export type Business = {
  id: string; ref: string; name: string; category: string; ward: string;
  status: "Active" | "Expired" | "Suspended"; renewal: string; levy: number;
};

export const businesses: Business[] = [
  { id: "b1", ref: "KWL-BIZ-2026-0231", name: "Yangoji Mini Mart", category: "Retail", ward: "Yangoji", status: "Active", renewal: "2026-12-31", levy: 10000 },
  { id: "b2", ref: "KWL-BIZ-2026-0232", name: "Dafa Mega Hotel", category: "Hospitality", ward: "Dafa", status: "Active", renewal: "2026-09-30", levy: 300000 },
  { id: "b3", ref: "KWL-BIZ-2026-0233", name: "Pai Filling Station", category: "Filling Station", ward: "Pai", status: "Suspended", renewal: "2026-03-31", levy: 250000 },
  { id: "b4", ref: "KWL-BIZ-2026-0234", name: "Sky POS Agent", category: "POS Operator", ward: "Kwali", status: "Active", renewal: "2026-12-31", levy: 15000 },
  { id: "b5", ref: "KWL-BIZ-2026-0235", name: "Kilankwa Event Centre", category: "Event Centre", ward: "Kilankwa", status: "Expired", renewal: "2026-04-30", levy: 80000 },
];

export type Market = {
  id: string; name: string; ward: string; traders: number; stalls: number;
  dailyTarget: number; collected: number; compliance: number;
};

export const markets: Market[] = [
  { id: "m1", name: "Kwali Central Market", ward: "Kwali", traders: 412, stalls: 280, dailyTarget: 84000, collected: 71200, compliance: 84 },
  { id: "m2", name: "Yangoji Daily Market", ward: "Yangoji", traders: 180, stalls: 110, dailyTarget: 36000, collected: 21000, compliance: 58 },
  { id: "m3", name: "Dafa Cattle Market", ward: "Dafa", traders: 95, stalls: 60, dailyTarget: 28500, collected: 26000, compliance: 91 },
  { id: "m4", name: "Pai Foodstuff Market", ward: "Pai", traders: 220, stalls: 140, dailyTarget: 44000, collected: 30800, compliance: 70 },
];

export type DemandNotice = {
  id: string; ref: string; taxpayer: string; category: string; amount: number;
  stage: "Demand" | "Reminder" | "Final Warning" | "Enforcement"; issued: string; due: string;
};

export const demandNotices: DemandNotice[] = [
  { id: "d1", ref: "DN-2026-00118", taxpayer: "Sani Idris", category: "Tenement Rate", amount: 22000, stage: "Reminder", issued: "2026-05-22", due: "2026-06-15" },
  { id: "d2", ref: "DN-2026-00121", taxpayer: "Pai Filling Station", category: "Business Renewal", amount: 250000, stage: "Enforcement", issued: "2026-04-02", due: "2026-05-02" },
  { id: "d3", ref: "DN-2026-00125", taxpayer: "Kilankwa Event Centre", category: "Event Centre Levy", amount: 80000, stage: "Final Warning", issued: "2026-05-10", due: "2026-06-10" },
  { id: "d4", ref: "DN-2026-00127", taxpayer: "Dafa Mega Hotel Ltd", category: "Hotel Levy Q1", amount: 125000, stage: "Demand", issued: "2026-06-01", due: "2026-06-21" },
];

export type Notification = {
  id: string; channel: "SMS" | "Email" | "Push" | "WhatsApp";
  title: string; body: string; at: string; tag: "Reminder" | "Alert" | "Receipt" | "Compliance";
};

export const notifications: Notification[] = [
  { id: "n1", channel: "SMS", title: "Payment received", body: "Your payment of ₦5,000 for Tenement Rate 2026 was successful. Receipt KWL-REF-2026-09810.", at: "2026-06-07 09:21", tag: "Receipt" },
  { id: "n2", channel: "Email", title: "Permit expires in 7 days", body: "Your tricycle permit KWL-T-2481 expires on 2026-06-14. Renew to avoid enforcement.", at: "2026-06-07 07:00", tag: "Reminder" },
  { id: "n3", channel: "WhatsApp", title: "Final warning", body: "Outstanding balance of ₦80,000 for Event Centre Levy. Final warning issued.", at: "2026-06-06 18:42", tag: "Compliance" },
  { id: "n4", channel: "Push", title: "QR scan alert", body: "Officer Adamu flagged vehicle KWL-M-7714 in Yangoji for expired ticket.", at: "2026-06-06 12:11", tag: "Alert" },
];

// Ward-level revenue performance (₦)
export const wardRevenue = wards.map((w, i) => {
  const expected = 1_800_000 + i * 220_000;
  const collected = Math.round(expected * (0.45 + (i % 5) * 0.11));
  return { ward: w, expected, collected, leakage: expected - collected, compliance: Math.round((collected / expected) * 100) };
});

// Monthly revenue trend (₦ in thousands)
export const monthlyTrend = [
  { m: "Jan", v: 6800 }, { m: "Feb", v: 7400 }, { m: "Mar", v: 8200 },
  { m: "Apr", v: 9100 }, { m: "May", v: 9850 }, { m: "Jun", v: 10420 },
];

// Revenue by source group
export const sourceMix = [
  { name: "Property", value: 28 },
  { name: "Business", value: 24 },
  { name: "Transport", value: 18 },
  { name: "Market", value: 14 },
  { name: "Environmental", value: 7 },
  { name: "Advertisement", value: 5 },
  { name: "Civil & Special", value: 4 },
];

export const kpis = {
  today: 2_450_000,
  week: 18_900_000,
  month: 84_000_000,
  year: 1_200_000_000,
  expected: 1_450_000_000,
  outstanding: 610_000_000,
  compliance: 82,
  defaulters: 1284,
  taxpayers: 34_200,
  businesses: 3210,
  properties: 8920,
  vehicles: 4000,
  motorcycles: 15000,
  tricycles: 6200,
  traders: 1907,
};

/* ============================================================
   MARKET TRADER IDENTITY SYSTEM
   ============================================================ */

export const tradeTypes = [
  "Vegetables & Tomatoes", "Grains & Foodstuff", "Frozen Foods & Fish",
  "Livestock & Poultry", "Clothing & Fashion", "Electronics & Accessories",
  "Building Materials", "Beverages & Drinks", "Pharmaceuticals & Medicine",
  "Cosmetics & Personal Care", "POS / Mobile Money", "Provisions & Grocery",
  "Fruits & Produce", "Cooking Utensils & Household", "Tailoring & Sewing",
  "Shoes & Leather Goods", "Bags & Accessories", "Furniture & Woodwork",
  "Pepper & Spices", "Rice & Grains (Wholesale)", "Spare Parts & Auto",
  "Agricultural Inputs", "Bakery & Confectionery", "Phone & Repairs",
  "Other",
] as const;

export const marketZoneNames = [
  "Vegetable Zone", "Grain & Foodstuff Zone", "Livestock Zone",
  "Fashion & Clothing Zone", "Electronics Zone", "Provisions Zone",
  "Frozen Foods Zone", "Building Materials Zone", "General Zone",
] as const;

/** Asset types for traders — physical/business assets owned/operated */
export const assetTypes = [
  "Company & Offices",
  "Land & Signage",
  "Shop, Market Stall & POS Operator",
  "Hotel & Event Centers",
  "Taxis, Okada & Vehicles",
  "Wastes & Sanitation",
  "Certificate & Land Papers",
  "None / Market Trader Only",
] as const;

export type AssetType = (typeof assetTypes)[number];

/** Category A = large traders, B = medium, C = small/informal */
export type TraderCategory = "A" | "B" | "C";
export type TraderStatus = "Active" | "Inactive" | "Suspended";
export type PassType = "Daily" | "Monthly";

export type Trader = {
  id: string;
  traderId: string;       // KWL-TRD-000123
  name: string;
  phone: string;
  nin?: string;
  initials: string;       // for avatar placeholder
  marketId: string;
  marketName: string;
  tradeType: string;
  gender: "Male" | "Female";
  ward: string;
  village?: string;
  emergencyContact?: string;
  assetType: AssetType;   // physical/business assets
  category: TraderCategory;
  zone: string;
  status: TraderStatus;
  registeredAt: string;
  passType: PassType;
  paidToday: boolean;
  lastPaid: string;
  totalPayments: number;
  complianceScore: number;
  dailyRate: number;
  monthlyRate: number;
};

const mkTrader = (
  n: number, name: string, phone: string, marketId: string, marketName: string,
  tradeType: string, gender: "Male" | "Female", ward: string, category: TraderCategory,
  zone: string, paidToday: boolean, complianceScore: number, assetType: AssetType = "None / Market Trader Only", passType: PassType = "Daily",
): Trader => {
  const pad = String(n).padStart(6, "0");
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const dailyRate = category === "A" ? 300 : category === "B" ? 200 : 100;
  return {
    id: `tr${n}`, traderId: `KWL-TRD-${pad}`, name, phone, initials,
    marketId, marketName, tradeType, gender, ward,
    assetType, category, zone, status: "Active", registeredAt: "2026-05-15",
    passType, paidToday, lastPaid: paidToday ? "2026-06-09" : "2026-06-06",
    totalPayments: Math.round(complianceScore * 1.2), complianceScore,
    dailyRate, monthlyRate: dailyRate * 20,
  };
};

export const traders: Trader[] = [
  mkTrader(1, "Mary Yakubu", "0803-441-2210", "m1", "Kwali Central Market", "Vegetables & Tomatoes", "Female", "Kwali", "C", "Vegetable Zone", true, 98, "Shop, Market Stall & POS Operator"),
  mkTrader(2, "Aisha Musa", "0814-552-3301", "m1", "Kwali Central Market", "Grains & Foodstuff", "Female", "Kwali", "B", "Grain & Foodstuff Zone", true, 91, "Land & Signage"),
  mkTrader(3, "Ibrahim Sule", "0901-113-4490", "m1", "Kwali Central Market", "Rice & Grains (Wholesale)", "Male", "Kwali", "A", "Grain & Foodstuff Zone", true, 87, "Company & Offices"),
  mkTrader(4, "Hauwa Danladi", "0815-220-7712", "m1", "Kwali Central Market", "Clothing & Fashion", "Female", "Yangoji", "B", "Fashion & Clothing Zone", false, 72, "Shop, Market Stall & POS Operator"),
  mkTrader(5, "Sani Bello", "0703-881-2200", "m1", "Kwali Central Market", "Electronics & Accessories", "Male", "Kwali", "A", "Electronics Zone", true, 94, "Company & Offices"),
  mkTrader(6, "Fatima Umar", "0906-330-1199", "m1", "Kwali Central Market", "Pepper & Spices", "Female", "Kwali", "C", "Vegetable Zone", true, 100),
  mkTrader(7, "Musa Garba", "0812-001-4482", "m1", "Kwali Central Market", "Provisions & Grocery", "Male", "Wako", "B", "Provisions Zone", false, 55, "Hotel & Event Centers"),
  mkTrader(8, "Blessing Eze", "0803-774-9901", "m1", "Kwali Central Market", "Cosmetics & Personal Care", "Female", "Kwali", "C", "General Zone", true, 88),
  mkTrader(9, "Adamu Bako", "0705-662-3318", "m2", "Yangoji Daily Market", "Vegetables & Tomatoes", "Male", "Yangoji", "C", "Vegetable Zone", true, 96),
  mkTrader(10, "Zainab Ahmed", "0811-443-7721", "m2", "Yangoji Daily Market", "Frozen Foods & Fish", "Female", "Yangoji", "B", "Frozen Foods Zone", false, 61, "Taxis, Okada & Vehicles"),
  mkTrader(11, "Isah Yusuf", "0902-551-8803", "m2", "Yangoji Daily Market", "Livestock & Poultry", "Male", "Dafa", "A", "Livestock Zone", true, 78),
  mkTrader(12, "Ramatu Bello", "0803-223-5514", "m2", "Yangoji Daily Market", "Fruits & Produce", "Female", "Yangoji", "C", "Vegetable Zone", true, 90),
  mkTrader(13, "Tanimu Lawal", "0814-119-2243", "m2", "Yangoji Daily Market", "Shoes & Leather Goods", "Male", "Kwali", "B", "Fashion & Clothing Zone", false, 44),
  mkTrader(14, "Hadiza Sabo", "0905-771-4432", "m3", "Dafa Cattle Market", "Livestock & Poultry", "Female", "Dafa", "A", "Livestock Zone", true, 99),
  mkTrader(15, "Umar Bello", "0812-882-6610", "m3", "Dafa Cattle Market", "Agricultural Inputs", "Male", "Dafa", "B", "Grain & Foodstuff Zone", true, 85),
  mkTrader(16, "Sumaiya Idris", "0704-113-8820", "m3", "Dafa Cattle Market", "Grains & Foodstuff", "Female", "Dafa", "C", "Grain & Foodstuff Zone", false, 67),
  mkTrader(17, "Mohammed Kwali", "0901-332-1108", "m4", "Pai Foodstuff Market", "Beverages & Drinks", "Male", "Pai", "B", "Provisions Zone", true, 82),
  mkTrader(18, "Rabi Yusuf", "0815-004-9912", "m4", "Pai Foodstuff Market", "Cooking Utensils & Household", "Female", "Pai", "C", "General Zone", true, 77),
  mkTrader(19, "Abdullahi Musa", "0803-667-2213", "m4", "Pai Foodstuff Market", "Building Materials", "Male", "Pai", "A", "Building Materials Zone", true, 93),
  mkTrader(20, "Jummai Garba", "0706-443-5580", "m4", "Pai Foodstuff Market", "Vegetables & Tomatoes", "Female", "Pai", "C", "Vegetable Zone", false, 59),
  mkTrader(21, "Bilkis Sule", "0812-774-3301", "m1", "Kwali Central Market", "Tailoring & Sewing", "Female", "Kwali", "B", "Fashion & Clothing Zone", true, 88, "Monthly"),
  mkTrader(22, "Garba Mohammed", "0901-552-7712", "m1", "Kwali Central Market", "Spare Parts & Auto", "Male", "Gumbo", "A", "General Zone", true, 95, "Monthly"),
  mkTrader(23, "Nana Bello", "0814-330-4492", "m2", "Yangoji Daily Market", "Bakery & Confectionery", "Female", "Yangoji", "C", "General Zone", true, 100, "Monthly"),
  mkTrader(24, "Isa Lawal", "0703-221-9918", "m4", "Pai Foodstuff Market", "POS / Mobile Money", "Male", "Pai", "B", "General Zone", false, 40),
  mkTrader(25, "Halima Ahmed", "0905-882-6641", "m1", "Kwali Central Market", "Phone & Repairs", "Female", "Kwali", "B", "Electronics Zone", true, 86),
];

export type MarketZone = {
  id: string;
  name: string;
  marketId: string;
  marketName: string;
  traderCount: number;
  category: TraderCategory;
};

export const marketZones: MarketZone[] = [
  { id: "z1", name: "Vegetable Zone", marketId: "m1", marketName: "Kwali Central Market", traderCount: 89, category: "C" },
  { id: "z2", name: "Grain & Foodstuff Zone", marketId: "m1", marketName: "Kwali Central Market", traderCount: 72, category: "B" },
  { id: "z3", name: "Fashion & Clothing Zone", marketId: "m1", marketName: "Kwali Central Market", traderCount: 55, category: "B" },
  { id: "z4", name: "Electronics Zone", marketId: "m1", marketName: "Kwali Central Market", traderCount: 38, category: "A" },
  { id: "z5", name: "Provisions Zone", marketId: "m1", marketName: "Kwali Central Market", traderCount: 61, category: "B" },
  { id: "z6", name: "Livestock Zone", marketId: "m3", marketName: "Dafa Cattle Market", traderCount: 45, category: "A" },
  { id: "z7", name: "Vegetable Zone", marketId: "m2", marketName: "Yangoji Daily Market", traderCount: 53, category: "C" },
  { id: "z8", name: "Frozen Foods Zone", marketId: "m2", marketName: "Yangoji Daily Market", traderCount: 34, category: "B" },
  { id: "z9", name: "General Zone", marketId: "m4", marketName: "Pai Foodstuff Market", traderCount: 68, category: "C" },
];

export type MarketOfficer = {
  id: string;
  name: string;
  badge: string;
  marketId: string;
  marketName: string;
  collectedToday: number;
  collectedMonth: number;
  receiptsToday: number;
  efficiency: number; // %
};

export const marketOfficers: MarketOfficer[] = [
  { id: "o1", name: "Ofc. Amina Sule", badge: "KWL-MKT-001", marketId: "m1", marketName: "Kwali Central Market", collectedToday: 52000, collectedMonth: 980000, receiptsToday: 186, efficiency: 94 },
  { id: "o2", name: "Ofc. Idris Musa", badge: "KWL-MKT-002", marketId: "m1", marketName: "Kwali Central Market", collectedToday: 41000, collectedMonth: 820000, receiptsToday: 152, efficiency: 81 },
  { id: "o3", name: "Ofc. Fatima Bello", badge: "KWL-MKT-003", marketId: "m2", marketName: "Yangoji Daily Market", collectedToday: 21000, collectedMonth: 390000, receiptsToday: 97, efficiency: 73 },
  { id: "o4", name: "Ofc. Garba Lawal", badge: "KWL-MKT-004", marketId: "m3", marketName: "Dafa Cattle Market", collectedToday: 26000, collectedMonth: 510000, receiptsToday: 88, efficiency: 91 },
  { id: "o5", name: "Ofc. Halima Kwali", badge: "KWL-MKT-005", marketId: "m4", marketName: "Pai Foodstuff Market", collectedToday: 30800, collectedMonth: 604000, receiptsToday: 122, efficiency: 85 },
];

export type MarketSession = {
  id: string;
  marketId: string;
  marketName: string;
  date: string;
  registered: number;
  present: number;
  paid: number;
  absent: number;
  revenue: number;
  officerName: string;
};

export const marketSessions: MarketSession[] = [
  { id: "ms1", marketId: "m1", marketName: "Kwali Central Market", date: "2026-06-09", registered: 412, present: 318, paid: 280, absent: 94, revenue: 71200, officerName: "Ofc. Amina Sule" },
  { id: "ms2", marketId: "m2", marketName: "Yangoji Daily Market", date: "2026-06-09", registered: 180, present: 110, paid: 97, absent: 70, revenue: 21000, officerName: "Ofc. Fatima Bello" },
  { id: "ms3", marketId: "m3", marketName: "Dafa Cattle Market", date: "2026-06-09", registered: 95, present: 88, paid: 84, absent: 7, revenue: 26000, officerName: "Ofc. Garba Lawal" },
  { id: "ms4", marketId: "m4", marketName: "Pai Foodstuff Market", date: "2026-06-09", registered: 220, present: 155, paid: 132, absent: 65, revenue: 30800, officerName: "Ofc. Halima Kwali" },
];

export type TraderAssociation = {
  id: string;
  name: string;
  marketId: string;
  marketName: string;
  chairman: string;
  phone: string;
  members: number;
  registered: number;
};

export const traderAssociations: TraderAssociation[] = [
  { id: "ta1", name: "Kwali Women Traders Association", marketId: "m1", marketName: "Kwali Central Market", chairman: "Alhaja Maryam Sule", phone: "0803-441-9910", members: 210, registered: 178 },
  { id: "ta2", name: "Kwali Grain Dealers Association", marketId: "m1", marketName: "Kwali Central Market", chairman: "Mallam Ibrahim Garba", phone: "0901-223-5541", members: 72, registered: 65 },
  { id: "ta3", name: "Yangoji Traders Association", marketId: "m2", marketName: "Yangoji Daily Market", chairman: "Hajiya Ramatu Ahmed", phone: "0814-770-1122", members: 180, registered: 142 },
  { id: "ta4", name: "Dafa Livestock Dealers Association", marketId: "m3", marketName: "Dafa Cattle Market", chairman: "Alhaji Usman Danladi", phone: "0705-882-3390", members: 95, registered: 91 },
  { id: "ta5", name: "Pai Market Traders Coalition", marketId: "m4", marketName: "Pai Foodstuff Market", chairman: "Mrs. Grace Okafor", phone: "0906-114-8821", members: 220, registered: 190 },
];
