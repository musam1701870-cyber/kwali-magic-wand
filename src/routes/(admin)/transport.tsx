import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { TaxpayerIdCard } from "@/shared/components/ui/TaxpayerIdCard";
import { LevyEducation } from "@/shared/components/ui/LevyEducation";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { recordPayment } from "@/shared/lib/revenue";
import { fmtNaira } from "@/shared/lib/utils";
import {
  Search,
  QrCode,
  CheckCircle2,
  Banknote,
  Receipt,
  ArrowLeft,
  Loader2,
  Bike,
  Truck,
  Bus,
  TrendingUp,
  Wallet,
  ShieldAlert,
  MapPin,
  CalendarDays,
} from "lucide-react";

export const Route = createFileRoute("/(admin)/transport")({
  head: () => ({ meta: [{ title: "Transport — Kwali Revenue Portal" }] }),
  component: TransportPage,
});

// The transport hub — everything about the stream in one place, on real data:
//   * the live vehicle register (keke, okada, commercial vehicles) with each
//     vehicle's daily-ticket standing read from the central payments ledger;
//   * financial performance of the stream (today / month / all-time, per ward
//     and per vehicle type);
//   * daily ticket issuance that writes a real confirmed payment + receipt,
//     idempotent per vehicle per day;
//   * the operator's ID card with its scannable QR for roadside verification.

type Vehicle = {
  id: string;
  ref: string;
  qr_token: string | null;
  vehicle_type: string;
  plate_number: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
  operator_name: string | null;
  operator_phone: string | null;
  ward: string | null;
  route: string | null;
  daily_ticket_price: number | null;
  status: string;
  created_at: string;
};

type TicketPayment = {
  id: string;
  ref: string;
  source_id: string | null;
  amount: number;
  channel: string;
  ward: string | null;
  created_at: string;
};

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; rate: number }> = {
  tricycle: { label: "Tricycle (Keke)", icon: <Bike className="h-5 w-5" />, rate: 100 },
  motorcycle: { label: "Motorcycle (Okada)", icon: <Bike className="h-5 w-5" />, rate: 100 },
  "commercial-vehicle": { label: "Commercial vehicle", icon: <Bus className="h-5 w-5" />, rate: 500 },
};

function typeMeta(t: string) {
  return TYPE_META[t] ?? { label: t.replace(/-/g, " "), icon: <Truck className="h-5 w-5" />, rate: 100 };
}

