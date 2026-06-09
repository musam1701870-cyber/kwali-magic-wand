import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import crest from "@/assets/kwali-crest.png";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  TrendingUp,
  Banknote,
  Users,
  Building2,
  Home,
  Bike,
  ShoppingCart,
  CreditCard,
  ShieldCheck,
  FileText,
  Map,
  BarChart3,
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Settings,
  Search,
  Menu,
  UserPlus,
  ClipboardList,
  Scan,
} from "lucide-react";

const navGroups: { label: string; items: { to: string; label: string; icon: ReactNode; sub?: boolean }[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/executive", label: "Executive Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/revenue-center", label: "Revenue Center", icon: <Banknote className="h-4 w-4" /> },
      { to: "/intelligence", label: "Intelligence", icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
  {
    label: "Registry",
    items: [
      { to: "/taxpayers", label: "Taxpayers", icon: <Users className="h-4 w-4" /> },
      { to: "/businesses", label: "Businesses", icon: <Building2 className="h-4 w-4" /> },
      { to: "/properties", label: "Properties", icon: <Home className="h-4 w-4" /> },
      { to: "/transport", label: "Transport", icon: <Bike className="h-4 w-4" /> },
      { to: "/markets", label: "Markets", icon: <ShoppingCart className="h-4 w-4" /> },
      { to: "/markets/traders", label: "Trader Directory", icon: <ClipboardList className="h-4 w-4" />, sub: true },
      { to: "/markets/register", label: "Register Trader", icon: <UserPlus className="h-4 w-4" />, sub: true },
      { to: "/markets/collect", label: "Day Collection", icon: <Scan className="h-4 w-4" />, sub: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
      { to: "/compliance", label: "Compliance", icon: <ShieldCheck className="h-4 w-4" /> },
      { to: "/notices", label: "Demand Notices", icon: <FileText className="h-4 w-4" /> },
      { to: "/gis", label: "Ward Map", icon: <Map className="h-4 w-4" /> },
      { to: "/reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
      { to: "/notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    ],
  },
];

export function DashboardShell({
  title, subtitle, actions, children, requireAdmin = true,
}: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; requireAdmin?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (requireAdmin) {
      if (!user) navigate({ to: "/auth/login" });
      else if (!isAdmin) navigate({ to: "/portal" });
    }
  }, [loading, user, isAdmin, requireAdmin, navigate]);

  if (requireAdmin && (loading || !user || !isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        {/* Brand */}
        <Link to="/" className="group flex items-center gap-3 border-b border-border px-5 py-4 transition hover:bg-secondary/50">
          <div className="relative">
            <img src={crest} alt="Kwali Crest" className="h-9 w-9 drop-shadow-sm" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-sm font-bold text-primary">Kwali Area Council</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">KSRP Admin</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((g) => (
            <div key={g.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{g.label}</p>
              <div className="space-y-0.5">
                {g.items.map((n) => {
                  const active = pathname === n.to || (n.to !== "/markets" && pathname.startsWith(n.to + "/")) || (n.to === "/markets" && pathname === "/markets");
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={[
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        n.sub ? "ml-4 py-2" : "",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : n.sub
                          ? "text-foreground/60 hover:bg-secondary hover:text-foreground"
                          : "text-foreground/70 hover:bg-secondary hover:text-foreground",
                      ].join(" ")}
                    >
                      <span className={active ? "opacity-100" : "opacity-60 group-hover:opacity-100"}>{n.icon}</span>
                      <span className="flex-1">{n.label}</span>
                      {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-border p-3 space-y-1">
          <Link to="/contact" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 transition hover:bg-secondary hover:text-foreground">
            <HelpCircle className="h-4 w-4" />
            Help & support
          </Link>
          <Link to="/portal" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 transition hover:bg-secondary hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Exit admin
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-6 py-3.5 backdrop-blur-md">
          {/* Mobile menu button */}
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-foreground/60 transition hover:bg-secondary md:hidden">
            <Menu className="h-4 w-4" />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-lg font-bold text-ink">{title}</h1>
              {subtitle && (
                <>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p>
                </>
              )}
            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-2">
            {actions}

            {/* Search */}
            <button className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary sm:flex">
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Search…</span>
              <kbd className="rounded border border-border bg-secondary px-1 text-[10px]">⌘K</kbd>
            </button>

            {/* Notifications */}
            <Link to="/notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-foreground/60 transition hover:bg-secondary">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">4</span>
            </Link>

            {/* Settings */}
            <button className="hidden h-9 w-9 place-items-center rounded-lg border border-border bg-background text-foreground/60 transition hover:bg-secondary md:grid">
              <Settings className="h-4 w-4" />
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-1.5 transition hover:bg-secondary">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                AM
              </div>
              <div className="hidden text-xs leading-tight sm:block">
                <div className="font-semibold text-ink">Aisha M.</div>
                <div className="text-muted-foreground">Admin</div>
              </div>
              <ChevronRight className="hidden h-3 w-3 text-muted-foreground sm:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
