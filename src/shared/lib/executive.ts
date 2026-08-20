import {
  kpis,
  wards,
  wardRevenue,
  markets,
  taxpayers,
  traders,
  payments,
  demandNotices,
} from "@/shared/lib/kwali-mock";

export type ExecutiveRevenueSummary = {
  totalCollected: number;
  revenueTarget: number;
  outstandingRevenue: number;
  collectionPerformance: number;
  totalTaxpayers: number;
  complianceRate: number;
  successfulPayments: number;
  totalSettled: number;
  today: number;
  week: number;
  month: number;
  prevMonth: number;
  changePct: number;
};

export type StreamPerformance = {
  stream: string;
  target: number;
  collected: number;
  outstanding: number;
  collectionPct: number;
  growthPct: number;
};

export type WardPerformance = {
  ward: string;
  target: number;
  collected: number;
  outstanding: number;
  compliance: number;
  taxpayers: number;
  businesses: number;
};

export type PaymentSummary = {
  totalTransactions: number;
  successful: number;
  failed: number;
  pending: number;
  reversed: number;
  totalValue: number;
  totalSettled: number;
  pendingSettlement: number;
  channels: { channel: string; count: number; value: number; pct: number }[];
};

export type ComplianceSummary = {
  totalTaxpayers: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  overdue: number;
  outstanding: number;
  complianceRate: number;
  topOutstanding: {
    taxpayer: string;
    revenueType: string;
    amount: number;
    dueDate: string;
    ward: string;
    status: string;
  }[];
};

export type MarketSummary = {
  totalMarkets: number;
  totalStalls: number;
  occupiedStalls: number;
  vacantStalls: number;
  registeredTraders: number;
  revenue: number;
  outstanding: number;
  compliance: number;
  topMarket: string;
  lowestMarket: string;
};

export type TransportSummary = {
  registeredVehicles: number;
  activeVehicles: number;
  routes: number;
  revenue: number;
  ticketsIssued: number;
  ticketsVerified: number;
  verifiedPayments: number;
  violations: number;
  outstanding: number;
};

export type EnforcementSummary = {
  totalInspections: number;
  compliant: number;
  violations: number;
  warnings: number;
  fines: number;
  otherActions: number;
};

export type ExecutiveAlert = {
  severity: "Critical" | "Warning" | "Information" | "Positive";
  message: string;
};

export type ExecutiveActivity = {
  text: string;
  at: string;
  kind: "revenue" | "payment" | "settlement" | "market" | "target" | "compliance" | "report";
};

const fmt = (n: number) => "₦" + n.toLocaleString();

async function safeQuery<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function getExecutiveRevenueSummary(): Promise<ExecutiveRevenueSummary> {
  const live = await safeQuery(async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("payments").select("amount,status");
    return data ?? null;
  });

  if (live && live.length > 0) {
    const totalCollected = live
      .filter((p) => p.status === "successful")
      .reduce((s, p) => s + (p.amount ?? 0), 0);
    const successfulPayments = live.filter((p) => p.status === "successful").length;
    const totalSettled = Math.round(totalCollected * 0.92);
    const revenueTarget = 150_000_000;
    const outstandingRevenue = Math.max(0, revenueTarget - totalCollected);
    return {
      totalCollected,
      revenueTarget,
      outstandingRevenue,
      collectionPerformance: Math.round((totalCollected / revenueTarget) * 1000) / 10,
      totalTaxpayers: kpis.taxpayers,
      complianceRate: kpis.compliance,
      successfulPayments,
      totalSettled,
      today: kpis.today,
      week: kpis.week,
      month: totalCollected,
      prevMonth: kpis.month,
      changePct: 18.4,
    };
  }

  const totalCollected = kpis.year;
  const revenueTarget = kpis.expected;
  const outstandingRevenue = kpis.outstanding;
  return {
    totalCollected,
    revenueTarget,
    outstandingRevenue,
    collectionPerformance: Math.round((totalCollected / revenueTarget) * 1000) / 10,
    totalTaxpayers: kpis.taxpayers,
    complianceRate: kpis.compliance,
    successfulPayments: payments.filter((p) => p.status === "Successful").length + 128_400,
    totalSettled: Math.round(totalCollected * 0.87),
    today: kpis.today,
    week: kpis.week,
    month: kpis.month,
    prevMonth: Math.round(kpis.month / 1.08),
    changePct: 18.4,
  };
}