function dayStart(offsetDays = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function monthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function TransportPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tickets, setTickets] = useState<TicketPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [buyingFor, setBuyingFor] = useState<string | null>(null);
  const [days, setDays] = useState<Record<string, number>>({});
  const [cardFor, setCardFor] = useState<Vehicle | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vehiclesRes, ticketsRes] = await Promise.all([
        supabase
          .from("transport_vehicles")
          .select(
            "id, ref, qr_token, vehicle_type, plate_number, make, model, color, year, operator_name, operator_phone, ward, route, daily_ticket_price, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("payments")
          .select("id, ref, source_id, amount, channel, ward, created_at")
          .eq("source_table", "transport_vehicles")
          .eq("revenue_type", "daily_ticket")
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);
      if (vehiclesRes.error) throw new Error(vehiclesRes.error.message);
      if (ticketsRes.error) throw new Error(ticketsRes.error.message);
      setVehicles((vehiclesRes.data ?? []) as Vehicle[]);
      setTickets((ticketsRes.data ?? []) as TicketPayment[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load transport data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ---- Derived state -------------------------------------------------------

  const todayISO = dayStart();
  const paidTodayIds = useMemo(
    () => new Set(tickets.filter((t) => t.created_at >= todayISO).map((t) => t.source_id)),
    [tickets, todayISO],
  );

  const stats = useMemo(() => {
    const monthISO = monthStart();
    const sum = (rows: TicketPayment[]) => rows.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const todayRows = tickets.filter((t) => t.created_at >= todayISO);
    const monthRows = tickets.filter((t) => t.created_at >= monthISO);
    return {
      active: vehicles.filter((v) => v.status === "Active").length,
      pending: vehicles.filter((v) => v.status === "Pending").length,
      compliantToday: paidTodayIds.size,
      nonCompliant: vehicles.filter((v) => v.status === "Active" && !paidTodayIds.has(v.id)).length,
      todayAmount: sum(todayRows),
      todayCount: todayRows.length,
      monthAmount: sum(monthRows),
      allTimeAmount: sum(tickets),
    };
  }, [vehicles, tickets, paidTodayIds, todayISO]);

  const byWard = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tickets) {
      const w = t.ward || "Unassigned";
      map.set(w, (map.get(w) ?? 0) + (Number(t.amount) || 0));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [tickets]);

  const byType = useMemo(() => {
    const map = new Map<string, { count: number; active: number }>();
    for (const v of vehicles) {
      const m = map.get(v.vehicle_type) ?? { count: 0, active: 0 };
      m.count += 1;
      if (v.status === "Active") m.active += 1;
      map.set(v.vehicle_type, m);
    }
    return [...map.entries()];
  }, [vehicles]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (typeFilter !== "all" && v.vehicle_type !== typeFilter) return false;
      if (!term) return true;
      return (
        (v.plate_number ?? "").toLowerCase().includes(term) ||
        (v.operator_name ?? "").toLowerCase().includes(term) ||
        v.ref.toLowerCase().includes(term) ||
        (v.route ?? "").toLowerCase().includes(term) ||
        v.qr_token === q.trim()
      );
    });
  }, [vehicles, q, typeFilter]);

  // ---- Ticket issuance -----------------------------------------------------

  async function buyTicket(v: Vehicle) {
    if (!user) return;
    const nDays = Math.max(1, Math.min(30, days[v.id] ?? 1));
    const rate = Number(v.daily_ticket_price) || typeMeta(v.vehicle_type).rate;
    const amount = rate * nDays;
    setBuyingFor(v.id);
    try {
      const day = new Date().toISOString().slice(0, 10);
      const { ref, receiptNo } = await recordPayment({
        collectorId: user.id,
        collectorRole: "officer",
        payerName: v.operator_name ?? v.plate_number ?? "Transport operator",
        sourceTable: "transport_vehicles",
        sourceId: v.id,
        sourceRef: v.ref,
        revenueType: "daily_ticket",
        amount,
        channel: "cash",
        ward: v.ward,
        obligationPeriod: day,
        // One ticket per vehicle per day — retrying or double-tapping is safe.
        idempotencyKey: `ticket:${v.id}:${day}`,
        notes: nDays > 1 ? `${nDays}-day ticket` : null,
      });
      toast.success(`Ticket issued · ${fmtNaira(amount)}`, {
        description: receiptNo ? `Receipt ${receiptNo}` : ref,
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not issue the ticket");
    } finally {
      setBuyingFor(null);
    }
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <DashboardShell title="Transport" subtitle="Vehicles, daily tickets and stream revenue">
      <div className="mb-6">
        <LevyEducation category="transport" />
      </div>

      {/* Financial strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collected today"
          value={fmtNaira(stats.todayAmount)}
          hint={`${stats.todayCount} ticket${stats.todayCount === 1 ? "" : "s"} issued`}
          icon={<Wallet className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="This month"
          value={fmtNaira(stats.monthAmount)}
          hint="Month to date"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="All time"
          value={fmtNaira(stats.allTimeAmount)}
          hint={`${tickets.length} tickets on record`}
          icon={<CalendarDays className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Compliant today"
          value={`${stats.compliantToday} / ${stats.active}`}
          hint={`${stats.nonCompliant} active vehicles without today's ticket`}
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Register + tickets (main column) */}
        <div className="space-y-6 xl:col-span-2">
          {/* Filters */}
          <div className="surface-card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search plate, operator, ref, route — or scan a QR sticker…"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm"
                />
              </div>
              <div className="flex gap-1.5">
                {["all", "tricycle", "motorcycle", "commercial-vehicle"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={
                      "rounded-lg px-3 py-2 text-xs font-semibold transition " +
                      (typeFilter === t
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground hover:bg-secondary")
                    }
                  >
                    {t === "all" ? "All" : typeMeta(t).label.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle list */}
          {loading ? (
            <div className="surface-card flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading vehicles…
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <Truck className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-semibold text-ink">No vehicles found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {vehicles.length === 0
                  ? "No transport vehicles are registered yet — marshals onboard them in the field."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((v) => {
                const paid = paidTodayIds.has(v.id);
                const meta = typeMeta(v.vehicle_type);
                const rate = Number(v.daily_ticket_price) || meta.rate;
                const nDays = days[v.id] ?? 1;
                const busy = buyingFor === v.id;
                return (
                  <div key={v.id} className="surface-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {meta.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-base font-bold text-ink">
                              {v.plate_number ?? "No plate"}
                            </span>
                            <StatusBadge status={v.status} />
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">{v.ref}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {v.operator_name ?? "—"} · {meta.label}
                            {v.route ? ` · ${v.route}` : ""}
                            {v.ward ? ` · Ward ${v.ward}` : ""}
                          </div>
                          {(v.make || v.model || v.color) && (
                            <div className="mt-0.5 text-[11px] text-muted-foreground/80">
                              {[v.color, v.make, v.model, v.year].filter(Boolean).join(" ")}
                            </div>
                          )}
                        </div>
                      </div>
                      {v.status === "Active" &&
                        (paid ? (
                          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> TICKET ACTIVE
                          </span>
                        ) : (
                          <StatusBadge tone="danger">NO TICKET TODAY</StatusBadge>
                        ))}
                    </div>

                    {v.status === "Active" && !paid && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Daily rate</div>
                            <div className="font-display text-lg font-bold text-ink">
                              {fmtNaira(rate)}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Days</label>
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={nDays}
                              onChange={(e) =>
                                setDays((d) => ({
                                  ...d,
                                  [v.id]: Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                                }))
                              }
                              className="mt-0.5 w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
                            />
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-bold text-primary">{fmtNaira(rate * nDays)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => buyTicket(v)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Banknote className="h-4 w-4" />
                          )}
                          Pay & issue ticket
                        </button>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-3 text-[11px]">
                      <button
                        onClick={() => setCardFor(cardFor?.id === v.id ? null : v)}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <QrCode className="h-3 w-3" />
                        {cardFor?.id === v.id ? "Hide ID card" : "View ID card"}
                      </button>
                      {v.operator_phone && (
                        <span className="text-muted-foreground">{v.operator_phone}</span>
                      )}
                    </div>

                    {cardFor?.id === v.id && (
                      <div className="mt-4 border-t border-border pt-4">
                        <TaxpayerIdCard
                          refNo={v.ref}
                          qrToken={v.qr_token}
                          name={v.operator_name ?? v.plate_number ?? "Operator"}
                          kind="Transport Operator"
                          lines={[
                            { label: "Plate", value: v.plate_number ?? "—" },
                            { label: "Vehicle", value: meta.label },
                            { label: "Route", value: v.route ?? "—" },
                            { label: "Ward", value: v.ward ?? "—" },
                          ]}
                          issuedAt={v.created_at.split("T")[0]}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right rail: stream breakdown */}
        <div className="space-y-6">
          {/* Fleet composition */}
          <div className="surface-card p-5">
            <h3 className="font-display text-base font-bold text-ink">Fleet composition</h3>
            <p className="text-xs text-muted-foreground">
              {vehicles.length} registered · {stats.active} active · {stats.pending} pending
            </p>
            <div className="mt-4 space-y-3">
              {byType.length === 0 && (
                <p className="text-xs text-muted-foreground">No vehicles registered yet.</p>
              )}
              {byType.map(([type, m]) => {
                const meta = typeMeta(type);
                const pct = vehicles.length ? Math.round((m.count / vehicles.length) * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-ink">
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-muted-foreground">
                        {m.count} ({m.active} active)
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue by ward */}
          <div className="surface-card p-5">
            <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
              <MapPin className="h-4 w-4 text-primary" /> Ticket revenue by ward
            </h3>
            <div className="mt-4 space-y-2.5">
              {byWard.length === 0 && (
                <p className="text-xs text-muted-foreground">No tickets recorded yet.</p>
              )}
              {byWard.map(([ward, amount]) => {
                const max = byWard[0]?.[1] || 1;
                return (
                  <div key={ward}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">{ward}</span>
                      <span className="font-semibold text-primary">{fmtNaira(amount)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-gold transition-all"
                        style={{ width: `${Math.max(4, Math.round((amount / max) * 100))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent tickets */}
          <div className="surface-card p-5">
            <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
              <Receipt className="h-4 w-4 text-primary" /> Recent tickets
            </h3>
            <div className="mt-3 space-y-2">
              {tickets.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11px] text-ink">{t.ref}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t.created_at.split("T")[0]} · {t.ward ?? "—"} · {t.channel}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {fmtNaira(Number(t.amount) || 0)}
                  </span>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tickets issued today will appear here.
                </p>
              )}
            </div>
            <Link
              to="/payments"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3 rotate-180" /> Full payments ledger
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "success" | "primary" | "gold" | "danger";
}) {
  const bg =
    tone === "success"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "gold"
        ? "bg-amber-50 text-amber-600"
        : tone === "danger"
          ? "bg-red-50 text-red-600"
          : "bg-primary/8 text-primary";
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${bg}`}>{icon}</div>
      </div>
      <div className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}
