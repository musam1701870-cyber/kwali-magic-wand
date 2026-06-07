import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { payments } from "@/lib/kwali-mock";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments & Receipts — Kwali Revenue Portal" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <DashboardShell title="Payments & receipts" subtitle="Every transaction with its RRR reference and QR-verifiable receipt.">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Total paid</div>
          <div className="mt-2 font-display text-2xl font-bold text-primary">₦5,600</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Pending</div>
          <div className="mt-2 font-display text-2xl font-bold text-gold-foreground">₦10,000</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Failed</div>
          <div className="mt-2 font-display text-2xl font-bold text-destructive">₦0</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="font-semibold text-ink">Transactions</div>
          <div className="flex gap-2 text-xs">
            <select className="rounded-md border border-border bg-background px-2 py-1">
              <option>All categories</option>
              <option>Tenement</option>
              <option>Business</option>
              <option>Sanitation</option>
              <option>Transport</option>
            </select>
            <select className="rounded-md border border-border bg-background px-2 py-1">
              <option>Last 90 days</option>
              <option>Last year</option>
              <option>All time</option>
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
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-4 text-muted-foreground">{p.date}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink">{p.rrr}</td>
                <td className="px-5 py-4 text-foreground">{p.category}</td>
                <td className="px-5 py-4 text-muted-foreground">{p.channel}</td>
                <td className="px-5 py-4 text-right font-semibold text-ink">₦{p.amount.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <span className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                    (p.status === "Successful" ? "bg-primary/10 text-primary" : p.status === "Failed" ? "bg-destructive/10 text-destructive" : "bg-gold/20 text-gold-foreground")
                  }>{p.status}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="text-xs font-semibold text-primary hover:underline">Download receipt</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
