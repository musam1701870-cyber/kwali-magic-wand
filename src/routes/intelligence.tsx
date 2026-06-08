import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { kpis, wardRevenue } from "@/lib/kwali-mock";

export const Route = createFileRoute("/intelligence")({
  head: () => ({ meta: [{ title: "Revenue Intelligence — KARCIP" }] }),
  component: IntelligencePage,
});

const fmt = (n: number) => "₦" + n.toLocaleString();

function IntelligencePage() {
  const totalExpected = wardRevenue.reduce((s, w) => s + w.expected, 0);
  const totalCollected = wardRevenue.reduce((s, w) => s + w.collected, 0);
  const totalLeakage = totalExpected - totalCollected;
  const highRisk = [...wardRevenue].sort((a, b) => a.compliance - b.compliance).slice(0, 3);

  return (
    <DashboardShell title="Revenue Intelligence" subtitle="AI-driven leakage detection, forecasting and enforcement recommendations">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Expected revenue" value={fmt(kpis.expected)} />
        <Stat label="Actual revenue" value={fmt(kpis.year)} accent="primary" />
        <Stat label="Leakage detected" value={fmt(totalLeakage)} accent="destructive" />
        <Stat label="Compliance" value={`${kpis.compliance}%`} accent="gold" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">🚨 High-risk wards</h2>
          <p className="mt-1 text-sm text-muted-foreground">Lowest compliance — prioritise enforcement sweeps.</p>
          <ul className="mt-4 space-y-3">
            {highRisk.map((w) => (
              <li key={w.ward} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div>
                  <div className="font-semibold text-ink">{w.ward}</div>
                  <div className="text-xs text-muted-foreground">Leakage {fmt(w.leakage)}</div>
                </div>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">{w.compliance}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">🔮 Forecast — Q3 2026</h2>
          <div className="mt-4 space-y-4">
            <Bar label="Property" pct={72} hint="₦52m projected" />
            <Bar label="Business" pct={64} hint="₦48m projected" />
            <Bar label="Transport" pct={81} hint="₦38m projected" />
            <Bar label="Market" pct={58} hint="₦22m projected" />
            <Bar label="Environmental" pct={45} hint="₦12m projected" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">🧠 AI insights & recommended actions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { t: "Deploy enforcement to Yangoji market", d: "Compliance dropped 18% over 3 weeks. Predicted recovery: ₦4.2m." },
            { t: "Reissue demand notices for 47 hotels", d: "Hospitality sector under-collecting by 38% vs forecast." },
            { t: "Audit POS operators in Kwali ward", d: "23 unregistered POS terminals detected via bank data." },
            { t: "Renew QR stickers — 312 expiring", d: "Tricycle stickers expire in 14 days. Auto-notify operators." },
            { t: "Investigate Pai property under-assessment", d: "GPS audit suggests 14 commercial properties classed residential." },
            { t: "Increase market ticket rounds", d: "Dafa Cattle Market shows highest yield-per-officer." },
          ].map((i) => (
            <div key={i.t} className="rounded-xl border border-border bg-surface p-4">
              <div className="font-semibold text-ink">{i.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{i.d}</div>
              <button className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Assign action</button>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "primary" | "destructive" | "gold" }) {
  const color = accent === "destructive" ? "text-destructive" : accent === "gold" ? "text-gold-foreground" : accent === "primary" ? "text-primary" : "text-ink";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Bar({ label, pct, hint }: { label: string; pct: number; hint: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold text-ink"><span>{label}</span><span>{pct}%</span></div>
      <div className="mt-1 h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-gradient-to-r from-primary to-gold" style={{ width: `${pct}%` }} /></div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}
