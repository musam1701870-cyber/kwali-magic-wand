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
  Building2,
  Wallet,
  Clock,
  AlertTriangle,
  Download,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/(admin)/businesses")({
  head: () => ({ meta: [{ title: "Business Registry — Kwali Revenue Portal" }] }),
  component: BusinessesPage,
});

// Business registry on real data, in plain council terms:
//   billed  = the annual permit amount assessed on a business;
//   received= confirmed payments against that business;
//   owing   = billed minus received (the arrears officers chase).

type Biz = {
  id: string;
  ref: string;
  business_name: string;
  trading_name: string | null;
  taxpayer_type: string | null;
  category: string | null;
  industry: string | null;
  rc_number: string | null;
  tin: string | null;
  phone: string | null;
  email: string | null;
  owner_name: string | null;
  nin: string | null;
  ward: string | null;
  street: string | null;
  building: string | null;
  district: string | null;
  annual_rate: number | null;
  status: string;
  created_at: string;
};

type BizPayment = {
  source_id: string | null;
  amount: number;
  channel: string;
  created_at: string;
};

function BusinessesPage() {
  const [list, setList] = useState<Biz[]>([]);
  const [payments, setPayments] = useState<BizPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Biz | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bizRes, payRes] = await Promise.all([
        supabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(500),
        supabase
          .from("payments")
          .select("source_id, amount, channel, created_at")
          .eq("source_table", "businesses")
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);
      if (bizRes.error) throw new Error(bizRes.error.message);
      if (payRes.error) throw new Error(payRes.error.message);
      setList((bizRes.data ?? []) as Biz[]);
      setPayments((payRes.data ?? []) as BizPayment[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load businesses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Confirmed money received per business.
  const receivedBy = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      if (!p.source_id) continue;
      map.set(p.source_id, (map.get(p.source_id) ?? 0) + (Number(p.amount) || 0));
    }
    return map;
  }, [payments]);

  const wards = useMemo(
    () => [...new Set(list.map((b) => b.ward).filter(Boolean))].sort() as string[],
    [list],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter((b) => {
      if (wardFilter !== "all" && b.ward !== wardFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!term) return true;
      return (
        b.business_name.toLowerCase().includes(term) ||
        (b.trading_name ?? "").toLowerCase().includes(term) ||
        (b.owner_name ?? "").toLowerCase().includes(term) ||
        (b.rc_number ?? "").toLowerCase().includes(term) ||
        (b.tin ?? "").toLowerCase().includes(term) ||
        (b.phone ?? "").toLowerCase().includes(term) ||
        (b.nin ?? "").toLowerCase().includes(term) ||
        (b.category ?? "").toLowerCase().includes(term) ||
        (b.street ?? "").toLowerCase().includes(term) ||
        b.ref.toLowerCase().includes(term)
      );
    });
  }, [list, q, wardFilter, statusFilter]);

  const stats = useMemo(() => {
    const billed = list.reduce((s, b) => s + (Number(b.annual_rate) || 0), 0);
    const received = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const owing = list.filter((b) => (receivedBy.get(b.id) ?? 0) < (Number(b.annual_rate) || 0));
    return {
      total: list.length,
      active: list.filter((b) => b.status === "Active").length,
      pending: list.filter((b) => b.status === "Pending").length,
      suspended: list.filter((b) => b.status === "Suspended" || b.status === "Expired").length,
      billed,
      received,
      owingAmount: Math.max(0, billed - received),
      owingCount: owing.length,
    };
  }, [list, payments, receivedBy]);

  const byWard = useMemo(() => {
    const map = new Map<string, { count: number; billed: number; received: number }>();
    for (const b of list) {
      const w = b.ward || "Unassigned";
      const m = map.get(w) ?? { count: 0, billed: 0, received: 0 };
      m.count += 1;
      m.billed += Number(b.annual_rate) || 0;
      m.received += receivedBy.get(b.id) ?? 0;
      map.set(w, m);
    }
    return [...map.entries()].sort((a, b) => b[1].billed - a[1].billed);
  }, [list, receivedBy]);

  function exportCsv() {
    if (!filtered.length) return toast.error("Nothing to export");
    const header = "Ref,Business,Owner,Categoory,RC,TIN,Ward,Phone,Status,Billed,Received,Owing";
    const lines = filtered.map((b) => {
      const rec = receivedBy.get(b.id) ?? 0;
      const billed = Number(b.annual_rate) || 0;
      return [b.ref, `"${b.business_name}"`, `"${b.owner_name ?? ""}"`, `"${b.category ?? ""}"`, b.rc_number ?? "", b.tin ?? "", b.ward ?? "", b.phone ?? "", b.status, billed, rec, Math.max(0, billed - rec)].join(",");
    });
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kwali-businesses-${new Date().toISOString().slice(0, 10)}.csv`;
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
          placeholder="Search name, owner, RC/CAC, TIN, phone, NIN, category, street…"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
        />
      </div>
      <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
        <option value="all">All wards</option>
        {wards.map((w) => (
          <option key={w} value={w}>{w}</option>
        ))}
      </select>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
        <option value="all">All statuses</option>
        <option value="Active">Active</option>
        <option value="Pending">Pending</option>
        <option value="Suspended">Suspended</option>
        <option value="Expired">Expired</option>
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
          <Loader2 className="h-4 w-4 animate-spin" /> Loading businesses…
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-ink">No businesses found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {list.length === 0 ? "Businesses appear here once registered." : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Business</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Ward</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Billed</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b) => {
                const billed = Number(b.annual_rate) || 0;
                const received = receivedBy.get(b.id) ?? 0;
                const owes = received < billed;
                return (
                  <tr key={b.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs text-ink">{b.ref}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{b.business_name}</div>
                      {b.owner_name && <div className="text-xs text-muted-foreground">{b.owner_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.category ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.ward ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right text-sm text-ink">{fmtNaira(billed)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">
                      <span className={owes ? "text-destructive" : "text-success"}>{fmtNaira(received)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(b)} className="text-xs font-semibold text-primary hover:underline">
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

  const owingSection = (
    <div className="surface-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-display text-base font-bold text-ink">Unpaid business bills</h3>
        <p className="text-xs text-muted-foreground">
          Businesses whose confirmed payments are below their annual bill — the arrears list for officers.
        </p>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : stats.owingCount === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <Wallet className="h-8 w-8 text-success" />
          <p className="text-sm font-semibold text-ink">No arrears</p>
          <p className="text-xs text-muted-foreground">Every billed business has paid in full.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {list
            .filter((b) => (receivedBy.get(b.id) ?? 0) < (Number(b.annual_rate) || 0))
            .sort((a, b) => (Number(b.annual_rate) || 0) - (receivedBy.get(b.id) ?? 0) - ((Number(a.annual_rate) || 0) - (receivedBy.get(a.id) ?? 0)))
            .map((b) => {
              const owing = (Number(b.annual_rate) || 0) - (receivedBy.get(b.id) ?? 0);
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{b.business_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.ref} · {b.ward ?? "—"}{b.phone ? ` · ${b.phone}` : ""}
                    </div>
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
                <div className="text-xs text-muted-foreground">{m.count} businesses</div>
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
    <DashboardShell title="Business Registry" subtitle="Registered businesses, their annual bills and what they have paid">
      <SectionTabs
        sections={[
          {
            id: "overview",
            label: "Overview",
            hint: "The business stream in plain terms — registered, billed, received, owing.",
            content: (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Kpi label="Registered businesses" value={String(stats.total)} hint={`${stats.active} active · ${stats.pending} awaiting approval`} icon={<Building2 className="h-5 w-5" />} tone="primary" />
                  <Kpi label="Bills raised this year" value={fmtNaira(stats.billed)} hint="Total annual permits assessed" icon={<Clock className="h-5 w-5" />} tone="gold" />
                  <Kpi label="Money received" value={fmtNaira(stats.received)} hint="Confirmed payments from businesses" icon={<Wallet className="h-5 w-5" />} tone="success" />
                </div>
                <div className="surface-card flex items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-red-50 p-2.5 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
                    <div>
                      <div className="font-display text-lg font-bold text-ink">{fmtNaira(stats.owingAmount)} still to collect</div>
                      <div className="text-xs text-muted-foreground">
                        {stats.owingCount} businesses have not fully paid · {stats.suspended} suspended or expired
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          { id: "register", label: "Business Register", hint: "Search any field — RC/CAC, TIN, owner, phone, NIN, ward.", badge: list.length || undefined, content: registerSection },
          { id: "owing", label: "Owing", hint: "Businesses with unpaid annual bills.", badge: stats.owingCount || undefined, content: owingSection },
          { id: "wards", label: "Ward Summary", hint: "Billed vs received for each ward.", content: wardSection },
        ]}
      />

      {selected && <BizDrawer biz={selected} received={receivedBy.get(selected.id) ?? 0} onClose={() => setSelected(null)} />}
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

function BizDrawer({ biz, received, onClose }: { biz: Biz; received: number; onClose: () => void }) {
  const billed = Number(biz.annual_rate) || 0;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-bold text-ink">{biz.business_name}</div>
            <div className="font-mono text-xs text-muted-foreground">{biz.ref}</div>
          </div>
          <button onClick={onClose} className="text-sm font-semibold text-muted-foreground hover:text-ink">Close</button>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm">
          {[
            ["Owner", biz.owner_name ?? "—"],
            ["Category", biz.category ?? biz.taxpayer_type ?? "—"],
            ["RC / CAC", biz.rc_number ?? "—"],
            ["TIN", biz.tin ?? "—"],
            ["Phone", biz.phone ?? "—"],
            ["Email", biz.email ?? "—"],
            ["Ward", biz.ward ?? "—"],
            ["Address", [biz.building, biz.street, biz.district].filter(Boolean).join(", ") || "—"],
            ["Status", biz.status],
            ["Registered", biz.created_at.split("T")[0]],
            ["Annual bill", fmtNaira(billed)],
            ["Received", fmtNaira(received)],
            ["Owing", fmtNaira(Math.max(0, billed - received))],
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
