import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { SectionTabs } from "@/shared/components/ui/SectionTabs";
import { supabase } from "@/integrations/supabase/client";
import { fmtNaira } from "@/shared/lib/utils";
import {
  Search,
  Loader2,
  Users,
  Building2,
  Home,
  Store,
  Bike,
  Landmark,
  Download,
  Wallet,
  CreditCard,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/(admin)/taxpayers")({
  head: () => ({ meta: [{ title: "Taxpayer Registry — Kwali Revenue Portal" }] }),
  component: TaxpayersPage,
});

// The unified taxpayer registry — every registered obligation holder across
// all seven registration tables, grouped the way the council actually collects:
// formal businesses, properties, informal market traders, and transport
// operators. All real Supabase data, sectioned so no screen is overloaded.

type RegRow = {
  key: string;
  table: string;
  id: string;
  ref: string;
  name: string;
  subtitle: string;
  ward: string | null;
  phone: string | null;
  nin: string | null;
  status: string;
  annualAmount: number;
  created_at: string;
  owner_id: string | null;
};

type GroupId = "businesses" | "properties" | "markets" | "transport";

const GROUPS: { id: GroupId; label: string; icon: React.ReactNode; tables: string[] }[] = [
  { id: "businesses", label: "Businesses", icon: <Building2 className="h-4 w-4" />, tables: ["businesses", "hospitality_permits", "pos_operators"] },
  { id: "properties", label: "Properties", icon: <Home className="h-4 w-4" />, tables: ["properties"] },
  { id: "markets", label: "Market Traders", icon: <Store className="h-4 w-4" />, tables: ["market_stalls"] },
  { id: "transport", label: "Transport", icon: <Bike className="h-4 w-4" />, tables: ["transport_vehicles"] },
];

function groupFor(table: string): GroupId {
  if (table === "properties") return "properties";
  if (table === "market_stalls") return "markets";
  if (table === "transport_vehicles") return "transport";
  return "businesses";
}

type RawRow = Record<string, unknown>;
const s = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const n = (v: unknown): number => Number(v) || 0;

function mapRow(table: string, r: RawRow): RegRow {
  const base = {
    table,
    id: String(r.id),
    ref: String(r.ref ?? ""),
    ward: s(r.ward),
    status: String(r.status ?? "Pending"),
    created_at: String(r.created_at ?? ""),
    owner_id: s(r.owner_id),
    key: `${table}:${r.id}`,
  };
  switch (table) {
    case "businesses":
      return { ...base, name: s(r.business_name) || s(r.trading_name) || "Business", subtitle: s(r.category) || s(r.taxpayer_type) || "Registered business", phone: s(r.phone), nin: s(r.nin), annualAmount: n(r.annual_rate) };
    case "properties":
      return { ...base, name: s(r.property_name) || s(r.address) || "Property", subtitle: [s(r.property_type), s(r.address)].filter(Boolean).join(" · ") || "Tenement", phone: null, nin: null, annualAmount: n(r.annual_rate) };
    case "market_stalls":
      return { ...base, name: s(r.trader_name) || "Trader", subtitle: [s(r.market_name), s(r.stall_number)].filter(Boolean).join(" · ") || "Market trader", phone: s(r.trader_phone), nin: s(r.trader_nin), annualAmount: n(r.daily_toll) * 300 };
    case "transport_vehicles":
      return { ...base, name: s(r.operator_name) || s(r.plate_number) || "Operator", subtitle: [s(r.vehicle_type)?.replace(/-/g, " "), s(r.plate_number)].filter(Boolean).join(" · ") || "Transport", phone: s(r.operator_phone), nin: s(r.operator_nin), annualAmount: n(r.daily_ticket_price) * 300 };
    case "hospitality_permits":
      return { ...base, name: s(r.establishment_name) || "Establishment", subtitle: s(r.establishment_type) || "Hospitality", phone: null, nin: null, annualAmount: n(r.annual_permit_fee) };
    case "pos_operators":
      return { ...base, name: s(r.operator_name) || s(r.business_name) || "POS operator", subtitle: s(r.location) || "POS / agency banking", phone: s(r.phone), nin: null, annualAmount: n(r.annual_permit_fee) };
    default: // sanitation_subscriptions
      return { ...base, name: s(r.subscriber_name) || "Subscriber", subtitle: s(r.service_type) || "Sanitation", phone: s(r.phone), nin: null, annualAmount: n(r.monthly_fee) * 12 };
  }
}

