import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import {
  wardRevenue,
  monthlyTrend,
  sourceMix,
  markets,
  marketOfficers,
  payments,
  businesses,
  vehicles,
} from "@/shared/lib/kwali-mock";
import { exportCSV, exportXLSX, exportPDF, type ExportRow } from "@/shared/lib/exporters";
import { X } from "lucide-react";

export const Route = createFileRoute("/(admin)/reports")({
  head: () => ({ meta: [{ title: "Reports & Export — KARCIP" }] }),
  component: ReportsPage,
});

// Each report resolves to a concrete dataset that can be exported in any format.
type ReportDef = { t: string; d: string; icon: string; rows: () => ExportRow[] };

const reports: ReportDef[] = [
  {
    t: "Daily Revenue Report",
    d: "Today's collections across all sources",
    icon: "📅",
    rows: () =>
      sourceMix.map((s) => ({
        Source: s.name,
        "Share %": s.value,
        "Est. ₦ today": s.value * 24500,
      })),
  },
  {
    t: "Weekly Revenue Report",
    d: "Week-over-week collection trend",
    icon: "🗓️",
    rows: () => monthlyTrend.map((m) => ({ Period: m.m, "Revenue (₦000)": m.v })),
  },
  {
    t: "Monthly Revenue Report",
    d: "Comprehensive monthly performance",
    icon: "📆",
    rows: () =>
      monthlyTrend.map((m) => ({
        Month: m.m,
        "Revenue (₦000)": m.v,
        "vs target %": Math.round((m.v / 10000) * 100),
      })),
  },
  {
    t: "Quarterly Revenue Report",
    d: "Q1–Q4 performance and forecast",
    icon: "📊",
    rows: () => [
      { Quarter: "Q1", "Revenue (₦000)": 22400 },
      { Quarter: "Q2 (proj.)", "Revenue (₦000)": 29370 },
    ],
  },
  {
    t: "Annual Revenue Report",
    d: "Year-end audit-ready report",
    icon: "📈",
    rows: () =>
      wardRevenue.map((w) => ({
        Ward: w.ward,
        Expected: w.expected,
        Collected: w.collected,
        Leakage: w.leakage,
      })),
  },
  {
    t: "Revenue by Category",
    d: "Breakdown across all revenue sources",
    icon: "🗂️",
    rows: () => sourceMix.map((s) => ({ Category: s.name, "Share %": s.value })),
  },
  {
    t: "Revenue by Ward",
    d: "Performance per ward",
    icon: "🗺️",
    rows: () =>
      wardRevenue.map((w) => ({
        Ward: w.ward,
        Expected: w.expected,
        Collected: w.collected,
        "Compliance %": w.compliance,
      })),
  },
  {
    t: "Revenue by Officer",
    d: "Collection officer leaderboard",
    icon: "👮",
    rows: () =>
      marketOfficers.map((o) => ({
        Officer: o.name,
        Market: o.marketName,
        "Collected today": o.collectedToday,
        "Efficiency %": o.efficiency,
      })),
  },
  {
    t: "Revenue by Market",
    d: "Market-level revenue analytics",
    icon: "🛒",
    rows: () =>
      markets.map((m) => ({
        Market: m.name,
        Ward: m.ward,
        Traders: m.traders,
        "Daily target ₦": m.dailyTarget,
        "Collected ₦": m.collected,
      })),
  },
  {
    t: "Revenue by Business Type",
    d: "Hotels, POS, retail, hospitality",
    icon: "🏢",
    rows: () =>
      businesses.map((b) => ({
        Business: b.name,
        Category: b.category,
        Ward: b.ward,
        "Levy ₦": b.levy,
        Status: b.status,
      })),
  },
  {
    t: "Revenue by Vehicle Type",
    d: "Motorcycle, tricycle, taxi, commercial",
    icon: "🛵",
    rows: () =>
      vehicles.map((v) => ({
        Plate: v.plate,
        Type: v.type,
        Ward: v.ward,
        "Daily ₦": v.daily,
        Active: v.active ? "Yes" : "No",
      })),
  },
  {
    t: "Chairman Monthly Report",
    d: "Branded executive PDF report",
    icon: "👑",
    rows: () =>
      payments.map((p) => ({
        Date: p.date,
        Reference: p.rrr,
        Category: p.category,
        Amount: p.amount,
        Status: p.status,
      })),
  },
];

