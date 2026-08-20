// Client-side revenue operations, enforced by RLS (see migrations 000003-000005).
// - Officers/admin can approve/reject registrations (RLS UPDATE).
// - Marshals/officers record collections into the payments ledger (RLS INSERT
//   requires collector_id = auth.uid(), so attribution can't be forged).
// - Officers/admin read all payments; marshals read only their own.
import { supabase } from "@/integrations/supabase/client";

export type RegistrationTable =
  | "businesses"
  | "properties"
  | "transport_vehicles"
  | "market_stalls"
  | "hospitality_permits"
  | "pos_operators"
  | "sanitation_subscriptions";

export type CollectorRole = "marshal" | "officer" | "online" | "system";

export type PendingRegistration = {
  table: RegistrationTable;
  id: string;
  ref: string;
  name: string;
  subtitle: string;
  ward: string | null;
  status: string;
  created_at: string;
};

type NamedRow = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" && v.length > 0 ? v : "");

// Per-table display config: how to label a row in the approval queue.
export const REGISTRATION_TABLES: {
  table: RegistrationTable;
  label: string;
  getName: (r: NamedRow) => string;
  getSubtitle: (r: NamedRow) => string;
}[] = [
  {
    table: "businesses",
    label: "Business",
    getName: (r) => str(r.business_name) || str(r.trading_name) || "Business",
    getSubtitle: (r) => str(r.category) || str(r.industry) || str(r.taxpayer_type) || "Registered business",
  },
  {
    table: "properties",
    label: "Property",
    getName: (r) => str(r.property_name) || str(r.address) || "Property",
    getSubtitle: (r) => [str(r.property_type), str(r.address)].filter(Boolean).join(" · ") || "Tenement",
  },
  {
    table: "transport_vehicles",
    label: "Vehicle",
    getName: (r) => str(r.operator_name) || str(r.plate_number) || "Vehicle",
    getSubtitle: (r) => [str(r.vehicle_type), str(r.plate_number)].filter(Boolean).join(" · ") || "Transport",
  },
  {
    table: "market_stalls",
    label: "Market stall",
    getName: (r) => str(r.trader_name) || "Trader",
    getSubtitle: (r) => [str(r.market_name), str(r.stall_number)].filter(Boolean).join(" · ") || "Market trader",
  },
  {
    table: "hospitality_permits",
    label: "Hospitality",
    getName: (r) => str(r.establishment_name) || "Establishment",
    getSubtitle: (r) => str(r.establishment_type) || "Hospitality permit",
  },
  {
    table: "pos_operators",
    label: "POS operator",
    getName: (r) => str(r.operator_name) || str(r.business_name) || "POS operator",
    getSubtitle: (r) => str(r.location) || "POS / agency banking",
  },
  {
    table: "sanitation_subscriptions",
    label: "Sanitation",
    getName: (r) => str(r.subscriber_name) || "Subscriber",
    getSubtitle: (r) => str(r.service_type) || "Sanitation subscription",
  },
];

/**
 * Legacy client-side reference generator. Kept only as a fallback for
 * nextPaymentRef() — it uses Math.random() with no collision protection, so
 * anything user-facing and permanent (payment refs, receipt numbers) now comes
 * from a Postgres sequence instead.
 */
export function genRef(prefix = "KWL-PAY"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1e6)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `${prefix}-${ts}-${rand}`;
}

