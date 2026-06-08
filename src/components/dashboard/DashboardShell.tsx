import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import crest from "@/assets/kwali-crest.png";

const navGroups: { label: string; items: { to: string; label: string; icon: string }[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/executive", label: "Dashboard", icon: "🏠" },
      { to: "/intelligence", label: "Revenue Overview", icon: "📈" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { to: "/taxpayers", label: "Taxpayers", icon: "👥" },
      { to: "/register", label: "New Registration", icon: "📝" },
      { to: "/businesses", label: "Businesses", icon: "🏢" },
      { to: "/properties", label: "Properties", icon: "🏘️" },
      { to: "/transport", label: "Transport", icon: "🛵" },
      { to: "/markets", label: "Markets", icon: "🛒" },
      { to: "/payments", label: "Payments", icon: "💳" },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/compliance", label: "Compliance", icon: "✅" },
      { to: "/notices", label: "Demand Notices", icon: "📨" },
      { to: "/gis", label: "Ward Map", icon: "🗺️" },
      { to: "/reports", label: "Reports", icon: "📊" },
      { to: "/notifications", label: "Notifications", icon: "🔔" },
    ],
  },
];

export function DashboardShell({
  title, subtitle, actions, children,
}: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="grid min-h-screen bg-surface md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-border bg-card md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-3 border-b border-border px-6 py-4">
          <img src={crest} alt="" className="h-9 w-9" />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-primary">Kwali Area Council</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Smart Revenue Platform</div>
          </div>
        </Link>
        <nav className="flex-1 overflow-y-auto p-3">
          {navGroups.map((g) => (
            <div key={g.label} className="mb-4">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{g.label}</div>
              {g.items.map((n) => {
                const active = pathname === n.to || pathname.startsWith(n.to + "/");
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={
                      "mt-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold " +
                      (active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary")
                    }
                  >
                    <span className="text-base">{n.icon}</span> {n.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
            Need help? <a href="/contact" className="font-semibold text-primary">Contact support</a>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <h1 className="font-display text-xl font-bold text-ink md:text-2xl">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <select className="hidden rounded-md border border-border bg-background px-2 py-1.5 text-xs font-semibold text-ink md:block">
              <option>Chairman</option>
              <option>Revenue Director</option>
              <option>Revenue Administrator</option>
              <option>Assessment Officer</option>
              <option>Revenue Officer</option>
              <option>Enforcement Officer</option>
              <option>Market Supervisor</option>
              <option>Transport Manager</option>
              <option>Taxpayer</option>
            </select>
            <Link to="/notifications" className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-base">
              🔔<span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">4</span>
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">AM</div>
              <div className="hidden text-xs sm:block">
                <div className="font-semibold text-ink">Aisha M.</div>
                <div className="text-muted-foreground">Kwali ward</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
