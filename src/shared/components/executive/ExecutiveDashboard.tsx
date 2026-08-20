import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { fmtNaira } from "@/shared/lib/utils";
import {
  getExecutiveActivity,
  getExecutiveAlerts,
  getExecutiveComplianceSummary,
  getExecutiveEnforcementSummary,
  getExecutiveMarketSummary,
  getExecutivePaymentSummary,
  getExecutiveRevenueByStream,
  getExecutiveRevenueSummary,
  getExecutiveTransportSummary,
  getExecutiveWardPerformance,
  executivePeriods,
  type ExecutivePeriod,
  type ExecutiveActivity,
  type ExecutiveAlert,
  type ComplianceSummary,
  type EnforcementSummary,
  type MarketSummary,
  type PaymentSummary,
  type StreamPerformance,
  type TransportSummary,
  type WardPerformance,
  type ExecutiveRevenueSummary,
} from "@/shared/lib/executive";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Gavel,
  Home,
  LayoutDashboard,
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

type ExecutiveData = {
  summary: ExecutiveRevenueSummary;
  streams: StreamPerformance[];
  wards: WardPerformance[];
  payments: PaymentSummary;
  compliance: ComplianceSummary;
  markets: MarketSummary;
  transport: TransportSummary;
  enforcement: EnforcementSummary;
  alerts: ExecutiveAlert[];
  activity: ExecutiveActivity[];
};