/** Fetch all Pending registrations across every table (officer approval queue). */
export async function fetchPendingRegistrations(): Promise<PendingRegistration[]> {
  const results = await Promise.all(
    REGISTRATION_TABLES.map(async (cfg) => {
      const { data, error } = await supabase
        .from(cfg.table)
        .select("*")
        .eq("status", "Pending")
        .order("created_at", { ascending: true });
      if (error || !data) return [] as PendingRegistration[];
      return (data as NamedRow[]).map((r) => ({
        table: cfg.table,
        id: str(r.id),
        ref: str(r.ref),
        name: cfg.getName(r),
        subtitle: `${cfg.label} · ${cfg.getSubtitle(r)}`,
        ward: (r.ward as string | null) ?? null,
        status: str(r.status),
        created_at: str(r.created_at),
      }));
    }),
  );
  return results
    .flat()
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

/** Count Pending registrations across all tables (badge / stat). */
export async function countPendingRegistrations(): Promise<number> {
  const counts = await Promise.all(
    REGISTRATION_TABLES.map(async (cfg) => {
      const { count } = await supabase
        .from(cfg.table)
        .select("id", { count: "exact", head: true })
        .eq("status", "Pending");
      return count ?? 0;
    }),
  );
  return counts.reduce((a, b) => a + b, 0);
}

/** Approve a registration: flip to Active and stamp the approver. */
export async function approveRegistration(table: RegistrationTable, id: string, approverId: string) {
  const { error } = await supabase
    .from(table)
    .update({ status: "Active", approved_by: approverId, approved_at: new Date().toISOString(), rejected_reason: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Reject a registration with a reason. */
export async function rejectRegistration(
  table: RegistrationTable,
  id: string,
  approverId: string,
  reason: string,
) {
  const { error } = await supabase
    .from(table)
    .update({ status: "Rejected", approved_by: approverId, approved_at: new Date().toISOString(), rejected_reason: reason })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export type PaymentStatus =
  | "initiated"
  | "pending"
  | "confirmed"
  | "failed"
  | "cancelled"
  | "expired"
  | "reversed";

export type RecordPaymentInput = {
  collectorId: string;
  collectorRole: CollectorRole;
  payerId?: string | null;
  payerName?: string | null;
  sourceTable: string;
  sourceId?: string | null;
  sourceRef?: string | null;
  revenueType: string;
  amount: number;
  channel?: string;
  ward?: string | null;
  notes?: string | null;
  /** Which period this settles: '2026' | '2026-08' | '2026-08-17'. */
  obligationPeriod?: string | null;
  /** External teller/transaction reference, for reconciliation. */
  providerRef?: string | null;
  /**
   * Makes the write safe to retry. Two calls with the same key produce one
   * payment (unique partial index), so a double-tap or a retried request can
   * never double-count revenue or mint two receipts.
   */
  idempotencyKey?: string | null;
  /** Defaults to 'confirmed' — cash in hand. Use 'pending' for money in flight. */
  status?: PaymentStatus;
};

export type RecordedPayment = {
  /** The payment reference (KWL-PAY-2026-NNNNNN). */
  ref: string;
  /** The official receipt number, present once the payment is confirmed. */
  receiptNo: string | null;
  paymentId: string;
  status: PaymentStatus;
};

/**
 * Record a payment into the central ledger.
 *
 * This is the single write path for every channel. When the payment lands as
 * 'confirmed' a database trigger issues the receipt, so callers never have to
 * remember to do it and a retry cannot produce a second one.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<RecordedPayment> {
  const status: PaymentStatus = input.status ?? "confirmed";
  const ref = await nextPaymentRef();

  const { data, error } = await supabase
    .from("payments")
    .insert({
      ref,
      payer_id: input.payerId ?? null,
      payer_name: input.payerName ?? null,
      collector_id: input.collectorId,
      collector_role: input.collectorRole,
      source_table: input.sourceTable,
      source_id: input.sourceId ?? null,
      source_ref: input.sourceRef ?? null,
      revenue_type: input.revenueType,
      amount: input.amount,
      channel: input.channel ?? "cash",
      ward: input.ward ?? null,
      status,
      notes: input.notes ?? null,
      obligation_period: input.obligationPeriod ?? null,
      provider_ref: input.providerRef ?? null,
      idempotency_key: input.idempotencyKey ?? null,
    })
    .select("id, ref, status")
    .single();

  if (error) throw new Error(error.message);

  // The trigger has already issued the receipt by the time the insert returns.
  const receiptNo = status === "confirmed" ? await fetchReceiptNo(data.id) : null;

  return { ref: data.ref, receiptNo, paymentId: data.id, status: data.status as PaymentStatus };
}

/**
 * Confirm a payment that was raised as pending — an officer clearing a bank
 * transfer, an agent collecting against a quoted reference, or reconciliation.
 *
 * Idempotent: confirming an already-confirmed payment returns its existing
 * receipt instead of double-counting. The role check lives in the SQL function,
 * so it holds even if a caller reaches the database another way.
 */
export async function confirmPayment(
  paymentId: string,
  opts?: { providerRef?: string | null; channel?: string | null },
): Promise<{ receiptNo: string | null }> {
  const { data, error } = await supabase.rpc("confirm_payment", {
    p_payment_id: paymentId,
    p_provider_ref: opts?.providerRef ?? null,
    p_channel: opts?.channel ?? null,
  });
  if (error) throw new Error(error.message);
  return { receiptNo: data?.receipt_no ?? null };
}

/** Reverse a confirmed payment. The receipt is voided by trigger, not deleted. */
export async function reversePayment(paymentId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from("payments")
    .update({ status: "reversed", notes: reason })
    .eq("id", paymentId);
  if (error) throw new Error(error.message);
}

async function fetchReceiptNo(paymentId: string): Promise<string | null> {
  const { data } = await supabase
    .from("receipts")
    .select("receipt_no")
    .eq("payment_id", paymentId)
    .maybeSingle();
  return data?.receipt_no ?? null;
}

/**
 * Payment references come from a Postgres sequence so they cannot collide.
 * Falls back to the legacy client-side generator only if the RPC is unavailable
 * (i.e. the 20260817* migrations have not been applied yet), so recording a
 * collection keeps working rather than failing outright.
 */
async function nextPaymentRef(): Promise<string> {
  const { data, error } = await supabase.rpc("next_ref", { p_type: "PAY" });
  if (error || !data) return genRef("KWL-PAY");
  return data;
}


export type CollectorTotals = {
  today: number;
  month: number;
  allTime: number;
  countToday: number;
  countAllTime: number;
};

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

/** Revenue totals for a single collector (marshal/officer own achievements). */
export async function fetchCollectorTotals(collectorId: string): Promise<CollectorTotals> {
  const { data, error } = await supabase
    .from("payments")
    .select("amount, created_at, confirmed_at")
    .eq("collector_id", collectorId)
    .eq("status", "confirmed");
  if (error || !data) return { today: 0, month: 0, allTime: 0, countToday: 0, countAllTime: 0 };
  const today = startOfTodayISO();
  const month = startOfMonthISO();
  let t = 0,
    m = 0,
    all = 0,
    ct = 0;
  for (const p of data) {
    const amt = Number(p.amount) || 0;
    // Bucket by when the money was verified, not when the intent was raised:
    // a transfer initiated yesterday and cleared today is today's revenue.
    const at = p.confirmed_at ?? p.created_at;
    all += amt;
    if (at >= month) m += amt;
    if (at >= today) {
      t += amt;
      ct += 1;
    }
  }
  return { today: t, month: m, allTime: all, countToday: ct, countAllTime: data.length };
}

export type CollectorLeaderRow = {
  collectorId: string;
  name: string;
  ward: string | null;
  total: number;
  month: number;
  today: number;
  count: number;
};

/**
 * Per-collector leaderboard for the chairman/officer view. Aggregates the whole
 * payments ledger client-side (RLS lets admin/officer read all rows) and joins
 * profiles for display names.
 */
export async function fetchCollectorLeaderboard(): Promise<CollectorLeaderRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("collector_id, collector_role, amount, created_at, ward")
    .eq("status", "confirmed")
    .not("collector_id", "is", null);
  if (error || !data) return [];

  const today = startOfTodayISO();
  const month = startOfMonthISO();
  const byCollector = new Map<string, CollectorLeaderRow>();
  for (const p of data) {
    const id = p.collector_id as string;
    if (!id) continue;
    const amt = Number(p.amount) || 0;
    const row =
      byCollector.get(id) ??
      { collectorId: id, name: "", ward: (p.ward as string | null) ?? null, total: 0, month: 0, today: 0, count: 0 };
    row.total += amt;
    row.count += 1;
    if (p.created_at >= month) row.month += amt;
    if (p.created_at >= today) row.today += amt;
    byCollector.set(id, row);
  }

  const ids = [...byCollector.keys()];
  if (ids.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, ward").in("id", ids);
    for (const pr of profiles ?? []) {
      const row = byCollector.get(pr.id as string);
      if (row) {
        row.name = (pr.full_name as string) || "Collector";
        row.ward = row.ward ?? ((pr.ward as string | null) ?? null);
      }
    }
  }
  return [...byCollector.values()].sort((a, b) => b.total - a.total);
}

/** How many taxpayers/records a collector has onboarded (attribution). */
export async function fetchOnboardingCountsByCollector(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  await Promise.all(
    REGISTRATION_TABLES.map(async (cfg) => {
      const { data } = await supabase.from(cfg.table).select("registered_by").not("registered_by", "is", null);
      for (const r of (data as NamedRow[] | null) ?? []) {
        const id = str(r.registered_by);
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }),
  );
  return counts;
}

/** Count records a single collector onboarded (marshal own achievement). */
export async function fetchOnboardedCount(collectorId: string): Promise<number> {
  const counts = await Promise.all(
    REGISTRATION_TABLES.map(async (cfg) => {
      const { count } = await supabase
        .from(cfg.table)
        .select("id", { count: "exact", head: true })
        .eq("registered_by", collectorId);
      return count ?? 0;
    }),
  );
  return counts.reduce((a, b) => a + b, 0);
}

// ---------------------------------------------------------------------------
// Ledger reads — the single source of truth for every payment surface
// ---------------------------------------------------------------------------

export type LedgerRow = {
  id: string;
  ref: string;
  amount: number;
  channel: string;
  status: PaymentStatus;
  revenueType: string;
  sourceTable: string;
  sourceRef: string | null;
  ward: string | null;
  payerName: string | null;
  collectorId: string | null;
  collectorRole: string | null;
  notes: string | null;
  obligationPeriod: string | null;
  providerRef: string | null;
  createdAt: string;
  confirmedAt: string | null;
  expiresAt: string | null;
  receiptNo: string | null;
  verifyToken: string | null;
  voided: boolean;
};

type LedgerJoinRow = {
  id: string;
  ref: string;
  amount: number;
  channel: string;
  status: string;
  revenue_type: string;
  source_table: string;
  source_ref: string | null;
  ward: string | null;
  payer_name: string | null;
  collector_id: string | null;
  collector_role: string | null;
  notes: string | null;
  obligation_period: string | null;
  provider_ref: string | null;
  created_at: string;
  confirmed_at: string | null;
  expires_at: string | null;
  receipts: { receipt_no: string; verify_token: string; voided_at: string | null } | null;
};

const LEDGER_COLUMNS =
  "id, ref, amount, channel, status, revenue_type, source_table, source_ref, ward, " +
  "payer_name, collector_id, collector_role, notes, obligation_period, provider_ref, " +
  "created_at, confirmed_at, expires_at, receipts(receipt_no, verify_token, voided_at)";

function toLedgerRow(r: LedgerJoinRow): LedgerRow {
  return {
    id: r.id,
    ref: r.ref,
    amount: Number(r.amount) || 0,
    channel: r.channel,
    status: r.status as PaymentStatus,
    revenueType: r.revenue_type,
    sourceTable: r.source_table,
    sourceRef: r.source_ref,
    ward: r.ward,
    payerName: r.payer_name,
    collectorId: r.collector_id,
    collectorRole: r.collector_role,
    notes: r.notes,
    obligationPeriod: r.obligation_period,
    providerRef: r.provider_ref,
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at,
    expiresAt: r.expires_at,
    receiptNo: r.receipts?.receipt_no ?? null,
    verifyToken: r.receipts?.verify_token ?? null,
    voided: Boolean(r.receipts?.voided_at),
  };
}

/**
 * Read the central ledger with its receipts attached. RLS decides the scope:
 * admin/chairman/officer see everything, a collector sees what they collected,
 * a taxpayer sees their own payments. One query serves all of them.
 */
export async function fetchLedger(opts?: {
  status?: PaymentStatus | PaymentStatus[];
  since?: string;
  limit?: number;
}): Promise<LedgerRow[]> {
  let q = supabase
    .from("payments")
    .select(LEDGER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 500);

  if (opts?.status) {
    const list = Array.isArray(opts.status) ? opts.status : [opts.status];
    q = list.length === 1 ? q.eq("status", list[0]) : q.in("status", list);
  }
  if (opts?.since) q = q.gte("created_at", opts.since);

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as unknown as LedgerJoinRow[]).map(toLedgerRow);
}

/**
 * Money in flight: references a payer has raised but nobody has verified yet.
 * This is the officer/agent reconciliation queue.
 */
export async function fetchPendingPayments(): Promise<LedgerRow[]> {
  return fetchLedger({ status: ["pending", "initiated"] });
}

/** A taxpayer's own payments, newest first (portal payment history). */
export async function fetchMyPayments(payerId: string): Promise<LedgerRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(LEDGER_COLUMNS)
    .eq("payer_id", payerId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as LedgerJoinRow[]).map(toLedgerRow);
}

export type Obligation = {
  revenueType: string;
  label: string;
  amount: number;
  period: string;
  periodLabel: string;
  paid: boolean;
  receiptNo: string | null;
};

/**
 * What an entity owes right now, computed from the rate columns already on its
 * registration row and netted against confirmed payments in the ledger. Used by
 * the staff-facing surfaces; the public flow calls the same SQL function through
 * /api/public/lookup.
 */
export async function fetchObligations(
  sourceTable: RegistrationTable,
  sourceId: string,
): Promise<Obligation[]> {
  const { data, error } = await supabase.rpc("entity_obligations", {
    p_table: sourceTable,
    p_id: sourceId,
  });
  if (error || !data) return [];
  return data.map((o) => ({
    revenueType: o.revenue_type,
    label: o.label,
    amount: Number(o.amount) || 0,
    period: o.period,
    periodLabel: o.period_label,
    paid: o.paid,
    receiptNo: o.receipt_no,
  }));
}
