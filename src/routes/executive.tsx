import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { kpis, wardRevenue, monthlyTrend, sourceMix } from "@/lib/kwali-mock";

export const Route = createFileRoute("/executive")({
  head: () => ({ meta: [{ title: "Dashboard — Kwali Smart Revenue Platform" }] }),
  component: ExecutivePage,
});

const fmtNaira = (n: number) => {
  if (n >= 1_000_000_000) return "₦" + (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return "₦" + (n / 1_000).toFixed(0) + "K";
  return "₦" + n.toLocaleString();
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

function KpiCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "positive" | "warning" | "danger" | "gold" }) {
  const ring =
    tone === "positive" ? "ring-1 ring-primary/15" :
    tone === "warning" ? "ring-1 ring-gold/30" :
    tone === "danger" ? "ring-1 ring-destructive/20" :
    tone === "gold" ? "ring-1 ring-gold/30" : "ring-1 ring-border";
  const chip =
    tone === "danger" ? "bg-destructive/10 text-destructive" :
    tone === "warning" || tone === "gold" ? "bg-gold/15 text-gold-foreground" :
    "bg-primary/10 text-primary";
  return (
    <div className={`rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] ${ring}`}>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-ink">{value}</div>
      {hint && <div className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip}`}>{hint}</div>}
    </div>
  );
}

function ExecutivePage() {
  const max = Math.max(...monthlyTrend.map((m) => m.v));
  const totalMix = sourceMix.reduce((s, x) => s + x.value, 0);
  // Build a conic-gradient donut from the mix values
  const palette = ["#0E4D3C", "#C9A23A", "#1E6F58", "#7A5A1F", "#2F8F75", "#B8862B", "#3FA68B"];
  let acc = 0;
  const stops = sourceMix.map((s, i) => {
    const start = (acc / totalMix) * 360;
    acc += s.value;
    const end = (acc / totalMix) * 360;
    return `${palette[i % palette.length]} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <DashboardShell
      title="Dashboard"
      subtitle="Revenue performance summary for Kwali Area Council"
      actions={
        <Link to="/reports" className="hidden rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 md:inline-flex">
          Generate executive report
        </Link>
      }
    >
      {/* Welcome */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-[var(--shadow-elegant)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">{new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{greeting()}, Chairman</h2>
            <p className="mt-1 text-sm text-primary-foreground/85">Here is today's revenue performance summary for Kwali Area Council.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Hero label="Today" value={fmtNaira(kpis.today)} />
            <Hero label="This month" value={fmtNaira(kpis.month)} />
            <Hero label="This year" value={fmtNaira(kpis.year)} />
            <Hero label="Compliance" value={`${kpis.compliance}%`} />
          </div>
        </div>
      </section>

      {/* Row 1 — six executive cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Revenue" value={fmtNaira(kpis.year)} hint="Year to date" tone="positive" />
        <KpiCard label="Revenue This Month" value={fmtNaira(kpis.month)} hint="+8% MoM" tone="positive" />
        <KpiCard label="Expected Revenue" value={fmtNaira(kpis.expected)} hint="Annual target" />
        <KpiCard label="Outstanding Revenue" value={fmtNaira(kpis.outstanding)} hint={`${kpis.defaulters.toLocaleString()} defaulters`} tone="danger" />
        <KpiCard label="Compliance Rate" value={`${kpis.compliance}%`} hint="Council average" tone="gold" />
        <KpiCard label="Registered Taxpayers" value={kpis.taxpayers.toLocaleString()} hint="Active records" />
      </div>

      {/* Row 2 — big trend + donut */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Revenue Trend</h2>
              <p className="text-xs text-muted-foreground">Monthly collection · January → December</p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">₦ in thousands</span>
          </div>
          <div className="mt-6 flex h-64 items-end gap-3">
            {monthlyTrend.map((m) => (
              <div key={m.m} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full">
                  <div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-white group-hover:block">
                    {m.v.toLocaleString()}
                  </div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/50 transition group-hover:from-gold group-hover:to-gold/60"
                       style={{ height: `${(m.v / max) * 220}px` }} />
                </div>
                <div className="text-xs font-semibold text-muted-foreground">{m.m}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Revenue by Category</h2>
          <p className="text-xs text-muted-foreground">Share of total IGR</p>
          <div className="mt-4 flex items-center justify-center">
            <div
              className="relative grid h-44 w-44 place-items-center rounded-full"
              style={{ background: `conic-gradient(${stops})` }}
            >
              <div className="grid h-28 w-28 place-items-center rounded-full bg-card text-center">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total</div>
                  <div className="font-display text-base font-bold text-ink">{fmtNaira(kpis.year)}</div>
                </div>
              </div>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-1.5 text-xs">
            {sourceMix.map((s, i) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: palette[i % palette.length] }} />
                  {s.name}
                </span>
                <span className="font-semibold text-ink">{s.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Row 3 — Revenue by ward */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Revenue by Ward</h2>
            <p className="text-xs text-muted-foreground">Collections across the 10 wards of Kwali Area Council</p>
          </div>
          <Link to="/gis" className="text-sm font-semibold text-primary hover:underline">View ward map →</Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {wardRevenue.map((w) => (
            <div key={w.ward} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink">{w.ward}</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${w.compliance >= 70 ? "bg-primary/10 text-primary" : w.compliance >= 50 ? "bg-gold/20 text-gold-foreground" : "bg-destructive/10 text-destructive"}`}>{w.compliance}%</span>
              </div>
              <div className="mt-2 font-display text-xl font-bold text-ink">{fmtNaira(w.collected)}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">of {fmtNaira(w.expected)} expected</div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (w.collected / w.expected) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

function Hero({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
      <div className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/75">{label}</div>
      <div className="font-display text-base font-bold text-primary-foreground">{value}</div>
    </div>
  );
}
