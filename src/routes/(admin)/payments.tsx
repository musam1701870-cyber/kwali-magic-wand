import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { payments, type Payment } from "@/shared/lib/kwali-mock";
import { exportCSV, exportPDF, exportReceiptPDF, type ExportRow } from "@/shared/lib/exporters";
import { Download, Search, FileText } from "lucide-react";

export const Route = createFileRoute("/(admin)/payments")({
  head: () => ({ meta: [{ title: "Payments & Receipts — Kwali Revenue Portal" }] }),
  component: PaymentsPage,
});

const CATEGORIES = ["All categories", "Tenement", "Business", "Sanitation", "Transport"] as const;
const RANGES = ["Last 90 days", "Last year", "All time"] as const;

function cutoffFor(range: (typeof RANGES)[number]): string {
  if (range === "All time") return "0000-00-00";
  const d = new Date();
  d.setDate(d.getDate() - (range === "Last 90 days" ? 90 : 365));
  return d.toISOString().slice(0, 10);
}

function downloadReceipt(p: Payment) {
  exportReceiptPDF({
    filename: `receipt-${p.rrr}`,
    receiptNo: p.rrr,
    payerName: p.category,
    lines: [
      { label: "Date", value: p.date },
      { label: "Category", value: p.category },
      { label: "Channel", value: p.channel },
      { label: "Status", value: p.status },
    ],
    amount: `₦${p.amount.toLocaleString()}`,
    note: "Scan the QR on this receipt at any Kwali revenue office to verify authenticity.",
  });
  toast.success("Receipt downloaded", { description: p.rrr });
}

function PaymentsPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All categories");
  const [range, setRange] = useState<(typeof RANGES)[number]>("Last 90 days");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const cutoff = cutoffFor(range);
    return payments.filter((p) => {
      const matchCat =
        category === "All categories" || p.category.toLowerCase().includes(category.toLowerCase());
      const matchDate = p.date >= cutoff;
      const matchQ =
        !q ||
        p.rrr.toLowerCase().includes(q.toLowerCase()) ||
        p.category.toLowerCase().includes(q.toLowerCase());
      return matchCat && matchDate && matchQ;
    });
  }, [category, range, q]);

  const totals = useMemo(() => {
    const sum = (s: Payment["status"]) =>
      filtered.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
    return { paid: sum("Successful"), pending: sum("Pending"), failed: sum("Failed") };
  }, [filtered]);

  function exportRows(): ExportRow[] {
    return filtered.map((p) => ({
      Date: p.date,
      Reference: p.rrr,
      Category: p.category,
      Channel: p.channel,
      Amount: p.amount,
      Status: p.status,
    }));
  }

  function exportListPDF() {
    if (!filtered.length) return toast.error("Nothing to export for this filter.");
    exportPDF({
      filename: "kwali-payments",
      title: "Payments & Receipts",
      subtitle: `${filtered.length} transactions · ${category} · ${range}`,
      rows: exportRows(),
      totals: [
        { label: "Total paid", value: `₦${totals.paid.toLocaleString()}` },
        { label: "Pending", value: `₦${totals.pending.toLocaleString()}` },
        { label: "Failed", value: `₦${totals.failed.toLocaleString()}` },
      ],
    });
    toast.success("Statement PDF downloaded");
  }

  function exportListCSV() {
    if (!filtered.length) return toast.error("Nothing to export for this filter.");
    exportCSV("kwali-payments", exportRows());
    toast.success("CSV downloaded");
  }

  return (
    <DashboardShell
      title="Payments & receipts"
      subtitle="Every transaction with its RRR reference and QR-verifiable receipt."
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
            <FileText className="h-4 w-4" /> Statement
          </button>
        </div>
      }
    >
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Total paid</div>
          <div className="mt-2 font-display text-2xl font-bold text-primary">
            ₦{totals.paid.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Pending</div>
          <div className="mt-2 font-display text-2xl font-bold text-gold-foreground">
            ₦{totals.pending.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Failed</div>
          <div className="mt-2 font-display text-2xl font-bold text-destructive">
            ₦{totals.failed.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search reference or category…"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </div>
          <div className="flex gap-2 text-xs">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="rounded-md border border-border bg-background px-2 py-1"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as typeof range)}
              className="rounded-md border border-border bg-background px-2 py-1"
            >
              {RANGES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Reference</th>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-left">Channel</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No transactions match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-4 text-muted-foreground">{p.date}</td>
                  <td className="px-5 py-4 font-mono text-xs text-ink">{p.rrr}</td>
                  <td className="px-5 py-4 text-foreground">{p.category}</td>
                  <td className="px-5 py-4 text-muted-foreground">{p.channel}</td>
                  <td className="px-5 py-4 text-right font-semibold text-ink">
                    ₦{p.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                        (p.status === "Successful"
                          ? "bg-primary/10 text-primary"
                          : p.status === "Failed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-gold/20 text-gold-foreground")
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => downloadReceipt(p)}
                      disabled={p.status !== "Successful"}
                      className="text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                    >
                      Download receipt
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
