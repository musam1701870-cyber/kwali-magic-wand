import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { SectionTabs } from "@/shared/components/ui/SectionTabs";
import { supabase } from "@/integrations/supabase/client";
import { fmtNaira } from "@/shared/lib/utils";
import {
  AlertTriangle,
  Wallet,
  ClipboardList,
  MapPin,
  Loader2,
  Store,
  Bike,
  Building2,
  Home,
} from "lucide-react";

export const Route = createFileRoute("/(admin)/intelligence")({
  head: () => ({ meta: [{ title: "Revenue Watch — Kwali Revenue Portal" }] }),
  component: RevenueWatchPage,
});

// Revenue Watch — practical flags from the live registers, in plain terms:
// where money is expected, where it has come in, and which areas need
// follow-up. No forecasts or invented insights — only what the data shows.

type CountRow = { ward: string | null; status: string; annual?: number | null };

function RevenueWatchPage() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<CountRow[]>([]);
  const [properties, setProperties] = useState<CountRow[]>([]);
  const [stalls, setStalls] = useState<CountRow[]>([]);
  const [vehicles, setVehicles] = useState<CountRow[]>([]);
  const [payments, setPayments] = useState<{ source_table: string; amount: number; ward: string | null; created_at: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, p, m, t, pay] = await Promise.all([
        supabase.from("businesses").select("ward, status, annual_rate").limit(1000),
        supabase.from("properties").select("ward, status, annual_rate").limit(1000),
        supabase.from("market_stalls").select("ward, status").limit(1000),
        supabase.from("transport_vehicles").select("ward, status").limit(1000),
        supabase
          .from("payments")
          .select("source_table, amount, ward, created_at")
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);
      for (const r of [b, p, m, t, pay]) if (r.error) throw new Error(r.error.message);
      setBusinesses((b.data ?? []) as CountRow[]);
      setProperties((p.data ?? []) as CountRow[]);
      setStalls((m.data ?? []) as CountRow[]);
      setVehicles((t.data ?? []) as CountRow[]);
      setPayments((pay.data ?? []) as { source_table: string; amount: number; ward: string | null; created_at: string }[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load revenue watch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);

  const streamStats = useMemo(() => {
    const receivedFor = (table: string) =>
      payments.filter((p) => p.source_table === table).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const billedBiz = businesses.reduce((s, r) => s + (Number(r.annual) || 0), 0);
    const billedProps = properties.reduce((s, r) => s + (Number(r.annual) || 0), 0);
    return [
      { id: "businesses", label: "Businesses", icon: <Building2 className="h-4 w-4" />, registered: businesses.length, pending: businesses.filter((r) => r.status === "Pending").length, billed: billedBiz, received: receivedFor("businesses") },
      { id: "properties", label: "Properties", icon: <Home className="h-4 w-4" />, registered: properties.length, pending: properties.filter((r) => r.status === "Pending").length, billed: billedProps, received: receivedFor("properties") },
      { id: "markets", label: "Market traders", icon: <Store className="h-4 w-4" />, registered: stalls.length, pending: stalls.filter((r) => r.status === "Pending").length, billed: 0, received: receivedFor("market_stalls") },
      { id: "transport", label: "Transport", icon: <Bike className="h-4 w-4" />, registered: vehicles.length, pending: vehicles.filter((r) => r.status === "Pending").length, billed: 0, received: receivedFor("transport_vehicles") },
    ];
  }, [businesses, properties, stalls, vehicles, payments]);

  const todayByWard = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments.filter((x) => x.created_at.slice(0, 10) === today)) {
      const w = p.ward || "Unassigned";
      map.set(w, (map.get(w) ?? 0) + (Number(p.amount) || 0));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [payments, today]);

  // Practical follow-up flags, each phrased as something an officer understands.
  const flags = useMemo(() => {
    const list: { title: string; detail: string; tone: "danger" | "warning" }[] = [];
    const pendingTotal = streamStats.reduce((s, x) => s + x.pending, 0);
    if (pendingTotal > 0)
      list.push({ title: `${pendingTotal} registrations are waiting for approval`, detail: "Businesses, properties, traders and vehicles that cannot be billed until an officer approves them.", tone: "warning" });
    const unpaidBiz = streamStats[0].billed - streamStats[0].received;
    if (unpaidBiz > 0)
      list.push({ title: `${fmtNaira(unpaidBiz)} in business bills is unpaid`, detail: "Open the Business Registry 'Owing' list and issue demand notices.", tone: "danger" });
    const unpaidProps = streamStats[1].billed - streamStats[1].received;
    if (unpaidProps > 0)
      list.push({ title: `${fmtNaira(unpaidProps)} in tenement rates is unpaid`, detail: "Open the Properties 'Arrears' list and follow up with property owners.", tone: "danger" });
    if (todayByWard.length > 0) {
      const [, topAmount] = todayByWard[0];
      const total = todayByWard.reduce((s, [, a]) => s + a, 0);
      const [, lowAmount] = todayByWard[todayByWard.length - 1];
      if (todayByWard.length > 1 && lowAmount < topAmount * 0.3)
        list.push({ title: "Some wards collected very little today", detail: `Today's collections range from ${fmtNaira(lowAmount)} to ${fmtNaira(topAmount)} (total ${fmtNaira(total)}). Check ward activity in the summary tab.`, tone: "warning" });
    }
    if (list.length === 0)
      list.push({ title: "Nothing needs attention", detail: "Approvals are clear and collections are being recorded across the wards.", tone: "warning" });
    return list;
  }, [streamStats, todayByWard]);

  const totalReceived = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalBilled = streamStats.reduce((s, x) => s + x.billed, 0);
  const totalToday = todayByWard.reduce((s, [, a]) => s + a, 0);

  if (loading) {
    return (
      <DashboardShell title="Revenue Watch" subtitle="Where money is expected, received, or needs follow-up">
        <div className="surface-card flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Revenue Watch" subtitle="Where money is expected, received, or needs follow-up">
      <SectionTabs
        sections={[
          {
            id: "position",
            label: "Money Position",
            hint: "What has been billed, received, and collected today.",
            content: (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Kpi label="Bills raised" value={fmtNaira(totalBilled)} hint="Annual business permits + tenement rates" icon={<ClipboardList className="h-5 w-5" />} tone="gold" />
                  <Kpi label="Money received" value={fmtNaira(totalReceived)} hint="All confirmed payments on record" icon={<Wallet className="h-5 w-5" />} tone="success" />
                  <Kpi label="Collected today" value={fmtNaira(totalToday)} hint={`${todayByWard.length} wards reporting`} icon={<MapPin className="h-5 w-5" />} tone="primary" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {streamStats.map((s) => (
                    <div key={s.id} className="surface-card p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-ink">
                        <span className="text-primary">{s.icon}</span> {s.label}
                      </div>
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span className="font-semibold text-ink">{s.registered}</span></div>
                        {s.billed > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Billed</span><span className="font-semibold text-ink">{fmtNaira(s.billed)}</span></div>}
                        <div className="flex justify-between"><span className="text-muted-foreground">Received</span><span className="font-semibold text-primary">{fmtNaira(s.received)}</span></div>
                        {s.pending > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Awaiting approval</span><span className="font-semibold text-amber-700">{s.pending}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            id: "followup",
            label: "Needs Follow-up",
            hint: "Practical flags an officer can act on today.",
            badge: flags.length,
            content: (
              <div className="space-y-3">
                {flags.map((f) => (
                  <div
                    key={f.title}
                    className={"surface-card flex items-start gap-3 p-4 " + (f.tone === "danger" ? "border-destructive/30" : "border-warning/40")}
                  >
                    <span className={"mt-0.5 shrink-0 rounded-lg p-2 " + (f.tone === "danger" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700")}>
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-ink">{f.title}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
          {
            id: "wards",
            label: "Ward Summary",
            hint: "Today's confirmed collections by ward.",
            content: (
              <div className="surface-card">
                <div className="border-b border-border px-5 py-4">
                  <h3 className="font-display text-base font-bold text-ink">Collections today by ward</h3>
                </div>
                {todayByWard.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">No confirmed collections recorded today.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {todayByWard.map(([ward, amount]) => {
                      const max = todayByWard[0]?.[1] || 1;
                      return (
                        <div key={ward} className="px-5 py-3.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-ink">{ward}</span>
                            <span className="font-bold text-primary">{fmtNaira(amount)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(4, Math.round((amount / max) * 100))}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
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
