import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { kpis, wardRevenue, monthlyTrend, sourceMix } from "@/lib/kwali-mock";

export const Route = createFileRoute("/executive")({
  head: () => ({ meta: [{ title: "Executive Dashboard — KARCIP" }] }),
  component: ExecutivePage,
});

const fmt = (n: number) => "₦" + n.toLocaleString();

function KPI({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: "gold" | "destructive" | "primary" }) {
  const chip = accent === "gold" ? "bg-gold/15 text-gold-foreground" : accent === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${chip}`}>Live</span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-ink lg:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ExecutivePage() {
  const max = Math.max(...monthlyTrend.map((m) => m.v));
  return (
    <DashboardShell
      title="Chairman's Executive Dashboard"
      subtitle="Real-time revenue intelligence across Kwali Area Council"
      actions={
        <Link to="/reports" className="hidden rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 md:inline-flex">
          Generate monthly report
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPI label="Revenue today" value={fmt(kpis.today)} hint="+12% vs yesterday" />
        <KPI label="Revenue this week" value={fmt(kpis.week)} hint="+8% vs last week" />
        <KPI label="Revenue this month" value={fmt(kpis.month)} hint="On track to ₦78m" />
        <KPI label="Revenue this year" value={fmt(kpis.year)} hint="68% of annual target" accent="gold" />
        <KPI label="Outstanding revenue" value={fmt(kpis.outstanding)} hint={`${kpis.defaulters.toLocaleString()} defaulters`} accent="destructive" />
        <KPI label="Expected revenue" value={fmt(kpis.expected)} hint="Annual forecast 2026" />
        <KPI label="Compliance rate" value={`${kpis.compliance}%`} hint="Council-wide average" accent="gold" />
        <KPI label="Active taxpayers" value={(kpis.businesses + kpis.properties).toLocaleString()} hint="Businesses + properties" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Mini label="Properties" value={kpis.properties.toLocaleString()} />
        <Mini label="Businesses" value={kpis.businesses.toLocaleString()} />
        <Mini label="Vehicles" value={kpis.vehicles.toLocaleString()} />
        <Mini label="Motorcycles" value={kpis.motorcycles.toLocaleString()} />
        <Mini label="Tricycles" value={kpis.tricycles.toLocaleString()} />
        <Mini label="Market traders" value={kpis.traders.toLocaleString()} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Revenue trend · 2026</h2>
            <span className="text-xs text-muted-foreground">₦ in thousands</span>
          </div>
          <div className="mt-6 flex h-56 items-end gap-4">
            {monthlyTrend.map((m) => (
              <div key={m.m} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60" style={{ height: `${(m.v / max) * 100}%` }} />
                <div className="text-xs font-semibold text-muted-foreground">{m.m}</div>
                <div className="text-[10px] text-muted-foreground">{m.v.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Revenue mix</h2>
          <div className="mt-4 space-y-3">
            {sourceMix.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs font-semibold text-ink">
                  <span>{s.name}</span><span>{s.value}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${s.value * 3}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Revenue by ward</h2>
          <Link to="/command-center" className="text-sm font-semibold text-primary hover:underline">Open command center →</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="py-2 text-left">Ward</th><th className="text-right">Expected</th><th className="text-right">Collected</th><th className="text-right">Leakage</th><th className="text-right">Compliance</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {wardRevenue.map((w) => (
                <tr key={w.ward}>
                  <td className="py-3 font-semibold text-ink">{w.ward}</td>
                  <td className="py-3 text-right text-muted-foreground">{fmt(w.expected)}</td>
                  <td className="py-3 text-right font-semibold text-primary">{fmt(w.collected)}</td>
                  <td className="py-3 text-right text-destructive">{fmt(w.leakage)}</td>
                  <td className="py-3 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${w.compliance >= 70 ? "bg-primary/10 text-primary" : w.compliance >= 50 ? "bg-gold/20 text-gold-foreground" : "bg-destructive/10 text-destructive"}`}>{w.compliance}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold text-ink">{value}</div>
    </div>
  );
}
