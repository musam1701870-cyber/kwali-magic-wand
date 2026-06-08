// KARCIP — Kwali Area Council Revenue Command & Intelligence Platform
// Front-end mock data. Replace with real APIs later.

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
  today: 2_180_000,
  week: 14_750_000,
  month: 62_400_000,
  year: 488_900_000,
  expected: 720_000_000,
  outstanding: 231_100_000,
  compliance: 68,
  defaulters: 1284,
  businesses: 3210,
  properties: 8920,
  vehicles: 1142,
  motorcycles: 2480,
  tricycles: 1860,
  traders: 1907,
};
