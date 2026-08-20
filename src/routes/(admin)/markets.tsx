import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { SectionTabs } from "@/shared/components/ui/SectionTabs";
import { TaxpayerIdCard } from "@/shared/components/ui/TaxpayerIdCard";
import { supabase } from "@/integrations/supabase/client";
import { fmtNaira } from "@/shared/lib/utils";
import {
  UserPlus,
  Users,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  QrCode,
  Search,
  Loader2,
  Store,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/(admin)/markets")({
  head: () => ({ meta: [{ title: "Market Management — Kwali Revenue Portal" }] }),
  component: MarketsPage,
});

// Market management on real data, sectioned so the screen stays calm:
//   Overview  — today's position across all markets;
//   Traders   — the live stall register with full-field search;
//   Markets   — per-market breakdown of traders and today's tolls;
//   Compliance— traders trading today without a paid toll.

type Stall = {
  id: string;
  ref: string;
  qr_token: string | null;
  trader_name: string;
  trader_phone: string | null;
  trader_nin: string | null;
  market_name: string;
  stall_number: string | null;
  stall_type: string | null;
  goods_category: string | null;
  ward: string | null;
  daily_toll: number | null;
  monthly_rent: number | null;
  status: string;
  created_at: string;
};

type TollPayment = {
  id: string;
  ref: string;
  source_id: string | null;
  amount: number;
  channel: string;
  ward: string | null;
  created_at: string;
};

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function MarketsPage() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [tolls, setTolls] = useState<TollPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [cardFor, setCardFor] = useState<Stall | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stallsRes, tollsRes] = await Promise.all([
        supabase
          .from("market_stalls")
          .select(
            "id, ref, qr_token, trader_name, trader_phone, trader_nin, market_name, stall_number, stall_type, goods_category, ward, daily_toll, monthly_rent, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("payments")
          .select("id, ref, source_id, amount, channel, ward, created_at")
          .eq("source_table", "market_stalls")
          .eq("revenue_type", "market_toll")
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);
      if (stallsRes.error) throw new Error(stallsRes.error.message);
      if (tollsRes.error) throw new Error(tollsRes.error.message);
      setStalls((stallsRes.data ?? []) as Stall[]);
      setTolls((tollsRes.data ?? []) as TollPayment[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load market data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const todayISO = todayStart();
  const paidTodayIds = useMemo(
    () => new Set(tolls.filter((t) => t.created_at >= todayISO).map((t) => t.source_id)),
    [tolls, todayISO],
  );

  const stats = useMemo(() => {
    const sum = (rows: TollPayment[]) => rows.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const todayRows = tolls.filter((t) => t.created_at >= todayISO);
    const active = stalls.filter((s) => s.status === "Active");
    return {
      total: stalls.length,
      active: active.length,
      pending: stalls.filter((s) => s.status === "Pending").length,
      paidToday: paidTodayIds.size,
      unpaidToday: active.filter((s) => !paidTodayIds.has(s.id)).length,
      revenueToday: sum(todayRows),
      revenueAll: sum(tolls),
    };
  }, [stalls, tolls, paidTodayIds, todayISO]);

  const byMarket = useMemo(() => {
    const map = new Map<string, { traders: number; active: number; ward: string | null }>();
    for (const s of stalls) {
      const m = map.get(s.market_name) ?? { traders: 0, active: 0, ward: s.ward };
      m.traders += 1;
      if (s.status === "Active") m.active += 1;
      map.set(s.market_name, m);
    }
    return [...map.entries()].sort((a, b) => b[1].traders - a[1].traders);
  }, [stalls]);

  const wards = useMemo(
    () => [...new Set(stalls.map((s) => s.ward).filter(Boolean))].sort() as string[],
    [stalls],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return stalls.filter((s) => {
      if (wardFilter !== "all" && s.ward !== wardFilter) return false;
      if (!term) return true;
      return (
        s.trader_name.toLowerCase().includes(term) ||
        s.ref.toLowerCase().includes(term) ||
        s.market_name.toLowerCase().includes(term) ||
        (s.stall_number ?? "").toLowerCase().includes(term) ||
        (s.goods_category ?? "").toLowerCase().includes(term) ||
        (s.trader_phone ?? "").toLowerCase().includes(term) ||
        (s.trader_nin ?? "").toLowerCase().includes(term) ||
        s.qr_token === q.trim()
      );
    });
  }, [stalls, q, wardFilter]);

  // ---- Sections ------------------------------------------------------------

  const overviewSection = (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Revenue today" value={fmtNaira(stats.revenueToday)} hint={`${stats.paidToday} tolls collected`} icon={<Banknote className="h-5 w-5" />} tone="success" />
        <Kpi label="Active traders" value={String(stats.active)} hint={`${stats.pending} awaiting approval`} icon={<Users className="h-5 w-5" />} tone="primary" />
        <Kpi label="Unpaid today" value={String(stats.unpaidToday)} hint="Active traders without today's toll" icon={<XCircle className="h-5 w-5" />} tone={stats.unpaidToday > 0 ? "danger" : "success"} />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/markets/register" icon={<UserPlus className="h-5 w-5" />} title="Register Trader" desc="Generate ID & QR card" accent />
        <QuickLink to="/markets/traders" icon={<Users className="h-5 w-5" />} title="Trader Directory" desc="Search & manage traders" />
        <QuickLink to="/markets/collect" icon={<Banknote className="h-5 w-5" />} title="Collect Payment" desc="Market day collection" />
        <QuickLink to="/verify" icon={<QrCode className="h-5 w-5" />} title="Verify ID" desc="Scan a trader's QR card" />
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">Stream position</h3>
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All-time tolls</div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{fmtNaira(stats.revenueAll)}</div>
            <div className="text-[11px] text-muted-foreground">{tolls.length} receipts on record</div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Markets covered</div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{byMarket.length}</div>
            <div className="text-[11px] text-muted-foreground">{stats.total} stalls registered</div>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-success" />
          Every collection carries a receipt number, collector ID and timestamp — a payment without
          a receipt is not a valid collection.
        </p>
      </div>
    </div>
  );

  const tradersSection = (
    <div className="space-y-4">
      <div className="surface-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search trader, ID, market, stall, phone, NIN — or scan a QR card…"
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
      </div>

      {loading ? (
        <div className="surface-card flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading traders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <Store className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-ink">No traders found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stalls.length === 0 ? "Traders appear here once registered or onboarded." : "Try a different search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const paid = paidTodayIds.has(s.id);
            return (
              <div key={s.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {s.trader_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-ink">{s.trader_name}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{s.ref}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {s.market_name}
                        {s.stall_number ? ` · Stall ${s.stall_number}` : ""}
                        {s.goods_category ? ` · ${s.goods_category}` : ""}
                        {s.ward ? ` · Ward ${s.ward}` : ""}
                      </div>
                    </div>
                  </div>
                  {s.status === "Active" &&
                    (paid ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> PAID TODAY
                      </span>
                    ) : (
                      <StatusBadge tone="danger">UNPAID</StatusBadge>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]">
                  <button
                    onClick={() => setCardFor(cardFor?.id === s.id ? null : s)}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <QrCode className="h-3 w-3" />
                    {cardFor?.id === s.id ? "Hide ID card" : "View ID card"}
                  </button>
                  <span className="text-muted-foreground">
                    Daily toll {fmtNaira(Number(s.daily_toll) || 100)}
                    {s.monthly_rent ? ` · Rent ${fmtNaira(Number(s.monthly_rent))}/mo` : ""}
                  </span>
                  {s.trader_phone && <span className="text-muted-foreground">{s.trader_phone}</span>}
                </div>
                {cardFor?.id === s.id && (
                  <div className="mt-4 border-t border-border pt-4">
                    <TaxpayerIdCard
                      refNo={s.ref}
                      qrToken={s.qr_token}
                      name={s.trader_name}
                      kind="Market Trader"
                      lines={[
                        { label: "Market", value: s.market_name },
                        { label: "Stall", value: s.stall_number ?? "—" },
                        { label: "Goods", value: s.goods_category ?? "—" },
                        { label: "Ward", value: s.ward ?? "—" },
                      ]}
                      issuedAt={s.created_at.split("T")[0]}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const marketsSection = (
    <div className="grid gap-4 sm:grid-cols-2">
      {byMarket.length === 0 && (
        <div className="surface-card p-10 text-center sm:col-span-2">
          <Store className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-ink">No markets yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Markets appear once stalls are registered.</p>
        </div>
      )}
      {byMarket.map(([name, m]) => {
        const marketTolls = tolls.filter(
          (t) => t.created_at >= todayISO && stalls.find((s) => s.id === t.source_id)?.market_name === name,
        );
        const rev = marketTolls.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const paidCount = new Set(marketTolls.map((t) => t.source_id)).size;
        return (
          <div key={name} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-base font-bold text-ink">{name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {m.ward ?? "—"} Ward
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {m.traders} traders
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { l: "Active", v: m.active },
                { l: "Paid today", v: paidCount },
                { l: "Revenue", v: fmtNaira(rev) },
              ].map((x) => (
                <div key={x.l} className="rounded-lg bg-surface px-3 py-2">
                  <div className="text-[10px] text-muted-foreground">{x.l}</div>
                  <div className="text-sm font-bold text-ink">{x.v}</div>
                </div>
              ))}
            </div>
            {m.active > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Today's collection</span>
                  <span>{paidCount}/{m.active}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (paidCount / m.active) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const complianceSection = (
    <div className="surface-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-display text-base font-bold text-ink">Trading without today's toll</h3>
        <p className="text-xs text-muted-foreground">
          Active traders with no confirmed market toll today — share with marshals for field checks.
        </p>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : stats.unpaidToday === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <p className="text-sm font-semibold text-ink">Full compliance today</p>
          <p className="text-xs text-muted-foreground">Every active trader has paid today's toll.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {stalls
            .filter((s) => s.status === "Active" && !paidTodayIds.has(s.id))
            .map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">
                    {s.trader_name} · {s.market_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.ref}
                    {s.stall_number ? ` · Stall ${s.stall_number}` : ""}
                    {s.ward ? ` · Ward ${s.ward}` : ""}
                    {s.trader_phone ? ` · ${s.trader_phone}` : ""}
                  </div>
                </div>
                <StatusBadge tone="danger">Unpaid</StatusBadge>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardShell title="Market Management" subtitle="Trader identity · daily tolls · compliance">
      <SectionTabs
        sections={[
          { id: "overview", label: "Overview", hint: "Today's position across all markets.", content: overviewSection },
          { id: "traders", label: "Traders", hint: "The live stall register — search any field.", badge: stalls.length || undefined, content: tradersSection },
          { id: "markets", label: "Markets", hint: "Per-market traders and today's collection.", content: marketsSection },
          { id: "compliance", label: "Compliance", hint: "Active traders without today's toll.", badge: stats.unpaidToday || undefined, content: complianceSection },
        ]}
      />
    </DashboardShell>
  );
}

function Kpi({ label, value, hint, icon, tone }: { label: string; value: string; hint?: string; icon: React.ReactNode; tone: "success" | "primary" | "danger" }) {
  const bg =
    tone === "success" ? "bg-emerald-50 text-emerald-600" : tone === "danger" ? "bg-red-50 text-red-600" : "bg-primary/8 text-primary";
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

function QuickLink({ to, icon, title, desc, accent }: { to: string; icon: React.ReactNode; title: string; desc: string; accent?: boolean }) {
  return (
    <Link
      to={to}
      className={
        "group flex items-center gap-4 rounded-2xl border p-4 transition " +
        (accent
          ? "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10"
          : "border-border bg-card hover:border-primary/30 hover:shadow-[var(--shadow-card)]")
      }
    >
      <div className={"flex h-11 w-11 items-center justify-center rounded-xl " + (accent ? "bg-primary text-white" : "bg-secondary text-primary")}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-ink">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-primary opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}