function ReportsPage() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduled, setScheduled] = useState([
    {
      r: "Daily Revenue Report",
      f: "Every day · 18:00",
      to: "Revenue Director",
      n: "Tomorrow 18:00",
    },
    { r: "Chairman Monthly Report", f: "1st of month", to: "Chairman, Director", n: "1 Jul 2026" },
    { r: "Compliance & Leakage", f: "Weekly · Mon 08:00", to: "Enforcement team", n: "Mon 08:00" },
  ]);

  function doExport(r: ReportDef, fmt: "pdf" | "xlsx" | "csv") {
    const rows = r.rows();
    if (!rows.length) return toast.error("No data available for this report.");
    const base = r.t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (fmt === "csv") exportCSV(base, rows);
    else if (fmt === "xlsx") exportXLSX(base, rows, r.t.slice(0, 28));
    else exportPDF({ filename: base, title: r.t, subtitle: r.d, rows });
    toast.success(`${r.t} · ${fmt.toUpperCase()} exported`);
  }

  return (
    <DashboardShell
      title="Reports & Export Center"
      subtitle="Generate, schedule and export every report — PDF, Excel, CSV"
      actions={
        <button
          onClick={() => setScheduleOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          + Schedule report
        </button>
      }
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
              <button
                onClick={() => doExport(r, "pdf")}
                className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-95"
              >
                PDF
              </button>
              <button
                onClick={() => doExport(r, "xlsx")}
                className="rounded-md border border-border px-3 py-1.5 text-ink hover:border-primary"
              >
                Excel
              </button>
              <button
                onClick={() => doExport(r, "csv")}
                className="rounded-md border border-border px-3 py-1.5 text-ink hover:border-primary"
              >
                CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Scheduled automated reports</h2>
        <table className="mt-4 w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="py-2 text-left">Report</th>
              <th className="text-left">Frequency</th>
              <th className="text-left">Recipients</th>
              <th className="text-left">Next run</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {scheduled.map((s) => (
              <tr key={s.r}>
                <td className="py-3 font-semibold text-ink">{s.r}</td>
                <td className="py-3 text-muted-foreground">{s.f}</td>
                <td className="py-3 text-muted-foreground">{s.to}</td>
                <td className="py-3 text-muted-foreground">{s.n}</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => setScheduled((prev) => prev.filter((x) => x.r !== s.r))}
                    className="text-xs font-semibold text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {scheduled.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  No scheduled reports. Add one with “Schedule report”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {scheduleOpen && (
        <ScheduleModal
          onClose={() => setScheduleOpen(false)}
          onSave={(row) => {
            setScheduled((prev) => [...prev, row]);
            setScheduleOpen(false);
            toast.success("Report scheduled", { description: `${row.r} · ${row.f}` });
          }}
        />
      )}
    </DashboardShell>
  );
}

function ScheduleModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (row: { r: string; f: string; to: string; n: string }) => void;
}) {
  const [report, setReport] = useState(reports[0].t);
  const [freq, setFreq] = useState("Every day · 18:00");
  const [recipients, setRecipients] = useState("Revenue Director");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Schedule a report</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ r: report, f: freq, to: recipients, n: "Next scheduled run" });
          }}
          className="space-y-4 px-5 py-4"
        >
          <div>
            <label className="text-xs font-semibold text-ink">Report</label>
            <select
              value={report}
              onChange={(e) => setReport(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {reports.map((r) => (
                <option key={r.t}>{r.t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Frequency</label>
            <select
              value={freq}
              onChange={(e) => setFreq(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option>Every day · 18:00</option>
              <option>Weekly · Mon 08:00</option>
              <option>1st of month</option>
              <option>Quarterly</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Recipients</label>
            <input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Names or emails"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
