import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { taxpayers, type Taxpayer } from "@/shared/lib/kwali-mock";
import { exportCSV, exportPDF, type ExportRow } from "@/shared/lib/exporters";
import { Download, FileText, Search } from "lucide-react";

export const Route = createFileRoute("/(admin)/taxpayers")({
  head: () => ({ meta: [{ title: "Taxpayer Management — KARCIP" }] }),
  component: TaxpayersPage,
});

const FILTERS = [
  "All",
  "Individual",
  "Corporate",
  "Property Owner",
  "Business",
  "Transport Operator",
  "Market Trader",
] as const;

function TaxpayersPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Taxpayer | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return taxpayers.filter((t) => {
      const matchType = filter === "All" || t.type === filter;
      const matchQ =
        !needle ||
        t.tin.toLowerCase().includes(needle) ||
        t.name.toLowerCase().includes(needle) ||
        t.phone.toLowerCase().includes(needle);
      return matchType && matchQ;
    });
  }, [filter, q]);

  const stats = useMemo(() => {
    const total = taxpayers.length;
    const corporates = taxpayers.filter((t) => t.type === "Corporate").length;
    const owners = taxpayers.filter((t) => t.type === "Property Owner").length;
    const avg = Math.round(taxpayers.reduce((a, t) => a + t.compliance, 0) / (total || 1));
    return { total, corporates, owners, avg };
  }, []);

  function rows(): ExportRow[] {
    return filtered.map((t) => ({
      TIN: t.tin,
      Name: t.name,
      Type: t.type,
      Ward: t.ward,
      Phone: t.phone,
      Outstanding: t.outstanding,
      "Compliance %": t.compliance,
      Status: t.status,
    }));
  }
  function exportListCSV() {
    if (!filtered.length) return toast.error("Nothing to export for this filter.");
    exportCSV("kwali-taxpayers", rows());
    toast.success("CSV downloaded");
  }
  function exportListPDF() {
    if (!filtered.length) return toast.error("Nothing to export for this filter.");
    exportPDF({
      filename: "kwali-taxpayers",
      title: "Taxpayer Register",
      subtitle: `${filtered.length} records · ${filter}`,
      rows: rows(),
    });
    toast.success("Register PDF downloaded");
  }

  return (
    <DashboardShell
      title="Taxpayer Management"
      subtitle="Individuals, corporates, businesses, property owners, transport operators and market traders"
      actions={
        <div className="flex gap-2">
          <button
            onClick={exportListCSV}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={exportListPDF}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            <FileText className="h-4 w-4" /> Register
          </button>
        </div>
      }
    >
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          { t: "Total taxpayers", v: stats.total.toLocaleString() },
          { t: "Corporates", v: stats.corporates.toLocaleString() },
          { t: "Property owners", v: stats.owners.toLocaleString() },
          { t: "Compliance avg", v: `${stats.avg}%` },
        ].map((s) => (
          <div key={s.t} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {s.t}
            </div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={
              "rounded-full border px-3 py-1 text-xs font-semibold transition " +
              (filter === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-ink hover:border-primary")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="font-semibold text-ink">
            Registered taxpayers{" "}
            <span className="text-xs font-normal text-muted-foreground">({filtered.length})</span>
          </div>
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search TIN, name or phone…"
              className="w-full rounded-md border border-border bg-background py-1.5 pl-9 pr-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">TIN</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Ward</th>
                <th className="px-5 py-3 text-right">Outstanding</th>
                <th className="px-5 py-3 text-left">Compliance</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No taxpayers match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-4 font-mono text-xs text-ink">{t.tin}</td>
                    <td className="px-5 py-4 font-semibold text-ink">{t.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{t.type}</td>
                    <td className="px-5 py-4 text-muted-foreground">{t.ward}</td>
                    <td className="px-5 py-4 text-right font-semibold text-ink">
                      ₦{t.outstanding.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-secondary">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${t.compliance}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-ink">{t.compliance}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                          (t.status === "Compliant"
                            ? "bg-primary/10 text-primary"
                            : t.status === "Partial"
                              ? "bg-gold/20 text-gold-foreground"
                              : t.status === "Defaulting"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-ink/10 text-ink")
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelected(t)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <TaxpayerDrawer taxpayer={selected} onClose={() => setSelected(null)} />}
    </DashboardShell>
  );
}

function TaxpayerDrawer({ taxpayer: t, onClose }: { taxpayer: Taxpayer; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <div className="font-display text-lg font-bold text-ink">{t.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{t.tin}</div>
          </div>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-muted-foreground hover:text-ink"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm">
          {[
            ["Type", t.type],
            ["Ward", t.ward],
            ["Phone", t.phone],
            ["Compliance", `${t.compliance}%`],
            ["Status", t.status],
            ["Outstanding", `₦${t.outstanding.toLocaleString()}`],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between border-b border-border/60 pb-2"
            >
              <span className="text-muted-foreground">{k}</span>
              <span className="font-semibold text-ink">{v}</span>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <a
              href={`tel:${t.phone.replace(/[^0-9+]/g, "")}`}
              className="flex-1 rounded-md border border-border px-3 py-2 text-center text-xs font-semibold text-ink hover:border-primary"
            >
              Call
            </a>
            <a
              href={`sms:${t.phone.replace(/[^0-9+]/g, "")}`}
              className="flex-1 rounded-md border border-border px-3 py-2 text-center text-xs font-semibold text-ink hover:border-primary"
            >
              SMS
            </a>
            <button
              onClick={() => {
                toast.success("Statement generated", { description: t.name });
              }}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:opacity-95"
            >
              Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