const ALL_TABLES = ["businesses", "properties", "market_stalls", "transport_vehicles", "hospitality_permits", "pos_operators", "sanitation_subscriptions"];

function TaxpayersPage() {
  const [rows, setRows] = useState<RegRow[]>([]);
  const [paymentBySource, setPaymentBySource] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<RegRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        ALL_TABLES.map((t) =>
          supabase.from(t).select("*").order("created_at", { ascending: false }).limit(500),
        ),
      );
      const all: RegRow[] = [];
      results.forEach((res, i) => {
        if (res.error) throw new Error(res.error.message);
        for (const r of (res.data ?? []) as RawRow[]) all.push(mapRow(ALL_TABLES[i], r));
      });
      setRows(all);

      // Confirmed revenue per entity for the financial view.
      const { data: pays } = await supabase
        .from("payments")
        .select("source_table, source_id, amount")
        .eq("status", "confirmed");
      const map = new Map<string, number>();
      for (const p of (pays ?? []) as { source_table: string; source_id: string | null; amount: number }[]) {
        if (!p.source_id) continue;
        const k = `${p.source_table}:${p.source_id}`;
        map.set(k, (map.get(k) ?? 0) + (Number(p.amount) || 0));
      }
      setPaymentBySource(map);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const wards = useMemo(
    () => [...new Set(rows.map((r) => r.ward).filter(Boolean))].sort() as string[],
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (wardFilter !== "all" && r.ward !== wardFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        r.ref.toLowerCase().includes(term) ||
        (r.phone ?? "").toLowerCase().includes(term) ||
        (r.nin ?? "").toLowerCase().includes(term) ||
        r.subtitle.toLowerCase().includes(term)
      );
    });
  }, [rows, q, wardFilter, statusFilter]);

  const stats = useMemo(() => {
    const byGroup = (g: GroupId) => rows.filter((r) => groupFor(r.table) === g);
    const collected = rows.reduce((sum, r) => sum + (paymentBySource.get(r.key) ?? 0), 0);
    return {
      total: rows.length,
      active: rows.filter((r) => r.status === "Active").length,
      pending: rows.filter((r) => r.status === "Pending").length,
      collected,
      businesses: byGroup("businesses").length,
      properties: byGroup("properties").length,
      markets: byGroup("markets").length,
      transport: byGroup("transport").length,
    };
  }, [rows, paymentBySource]);

  function exportCsv(groupRows: RegRow[], label: string) {
    if (!groupRows.length) return toast.error("Nothing to export");
    const header = "Ref,Name,Detail,Ward,Phone,NIN,Status,Annual/Projected ₦,Collected ₦";
    const lines = groupRows.map((r) =>
      [r.ref, `"${r.name}"`, `"${r.subtitle}"`, r.ward ?? "", r.phone ?? "", r.nin ?? "", r.status, r.annualAmount, paymentBySource.get(r.key) ?? 0].join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kwali-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Register downloaded");
  }

  const filterBar = (
    <div className="surface-card flex flex-wrap items-center gap-3 p-4">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, ref, phone, NIN or detail…"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
        />
      </div>
      <select
        value={wardFilter}
        onChange={(e) => setWardFilter(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="all">All wards</option>
        {wards.map((w) => (
          <option key={w} value={w}>{w}</option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="all">All statuses</option>
        <option value="Active">Active</option>
        <option value="Pending">Pending</option>
        <option value="Suspended">Suspended</option>
      </select>
    </div>
  );

  function registerTable(groupRows: RegRow[]) {
    if (loading) {
      return (
        <div className="surface-card flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading registry…
        </div>
      );
    }
    if (groupRows.length === 0) {
      return (
        <div className="surface-card p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-ink">No records match</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registrations appear here as they are approved or onboarded.
          </p>
        </div>
      );
    }
    return (
      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Ref</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Detail</th>
              <th className="px-4 py-3 text-left">Ward</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Collected</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groupRows.map((r) => (
              <tr key={r.key} className="hover:bg-secondary/30">
                <td className="px-4 py-3 font-mono text-xs text-ink">{r.ref}</td>
                <td className="px-4 py-3 font-semibold text-ink">{r.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.subtitle}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{r.ward ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{r.phone ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                  {fmtNaira(paymentBySource.get(r.key) ?? 0)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelected(r)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <DashboardShell
      title="Taxpayer Registry"
      subtitle="Every obligation holder — businesses, properties, market traders and transport operators"
    >
      <SectionTabs
        sections={[
          {
            id: "overview",
            label: "Overview",
            hint: "Registry size and collection performance at a glance.",
            content: (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Kpi label="Registered taxpayers" value={stats.total.toLocaleString()} hint={`${stats.active} active · ${stats.pending} pending`} icon={<Users className="h-5 w-5" />} />
                  <Kpi label="Collected to date" value={fmtNaira(stats.collected)} hint="Confirmed payments across all registers" icon={<Wallet className="h-5 w-5" />} />
                  <Kpi label="Awaiting approval" value={String(stats.pending)} hint="Pending officer review" icon={<CreditCard className="h-5 w-5" />} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {GROUPS.map((g) => (
                    <div key={g.id} className="surface-card flex items-center gap-3 p-4">
                      <span className="rounded-xl bg-primary/10 p-2.5 text-primary">{g.icon}</span>
                      <div>
                        <div className="font-display text-xl font-bold text-ink">
                          {stats[g.id as keyof typeof stats] as number}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground">{g.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          ...GROUPS.map((g) => {
            const groupRows = filtered.filter((r) => groupFor(r.table) === g.id);
            return {
              id: g.id,
              label: g.label,
              hint: `${g.label} register — search any field, filter by ward or status.`,
              badge: rows.filter((r) => groupFor(r.table) === g.id).length || undefined,
              content: (
                <div className="space-y-4">
                  {filterBar}
                  <div className="flex justify-end">
                    <button
                      onClick={() => exportCsv(groupRows, g.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
                    >
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </button>
                  </div>
                  {registerTable(groupRows)}
                </div>
              ),
            };
          }),
        ]}
      />

      {selected && (
        <RecordDrawer
          row={selected}
          collected={paymentBySource.get(selected.key) ?? 0}
          onClose={() => setSelected(null)}
        />
      )}
    </DashboardShell>
  );
}

function Kpi({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon: React.ReactNode }) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-primary/8 p-2.5 text-primary">{icon}</div>
      </div>
      <div className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}

function RecordDrawer({ row, collected, onClose }: { row: RegRow; collected: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-bold text-ink">{row.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{row.ref}</div>
          </div>
          <button onClick={onClose} className="text-sm font-semibold text-muted-foreground hover:text-ink">
            Close
          </button>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm">
          {[
            ["Register", GROUPS.find((g) => g.id === groupFor(row.table))?.label ?? row.table],
            ["Detail", row.subtitle],
            ["Ward", row.ward ?? "—"],
            ["Phone", row.phone ?? "—"],
            ["NIN", row.nin ?? "—"],
            ["Status", row.status],
            ["Registered", row.created_at.split("T")[0]],
            ["Collected to date", fmtNaira(collected)],
            ["Annual / projected", fmtNaira(row.annualAmount)],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
              <span className="text-muted-foreground">{k}</span>
              <span className="text-right font-semibold text-ink">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
