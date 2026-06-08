import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { businesses } from "@/lib/kwali-mock";

export const Route = createFileRoute("/businesses")({
  head: () => ({ meta: [{ title: "Business Registry — KARCIP" }] }),
  component: BusinessesPage,
});

function BusinessesPage() {
  return (
    <DashboardShell title="Business Registry" subtitle="Register, renew, classify, verify and issue digital business permits"
      actions={<button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">+ Register business</button>}>
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Stat t="Active" v={String(businesses.filter(b => b.status === "Active").length)} color="text-primary" />
        <Stat t="Expired" v={String(businesses.filter(b => b.status === "Expired").length)} color="text-gold-foreground" />
        <Stat t="Suspended" v={String(businesses.filter(b => b.status === "Suspended").length)} color="text-destructive" />
        <Stat t="Total levy due" v={"₦" + businesses.reduce((s,b)=>s+b.levy,0).toLocaleString()} color="text-ink" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4 font-semibold text-ink">Registered businesses</div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="px-5 py-3 text-left">Ref</th><th className="px-5 py-3 text-left">Business</th><th className="px-5 py-3 text-left">Category</th><th className="px-5 py-3 text-left">Ward</th><th className="px-5 py-3 text-left">Renewal</th><th className="px-5 py-3 text-right">Levy</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {businesses.map((b) => (
              <tr key={b.id}>
                <td className="px-5 py-4 font-mono text-xs text-ink">{b.ref}</td>
                <td className="px-5 py-4 font-semibold text-ink">{b.name}</td>
                <td className="px-5 py-4 text-muted-foreground">{b.category}</td>
                <td className="px-5 py-4 text-muted-foreground">{b.ward}</td>
                <td className="px-5 py-4 text-muted-foreground">{b.renewal}</td>
                <td className="px-5 py-4 text-right font-semibold text-ink">₦{b.levy.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <span className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                    (b.status === "Active" ? "bg-primary/10 text-primary" :
                     b.status === "Expired" ? "bg-gold/20 text-gold-foreground" : "bg-destructive/10 text-destructive")
                  }>{b.status}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="text-xs font-semibold text-primary hover:underline">Generate permit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function Stat({ t, v, color }: { t: string; v: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t}</div>
      <div className={`mt-1 font-display text-xl font-bold ${color}`}>{v}</div>
    </div>
  );
}
