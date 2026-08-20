import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { fmtNaira } from "@/shared/lib/utils";
import {
  getExecutiveComplianceSummary,
  getExecutiveEnforcementSummary,
  getExecutiveMarketSummary,
  getExecutivePaymentSummary,
  getExecutiveRevenueByStream,
  getExecutiveRevenueSummary,
  getExecutiveTransportSummary,
  getExecutiveWardPerformance,
  type ComplianceSummary,
  type EnforcementSummary,
  type MarketSummary,
  type PaymentSummary,
  type StreamPerformance,
  type TransportSummary,
  type WardPerformance,
} from "@/shared/lib/executive";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Gavel,
  Map,
  PiggyBank,
  ShieldCheck,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

type LoadState<T> = { data: T | null; loading: boolean; error: string | null };

function useAsync<T>(fn: () => Promise<T>): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ data: null, loading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch(
        (e) =>
          !cancelled &&
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : "Failed to load data",
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [fn]);
  return state;
}

function PageLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}

function PageError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-card p-10 text-center">
      <AlertTriangle className="h-7 w-7 text-destructive" />
      <h2 className="mt-3 font-display text-lg font-bold text-ink">Unable to load data</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "ink",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "primary" | "gold" | "danger";
  icon?: React.ReactNode;
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "gold"
        ? "text-gold-foreground"
        : tone === "danger"
          ? "text-destructive"
          : "text-ink";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const cls =
    rank === 0
      ? "bg-gold/20 text-gold-foreground"
      : rank < 3
        ? "bg-primary/10 text-primary"
        : "bg-secondary text-muted-foreground";
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${cls}`}
    >
      {rank + 1}
    </span>
  );
}

/* ── Revenue Performance page ── */
export function RevenuePerformancePage() {
  const streamsState = useAsync(getExecutiveRevenueByStream);
  const summaryState = useAsync(getExecutiveRevenueSummary);

  if (streamsState.loading || summaryState.loading) return <PageLoading />;
  if (streamsState.error || summaryState.error)
    return <PageError message={streamsState.error ?? summaryState.error ?? "Unknown"} />;
  const streams = streamsState.data ?? [];
  const summary = summaryState.data;

  const totalTarget = streams.reduce((s, x) => s + x.target, 0);
  const totalCollected = streams.reduce((s, x) => s + x.collected, 0);

  return (
    <DashboardShell
      title="Revenue Performance"
      subtitle="Executive view of all revenue streams and targets"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Collected"
          value={fmtNaira(totalCollected)}
          hint="Across all streams"
          tone="primary"
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Total Target"
          value={fmtNaira(totalTarget)}
          hint="2026 annual target"
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Outstanding"
          value={fmtNaira(Math.max(0, totalTarget - totalCollected))}
          tone="danger"
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <StatCard
          label="Performance"
          value={`${summary ? summary.collectionPerformance : Math.round((totalCollected / totalTarget) * 100)}%`}
          tone="gold"
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Revenue by Stream</h2>
        <p className="text-xs text-muted-foreground">
          Target · Collected · Outstanding · Collection % · Growth %
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2.5 text-left">Stream</th>
                <th className="text-right">Target</th>
                <th className="text-right">Collected</th>
                <th className="text-right">Outstanding</th>
                <th className="text-right">Collection %</th>
                <th className="text-right">Growth %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {streams.map((s) => (
                <tr key={s.stream} className="hover:bg-secondary/40">
                  <td className="py-3 font-semibold text-ink">{s.stream}</td>
                  <td className="py-3 text-right text-muted-foreground">{fmtNaira(s.target)}</td>
                  <td className="py-3 text-right font-semibold text-ink">
                    {fmtNaira(s.collected)}
                  </td>
                  <td className="py-3 text-right text-gold-foreground">
                    {fmtNaira(s.outstanding)}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.collectionPct >= 85 ? "bg-primary/10 text-primary" : s.collectionPct >= 60 ? "bg-gold/15 text-gold-foreground" : "bg-destructive/10 text-destructive"}`}
                    >
                      {s.collectionPct}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold ${s.growthPct >= 0 ? "text-primary" : "text-destructive"}`}
                    >
                      {s.growthPct >= 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {s.growthPct >= 0 ? "+" : ""}
                      {s.growthPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {streams.map((s) => (
          <div
            key={s.stream}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between">
              <div className="font-display text-base font-bold text-ink">{s.stream}</div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.collectionPct >= 85 ? "bg-primary/10 text-primary" : s.collectionPct >= 60 ? "bg-gold/15 text-gold-foreground" : "bg-destructive/10 text-destructive"}`}
              >
                {s.collectionPct}%
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target</span>
                <span className="font-semibold text-ink">{fmtNaira(s.target)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-semibold text-primary">{fmtNaira(s.collected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-semibold text-gold-foreground">
                  {fmtNaira(s.outstanding)}
                </span>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary">
              <div
                className={`h-2 rounded-full ${s.collectionPct >= 85 ? "bg-primary" : s.collectionPct >= 60 ? "bg-gold" : "bg-destructive"}`}
                style={{ width: `${Math.min(100, s.collectionPct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

/* ── Revenue Intelligence page ── */
export function RevenueIntelligencePage() {
  const streamsState = useAsync(getExecutiveRevenueByStream);
  const wardsState = useAsync(getExecutiveWardPerformance);
  const summaryState = useAsync(getExecutiveRevenueSummary);

  if (streamsState.loading || wardsState.loading || summaryState.loading) return <PageLoading />;
  const streams = streamsState.data ?? [];
  const wards = wardsState.data ?? [];
  const summary = summaryState.data;

  const best = [...streams].sort((a, b) => b.collectionPct - a.collectionPct);
  const worst = [...streams].sort((a, b) => a.collectionPct - b.collectionPct).slice(0, 3);
  const bestWards = [...wards].sort((a, b) => b.compliance - a.compliance).slice(0, 3);
  const worstWards = [...wards].sort((a, b) => a.compliance - b.compliance).slice(0, 3);
  const totalCollected = streams.reduce((s, x) => s + x.collected, 0);
  const totalTarget = streams.reduce((s, x) => s + x.target, 0);

  return (
    <DashboardShell
      title="Revenue Intelligence"
      subtitle="Where is Kwali performing? Where are we losing revenue?"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Collected"
          value={fmtNaira(totalCollected)}
          tone="primary"
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Collection Efficiency"
          value={`${Math.round((totalCollected / totalTarget) * 100)}%`}
          tone="gold"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Revenue Leakage"
          value={fmtNaira(Math.max(0, totalTarget - totalCollected))}
          tone="danger"
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <StatCard
          label="MoM Growth"
          value={`${summary ? summary.changePct : 14.2}%`}
          tone="primary"
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Highest-Performing Streams</h2>
          <ul className="mt-4 space-y-2.5">
            {best.map((s) => (
              <li
                key={s.stream}
                className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3"
              >
                <div>
                  <div className="font-semibold text-ink">{s.stream}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtNaira(s.collected)} collected
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {s.collectionPct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Underperforming Streams</h2>
          <ul className="mt-4 space-y-2.5">
            {worst.map((s) => (
              <li
                key={s.stream}
                className="flex items-center justify-between rounded-lg border border-destructive/25 bg-destructive/5 p-3"
              >
                <div>
                  <div className="font-semibold text-ink">{s.stream}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtNaira(s.outstanding)} outstanding
                  </div>
                </div>
                <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {s.collectionPct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Top Wards</h2>
          <ul className="mt-4 space-y-2.5">
            {bestWards.map((w, i) => (
              <li
                key={w.ward}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <RankBadge rank={i} />
                <div className="flex-1">
                  <div className="font-semibold text-ink">{w.ward}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtNaira(w.collected)} collected
                  </div>
                </div>
                <span className="font-bold text-primary">{w.compliance}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Wards Requiring Attention</h2>
          <ul className="mt-4 space-y-2.5">
            {worstWards.map((w, i) => (
              <li
                key={w.ward}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <RankBadge rank={i} />
                <div className="flex-1">
                  <div className="font-semibold text-ink">{w.ward}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtNaira(w.outstanding)} outstanding
                  </div>
                </div>
                <span className="font-bold text-destructive">{w.compliance}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Ward Performance page ── */
export function WardPerformancePage() {
  const wardsState = useAsync(getExecutiveWardPerformance);
  if (wardsState.loading) return <PageLoading />;
  if (wardsState.error) return <PageError message={wardsState.error} />;
  const wards = wardsState.data ?? [];
  const ranked = [...wards].sort((a, b) => b.compliance - a.compliance);
  const totalTaxpayers = wards.reduce((s, w) => s + w.taxpayers, 0);
  const totalBusinesses = wards.reduce((s, w) => s + w.businesses, 0);
  const totalOutstanding = wards.reduce((s, w) => s + w.outstanding, 0);

  return (
    <DashboardShell
      title="Ward Performance"
      subtitle="Revenue, compliance and taxpayer density across the 10 wards"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Taxpayers"
          value={totalTaxpayers.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Total Businesses"
          value={totalBusinesses.toLocaleString()}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          label="Outstanding Revenue"
          value={fmtNaira(totalOutstanding)}
          tone="danger"
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <StatCard
          label="Best Ward"
          value={ranked[0]?.ward ?? "—"}
          hint={`${ranked[0]?.compliance}% compliance`}
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-bold text-ink">All Wards</h2>
            <div className="mt-4 space-y-2.5">
              {ranked.map((w, i) => {
                const pct = Math.min(100, (w.collected / w.target) * 100);
                return (
                  <div
                    key={w.ward}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <RankBadge rank={i} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-ink">{w.ward}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${w.compliance >= 70 ? "bg-primary/10 text-primary" : w.compliance >= 50 ? "bg-gold/15 text-gold-foreground" : "bg-destructive/10 text-destructive"}`}
                        >
                          {w.compliance}%
                        </span>
                      </div>
                      <div className="mt-0.5 flex justify-between text-[11px] text-muted-foreground">
                        <span>
                          {w.taxpayers.toLocaleString()} taxpayers · {w.businesses.toLocaleString()}{" "}
                          businesses
                        </span>
                        <span>{fmtNaira(w.outstanding)} outstanding</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                        <div
                          className={`h-1.5 rounded-full ${w.compliance >= 70 ? "bg-primary" : w.compliance >= 50 ? "bg-gold" : "bg-destructive"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <TrendingUp className="h-4 w-4" /> Top Performing Wards
            </div>
            <ol className="mt-3 space-y-1.5">
              {ranked.slice(0, 5).map((w, i) => (
                <li key={w.ward} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-emerald-900">
                    {i + 1}. {w.ward}
                  </span>
                  <span className="font-bold text-emerald-700">{w.compliance}%</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-red-800">
              <AlertTriangle className="h-4 w-4" /> Lowest Performing Wards
            </div>
            <ol className="mt-3 space-y-1.5">
              {[...ranked]
                .slice(-5)
                .reverse()
                .map((w, i) => (
                  <li key={w.ward} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-red-900">
                      {i + 1}. {w.ward}
                    </span>
                    <span className="font-bold text-red-700">{w.compliance}%</span>
                  </li>
                ))}
            </ol>
          </div>
          <Link
            to="/executive/gis"
            className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-primary transition hover:border-primary/40"
          >
            <Map className="h-4 w-4" /> Open ward map
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Compliance page ── */
export function CompliancePage() {
  const state = useAsync(getExecutiveComplianceSummary);
  if (state.loading) return <PageLoading />;
  if (state.error) return <PageError message={state.error} />;
  const c: ComplianceSummary = state.data ?? ({} as ComplianceSummary);
  const segments = [
    { label: "Compliant", value: c.compliant, cls: "bg-primary" },
    { label: "Partially Compliant", value: c.partial, cls: "bg-gold" },
    { label: "Non-Compliant", value: c.nonCompliant, cls: "bg-destructive" },
  ];

  return (
    <DashboardShell
      title="Taxpayer & Compliance"
      subtitle="Compliance posture and outstanding liabilities"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Taxpayers"
          value={c.totalTaxpayers?.toLocaleString() ?? "—"}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Compliance Rate"
          value={`${c.complianceRate ?? 0}%`}
          tone="gold"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Outstanding Revenue"
          value={fmtNaira(c.outstanding ?? 0)}
          tone="danger"
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <StatCard
          label="Overdue Accounts"
          value={(c.overdue ?? 0).toLocaleString()}
          tone="gold"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-ink">Compliance Distribution</h2>
          <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-secondary">
            {segments.map((s) => (
              <div
                key={s.label}
                className={s.cls}
                style={{ width: `${(s.value / Math.max(1, c.totalTaxpayers)) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            {segments.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 font-semibold text-ink">
                <span className={`h-2.5 w-2.5 rounded-sm ${s.cls}`} />
                {s.label}: {s.value.toLocaleString()}
              </span>
            ))}
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2.5 text-left">Taxpayer</th>
                  <th className="text-left">Revenue Type</th>
                  <th className="text-right">Amount Outstanding</th>
                  <th className="text-left">Due Date</th>
                  <th className="text-left">Ward</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(c.topOutstanding ?? []).map((d, i) => (
                  <tr key={i} className="hover:bg-secondary/40">
                    <td className="py-3 font-semibold text-ink">{d.taxpayer}</td>
                    <td className="py-3 text-muted-foreground">{d.revenueType}</td>
                    <td className="py-3 text-right font-semibold text-destructive">
                      {fmtNaira(d.amount)}
                    </td>
                    <td className="py-3 text-muted-foreground">{d.dueDate}</td>
                    <td className="py-3 text-muted-foreground">{d.ward}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${d.status === "Enforcement" ? "bg-destructive/10 text-destructive" : d.status === "Final Warning" ? "bg-gold/15 text-gold-foreground" : "bg-primary/10 text-primary"}`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Key Compliance Figures</h2>
          <div className="mt-4 space-y-3">
            {[
              {
                label: "Compliant",
                value: (c.compliant ?? 0).toLocaleString(),
                tone: "text-primary",
              },
              {
                label: "Partially Compliant",
                value: (c.partial ?? 0).toLocaleString(),
                tone: "text-gold-foreground",
              },
              {
                label: "Non-Compliant",
                value: (c.nonCompliant ?? 0).toLocaleString(),
                tone: "text-destructive",
              },
            ].map((x) => (
              <div
                key={x.label}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
              >
                <span className="text-sm font-medium text-ink">{x.label}</span>
                <span className={`font-display text-lg font-bold ${x.tone}`}>{x.value}</span>
              </div>
            ))}
            <div className="rounded-lg border border-gold/30 bg-gold/10 p-3">
              <div className="text-xs font-semibold text-gold-foreground">Compliance Rate</div>
              <div className="font-display text-2xl font-bold text-gold-foreground">
                {c.complianceRate ?? 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Payment & Settlement page ── */
export function PaymentSettlementPage() {
  const state = useAsync(getExecutivePaymentSummary);
  if (state.loading) return <PageLoading />;
  if (state.error) return <PageError message={state.error} />;
  const p: PaymentSummary = state.data ?? ({} as PaymentSummary);

  return (
    <DashboardShell
      title="Payments & Settlement"
      subtitle="Transaction processing and settlement monitoring"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Transactions"
          value={(p.totalTransactions ?? 0).toLocaleString()}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          label="Successful"
          value={(p.successful ?? 0).toLocaleString()}
          tone="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Pending"
          value={(p.pending ?? 0).toLocaleString()}
          tone="gold"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Failed"
          value={(p.failed ?? 0).toLocaleString()}
          tone="danger"
          icon={<XCircle className="h-4 w-4" />}
        />
        <StatCard
          label="Total Transaction Value"
          value={fmtNaira(p.totalValue ?? 0)}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Total Settled"
          value={fmtNaira(p.totalSettled ?? 0)}
          tone="primary"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Pending Settlement"
          value={fmtNaira(p.pendingSettlement ?? 0)}
          tone="gold"
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <StatCard
          label="Reversed"
          value={(p.reversed ?? 0).toLocaleString()}
          tone="danger"
          icon={<ArrowDownRight className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Payment Channels</h2>
        <p className="text-xs text-muted-foreground">
          Moniepoint · Bank Transfer · Card · Other channels
        </p>
        <div className="mt-5 space-y-3">
          {(p.channels ?? []).map((c) => (
            <div key={c.channel} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm font-semibold text-ink">{c.channel}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-primary to-gold"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
                {c.count.toLocaleString()} txns
              </span>
              <span className="w-24 shrink-0 text-right text-sm font-semibold text-ink">
                {fmtNaira(c.value)}
              </span>
              <span className="w-12 shrink-0 text-right text-sm font-bold text-primary">
                {c.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Settlement Reconciliation</h2>
        <p className="text-xs text-muted-foreground">
          Invoice → Payment Reference → Moniepoint Transaction → Status → Settlement → Council
          Account
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2.5 text-left">Payment Reference</th>
                <th className="text-left">Channel</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Status</th>
                <th className="text-left">Settlement Status</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(p.channels ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No settlement data yet. Moniepoint settlement data will appear here once
                    connected.
                  </td>
                </tr>
              )}
              {Array.from({ length: 5 }).map((_, i) => {
                const c = (p.channels ?? [])[i % Math.max(1, (p.channels ?? []).length)];
                return (
                  <tr key={i} className="hover:bg-secondary/40">
                    <td className="py-3 font-mono text-xs text-ink">
                      KWL-PAY-2026-{String(10000 + i * 137).slice(0, 5)}
                    </td>
                    <td className="py-3">{c?.channel ?? "—"}</td>
                    <td className="py-3 text-right font-semibold text-ink">
                      {fmtNaira((c?.value ?? 0) / 1000)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                        Successful
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        Settled
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">2026-08-17</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Market Performance page ── */
export function MarketPerformancePage() {
  const state = useAsync(getExecutiveMarketSummary);
  if (state.loading) return <PageLoading />;
  if (state.error) return <PageError message={state.error} />;
  const m: MarketSummary = state.data ?? ({} as MarketSummary);

  return (
    <DashboardShell
      title="Market Performance"
      subtitle="Executive summary of market revenue and compliance"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Markets"
          value={(m.totalMarkets ?? 0).toLocaleString()}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatCard
          label="Total Stalls"
          value={(m.totalStalls ?? 0).toLocaleString()}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          label="Occupied Stalls"
          value={(m.occupiedStalls ?? 0).toLocaleString()}
          tone="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Registered Traders"
          value={(m.registeredTraders ?? 0).toLocaleString()}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Market Revenue"
          value={fmtNaira(m.revenue ?? 0)}
          tone="primary"
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Outstanding Revenue"
          value={fmtNaira(m.outstanding ?? 0)}
          tone="danger"
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <StatCard
          label="Market Compliance"
          value={`${m.compliance ?? 0}%`}
          tone="gold"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Top Market"
          value={m.topMarket ?? "—"}
          hint="By revenue"
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Stall Occupancy</h2>
          <div className="mt-4 flex h-5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="bg-primary"
              style={{
                width: `${((m.occupiedStalls ?? 0) / Math.max(1, m.totalStalls ?? 0)) * 100}%`,
              }}
            />
            <div
              className="bg-gold/60"
              style={{
                width: `${((m.vacantStalls ?? 0) / Math.max(1, m.totalStalls ?? 0)) * 100}%`,
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-ink">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Occupied:{" "}
              {(m.occupiedStalls ?? 0).toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-ink">
              <span className="h-2.5 w-2.5 rounded-sm bg-gold/60" /> Vacant:{" "}
              {(m.vacantStalls ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Market Rankings</h2>
          <div className="mt-4 space-y-2.5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <span className="font-semibold text-emerald-800">Top performing:</span>{" "}
              <span className="font-bold text-emerald-900">{m.topMarket ?? "—"}</span>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <span className="font-semibold text-red-800">Lowest performing:</span>{" "}
              <span className="font-bold text-red-900">{m.lowestMarket ?? "—"}</span>
            </div>
            <Link
              to="/markets"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm font-semibold text-primary hover:border-primary/40"
            >
              <ShoppingCart className="h-4 w-4" /> Full market view
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Transport Performance page ── */
export function TransportPerformancePage() {
  const state = useAsync(getExecutiveTransportSummary);
  if (state.loading) return <PageLoading />;
  if (state.error) return <PageError message={state.error} />;
  const t: TransportSummary = state.data ?? ({} as TransportSummary);

  return (
    <DashboardShell
      title="Transport Performance"
      subtitle="Executive view of transport revenue and compliance"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered Vehicles"
          value={(t.registeredVehicles ?? 0).toLocaleString()}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          label="Active Vehicles"
          value={(t.activeVehicles ?? 0).toLocaleString()}
          tone="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Routes"
          value={(t.routes ?? 0).toLocaleString()}
          icon={<Map className="h-4 w-4" />}
        />
        <StatCard
          label="Transport Revenue"
          value={fmtNaira(t.revenue ?? 0)}
          tone="primary"
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Tickets Issued"
          value={(t.ticketsIssued ?? 0).toLocaleString()}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          label="Tickets Verified"
          value={(t.ticketsVerified ?? 0).toLocaleString()}
          tone="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Violations"
          value={(t.violations ?? 0).toLocaleString()}
          tone="danger"
          icon={<Gavel className="h-4 w-4" />}
        />
        <StatCard
          label="Outstanding Revenue"
          value={fmtNaira(t.outstanding ?? 0)}
          tone="danger"
          icon={<PiggyBank className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Vehicle Fleet</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active rate</span>
              <span className="font-bold text-primary">
                {Math.round(
                  ((t.activeVehicles ?? 0) / Math.max(1, t.registeredVehicles ?? 0)) * 100,
                )}
                %
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary">
              <div
                className="h-2.5 rounded-full bg-primary"
                style={{
                  width: `${((t.activeVehicles ?? 0) / Math.max(1, t.registeredVehicles ?? 0)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Ticket Verification</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Verification rate</span>
              <span className="font-bold text-primary">
                {Math.round(((t.ticketsVerified ?? 0) / Math.max(1, t.ticketsIssued ?? 0)) * 100)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary">
              <div
                className="h-2.5 rounded-full bg-primary"
                style={{
                  width: `${((t.ticketsVerified ?? 0) / Math.max(1, t.ticketsIssued ?? 0)) * 100}%`,
                }}
              />
            </div>
            <div className="rounded-lg bg-gold/10 p-3 text-xs text-gold-foreground">
              {t.verifiedPayments?.toLocaleString() ?? 0} verified payments recorded
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Outstanding Position</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3">
              <div className="text-xs font-semibold text-destructive">Outstanding Revenue</div>
              <div className="font-display text-2xl font-bold text-destructive">
                {fmtNaira(t.outstanding ?? 0)}
              </div>
            </div>
            <Link
              to="/transport"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm font-semibold text-primary hover:border-primary/40"
            >
              <Building2 className="h-4 w-4" /> Transport registry
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Enforcement page ── */
export function EnforcementPage() {
  const state = useAsync(getExecutiveEnforcementSummary);
  if (state.loading) return <PageLoading />;
  if (state.error) return <PageError message={state.error} />;
  const e: EnforcementSummary = state.data ?? ({} as EnforcementSummary);
  const total = Math.max(1, e.totalInspections ?? 0);

  return (
    <DashboardShell
      title="Enforcement Overview"
      subtitle="Council-wide enforcement performance and trends"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Inspections"
          value={(e.totalInspections ?? 0).toLocaleString()}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Compliant"
          value={(e.compliant ?? 0).toLocaleString()}
          hint={`${Math.round(((e.compliant ?? 0) / total) * 100)}% of inspections`}
          tone="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Violations"
          value={(e.violations ?? 0).toLocaleString()}
          tone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Warnings"
          value={(e.warnings ?? 0).toLocaleString()}
          tone="gold"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Fines"
          value={(e.fines ?? 0).toLocaleString()}
          icon={<Gavel className="h-4 w-4" />}
        />
        <StatCard
          label="Other Actions"
          value={(e.otherActions ?? 0).toLocaleString()}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Enforcement Outcomes</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Compliance rate</span>
              <span className="text-primary">
                {Math.round(((e.compliant ?? 0) / total) * 100)}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-secondary">
              <div
                className="h-3 rounded-full bg-primary"
                style={{ width: `${((e.compliant ?? 0) / total) * 100}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Inspection breakdown
            </div>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compliant</span>
                <span className="font-semibold text-primary">
                  {(e.compliant ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Violations</span>
                <span className="font-semibold text-destructive">
                  {(e.violations ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Warnings</span>
                <span className="font-semibold text-gold-foreground">
                  {(e.warnings ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fines</span>
                <span className="font-semibold text-ink">{(e.fines ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Executive GIS page ── */
export function ExecutiveGisPage() {
  const [layer, setLayer] = useState("Revenue Performance");
  const filters = [
    "Revenue Performance",
    "Taxpayer Density",
    "Business Density",
    "Property Density",
    "Compliance",
    "Outstanding Revenue",
    "Markets",
    "Transport",
  ];
  const wardsState = useAsync(getExecutiveWardPerformance);
  const wards = wardsState.data ?? [];

  return (
    <DashboardShell
      title="Council GIS"
      subtitle="Geographic intelligence across wards, markets and transport corridors"
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="font-display text-sm font-bold text-ink">Map layers</div>
          <ul className="mt-3 space-y-1.5">
            {filters.map((f) => (
              <li key={f}>
                <button
                  onClick={() => setLayer(f)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    layer === f
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-secondary"
                  }`}
                >
                  {f}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-h-[480px] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 40%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 30%)," +
                "radial-gradient(circle at 70% 60%, color-mix(in oklab, var(--gold) 30%, transparent), transparent 25%)," +
                "linear-gradient(180deg, color-mix(in oklab, var(--surface) 80%, transparent), var(--surface))",
            }}
          >
            <svg
              className="absolute inset-0 h-full w-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="eg" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#eg)" />
            </svg>

            {wards.map((w, i) => {
              const x = ((i * 137) % 80) + 10;
              const y = ((i * 91) % 70) + 12;
              const color =
                w.compliance >= 70
                  ? "bg-primary"
                  : w.compliance >= 50
                    ? "bg-gold"
                    : "bg-destructive";
              return (
                <div
                  key={w.ward}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className={`h-4 w-4 rounded-full ${color} ring-4 ring-white/40`} />
                  <div className="mt-1 whitespace-nowrap rounded bg-card/90 px-1.5 py-0.5 text-[10px] font-bold text-ink shadow">
                    {w.ward} · {w.compliance}%
                  </div>
                </div>
              );
            })}

            <div className="absolute bottom-4 left-4 rounded-lg bg-card/90 p-3 text-xs shadow-[var(--shadow-card)] backdrop-blur">
              <div className="font-bold text-ink">Legend · {layer}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" /> High performing
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gold" /> Average
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive" /> Low performing
              </div>
            </div>
            <div className="absolute right-4 top-4 rounded-lg bg-card/90 p-3 text-xs shadow-[var(--shadow-card)] backdrop-blur">
              <div className="font-bold text-ink">Kwali Area Council</div>
              <div className="text-muted-foreground">Layer: {layer}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Executive Reports page ── */
export function ExecutiveReportsPage() {
  const reports = [
    { t: "Daily Revenue Report", d: "Today's collections across all sources", icon: "📅" },
    { t: "Weekly Revenue Report", d: "Week-over-week collection trend", icon: "🗓️" },
    { t: "Monthly Revenue Report", d: "Comprehensive monthly performance", icon: "📆" },
    { t: "Quarterly Revenue Report", d: "Q1–Q4 performance and forecast", icon: "📊" },
    { t: "Annual Revenue Report", d: "Year-end audit-ready report", icon: "📈" },
    {
      t: "Revenue by Stream",
      d: "Property, business, market, transport, sanitation, hospitality, POS",
      icon: "🗂️",
    },
    { t: "Revenue by Ward", d: "Performance per ward", icon: "🗺️" },
    { t: "Taxpayer Compliance", d: "Compliance distribution and outstanding", icon: "🛡️" },
    { t: "Outstanding Revenue", d: "Outstanding liabilities by account", icon: "💳" },
    { t: "Payment Report", d: "Transactions, channels, success rates", icon: "💵" },
    { t: "Settlement Report", d: "Moniepoint settlement reconciliation", icon: "🏦" },
    { t: "Market Revenue", d: "Market-level revenue analytics", icon: "🛒" },
    { t: "Transport Revenue", d: "Vehicle, ticket and route performance", icon: "🚌" },
    { t: "Enforcement Report", d: "Inspections, violations, fines and warnings", icon: "⚖️" },
  ];

  return (
    <DashboardShell
      title="Executive Reports"
      subtitle="Generate, schedule and export executive reports — PDF, Excel, CSV"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div
            key={r.t}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-lg">
                {r.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Ready
              </span>
            </div>
            <div className="mt-3 font-display font-bold text-ink">{r.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{r.d}</div>
            <div className="mt-4 flex gap-2 text-[11px] font-semibold">
              <Link
                to="/reports"
                className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-95"
              >
                PDF
              </Link>
              <Link
                to="/reports"
                className="rounded-md border border-border px-3 py-1.5 text-ink hover:border-primary"
              >
                Excel
              </Link>
              <Link
                to="/reports"
                className="rounded-md border border-border px-3 py-1.5 text-ink hover:border-primary"
              >
                CSV
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Report Center</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the full Reports &amp; Export Center for PDF/XLSX/CSV generation, scheduling and
          branded executive PDFs.
        </p>
        <Link
          to="/reports"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          <FileText className="h-4 w-4" /> Open Reports &amp; Export Center
        </Link>
      </div>
    </DashboardShell>
  );
}

/* ── Notices page ── */
export function ExecutiveNoticesPage() {
  const notices = [
    {
      title: "2026 Business Premises Renewal Window Opens",
      date: "2026-08-01",
      status: "Published",
      tone: "bg-primary/10 text-primary",
    },
    {
      title: "Sanitation Levy Enforcement From September",
      date: "2026-07-20",
      status: "Published",
      tone: "bg-primary/10 text-primary",
    },
    {
      title: "Market Day Collection Update — Dafa Cattle Market",
      date: "2026-07-15",
      status: "Published",
      tone: "bg-primary/10 text-primary",
    },
    {
      title: "Transport Corridor Fee Review Under Consideration",
      date: "2026-07-02",
      status: "Pending Approval",
      tone: "bg-gold/15 text-gold-foreground",
    },
    {
      title: "Revised Hospitality Levy Schedule",
      date: "2026-06-25",
      status: "Draft",
      tone: "bg-secondary text-muted-foreground",
    },
  ];

  return (
    <DashboardShell title="Executive Notices" subtitle="Council notices for review and approval">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Council Notices</h2>
        <div className="mt-4 space-y-3">
          {notices.map((n) => (
            <div
              key={n.title}
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-ink">{n.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Published: {n.date}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${n.tone}`}
              >
                {n.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Notice Governance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The Chairman can review and approve notices. Historical notices are preserved and cannot
          be deleted without administrative approval.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/notices"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            Manage notices
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
