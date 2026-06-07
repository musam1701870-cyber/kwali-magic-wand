import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { properties, payments, violations } from "@/lib/kwali-mock";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kwali Revenue Portal" }] }),
  component: DashboardPage,
});

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: "gold" | "primary" | "destructive" }) {
  const color = accent === "gold" ? "text-gold-foreground bg-gold/15" : accent === "destructive" ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>Live</span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function DashboardPage() {
  const outstanding = properties.filter((p) => p.status !== "Paid").reduce((s, p) => s + p.annualRate, 0);
  const totalPaid = payments.filter((p) => p.status === "Successful").reduce((s, p) => s + p.amount, 0);
  const openVio = violations.filter((v) => v.status === "Open").length;

  return (
    <DashboardShell title="Overview" subtitle="Welcome back. Here's everything you owe and everything you've paid." actions={
      <Link to="/properties/register" className="hidden rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 sm:inline-flex">
        + Add property
      </Link>
    }>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outstanding" value={`₦${outstanding.toLocaleString()}`} hint={`${properties.filter(p=>p.status!=="Paid").length} bills due`} accent="destructive" />
        <StatCard label="Paid this year" value={`₦${totalPaid.toLocaleString()}`} hint={`${payments.filter(p=>p.status==="Successful").length} successful payments`} />
        <StatCard label="Active permits" value="3" hint="Tenement · Business · Sanitation" accent="gold" />
        <StatCard label="Open violations" value={String(openVio)} hint="Transport enforcement" accent="destructive" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Outstanding bills</h2>
            <Link to="/properties" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {properties.filter((p) => p.status !== "Paid").map((p) => (
              <div key={p.id} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-semibold text-ink">{p.type} — {p.address}</div>
                  <div className="text-xs text-muted-foreground">PIN {p.pin} · Ward {p.ward}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-ink">₦{p.annualRate.toLocaleString()}</div>
                  <span className={`text-[11px] font-semibold ${p.status === "Overdue" ? "text-destructive" : "text-gold-foreground"}`}>{p.status}</span>
                </div>
                <button className="ml-4 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95">Pay</button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-bold text-ink">Quick actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/transport" className="rounded-lg border border-border p-3 text-center text-xs font-semibold text-ink hover:border-primary">
                🛵<div className="mt-1">Buy daily ticket</div>
              </Link>
              <Link to="/properties/register" className="rounded-lg border border-border p-3 text-center text-xs font-semibold text-ink hover:border-primary">
                🏠<div className="mt-1">Register property</div>
              </Link>
              <Link to="/payments" className="rounded-lg border border-border p-3 text-center text-xs font-semibold text-ink hover:border-primary">
                🧾<div className="mt-1">View receipts</div>
              </Link>
              <Link to="/compliance" className="rounded-lg border border-border p-3 text-center text-xs font-semibold text-ink hover:border-primary">
                🛡️<div className="mt-1">Verify QR</div>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-bold text-ink">Recent payments</h2>
            <div className="mt-3 space-y-3">
              {payments.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-ink">{p.category}</div>
                    <div className="text-xs text-muted-foreground">{p.date} · {p.channel}</div>
                  </div>
                  <div className="font-bold text-primary">₦{p.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