export async function getExecutiveRevenueByStream(): Promise<StreamPerformance[]> {
  const totalTarget = kpis.expected;
  const weights: Record<string, { w: number; growth: number }> = {
    Property: { w: 0.27, growth: 14.2 },
    Business: { w: 0.22, growth: 9.8 },
    Market: { w: 0.14, growth: -4.2 },
    Transport: { w: 0.16, growth: 18.6 },
    Sanitation: { w: 0.07, growth: 6.1 },
    Hospitality: { w: 0.09, growth: 12.4 },
    "POS Operators": { w: 0.05, growth: 22.7 },
  };
  const streams: string[] = [
    "Property",
    "Business",
    "Market",
    "Transport",
    "Sanitation",
    "Hospitality",
    "POS Operators",
  ];
  return streams.map((stream) => {
    const { w, growth } = weights[stream];
    const target = Math.round(totalTarget * w);
    const collected = Math.round(target * (0.76 + ((stream.length * 7) % 18) / 100));
    return {
      stream,
      target,
      collected,
      outstanding: target - collected,
      collectionPct: Math.round((collected / target) * 100),
      growthPct: growth,
    };
  });
}

export async function getExecutiveWardPerformance(): Promise<WardPerformance[]> {
  const businesses = 3210;
  const taxpayersPerWard = Math.round(kpis.taxpayers / wards.length);
  return wardRevenue.map((w) => ({
    ward: w.ward,
    target: w.expected,
    collected: w.collected,
    outstanding: w.leakage,
    compliance: w.compliance,
    taxpayers: taxpayersPerWard,
    businesses: Math.round(businesses / wards.length),
  }));
}

export async function getExecutivePaymentSummary(): Promise<PaymentSummary> {
  const live = await safeQuery(async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("payments").select("amount,status,channel");
    return data ?? null;
  });

  if (live && live.length > 0) {
    const successful = live.filter((p) => p.status === "successful");
    const totalValue = successful.reduce((s, p) => s + (p.amount ?? 0), 0);
    const channels = ["moniepoint", "bank_transfer", "card", "other"].map((ch) => {
      const rows = live.filter(
        (p) =>
          (p.channel ?? "").toLowerCase().includes(ch) ||
          (ch === "other" &&
            !["moniepoint", "bank_transfer", "card"].some((c) =>
              (p.channel ?? "").toLowerCase().includes(c),
            )),
      );
      return {
        channel: ch,
        count: rows.length,
        value: rows.reduce((s, p) => s + (p.amount ?? 0), 0),
        pct: Math.round((rows.length / live.length) * 100),
      };
    });
    return {
      totalTransactions: live.length,
      successful: successful.length,
      failed: live.filter((p) => p.status === "failed").length,
      pending: live.filter((p) => p.status === "pending").length,
      reversed: live.filter((p) => p.status === "reversed").length,
      totalValue,
      totalSettled: Math.round(totalValue * 0.92),
      pendingSettlement: Math.round(totalValue * 0.08),
      channels,
    };
  }

  const totalTransactions = 142_800;
  const successful = 128_400;
  const totalValue = kpis.month * 12;
  const channels = [
    { channel: "Moniepoint", count: 84_200, value: Math.round(totalValue * 0.58), pct: 59 },
    { channel: "Bank Transfer", count: 38_900, value: Math.round(totalValue * 0.27), pct: 27 },
    { channel: "Card", count: 14_600, value: Math.round(totalValue * 0.1), pct: 10 },
    { channel: "Other", count: 5_100, value: Math.round(totalValue * 0.05), pct: 4 },
  ];
  return {
    totalTransactions,
    successful,
    failed: 7_900,
    pending: 3_400,
    reversed: 3_100,
    totalValue,
    totalSettled: Math.round(totalValue * 0.87),
    pendingSettlement: Math.round(totalValue * 0.13),
    channels,
  };
}

export async function getExecutiveComplianceSummary(): Promise<ComplianceSummary> {
  const totalTaxpayers = kpis.taxpayers;
  const compliant = Math.round(totalTaxpayers * (kpis.compliance / 100));
  const partial = Math.round(totalTaxpayers * 0.11);
  const nonCompliant = totalTaxpayers - compliant - partial;
  const topOutstanding = demandNotices.map((d) => ({
    taxpayer: d.taxpayer,
    revenueType: d.category,
    amount: d.amount,
    dueDate: d.due,
    ward: taxpayers.find((t) => t.name === d.taxpayer)?.ward ?? "Kwali",
    status: d.stage,
  }));
  return {
    totalTaxpayers,
    compliant,
    partial,
    nonCompliant,
    overdue: kpis.defaulters,
    outstanding: kpis.outstanding,
    complianceRate: kpis.compliance,
    topOutstanding,
  };
}

export async function getExecutiveMarketSummary(): Promise<MarketSummary> {
  const totalMarkets = markets.length;
  const totalStalls = markets.reduce((s, m) => s + m.stalls, 0);
  const registeredTraders = traders.length;
  const occupiedStalls = Math.round(totalStalls * 0.84);
  const revenue = markets.reduce((s, m) => s + m.collected, 0);
  const compliance = Math.round(markets.reduce((s, m) => s + m.compliance, 0) / markets.length);
  const ranked = [...markets].sort((a, b) => b.collected - a.collected);
  return {
    totalMarkets,
    totalStalls,
    occupiedStalls,
    vacantStalls: totalStalls - occupiedStalls,
    registeredTraders,
    revenue,
    outstanding: Math.round(revenue * (100 - compliance)) / 100,
    compliance,
    topMarket: ranked[0]?.name ?? "—",
    lowestMarket: ranked[ranked.length - 1]?.name ?? "—",
  };
}

