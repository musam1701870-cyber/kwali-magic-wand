import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Export — KARCIP" }] }),
  component: ReportsPage,
});

const reports = [
  { t: "Daily Revenue Report", d: "Today's collections across all sources", icon: "📅" },
  { t: "Weekly Revenue Report", d: "Week-over-week collection trend", icon: "🗓️" },
  { t: "Monthly Revenue Report", d: "Comprehensive monthly performance", icon: "📆" },
  { t: "Quarterly Revenue Report", d: "Q1–Q4 performance and forecast", icon: "📊" },
  { t: "Annual Revenue Report", d: "Year-end audit-ready report", icon: "📈" },
  { t: "Revenue by Category", d: "Breakdown across all revenue sources", icon: "🗂️" },
  { t: "Revenue by Ward", d: "Performance per ward", icon: "🗺️" },
  { t: "Revenue by Officer", d: "Collection officer leaderboard", icon: "👮" },
  { t: "Revenue by Market", d: "Market-level revenue analytics", icon: "🛒" },
  { t: "Revenue by Business Type", d: "Hotels, POS, retail, hospitality", icon: "🏢" },
  { t: "Revenue by Vehicle Type", d: "Motorcycle, tricycle, taxi, commercial", icon: "🛵" },
  { t: "Chairman Monthly Report", d: "Branded executive PDF report", icon: "👑" },
];

function ReportsPage() {
  return (
    <DashboardShell title="Reports & Export Center" subtitle="Generate, schedule and export every report — PDF, Excel, CSV"
      actions={<button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">+ Schedule report</button>}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.t} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-lg">{r.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ready</span>
            </div>
            <div className="mt-3 font-display font-bold text-ink">{r.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{r.d}</div>
            <div className="mt-4 flex gap-2 text-[11px] font-semibold">
              <button className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground">PDF</button>
              <button className="rounded-md border border-border px-3 py-1.5 text-ink hover:border-primary">Excel</button>
              <button className="rounded-md border border-border px-3 py-1.5 text-ink hover:border-primary">CSV</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Scheduled automated reports</h2>
        <table className="mt-4 w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="py-2 text-left">Report</th><th className="text-left">Frequency</th><th className="text-left">Recipients</th><th className="text-left">Next run</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { r: "Daily Revenue Report", f: "Every day · 18:00", to: "Revenue Director", n: "Tomorrow 18:00" },
              { r: "Chairman Monthly Report", f: "1st of month", to: "Chairman, Director", n: "1 Jul 2026" },
              { r: "Compliance & Leakage", f: "Weekly · Mon 08:00", to: "Enforcement team", n: "Mon 08:00" },
            ].map((s) => (
              <tr key={s.r}>
                <td className="py-3 font-semibold text-ink">{s.r}</td>
                <td className="py-3 text-muted-foreground">{s.f}</td>
                <td className="py-3 text-muted-foreground">{s.to}</td>
                <td className="py-3 text-muted-foreground">{s.n}</td>
                <td className="py-3 text-right"><button className="text-xs font-semibold text-primary hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
