import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  markets, traders, marketSessions, marketOfficers, traderAssociations, marketZones,
} from "@/lib/kwali-mock";
import {
  UserPlus, Users, Banknote, ShieldCheck, BarChart3,
  TrendingUp, CheckCircle2, XCircle, ArrowRight, QrCode,
  MapPin, UserCheck, AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/markets")({
  head: () => ({ meta: [{ title: "Market Management — KSRP" }] }),
  component: MarketsPage,
});

const fmt = (n: number) => "₦" + n.toLocaleString();
const fmtK = (n: number) => n >= 1000 ? "₦" + (n / 1000).toFixed(0) + "K" : fmt(n);

/* ── Summary KPIs ─────────────────────────────── */
function KpiCard({ label, value, hint, icon, color }: {
  label: string; value: string | number; hint?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}>{icon}</div>
      <div className="font-display text-3xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-xs font-semibold text-ink">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function MarketsPage() {
  const totalRegistered = traders.length;
  const paidToday = traders.filter((t) => t.paidToday).length;
  const unpaidToday = traders.filter((t) => !t.paidToday).length;
  const totalRevenue = marketSessions.reduce((s, m) => s + m.revenue, 0);
  const avgCompliance = Math.round(traders.reduce((s, t) => s + t.complianceScore, 0) / traders.length);
  const totalPresent = marketSessions.reduce((s, m) => s + m.present, 0);

  return (
    <DashboardShell
      title="Market Management"
      subtitle="Trader Identity · Daily Collection · Zones · Attendance"
      actions={
        <div className="flex items-center gap-2">
          <Link to="/markets/collect"
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary sm:flex">
            <Banknote className="h-4 w-4 text-primary" />
            Collect
          </Link>
          <Link to="/markets/register"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95">
            <UserPlus className="h-4 w-4" />
            Register Trader
          </Link>
        </div>
      }
    >
      {/* ── Quick-access tiles ── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/markets/register"
          className="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 transition hover:bg-primary/10 hover:border-primary/40">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-ink">Register Trader</div>
            <div className="text-xs text-muted-foreground">Generate ID & QR card</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-primary opacity-0 transition group-hover:opacity-100" />
        </Link>
        <Link to="/markets/traders"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-[var(--shadow-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-ink">Trader Directory</div>
            <div className="text-xs text-muted-foreground">Search & manage traders</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
        </Link>
        <Link to="/markets/collect"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-[var(--shadow-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-ink">Collect Payment</div>
            <div className="text-xs text-muted-foreground">Officer market day app</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
        </Link>
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            <QrCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-ink">Verify QR Card</div>
            <div className="text-xs text-muted-foreground">Scan trader identity</div>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <KpiCard label="Registered Traders" value={totalRegistered} hint="Across all markets" icon={<Users className="h-5 w-5" />} color="bg-primary/8 text-primary" />
        <KpiCard label="Present Today (est.)" value={totalPresent} hint="Across 4 markets" icon={<UserCheck className="h-5 w-5" />} color="bg-blue-50 text-blue-700" />
        <KpiCard label="Paid Today" value={paidToday} hint={`${Math.round((paidToday / totalRegistered) * 100)}% of registered`} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-emerald-50 text-emerald-700" />
        <KpiCard label="Unpaid Today" value={unpaidToday} hint="Collection pending" icon={<XCircle className="h-5 w-5" />} color="bg-red-50 text-red-700" />
        <KpiCard label="Revenue Today" value={fmtK(totalRevenue)} hint="All 4 markets" icon={<Banknote className="h-5 w-5" />} color="bg-amber-50 text-amber-700" />
        <KpiCard label="Avg Compliance" value={`${avgCompliance}%`} hint="Trader score" icon={<TrendingUp className="h-5 w-5" />} color="bg-primary/8 text-primary" />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Market cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Market Status Today</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Session
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {marketSessions.map((s) => {
              const mkt = markets.find((m) => m.id === s.marketId);
              const compliancePct = Math.round((s.paid / s.registered) * 100);
              return (
                <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-base font-bold text-ink">{s.marketName}</div>
                      <div className="text-xs text-muted-foreground">{mkt?.ward} Ward</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${compliancePct >= 80 ? "bg-emerald-50 text-emerald-700" : compliancePct >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                      {compliancePct}%
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { l: "Registered", v: s.registered },
                      { l: "Present", v: s.present },
                      { l: "Paid Today", v: s.paid },
                      { l: "Revenue", v: fmt(s.revenue) },
                    ].map((x) => (
                      <div key={x.l} className="rounded-lg bg-surface px-3 py-2">
                        <div className="text-[10px] text-muted-foreground">{x.l}</div>
                        <div className="font-bold text-ink text-sm">{x.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>Collection progress</span>
                      <span>{s.paid}/{s.present} present</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (s.paid / s.present) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <UserCheck className="h-3 w-3" />
                    Officer: {s.officerName}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Market Zones */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink">Market Cluster Zones</h2>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {marketZones.map((z) => {
                const catColor = z.category === "A"
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : z.category === "B"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-50 text-slate-600 border-slate-200";
                return (
                  <div key={z.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{z.name}</div>
                      <div className="text-[11px] text-muted-foreground">{z.marketName.split(" ")[0]} · {z.traderCount} traders</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${catColor}`}>Cat {z.category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Officer accountability */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink">Officer Accountability</h2>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {marketOfficers.map((o) => (
                <div key={o.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {o.name.split(" ").slice(-1)[0].slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{o.name.replace("Ofc. ", "")}</div>
                    <div className="text-[11px] text-muted-foreground">{o.marketName.split(" ")[0]} · {o.receiptsToday} receipts</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">{fmtK(o.collectedToday)}</div>
                    <div className={`text-[10px] font-semibold ${o.efficiency >= 85 ? "text-emerald-600" : "text-amber-600"}`}>{o.efficiency}%</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-border bg-surface px-3 py-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total collected today</span>
                <span className="font-bold text-ink">{fmt(marketOfficers.reduce((s, o) => s + o.collectedToday, 0))}</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Every receipt has GPS + officer ID + timestamp — no cash leakage</p>
            </div>
          </div>

          {/* Trader Associations */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink">Trader Associations</h2>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-3">
              {traderAssociations.map((a) => {
                const pct = Math.round((a.registered / a.members) * 100);
                return (
                  <div key={a.id} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.chairman}</div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${pct >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{pct}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{a.registered}/{a.members} registered</span>
                      <a href={`tel:${a.phone}`} className="text-primary hover:underline">{a.phone}</a>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-secondary">
                      <div className="h-1 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 font-display text-base font-bold text-ink">Trader Categories</h2>
            {(["A", "B", "C"] as const).map((cat) => {
              const count = traders.filter((t) => t.category === cat).length;
              const desc = cat === "A" ? "Large traders · ₦300/day" : cat === "B" ? "Medium traders · ₦200/day" : "Small/informal · ₦100/day";
              const pct = Math.round((count / traders.length) * 100);
              const color = cat === "A" ? "bg-violet-500" : cat === "B" ? "bg-blue-500" : "bg-slate-400";
              const bg = cat === "A" ? "bg-violet-50 text-violet-700" : cat === "B" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600";
              return (
                <div key={cat} className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${bg}`}>Cat {cat}</span>
                      <span className="text-muted-foreground text-xs">{desc}</span>
                    </span>
                    <span className="font-bold text-ink">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue leakage notice */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-amber-800">Revenue Leakage Control</div>
                <p className="mt-1 text-xs leading-relaxed text-amber-700">All collections must have: Receipt No · Officer ID · GPS Location · Timestamp. No receipt = no valid collection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

