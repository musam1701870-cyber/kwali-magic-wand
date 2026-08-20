import { createFileRoute, Link } from "@tanstack/react-router";
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
  Home,
  Wallet,
  ClipboardCheck,
  AlertTriangle,
  Download,
  MapPin,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/(public)/properties/")({
  head: () => ({ meta: [{ title: "Properties — Kwali Revenue Portal" }] }),
  component: PropertiesPage,
});

// Property registry on real data, in tenement-rate terms:
//   assessed = properties that have a value and a rate on record;
//   billed   = the annual tenement rate raised;
//   received = confirmed payments against the property;
//   arrears  = billed minus received.

type Property = {
  id: string;
  ref: string;
  property_type: string;
  property_name: string | null;
  address: string;
  ward: string | null;
  district: string | null;
  street: string | null;
  building: string | null;
  landmark: string | null;
  property_class: string | null;
  assessment_ref: string | null;
  assessed_value: number | null;
  annual_rate: number | null;
  outstanding: number | null;
  status: string;
  created_at: string;
};

type PropPayment = { source_id: string | null; amount: number };

function PropertiesPage() {
  const [list, setList] = useState<Property[]>([]);
  const [payments, setPayments] = useState<PropPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState<Property | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [propRes, payRes] = await Promise.all([
        supabase.from("properties").select("*").order("created_at", { ascending: false }).limit(500),
        supabase
          .from("payments")
          .select("source_id, amount")
          .eq("source_table", "properties")
          .eq("status", "confirmed")
          .limit(2000),
      ]);
      if (propRes.error) throw new Error(propRes.error.message);
      if (payRes.error) throw new Error(payRes.error.message);
      setList((propRes.data ?? []) as Property[]);
      setPayments((payRes.data ?? []) as PropPayment[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const receivedBy = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      if (!p.source_id) continue;
      map.set(p.source_id, (map.get(p.source_id) ?? 0) + (Number(p.amount) || 0));
    }
    return map;
  }, [payments]);

  const wards = useMemo(
    () => [...new Set(list.map((p) => p.ward).filter(Boolean))].sort() as string[],
    [list],
  );
  const classes = useMemo(
    () => [...new Set(list.map((p) => p.property_class).filter(Boolean))].sort() as string[],
    [list],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter((p) => {
      if (wardFilter !== "all" && p.ward !== wardFilter) return false;
      if (classFilter !== "all" && p.property_class !== classFilter) return false;
      if (!term) return true;
      return (
        (p.property_name ?? "").toLowerCase().includes(term) ||
        p.address.toLowerCase().includes(term) ||
        p.ref.toLowerCase().includes(term) ||
        (p.assessment_ref ?? "").toLowerCase().includes(term) ||
        (p.street ?? "").toLowerCase().includes(term) ||
        (p.landmark ?? "").toLowerCase().includes(term)
      );
    });
  }, [list, q, wardFilter, classFilter]);

  const stats = useMemo(() => {
    const billed = list.reduce((s, p) => s + (Number(p.annual_rate) || 0), 0);
    const received = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const arrearsList = list.filter((p) => (receivedBy.get(p.id) ?? 0) < (Number(p.annual_rate) || 0));
    return {
      total: list.length,
      active: list.filter((p) => p.status === "Active").length,
      pending: list.filter((p) => p.status === "Pending").length,
      assessed: list.filter((p) => (Number(p.assessed_value) || 0) > 0).length,
      billed,
      received,
      arrearsAmount: Math.max(0, billed - received),
      arrearsCount: arrearsList.length,
    };
  }, [list, payments, receivedBy]);

  const byWard = useMemo(() => {
    const map = new Map<string, { count: number; billed: number; received: number }>();
    for (const p of list) {
      const w = p.ward || "Unassigned";
      const m = map.get(w) ?? { count: 0, billed: 0, received: 0 };
      m.count += 1;
      m.billed += Number(p.annual_rate) || 0;
      m.received += receivedBy.get(p.id) ?? 0;
      map.set(w, m);
    }
    return [...map.entries()].sort((a, b) => b[1].billed - a[1].billed);
  }, [list, receivedBy]);

  function exportCsv() {
    if (!filtered.length) return toast.error("Nothing to export");
    const header = "Ref,Property,Type,Class,Ward,Address,Assessment Ref,Assessed Value,Annual Rate,Received,Arrears,Status";
    const lines = filtered.map((p) => {
      const rec = receivedBy.get(p.id) ?? 0;
      const rate = Number(p.annual_rate) || 0;
      return [p.ref, `"${p.property_name ?? ""}"`, p.property_type, p.property_class ?? "", p.ward ?? "", `"${p.address}"`, p.assessment_ref ?? "", Number(p.assessed_value) || 0, rate, rec, Math.max(0, rate - rec), p.status].join(",");
    });
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kwali-properties-${new Date().toISOString().slice(0, 10)}.csv`;
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
          placeholder="Search name, PIN, address, assessment ref, street, landmark…"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
        />
      </div>
      <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
        <option value="all">All wards</option>
        {wards.map((w) => (
          <option key={w} value={w}>{w}</option>
        ))}
      </select>
      <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
        <option value="all">All classes</option>
        {classes.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );

  const registerSection = (
    <div className="space-y-4">
      {filterBar}
      <div className="flex justify-end">
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>
      {loading ? (
        <div className="surface-card flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading properties…
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <Home className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-ink">No properties found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {list.length === 0 ? "Properties appear here once registered." : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">PIN</th>
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Class</th>
                <th className="px-4 py-3 text-left">Ward</th>
                <th className="px-4 py-3 text-right">Annual rate</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const rate = Number(p.annual_rate) || 0;
                const received = receivedBy.get(p.id) ?? 0;
                const owes = received < rate;
                return (
                  <tr key={p.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs text-ink">{p.ref}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{p.property_name ?? p.address}</div>
                      <div className="text-xs text-muted-foreground">{p.property_type}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.property_class ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.ward ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-sm text-ink">{fmtNaira(rate)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">
                      <span className={owes ? "text-destructive" : "text-success"}>{fmtNaira(received)}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(p)} className="text-xs font-semibold text-primary hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const arrearsSection = (
    <div className="surface-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-display text-base font-bold text-ink">Rates in arrears</h3>
        <p className="text-xs text-muted-foreground">
          Properties whose confirmed payments are below their annual rate — the demand-notice list.
        </p>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : stats.arrearsCount === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <Wallet className="h-8 w-8 text-success" />
          <p className="text-sm font-semibold text-ink">No arrears</p>
          <p className="text-xs text-muted-foreground">Every rated property has paid in full.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {list
            .filter((p) => (receivedBy.get(p.id) ?? 0) < (Number(p.annual_rate) || 0))
            .sort((a, b) => (Number(b.annual_rate) || 0) - (receivedBy.get(b.id) ?? 0) - ((Number(a.annual_rate) || 0) - (receivedBy.get(a.id) ?? 0)))
            .map((p) => {
              const owing = (Number(p.annual_rate) || 0) - (receivedBy.get(p.id) ?? 0);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{p.property_name ?? p.address}</div>
                    <div className="text-xs text-muted-foreground">{p.ref} · {p.ward ?? "—"}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-destructive">{fmtNaira(owing)}</div>
                    <div className="text-[10px] text-muted-foreground">owing</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );

  const wardSection = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {byWard.length === 0 && (
        <div className="surface-card p-10 text-center sm:col-span-3">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-ink">No ward data yet</p>
        </div>
      )}
      {byWard.map(([ward, m]) => {
        const pct = m.billed > 0 ? Math.round((m.received / m.billed) * 100) : 0;
        return (
          <div key={ward} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-base font-bold text-ink">{ward}</div>
                <div className="text-xs text-muted-foreground">{m.count} properties</div>
              </div>
              <span className={"rounded-full px-2 py-0.5 text-[11px] font-bold " + (pct >= 80 ? "bg-emerald-50 text-emerald-700" : pct >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                {pct}% paid
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-surface px-3 py-2">
                <div className="text-[10px] text-muted-foreground">Billed</div>
                <div className="text-sm font-bold text-ink">{fmtNaira(m.billed)}</div>
              </div>
              <div className="rounded-lg bg-surface px-3 py-2">
                <div className="text-[10px] text-muted-foreground">Received</div>
                <div className="text-sm font-bold text-primary">{fmtNaira(m.received)}</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-secondary">
              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <DashboardShell
      title="Properties"
      subtitle="Rated properties and their tenement rates"
      actions={
        <Link to="/properties/register" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95">
          <Plus className="h-4 w-4" /> Register
        </Link>
      }
    >
      <SectionTabs
        sections={[
          {
            id: "overview",
            label: "Overview",
            hint: "The property stream in plain terms — registered, assessed, billed, received.",
            content: (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Kpi label="Registered properties" value={String(stats.total)} hint={`${stats.active} active · ${stats.pending} pending assessment`} icon={<Home className="h-5 w-5" />} tone="primary" />
                  <Kpi label="Rates billed this year" value={fmtNaira(stats.billed)} hint={`${stats.assessed} properties assessed`} icon={<ClipboardCheck className="h-5 w-5" />} tone="gold" />
                  <Kpi label="Money received" value={fmtNaira(stats.received)} hint="Confirmed tenement payments" icon={<Wallet className="h-5 w-5" />} tone="success" />
                </div>
                <div className="surface-card flex items-center gap-3 p-5">
                  <span className="rounded-xl bg-red-50 p-2.5 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
                  <div>
                    <div className="font-display text-lg font-bold text-ink">{fmtNaira(stats.arrearsAmount)} in arrears</div>
                    <div className="text-xs text-muted-foreground">{stats.arrearsCount} properties have not fully paid their rate</div>
                  </div>
                </div>
              </div>
            ),
          },
          { id: "register", label: "Property Register", hint: "Search PIN, address, assessment ref or landmark.", badge: list.length || undefined, content: registerSection },
          { id: "arrears", label: "Arrears", hint: "Properties with unpaid rates.", badge: stats.arrearsCount || undefined, content: arrearsSection },
          { id: "wards", label: "Ward Summary", hint: "Billed vs received for each ward.", content: wardSection },
        ]}
      />

      {selected && <PropDrawer prop={selected} received={receivedBy.get(selected.id) ?? 0} onClose={() => setSelected(null)} />}
    </DashboardShell>
  );
}

function Kpi({ label, value, hint, icon, tone }: { label: string; value: string; hint?: string; icon: React.ReactNode; tone: "success" | "primary" | "gold" }) {
  const bg = tone === "success" ? "bg-emerald-50 text-emerald-600" : tone === "gold" ? "bg-amber-50 text-amber-600" : "bg-primary/8 text-primary";
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

function PropDrawer({ prop, received, onClose }: { prop: Property; received: number; onClose: () => void }) {
  const rate = Number(prop.annual_rate) || 0;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-bold text-ink">{prop.property_name ?? prop.address}</div>
            <div className="font-mono text-xs text-muted-foreground">{prop.ref}</div>
          </div>
          <button onClick={onClose} className="text-sm font-semibold text-muted-foreground hover:text-ink">Close</button>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm">
          {[
            ["Type", prop.property_type],
            ["Class", prop.property_class ?? "—"],
            ["Ward", prop.ward ?? "—"],
            ["Address", prop.address],
            ["Assessment ref", prop.assessment_ref ?? "—"],
            ["Assessed value", fmtNaira(Number(prop.assessed_value) || 0)],
            ["Annual rate", fmtNaira(rate)],
            ["Received", fmtNaira(received)],
            ["Arrears", fmtNaira(Math.max(0, rate - received))],
            ["Status", prop.status],
            ["Registered", prop.created_at.split("T")[0]],
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