export async function getExecutiveTransportSummary(): Promise<TransportSummary> {
  const registeredVehicles = kpis.tricycles + kpis.motorcycles + kpis.vehicles;
  const activeVehicles = Math.round(registeredVehicles * 0.78);
  return {
    registeredVehicles,
    activeVehicles,
    routes: 24,
    revenue: 18_900_000,
    ticketsIssued: 96_400,
    ticketsVerified: 88_100,
    verifiedPayments: 84_300,
    violations: 612,
    outstanding: 4_800_000,
  };
}

export async function getExecutiveEnforcementSummary(): Promise<EnforcementSummary> {
  return {
    totalInspections: 4_820,
    compliant: 3_790,
    violations: 612,
    warnings: 890,
    fines: 2_430,
    otherActions: 418,
  };
}

export async function getExecutiveAlerts(): Promise<ExecutiveAlert[]> {
  const summary = await getExecutiveRevenueSummary();
  const streams = await getExecutiveRevenueByStream();
  const wards = await getExecutiveWardPerformance();
  const payments = await getExecutivePaymentSummary();
  const alerts: ExecutiveAlert[] = [];

  if (summary.collectionPerformance < 100) {
    alerts.push({
      severity: "Critical",
      message: `Revenue collection is ${Math.round(100 - summary.collectionPerformance)}% below target.`,
    });
  }

  const worstWard = [...wards].sort((a, b) => a.compliance - b.compliance)[0];
  if (worstWard && worstWard.outstanding > 10_000_000) {
    alerts.push({
      severity: "Critical",
      message: `${fmt(worstWard.outstanding)} outstanding revenue exists in ${worstWard.ward} ward.`,
    });
  }

  const marketStream = streams.find((s) => s.stream === "Market");
  if (marketStream && marketStream.growthPct < 0) {
    alerts.push({
      severity: "Warning",
      message: `Market revenue decreased ${Math.abs(marketStream.growthPct)}% this month.`,
    });
  }

  if (payments.pendingSettlement > 0) {
    alerts.push({
      severity: "Warning",
      message: `${fmt(payments.pendingSettlement)} is awaiting settlement.`,
    });
  }

  const transportStream = streams.find((s) => s.stream === "Transport");
  if (transportStream && transportStream.growthPct > 10) {
    alerts.push({
      severity: "Positive",
      message: `Transport revenue increased ${transportStream.growthPct}%.`,
    });
  }

  const posStream = streams.find((s) => s.stream === "POS Operators");
  if (posStream && posStream.growthPct > 15) {
    alerts.push({
      severity: "Positive",
      message: `POS Operators revenue grew ${posStream.growthPct}% — the fastest growing stream.`,
    });
  }

  const lowComplianceWard = [...wards].find((w) => w.compliance < 60);
  if (lowComplianceWard) {
    alerts.push({
      severity: "Warning",
      message: `${lowComplianceWard.ward} compliance dropped below 60%.`,
    });
  }

  const bestWard = [...wards].sort((a, b) => b.compliance - a.compliance)[0];
  if (bestWard) {
    alerts.push({
      severity: "Positive",
      message: `${bestWard.ward} is the top performing ward at ${bestWard.compliance}% compliance.`,
    });
  }

  if (summary.successfulPayments > 100_000) {
    alerts.push({
      severity: "Information",
      message: `${summary.successfulPayments.toLocaleString()} payments processed successfully this year.`,
    });
  }

  return alerts;
}

export async function getExecutiveActivity(): Promise<ExecutiveActivity[]> {
  return [
    { text: "₦2.5M revenue collected today", at: "Today 16:20", kind: "revenue" },
    { text: "Kwali Central Market recorded 84% compliance", at: "Today 15:05", kind: "market" },
    { text: "Settlement of ₦18.2M completed", at: "Today 12:40", kind: "settlement" },
    { text: "Monthly revenue report generated", at: "Today 09:00", kind: "report" },
    {
      text: "Large payment of ₦2.1M received (Hotel Levy)",
      at: "Yesterday 17:12",
      kind: "payment",
    },
    { text: "2026 revenue target updated", at: "Yesterday 10:30", kind: "target" },
    { text: "Ward 5 compliance threshold breached", at: "2 days ago", kind: "compliance" },
  ];
}

export const executivePeriods = [
  "Today",
  "This Week",
  "This Month",
  "This Quarter",
  "This Year",
  "Custom Range",
] as const;
export type ExecutivePeriod = (typeof executivePeriods)[number];

export const revenueStreamNames = [
  "Property",
  "Business",
  "Market",
  "Transport",
  "Sanitation",
  "Hospitality",
  "POS Operators",
];

export { fmt };
