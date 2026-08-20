import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { exportCSV, exportPDF, exportReceiptPDF, type ExportRow } from "@/shared/lib/exporters";
import { receiptVerifyUrl } from "@/shared/lib/qr";
import { confirmPayment, fetchLedger, type LedgerRow, type PaymentStatus } from "@/shared/lib/revenue";
import { CheckCircle2, Download, FileText, Loader2, RefreshCw, Search } from "lucide-react";

// Payments & receipts, read from the central ledger.
//
// This page used to render kwali-mock.ts: a council officer could open it, read a
// revenue figure, and be looking at invented numbers. It now reads public.payments
// with its receipts attached — the same rows the marshal dashboard, the collector
// leaderboard and the public receipt verification all use. One record, one truth.
//
// It also closes the payment loop. A pending payment (a bank transfer or a quoted
// reference from the public flow) is confirmed here, which triggers the database to
// issue the official receipt. Confirmation is idempotent, so a double-click cannot
// double-count revenue.

export const Route = createFileRoute("/(admin)/payments")({
  head: () => ({ meta: [{ title: "Payments & Receipts — Kwali Revenue Portal" }] }),
  component: PaymentsPage,
});

const STATUS_FILTERS = [
  { key: "all", label: "All statuses" },
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Awaiting confirmation" },
  { key: "reversed", label: "Reversed" },
] as const;

const RANGES = ["Last 90 days", "Last year", "All time"] as const;

const REVENUE_LABELS: Record<string, string> = {
  daily_ticket: "Daily ticket",
  market_toll: "Market toll",
  market_rent: "Stall rent",
  tenement_rate: "Tenement rate",
  business_levy: "Business permit",
  permit_fee: "Permit fee",
  sanitation_levy: "Sanitation levy",
  penalty: "Penalty",
  other: "Other revenue",
};

function revenueLabel(key: string): string {
  return REVENUE_LABELS[key] ?? titleCase(key);
}

