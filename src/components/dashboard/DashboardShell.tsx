import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import crest from "@/assets/kwali-crest.png";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: "🏠" },
  { to: "/properties", label: "Properties", icon: "🏘️" },
  { to: "/payments", label: "Payments", icon: "💳" },
  { to: "/transport", label: "Transport", icon: "🛵" },
  { to: "/compliance", label: "Compliance", icon: "🛡️" },
] as const;

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="grid min-h-screen bg-surface md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-border bg-card md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-3 border-b border-border px-6 py-4">
          <img src={crest} alt="" className="h-9 w-9" />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-primary">Kwali Council</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">KURCMS</div>
          </div>
        </Link>
        <nav className="flex-1 p-3">
          {navItems.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold " +
                  (active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary")
                }
              >
                <span className="text-base">{n.icon}</span> {n.label}
              </Link>
            );
          })}
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
