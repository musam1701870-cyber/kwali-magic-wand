import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { taxpayers } from "@/lib/kwali-mock";

export const Route = createFileRoute("/taxpayers")({
  head: () => ({ meta: [{ title: "Taxpayer Management — KARCIP" }] }),
  component: TaxpayersPage,
});

function TaxpayersPage() {
  return (
    <DashboardShell title="Taxpayer Management" subtitle="Individuals, corporates, businesses, property owners, transport operators and market traders"
      actions={<button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">+ Register taxpayer</button>}>
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          { t: "Individuals", v: "6,210" },
          { t: "Corporates", v: "412" },
          { t: "Property owners", v: "8,920" },
          { t: "Compliance avg", v: "68%" },
        ].map((s) => (
          <div key={s.t} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.t}</div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["All","Individual","Corporate","Property Owner","Business","Transport Operator","Market Trader","Hotels","Filling Stations","POS Operators"].map((t) => (
          <button key={t} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-ink hover:border-primary">{t}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="font-semibold text-ink">Registered taxpayers</div>
          <input placeholder="Search TIN, name or phone…" className="w-64 rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">TIN</th><th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Type</th><th className="px-5 py-3 text-left">Ward</th>
              <th className="px-5 py-3 text-right">Outstanding</th><th className="px-5 py-3 text-left">Compliance</th>
              <th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {taxpayers.map((t) => (
              <tr key={t.id}>
                <td className="px-5 py-4 font-mono text-xs text-ink">{t.tin}</td>
                <td className="px-5 py-4 font-semibold text-ink">{t.name}</td>
                <td className="px-5 py-4 text-muted-foreground">{t.type}</td>
                <td className="px-5 py-4 text-muted-foreground">{t.ward}</td>
                <td className="px-5 py-4 text-right font-semibold text-ink">₦{t.outstanding.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${t.compliance}%` }} /></div>
                    <span className="text-xs font-semibold text-ink">{t.compliance}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                    (t.status === "Compliant" ? "bg-primary/10 text-primary" :
                     t.status === "Partial" ? "bg-gold/20 text-gold-foreground" :
                     t.status === "Defaulting" ? "bg-destructive/10 text-destructive" :
                     "bg-ink/10 text-ink")
                  }>{t.status}</span>
                </td>
                <td className="px-5 py-4 text-right"><button className="text-xs font-semibold text-primary hover:underline">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