function titleCase(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sinceFor(range: (typeof RANGES)[number]): string | undefined {
  if (range === "All time") return undefined;
  const d = new Date();
  d.setDate(d.getDate() - (range === "Last 90 days" ? 90 : 365));
  return d.toISOString();
}

function PaymentsPage() {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["key"]>("all");
  const [range, setRange] = useState<(typeof RANGES)[number]>("Last 90 days");
  const [q, setQ] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLedger({
      since: sinceFor(range),
      status: status === "all" ? undefined : (status as PaymentStatus),
    });
    setRows(data);
    setLoading(false);
  }, [range, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.ref.toLowerCase().includes(needle) ||
        (r.receiptNo ?? "").toLowerCase().includes(needle) ||
        (r.sourceRef ?? "").toLowerCase().includes(needle) ||
        (r.payerName ?? "").toLowerCase().includes(needle) ||
        revenueLabel(r.revenueType).toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const totals = useMemo(() => {
    const sum = (pred: (r: LedgerRow) => boolean) =>
      filtered.filter(pred).reduce((a, r) => a + r.amount, 0);
    return {
      confirmed: sum((r) => r.status === "confirmed" && !r.voided),
      pending: sum((r) => r.status === "pending" || r.status === "initiated"),
      reversed: sum((r) => r.status === "reversed" || r.voided),
      pendingCount: filtered.filter((r) => r.status === "pending" || r.status === "initiated")
        .length,
    };
  }, [filtered]);

  async function confirm(row: LedgerRow) {
    setConfirming(row.id);
    try {
      const { receiptNo } = await confirmPayment(row.id);
      toast.success("Payment confirmed", {
        description: receiptNo ? `Receipt ${receiptNo} issued.` : "Receipt issued.",
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm this payment");
    } finally {
      setConfirming(null);
    }
  }

  async function downloadReceipt(row: LedgerRow) {
    if (!row.receiptNo) return;
    await exportReceiptPDF({
      filename: `receipt-${row.receiptNo}`,
      receiptNo: row.receiptNo,
      payerName: row.payerName ?? "Kwali Area Council taxpayer",
      lines: [
        { label: "Revenue head", value: revenueLabel(row.revenueType) },
        ...(row.obligationPeriod ? [{ label: "Period", value: row.obligationPeriod }] : []),
        { label: "Channel", value: titleCase(row.channel) },
        ...(row.sourceRef ? [{ label: "Taxpayer ID", value: row.sourceRef }] : []),
        ...(row.ward ? [{ label: "Ward", value: row.ward }] : []),
        { label: "Payment ref", value: row.ref },
      ],
      amount: `₦${row.amount.toLocaleString()}`,
      note: "Thank you for paying your Kwali Area Council levy.",
      // Real, scannable QR pointing at the public verification page.
      qrText: row.verifyToken ? receiptVerifyUrl(row.verifyToken) : undefined,
    });
    toast.success("Receipt downloaded", { description: row.receiptNo });
  }

  function exportRows(): ExportRow[] {
    return filtered.map((r) => ({
      Date: new Date(r.confirmedAt ?? r.createdAt).toLocaleDateString(),
      Reference: r.ref,
      Receipt: r.receiptNo ?? "",
      Payer: r.payerName ?? "",
      "Revenue head": revenueLabel(r.revenueType),
      Period: r.obligationPeriod ?? "",
      Channel: titleCase(r.channel),
      Ward: r.ward ?? "",
      Amount: r.amount,
      Status: r.voided ? "reversed" : r.status,
    }));
  }

  function exportListPDF() {
    if (!filtered.length) return toast.error("Nothing to export for this filter.");
    exportPDF({
      filename: "kwali-payments",
      title: "Payments & Receipts",
      subtitle: `${filtered.length} transactions · ${STATUS_FILTERS.find((s) => s.key === status)?.label} · ${range}`,
      rows: exportRows(),
      totals: [
        { label: "Confirmed", value: `₦${totals.confirmed.toLocaleString()}` },
        { label: "Awaiting confirmation", value: `₦${totals.pending.toLocaleString()}` },
        { label: "Reversed", value: `₦${totals.reversed.toLocaleString()}` },
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
      subtitle="Every payment in the central ledger, with its official receipt."
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
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
        <div className="surface-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Confirmed</div>
          <div className="mt-2 font-display text-2xl font-bold text-primary">
            ₦{totals.confirmed.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Verified revenue</div>
        </div>
        <div className="surface-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Awaiting confirmation
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-warning-foreground">
            ₦{totals.pending.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {totals.pendingCount} reference{totals.pendingCount === 1 ? "" : "s"} raised, money not
            yet verified
          </div>
        </div>
        <div className="surface-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Reversed</div>
          <div className="mt-2 font-display text-2xl font-bold text-destructive">
            ₦{totals.reversed.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Receipts voided</div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search reference, receipt, payer or taxpayer ID…"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </div>
          <div className="flex gap-2 text-xs">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-md border border-border bg-background px-2 py-1"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Reference</th>
                <th className="px-5 py-3 text-left">Payer</th>
                <th className="px-5 py-3 text-left">Revenue head</th>
                <th className="px-5 py-3 text-left">Channel</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No payments match these filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const awaiting = r.status === "pending" || r.status === "initiated";
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {new Date(r.confirmedAt ?? r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs text-ink">{r.receiptNo ?? r.ref}</div>
                        {r.receiptNo && (
                          <div className="font-mono text-[10px] text-muted-foreground">{r.ref}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-foreground">{r.payerName ?? "—"}</div>
                        {r.sourceRef && (
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {r.sourceRef}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-foreground">
                        {revenueLabel(r.revenueType)}
                        {r.obligationPeriod && (
                          <span className="text-muted-foreground"> · {r.obligationPeriod}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{titleCase(r.channel)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-ink">
                        ₦{r.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        {r.voided ? (
                          <StatusBadge tone="danger">Reversed</StatusBadge>
                        ) : (
                          <StatusBadge status={r.status} />
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {awaiting ? (
                          <button
                            onClick={() => void confirm(r)}
                            disabled={confirming === r.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
                          >
                            {confirming === r.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Confirm payment
                          </button>
                        ) : r.receiptNo && !r.voided ? (
                          <button
                            onClick={() => void downloadReceipt(r)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Download receipt
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Confirming a payment records the money as received and makes the database issue its official
        receipt. It is safe to retry — a payment can only ever have one receipt.
      </p>
    </DashboardShell>
  );
}