type DataState = {
  data: ExecutiveData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

function useExecutiveData(): DataState {
  const [state, setState] = useState<{
    data: ExecutiveData | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    (async () => {
      try {
        const [
          summary,
          streams,
          wards,
          payments,
          compliance,
          markets,
          transport,
          enforcement,
          alerts,
          activity,
        ] = await Promise.all([
          getExecutiveRevenueSummary(),
          getExecutiveRevenueByStream(),
          getExecutiveWardPerformance(),
          getExecutivePaymentSummary(),
          getExecutiveComplianceSummary(),
          getExecutiveMarketSummary(),
          getExecutiveTransportSummary(),
          getExecutiveEnforcementSummary(),
          getExecutiveAlerts(),
          getExecutiveActivity(),
        ]);
        if (!cancelled) {
          setState({
            data: {
              summary,
              streams,
              wards,
              payments,
              compliance,
              markets,
              transport,
              enforcement,
              alerts,
              activity,
            },
            loading: false,
            error: null,
          });
        }
      } catch (e) {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : "Failed to load executive data",
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, retry };
}

function KpiCard({
  label,
  value,
  hint,
  change,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  change?: { pct: number; positive: boolean };
  tone?: "default" | "positive" | "warning" | "danger" | "gold";
  icon?: React.ReactNode;
}) {
  const accent =
    tone === "positive"
      ? "bg-primary"
      : tone === "warning" || tone === "gold"
        ? "bg-gold"
        : tone === "danger"
          ? "bg-destructive"
          : "bg-border";
  
  const chip =
    tone === "danger"
      ? "text-destructive border-destructive/20"
      : tone === "warning" || tone === "gold"
        ? "text-gold-foreground border-gold/20"
        : "text-primary border-primary/20";
        
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      {/* Subtle top accent bar instead of full ring */}
      <div className={`absolute left-0 top-0 h-1 w-full ${accent}`} />
      <div className="flex items-center justify-between mt-1">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-ink">{value}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {change && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
              change.positive ? "text-primary" : "text-destructive"
            }`}
          >
            {change.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {change.positive ? "+" : ""}
            {change.pct}%
          </span>
        )}
        {hint && (
          <span
            className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold ${chip}`}
          >
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function PeriodFilter({
  value,
  onChange,
}: {
  value: ExecutivePeriod;
  onChange: (p: ExecutivePeriod) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {executivePeriods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
            value === p
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:bg-secondary"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function TrendFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
            value === o
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:bg-secondary"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const trendData: Record<
  string,
  { label: string; current: number; previous: number; target: number }[]
> = {
  Daily: [
    { label: "Mon", current: 82, previous: 71, target: 90 },
    { label: "Tue", current: 88, previous: 76, target: 90 },
    { label: "Wed", current: 79, previous: 80, target: 90 },
    { label: "Thu", current: 95, previous: 82, target: 90 },
    { label: "Fri", current: 92, previous: 85, target: 90 },
    { label: "Sat", current: 101, previous: 78, target: 90 },
    { label: "Sun", current: 87, previous: 74, target: 90 },
  ],
  Weekly: [
    { label: "W1", current: 620, previous: 540, target: 600 },
    { label: "W2", current: 640, previous: 570, target: 600 },
    { label: "W3", current: 585, previous: 590, target: 600 },
    { label: "W4", current: 690, previous: 610, target: 600 },
    { label: "W5", current: 710, previous: 630, target: 600 },
  ],
  Monthly: [
    { label: "Jan", current: 6800, previous: 6100, target: 7000 },
    { label: "Feb", current: 7400, previous: 6600, target: 7200 },
    { label: "Mar", current: 8200, previous: 7000, target: 8000 },
    { label: "Apr", current: 9100, previous: 7600, target: 8600 },
    { label: "May", current: 9850, previous: 8300, target: 9200 },
    { label: "Jun", current: 10420, previous: 8900, target: 9800 },
    { label: "Jul", current: 11200, previous: 9600, target: 10400 },
    { label: "Aug", current: 11800, previous: 10000, target: 11000 },
  ],
  Quarterly: [
    { label: "Q1", current: 22400, previous: 19700, target: 23000 },
    { label: "Q2", current: 29370, previous: 24800, target: 27500 },
    { label: "Q3", current: 33400, previous: 27500, target: 31000 },
    { label: "Q4", current: 35900, previous: 29800, target: 34500 },
  ],
  Yearly: [
    { label: "2022", current: 78000, previous: 61000, target: 72000 },
    { label: "2023", current: 92000, previous: 78000, target: 88000 },
    { label: "2024", current: 108000, previous: 92000, target: 100000 },
    { label: "2025", current: 124000, previous: 108000, target: 118000 },
    { label: "2026", current: 128400, previous: 124000, target: 150000 },
  ],
};

function RevenueTrendChart() {
  const [mode, setMode] = useState("Monthly");
  const [view, setView] = useState<"current" | "previous" | "target">("current");
  const points = trendData[mode];
  const max = Math.max(...points.flatMap((p) => [p.current, p.previous, p.target])) * 1.05;
  const current = view === "current";
  const show = (p: { current: number; previous: number; target: number }) =>
    view === "current" ? p.current : view === "previous" ? p.previous : p.target;

  return (
    <SectionCard
      title="Revenue Collection Trend"
      subtitle="Track collection over time and compare against the previous period and target"
      actions={
        <div className="flex flex-wrap gap-1.5">
          <TrendFilter value={mode} onChange={setMode} />
          <div className="ml-1 flex gap-1.5">
            {(["current", "previous", "target"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {v === "current" ? "Current" : v === "previous" ? "Previous" : "Target"}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="mt-6">
        <div className="flex items-end gap-3">
          {points.map((p) => {
            const v = show(p);
            const color =
              view === "target" ? "bg-gold/70" : v >= p.target ? "bg-primary" : "bg-primary/45";
            return (
              <div key={p.label} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full">
                  <div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-white group-hover:block">
                    {fmtNaira(v * 1000)}
                  </div>
                  <div
                    className={`w-full rounded-t-lg ${color} transition group-hover:opacity-90`}
                    style={{ height: `${Math.max(4, (v / max) * 220)}px` }}
                  />
                </div>
                <div className="text-xs font-semibold text-muted-foreground">{p.label}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-5 text-[11px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Above / at target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/45" /> Below target
          </span>
          {view !== "target" && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gold/70" /> Target line
            </span>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function RevenueTargetVsActual({ summary }: { summary: ExecutiveRevenueSummary }) {
  const [period, setPeriod] = useState<ExecutivePeriod>("This Year");
  const collected = summary.totalCollected;
  const target = summary.revenueTarget;
  const outstanding = Math.max(0, target - collected);
  const pct = Math.min(100, (collected / target) * 100);

  return (
    <SectionCard
      title="Revenue Target vs Actual"
      subtitle="Council-wide collection performance against the annual target"
      actions={<PeriodFilter value={period} onChange={setPeriod} />}
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                2026 Revenue Target
              </div>
              <div className="mt-1 font-display text-3xl font-bold text-ink">
                {fmtNaira(target)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Performance
              </div>
              <div className="mt-1 font-display text-3xl font-bold text-primary">
                {summary.collectionPerformance}%
              </div>
            </div>
          </div>
          <div className="mt-6 h-3 w-full overflow-hidden rounded bg-secondary">
            <div
              className="h-3 bg-primary transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span>{fmtNaira(collected)} collected</span>
            <span>{pct.toFixed(1)}%</span>
            <span>{fmtNaira(outstanding)} outstanding</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Target
            </div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{fmtNaira(target)}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Collected
            </div>
            <div className="mt-1 font-display text-xl font-bold text-primary">
              {fmtNaira(collected)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Outstanding
            </div>
            <div className="mt-1 font-display text-xl font-bold text-gold-foreground">
              {fmtNaira(outstanding)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Variance
            </div>
            <div className="mt-1 font-display text-xl font-bold text-destructive">
              -{fmtNaira(outstanding)}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function RevenueByStream({ streams }: { streams: StreamPerformance[] }) {
  return (
    <SectionCard
      title="Revenue by Stream"
      subtitle="Performance across all major revenue streams"
      actions={
        <Link
          to="/executive/revenue"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Full stream analytics →
        </Link>
      }
    >
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {streams.map((s) => {
          const pct = Math.min(100, s.collectionPct);
          const tone =
            s.collectionPct >= 85
              ? "text-primary"
              : s.collectionPct >= 60
                ? "text-gold-foreground"
                : "text-destructive";
          return (
            <Link
              key={s.stream}
              to="/executive/revenue"
              className="rounded-lg border border-border bg-card p-4 transition hover:bg-secondary/30 hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink">{s.stream}</div>
                <span className={`text-[11px] font-bold ${tone}`}>
                  {s.collectionPct}%
                </span>
              </div>
              <div className="mt-2 font-display text-xl font-bold text-ink">
                {fmtNaira(s.collected)}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                of {fmtNaira(s.target)} target · {fmtNaira(s.outstanding)} outst.
              </div>
              <div className="mt-3 h-1.5 w-full rounded bg-secondary">
                <div
                  className={`h-1.5 rounded ${s.collectionPct >= 85 ? "bg-primary" : s.collectionPct >= 60 ? "bg-gold" : "bg-destructive"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] font-semibold">
                {s.growthPct >= 0 ? (
                  <span className="flex items-center gap-0.5 text-primary">
                    <ArrowUpRight className="h-3 w-3" /> +{s.growthPct}% vs prev
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-destructive">
                    <ArrowDownRight className="h-3 w-3" /> {s.growthPct}% vs prev
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}

function WardPerformanceSection({ wards }: { wards: WardPerformance[] }) {
  const ranked = useMemo(() => [...wards].sort((a, b) => b.compliance - a.compliance), [wards]);
  const top = ranked.slice(0, 5);
  const low = [...ranked].slice(-5).reverse();

  return (
    <SectionCard
      title="Ward Performance"
      subtitle="Collection and compliance ranking across the 10 wards"
      actions={
        <Link to="/executive/wards" className="text-sm font-semibold text-primary hover:underline">
          Full ward report →
        </Link>
      }
    >
      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ranked.map((w, i) => {
              const pct = Math.min(100, (w.collected / w.target) * 100);
              return (
                <div
                  key={w.ward}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                      i === 0
                        ? "bg-gold text-gold-foreground"
                        : i < 3
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{w.ward}</span>
                      <span className="text-xs font-bold text-ink">{w.compliance}%</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{fmtNaira(w.collected)}</span>
                      <span>{fmtNaira(w.outstanding)} outst.</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded bg-secondary">
                      <div
                        className={`h-1.5 rounded ${w.compliance >= 70 ? "bg-primary" : w.compliance >= 50 ? "bg-gold" : "bg-destructive"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <TrendingUp className="h-4 w-4" /> Top Performing Wards
            </div>
            <ol className="mt-2 space-y-1.5">
              {top.map((w, i) => (
                <li key={w.ward} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-emerald-900">
                    {i + 1}. {w.ward}
                  </span>
                  <span className="font-bold text-emerald-700">{w.compliance}%</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-red-800">
              <AlertTriangle className="h-4 w-4" /> Underperforming Wards
            </div>
            <ol className="mt-2 space-y-1.5">
              {low.map((w, i) => (
                <li key={w.ward} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-red-900">
                    {i + 1}. {w.ward}
                  </span>
                  <span className="font-bold text-red-700">{w.compliance}%</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function PaymentSettlementSection({ payments }: { payments: PaymentSummary }) {
  return (
    <SectionCard
      title="Payments & Settlement"
      subtitle="Transaction processing and settlement monitoring"
      actions={
        <Link
          to="/executive/payments"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Payment monitoring →
        </Link>
      }
    >
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Transactions",
            value: payments.totalTransactions.toLocaleString(),
            icon: <CreditCard className="h-4 w-4" />,
            tone: "text-ink",
          },
          {
            label: "Successful",
            value: payments.successful.toLocaleString(),
            icon: <CheckCircle2 className="h-4 w-4" />,
            tone: "text-primary",
          },
          {
            label: "Pending",
            value: payments.pending.toLocaleString(),
            icon: <Activity className="h-4 w-4" />,
            tone: "text-gold-foreground",
          },
          {
            label: "Failed",
            value: payments.failed.toLocaleString(),
            icon: <XCircle className="h-4 w-4" />,
            tone: "text-destructive",
          },
          {
            label: "Total Value",
            value: fmtNaira(payments.totalValue),
            icon: <Banknote className="h-4 w-4" />,
            tone: "text-ink",
          },
          {
            label: "Total Settled",
            value: fmtNaira(payments.totalSettled),
            icon: <Wallet className="h-4 w-4" />,
            tone: "text-primary",
          },
          {
            label: "Pending Settlement",
            value: fmtNaira(payments.pendingSettlement),
            icon: <PiggyBank className="h-4 w-4" />,
            tone: "text-gold-foreground",
          },
          {
            label: "Reversed",
            value: payments.reversed.toLocaleString(),
            icon: <ArrowDownRight className="h-4 w-4" />,
            tone: "text-destructive",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className={`mb-2 inline-flex rounded-lg p-1.5 bg-secondary ${s.tone}`}>
              {s.icon}
            </div>
            <div className={`font-display text-xl font-bold ${s.tone}`}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-ink">Payment Channels</div>
        <div className="mt-3 space-y-2.5">
          {payments.channels.map((c) => (
            <div key={c.channel} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm font-medium text-foreground">{c.channel}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
              </div>
              <span className="w-24 shrink-0 text-right text-[11px] text-muted-foreground">
                {fmtNaira(c.value)}
              </span>
              <span className="w-10 shrink-0 text-right text-xs font-bold text-ink">{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function ComplianceOverview({ compliance }: { compliance: ComplianceSummary }) {
  return (
    <SectionCard
      title="Compliance Overview"
      subtitle="Taxpayer compliance posture across the council"
      actions={
        <Link
          to="/executive/compliance"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Full compliance view →
        </Link>
      }
    >
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Taxpayers", value: compliance.totalTaxpayers.toLocaleString() },
          {
            label: "Compliant",
            value: compliance.compliant.toLocaleString(),
            tone: "text-primary",
          },
          {
            label: "Partially Compliant",
            value: compliance.partial.toLocaleString(),
            tone: "text-gold-foreground",
          },
          {
            label: "Non-Compliant",
            value: compliance.nonCompliant.toLocaleString(),
            tone: "text-destructive",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className={`font-display text-2xl font-bold ${s.tone ?? "text-ink"}`}>
              {s.value}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Compliance Rate</span>
            <span className="font-display text-2xl font-bold text-primary">
              {compliance.complianceRate}%
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary to-gold"
              style={{ width: `${compliance.complianceRate}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Outstanding Revenue</span>
            <span className="font-display text-2xl font-bold text-destructive">
              {fmtNaira(compliance.outstanding)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {compliance.overdue.toLocaleString()} overdue accounts
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function ExecutiveAlerts({ alerts }: { alerts: ExecutiveAlert[] }) {
  const icon = (severity: ExecutiveAlert["severity"]) =>
    severity === "Critical" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : severity === "Warning" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : severity === "Positive" ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : (
      <Activity className="h-4 w-4" />
    );
  const tone = (severity: ExecutiveAlert["severity"]) =>
    severity === "Critical"
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : severity === "Warning"
        ? "border-gold/40 bg-gold/10 text-gold-foreground"
        : severity === "Positive"
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-border bg-surface text-foreground";

  return (
    <SectionCard title="Executive Alerts" subtitle="Automatically generated from live council data">
      <div className="mt-4 space-y-2.5">
        {alerts.map((a, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${tone(a.severity)}`}
          >
            <span className="mt-0.5 shrink-0">{icon(a.severity)}</span>
            <div className="flex-1">
              <div className="font-semibold">{a.message}</div>
              <div className="mt-0.5 text-[11px] font-bold uppercase tracking-widest opacity-70">
                {a.severity}
              </div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No alerts — the council is performing within expectations.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function MarketSummaryCard({ markets }: { markets: MarketSummary }) {
  return (
    <SectionCard
      title="Market Performance"
      subtitle="Executive summary of the council's markets"
      actions={
        <Link
          to="/executive/markets"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Markets →
        </Link>
      }
    >
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Total Markets",
            value: markets.totalMarkets.toLocaleString(),
            icon: <ShoppingCart className="h-4 w-4" />,
          },
          {
            label: "Occupied Stalls",
            value: markets.occupiedStalls.toLocaleString(),
            icon: <Home className="h-4 w-4" />,
          },
          {
            label: "Registered Traders",
            value: markets.registeredTraders.toLocaleString(),
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: "Market Revenue",
            value: fmtNaira(markets.revenue),
            icon: <Banknote className="h-4 w-4" />,
          },
          {
            label: "Outstanding",
            value: fmtNaira(markets.outstanding),
            icon: <PiggyBank className="h-4 w-4" />,
          },
          {
            label: "Compliance",
            value: `${markets.compliance}%`,
            icon: <ShieldCheck className="h-4 w-4" />,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 inline-flex rounded-lg bg-secondary p-1.5 text-muted-foreground">
              {s.icon}
            </div>
            <div className="font-display text-xl font-bold text-ink">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <span className="font-semibold text-emerald-800">Top market:</span>{" "}
          <span className="font-bold text-emerald-900">{markets.topMarket}</span>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
          <span className="font-semibold text-red-800">Lowest market:</span>{" "}
          <span className="font-bold text-red-900">{markets.lowestMarket}</span>
        </div>
      </div>
    </SectionCard>
  );
}

function TransportSummaryCard({ transport }: { transport: TransportSummary }) {
  return (
    <SectionCard
      title="Transport Performance"
      subtitle="Executive summary of transport revenue and compliance"
      actions={
        <Link
          to="/executive/transport"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Transport →
        </Link>
      }
    >
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Registered Vehicles",
            value: transport.registeredVehicles.toLocaleString(),
            icon: <Building2 className="h-4 w-4" />,
          },
          {
            label: "Active Vehicles",
            value: transport.activeVehicles.toLocaleString(),
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: "Routes",
            value: transport.routes.toLocaleString(),
            icon: <Map className="h-4 w-4" />,
          },
          {
            label: "Transport Revenue",
            value: fmtNaira(transport.revenue),
            icon: <Banknote className="h-4 w-4" />,
          },
          {
            label: "Tickets Verified",
            value: transport.ticketsVerified.toLocaleString(),
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: "Violations",
            value: transport.violations.toLocaleString(),
            icon: <Gavel className="h-4 w-4" />,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 inline-flex rounded-lg bg-secondary p-1.5 text-muted-foreground">
              {s.icon}
            </div>
            <div className="font-display text-xl font-bold text-ink">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function EnforcementSummaryCard({ enforcement }: { enforcement: EnforcementSummary }) {
  const total = Math.max(1, enforcement.totalInspections);
  return (
    <SectionCard
      title="Enforcement Overview"
      subtitle="Council-wide enforcement performance"
      actions={
        <Link
          to="/executive/enforcement"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Enforcement →
        </Link>
      }
    >
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: "Total Inspections",
            value: enforcement.totalInspections.toLocaleString(),
            tone: "text-ink",
          },
          {
            label: "Compliant",
            value: enforcement.compliant.toLocaleString(),
            tone: "text-primary",
          },
          {
            label: "Violations",
            value: enforcement.violations.toLocaleString(),
            tone: "text-destructive",
          },
          {
            label: "Warnings",
            value: enforcement.warnings.toLocaleString(),
            tone: "text-gold-foreground",
          },
          { label: "Fines", value: enforcement.fines.toLocaleString(), tone: "text-ink" },
          {
            label: "Other Actions",
            value: enforcement.otherActions.toLocaleString(),
            tone: "text-muted-foreground",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className={`font-display text-xl font-bold ${s.tone}`}>{s.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Compliance rate from inspections</span>
          <span className="font-bold text-primary">
            {Math.round((enforcement.compliant / total) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${(enforcement.compliant / total) * 100}%` }}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function RecentActivity({ activity }: { activity: ExecutiveActivity[] }) {
  const kindIcon = (kind: ExecutiveActivity["kind"]) =>
    kind === "revenue" ? (
      <Banknote className="h-4 w-4" />
    ) : kind === "payment" ? (
      <CreditCard className="h-4 w-4" />
    ) : kind === "settlement" ? (
      <Wallet className="h-4 w-4" />
    ) : kind === "market" ? (
      <ShoppingCart className="h-4 w-4" />
    ) : kind === "target" ? (
      <Target className="h-4 w-4" />
    ) : kind === "compliance" ? (
      <ShieldCheck className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );

  return (
    <SectionCard title="Recent Executive Activity" subtitle="High-level events across the council">
      <ul className="mt-4 space-y-3">
        {activity.map((a, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex rounded-lg bg-secondary p-1.5 text-muted-foreground">
              {kindIcon(a.kind)}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-ink">{a.text}</div>
              <div className="text-[11px] text-muted-foreground">{a.at}</div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function QuickActions() {
  const actions = [
    { to: "/reports", label: "View Revenue Report", icon: <FileText className="h-4 w-4" /> },
    {
      to: "/executive/revenue",
      label: "View Monthly Performance",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    { to: "/executive/wards", label: "View Ward Performance", icon: <Map className="h-4 w-4" /> },
    {
      to: "/executive/payments",
      label: "View Payment Report",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      to: "/executive/compliance",
      label: "View Compliance",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    { to: "/executive/gis", label: "View GIS", icon: <Map className="h-4 w-4" /> },
    {
      to: "/reports",
      label: "Generate Executive Report",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
  ];
  return (
    <SectionCard title="Quick Actions" subtitle="Jump straight to the reports you need most">
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm font-semibold text-ink transition hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="text-muted-foreground transition group-hover:text-primary">
              {a.icon}
            </span>
            {a.label}
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

function ExecutiveGisCard() {
  return (
    <SectionCard
      title="Council GIS"
      subtitle="Geographic revenue intelligence across wards, markets and transport corridors"
      actions={
        <Link to="/executive/gis" className="text-sm font-semibold text-primary hover:underline">
          Open executive map →
        </Link>
      }
    >
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Revenue by Location", icon: <Banknote className="h-4 w-4" /> },
            { label: "Taxpayer Density", icon: <Users className="h-4 w-4" /> },
            { label: "Property Density", icon: <Home className="h-4 w-4" /> },
            { label: "Compliance Heat", icon: <ShieldCheck className="h-4 w-4" /> },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm font-medium text-foreground"
            >
              <span className="text-primary">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-2xl bg-card" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-card" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl bg-card lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-card" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-card p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h2 className="mt-4 font-display text-lg font-bold text-ink">
        Unable to load executive data
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
      >
        Try again
      </button>
    </div>
  );
}

type SectionKey = "overview" | "revenue" | "operations" | "compliance" | "activity";

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "revenue", label: "Revenue", icon: BarChart3 },
  { key: "operations", label: "Operations", icon: Building2 },
  { key: "compliance", label: "Wards & Compliance", icon: ShieldCheck },
  { key: "activity", label: "Activity", icon: Activity },
];

function SectionTabs({ active, onChange }: { active: SectionKey; onChange: (k: SectionKey) => void }) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="inline-flex gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const on = active === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                on
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact "jump to a detailed report" grid shown on the Overview tab so the
// landing screen stays clean while every deep-dive stays one tap away.
function ExploreReports() {
  const links = [
    { to: "/executive/revenue", label: "Revenue streams", icon: <BarChart3 className="h-4 w-4" /> },
    { to: "/executive/wards", label: "Ward performance", icon: <Map className="h-4 w-4" /> },
    { to: "/executive/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
    { to: "/executive/compliance", label: "Compliance", icon: <ShieldCheck className="h-4 w-4" /> },
    { to: "/executive/markets", label: "Markets", icon: <ShoppingCart className="h-4 w-4" /> },
    { to: "/executive/transport", label: "Transport", icon: <Building2 className="h-4 w-4" /> },
    { to: "/executive/enforcement", label: "Enforcement", icon: <Gavel className="h-4 w-4" /> },
    { to: "/executive/gis", label: "GIS map", icon: <Map className="h-4 w-4" /> },
  ];
  return (
    <SectionCard title="Explore detailed reports" subtitle="Open a full analytics view for any area of the council">
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm font-semibold text-ink transition hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="text-muted-foreground transition group-hover:text-primary">{l.icon}</span>
            {l.label}
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

export function ExecutiveDashboard() {
  const { data, loading, error, retry } = useExecutiveData();
  const [section, setSection] = useState<SectionKey>("overview");

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return <ErrorState message="No executive data available." onRetry={retry} />;

  const {
    summary,
    streams,
    wards,
    payments,
    compliance,
    markets,
    transport,
    enforcement,
    alerts,
    activity,
  } = data;

  return (
    <DashboardShell
      title="Executive Dashboard"
      subtitle="Chairman command center for Kwali Area Council"
      actions={
        <Link
          to="/reports"
          className="hidden rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 md:inline-flex"
        >
          Generate executive report
        </Link>
      }
    >
      {/* Welcome */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-[var(--shadow-elegant)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
              {new Date().toLocaleDateString("en-NG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">
              {greeting()}, Chairman
            </h2>
            <p className="mt-1 text-sm text-primary-foreground/85">
              Kwali Area Council · Executive Command Center
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Hero label="Today" value={fmtNaira(summary.today)} />
            <Hero label="This month" value={fmtNaira(summary.month)} />
            <Hero label="This year" value={fmtNaira(summary.totalCollected)} />
            <Hero label="Compliance" value={`${summary.complianceRate}%`} />
          </div>
        </div>
      </section>

      {/* Section navigation — replaces one endless scroll with focused views */}
      <SectionTabs active={section} onChange={setSection} />

      {/* ---------------------------------------------------------- Overview */}
      {section === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Revenue Collected"
              value={fmtNaira(summary.totalCollected)}
              hint="Year to date"
              change={{ pct: summary.changePct, positive: true }}
              tone="positive"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KpiCard
              label="Collection Performance"
              value={`${summary.collectionPerformance}%`}
              hint="of 2026 target"
              tone="gold"
              icon={<Target className="h-4 w-4" />}
            />
            <KpiCard
              label="Outstanding Revenue"
              value={fmtNaira(summary.outstandingRevenue)}
              hint="assessed but unpaid"
              tone="danger"
              icon={<PiggyBank className="h-4 w-4" />}
            />
            <KpiCard
              label="Compliance Rate"
              value={`${summary.complianceRate}%`}
              hint="council average"
              tone="gold"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
          </div>

          <RevenueTargetVsActual summary={summary} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ExecutiveAlerts alerts={alerts} />
            <ExploreReports />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- Revenue */}
      {section === "revenue" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Revenue Collected"
              value={fmtNaira(summary.totalCollected)}
              hint="Year to date"
              change={{ pct: summary.changePct, positive: true }}
              tone="positive"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KpiCard
              label="Revenue Target"
              value={fmtNaira(summary.revenueTarget)}
              hint="2026 target"
              icon={<Target className="h-4 w-4" />}
            />
            <KpiCard
              label="Collection Performance"
              value={`${summary.collectionPerformance}%`}
              hint="of target"
              tone="gold"
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <KpiCard
              label="Outstanding Revenue"
              value={fmtNaira(summary.outstandingRevenue)}
              hint="assessed but unpaid"
              tone="danger"
              icon={<PiggyBank className="h-4 w-4" />}
            />
            <KpiCard
              label="Total Taxpayers"
              value={summary.totalTaxpayers.toLocaleString()}
              hint="registered"
              icon={<Users className="h-4 w-4" />}
            />
            <KpiCard
              label="Successful Payments"
              value={summary.successfulPayments.toLocaleString()}
              hint="processed"
              tone="positive"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <KpiCard
              label="Total Settled Funds"
              value={fmtNaira(summary.totalSettled)}
              hint="settled to council"
              tone="positive"
              icon={<Wallet className="h-4 w-4" />}
            />
            <KpiCard
              label="Compliance Rate"
              value={`${summary.complianceRate}%`}
              hint="council average"
              tone="gold"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
          </div>

          <RevenueTargetVsActual summary={summary} />
          <RevenueTrendChart />
          <RevenueByStream streams={streams} />
        </div>
      )}

      {/* ---------------------------------------------------------- Operations */}
      {section === "operations" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <MarketSummaryCard markets={markets} />
            <TransportSummaryCard transport={transport} />
          </div>
          <EnforcementSummaryCard enforcement={enforcement} />
          <ExecutiveGisCard />
        </div>
      )}

      {/* ---------------------------------------------------- Wards & Compliance */}
      {section === "compliance" && (
        <div className="space-y-6">
          <WardPerformanceSection wards={wards} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ComplianceOverview compliance={compliance} />
            <PaymentSettlementSection payments={payments} />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- Activity */}
      {section === "activity" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentActivity activity={activity} />
            <QuickActions />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Hero({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
      <div className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/75">
        {label}
      </div>
      <div className="font-display text-base font-bold text-primary-foreground">{value}</div>
    </div>
  );
}
