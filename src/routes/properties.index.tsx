import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { properties } from "@/lib/kwali-mock";

export const Route = createFileRoute("/properties/")({
  head: () => ({ meta: [{ title: "Properties — Kwali Revenue Portal" }] }),
  component: PropertiesLayout,
});

function PropertiesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/properties") return <Outlet />;
  return <PropertiesIndex />;
}

function PropertiesIndex() {
  return (
    <DashboardShell title="Properties" subtitle="All your tenement-rated buildings and businesses." actions={
      <Link to="/properties/register" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">+ Register</Link>
    }>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">PIN</th>
              <th className="px-5 py-3 text-left">Type</th>
              <th className="px-5 py-3 text-left">Address</th>
              <th className="px-5 py-3 text-left">Ward</th>
              <th className="px-5 py-3 text-right">Annual rate</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {properties.map((p) => (
              <tr key={p.id} className="hover:bg-secondary/30">
                <td className="px-5 py-4 font-mono text-xs text-ink">{p.pin}</td>
                <td className="px-5 py-4 text-foreground">{p.type}</td>
                <td className="px-5 py-4 text-foreground">{p.address}</td>
                <td className="px-5 py-4 text-muted-foreground">{p.ward}</td>
                <td className="px-5 py-4 text-right font-semibold text-ink">₦{p.annualRate.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <span className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                    (p.status === "Paid" ? "bg-primary/10 text-primary" : p.status === "Overdue" ? "bg-destructive/10 text-destructive" : "bg-gold/20 text-gold-foreground")
                  }>{p.status}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  {p.status !== "Paid" && (
                    <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95">Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
