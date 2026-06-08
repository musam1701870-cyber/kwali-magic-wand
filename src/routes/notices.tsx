import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { demandNotices } from "@/lib/kwali-mock";

export const Route = createFileRoute("/notices")({
  head: () => ({ meta: [{ title: "Demand Notices — KARCIP" }] }),
  component: NoticesPage,
});

const stageColor: Record<string, string> = {
  "Demand": "bg-primary/10 text-primary",
  "Reminder": "bg-gold/20 text-gold-foreground",
  "Final Warning": "bg-orange-500/15 text-orange-700",
  "Enforcement": "bg-destructive/10 text-destructive",
};

function NoticesPage() {
  return (
    <DashboardShell title="Demand Notice System" subtitle="Generate, deliver and track Demand, Reminder, Final Warning and Enforcement notices"
      actions={<button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">+ Issue notice</button>}>
      <div className="grid gap-4 md:grid-cols-4">
        {(["Demand","Reminder","Final Warning","Enforcement"] as const).map((s) => (
          <div key={s} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s}</div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{demandNotices.filter(d => d.stage === s).length}</div>
            <div className="text-[11px] text-muted-foreground">Active notices</div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4 font-semibold text-ink">Recent notices</div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="px-5 py-3 text-left">Ref</th><th className="px-5 py-3 text-left">Taxpayer</th><th className="px-5 py-3 text-left">Category</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-left">Stage</th><th className="px-5 py-3 text-left">Issued</th><th className="px-5 py-3 text-left">Due</th><th className="px-5 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {demandNotices.map((d) => (
              <tr key={d.id}>
                <td className="px-5 py-4 font-mono text-xs text-ink">{d.ref}</td>
                <td className="px-5 py-4 font-semibold text-ink">{d.taxpayer}</td>
                <td className="px-5 py-4 text-muted-foreground">{d.category}</td>
                <td className="px-5 py-4 text-right font-semibold text-ink">₦{d.amount.toLocaleString()}</td>
                <td className="px-5 py-4"><span className={"rounded-full px-2.5 py-0.5 text-[11px] font-bold " + stageColor[d.stage]}>{d.stage}</span></td>
                <td className="px-5 py-4 text-muted-foreground">{d.issued}</td>
                <td className="px-5 py-4 text-muted-foreground">{d.due}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-1.5 text-[11px] font-semibold">
                    <button className="rounded border border-border px-2 py-1 text-ink hover:border-primary">PDF</button>
                    <button className="rounded border border-border px-2 py-1 text-ink hover:border-primary">SMS</button>
                    <button className="rounded border border-border px-2 py-1 text-ink hover:border-primary">Email</button>
                    <button className="rounded border border-border px-2 py-1 text-ink hover:border-primary">WhatsApp</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
