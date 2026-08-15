import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import crest from "@/shared/assets/kwali-crest.png";
import { useAuth } from "@/shared/hooks/useAuth";
import { notifications } from "@/shared/lib/kwali-mock";
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
  X,
  User as UserIcon,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const navGroups: {
  label: string;
  items: { to: string; label: string; icon: ReactNode; sub?: boolean }[];
}[] = [
  {
    label: "Overview",
    items: [
      {
        to: "/executive",
        label: "Executive Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
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
      {
        to: "/markets/traders",
        label: "Trader Directory",
        icon: <ClipboardList className="h-4 w-4" />,
        sub: true,
      },
      {
        to: "/markets/register",
        label: "Register Trader",
        icon: <UserPlus className="h-4 w-4" />,
        sub: true,
      },
      {
        to: "/markets/collect",
        label: "Day Collection",
        icon: <Scan className="h-4 w-4" />,
        sub: true,
      },
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

// Nav shown to non-admin (taxpayer/officer) users — only pages they can actually open.
const taxpayerGroups: typeof navGroups = [
  {
    label: "My Account",
    items: [
      { to: "/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/portal", label: "My Portal", icon: <Home className="h-4 w-4" /> },
    ],
  },
  {
    label: "Services",
    items: [
      { to: "/transport", label: "Transport Tickets", icon: <Bike className="h-4 w-4" /> },
      { to: "/register", label: "Register", icon: <UserPlus className="h-4 w-4" /> },
      { to: "/contact", label: "Help & Support", icon: <HelpCircle className="h-4 w-4" /> },
    ],
  },
];

// Marshal navigation
const marshalGroups: typeof navGroups = [
  {
    label: "Field Operations",
    items: [
      { to: "/marshal", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/marshal", label: "Transport Verification", icon: <Bike className="h-4 w-4" />, state: { tab: "transport" } },
      { to: "/marshal", label: "Market Verification", icon: <ShoppingCart className="h-4 w-4" />, state: { tab: "market" } },
      { to: "/marshal", label: "Enforcement Incidents", icon: <AlertTriangle className="h-4 w-4" />, state: { tab: "incidents" } },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/marshal", label: "QR Scanner", icon: <Scan className="h-4 w-4" /> },
      { to: "/contact", label: "Help & Support", icon: <HelpCircle className="h-4 w-4" /> },
    ],
  },
];

// Officer navigation
const officerGroups: typeof navGroups = [
  {
    label: "Revenue Operations",
    items: [
      { to: "/officer", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/officer", label: "Collections", icon: <ShieldCheck className="h-4 w-4" />, state: { tab: "collections" } },
      { to: "/officer", label: "Demand Notices", icon: <FileText className="h-4 w-4" />, state: { tab: "demands" } },
      { to: "/officer", label: "Compliance", icon: <CheckCircle className="h-4 w-4" />, state: { tab: "compliance" } },
    ],
  },
  {
    label: "Registry",
    items: [
      { to: "/businesses", label: "Businesses", icon: <Building2 className="h-4 w-4" /> },
      { to: "/properties", label: "Properties", icon: <Home className="h-4 w-4" /> },
      { to: "/transport", label: "Transport", icon: <Bike className="h-4 w-4" /> },
      { to: "/markets", label: "Markets", icon: <ShoppingCart className="h-4 w-4" /> },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/register", label: "Register Taxpayer", icon: <UserPlus className="h-4 w-4" /> },
      { to: "/contact", label: "Help & Support", icon: <HelpCircle className="h-4 w-4" /> },
    ],
  },
];

// Extra destinations that aren't in the sidebar but are worth reaching from search.
const extraSearchTargets = [
  { to: "/register", label: "Register Taxpayer" },
  { to: "/portal", label: "Taxpayer Portal" },
  { to: "/contact", label: "Help & Support" },
  { to: "/", label: "Public Home" },
];

function deriveIdentity(
  user: { email?: string | null; user_metadata?: Record<string, unknown> } | null,
  isAdmin: boolean,
  roles: string[],
) {
  const meta = user?.user_metadata ?? {};
  const metaName = (meta.full_name || meta.name || meta.display_name) as string | undefined;
  const email = user?.email ?? "";
  const fromEmail = email ? email.split("@")[0].replace(/[._+-]+/g, " ") : "";
  const raw = (metaName || fromEmail || "Guest user").trim();
  const name = raw.replace(/\b\w/g, (c) => c.toUpperCase());
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = (
    parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.slice(0, 2) ?? "KA")
  ).toUpperCase();
  
  // Determine role from user_metadata or roles array
  const userRole = meta.account_type || meta.role || roles[0];
  const role = isAdmin
    ? "Administrator"
    : userRole === "marshal"
      ? "Marshal"
      : userRole === "officer"
        ? "Revenue Officer"
        : userRole === "taxpayer"
          ? "Taxpayer"
          : user
            ? "Signed in"
            : "Guest";
  return { name, initials, role, email };
}

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
  requireAdmin = true,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const identity = deriveIdentity(user, isAdmin, roles);
  const notifCount = notifications.length;
  
  // Select navigation groups based on role
  const userRole = user?.user_metadata?.account_type || user?.user_metadata?.role || roles[0];
  const groups = isAdmin
    ? navGroups
    : userRole === "marshal"
      ? marshalGroups
      : userRole === "officer"
        ? officerGroups
        : taxpayerGroups;

  useEffect(() => {
    if (loading) return;
    if (requireAdmin) {
      if (!user) navigate({ to: "/auth/login" });
      else if (!isAdmin) navigate({ to: "/portal" });
    }
  }, [loading, user, isAdmin, requireAdmin, navigate]);

  // Close overlays whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // ⌘K / Ctrl-K opens search; Esc closes any overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 20);
    else setSearchQ("");
  }, [searchOpen]);

  const searchTargets = useMemo(
    () => [
      ...groups.flatMap((g) => g.items.map((i) => ({ to: i.to, label: i.label }))),
      ...extraSearchTargets,
    ],
    [groups],
  );
  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return searchTargets;
    return searchTargets.filter((t) => t.label.toLowerCase().includes(q) || t.to.includes(q));
  }, [searchQ, searchTargets]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

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

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {groups.map((g) => (
        <div key={g.label} className="mb-5">
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            {g.label}
          </p>
          <div className="space-y-0.5">
            {g.items.map((n) => {
              const active =
                pathname === n.to ||
                (n.to !== "/markets" && pathname.startsWith(n.to + "/")) ||
                (n.to === "/markets" && pathname === "/markets");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={onNavigate}
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
                  <span className={active ? "opacity-100" : "opacity-60 group-hover:opacity-100"}>
                    {n.icon}
                  </span>
                  <span className="flex-1">{n.label}</span>
                  {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        {/* Brand */}
        <Link
          to="/"
          className="group flex items-center gap-3 border-b border-border px-5 py-4 transition hover:bg-secondary/50"
        >
          <div className="relative">
            <img src={crest} alt="Kwali Crest" className="h-9 w-9 drop-shadow-sm" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-sm font-bold text-primary">
              Kwali Area Council
            </div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {isAdmin ? "KSRP Admin" : "Taxpayer Portal"}
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavList />
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-border p-3 space-y-1">
          <Link
            to="/contact"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 transition hover:bg-secondary hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
            Help & support
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile slide-over nav */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <img src={crest} alt="Kwali Crest" className="h-9 w-9" />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate font-display text-sm font-bold text-primary">
                  Kwali Area Council
                </div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {isAdmin ? "KSRP Admin" : "Taxpayer Portal"}
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="border-t border-border p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 transition hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Search palette */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults[0]) navigate({ to: searchResults[0].to });
                }}
                placeholder="Jump to a page…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Esc
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No pages match "{searchQ}".
                </div>
              ) : (
                searchResults.map((r) => (
                  <button
                    key={r.to}
                    onClick={() => navigate({ to: r.to })}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-secondary"
                  >
                    <span className="font-medium">{r.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{r.to}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-6 py-3.5 backdrop-blur-md">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-foreground/60 transition hover:bg-secondary md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-lg font-bold text-ink">{title}</h1>
              {subtitle && (
                <>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="hidden truncate text-sm text-muted-foreground sm:block">
                    {subtitle}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-2">
            {actions}

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary sm:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Search…</span>
              <kbd className="rounded border border-border bg-secondary px-1 text-[10px]">⌘K</kbd>
            </button>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-foreground/60 transition hover:bg-secondary"
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </Link>

            {/* User avatar + menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-1.5 transition hover:bg-secondary"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {identity.initials}
                </div>
                <div className="hidden text-left text-xs leading-tight sm:block">
                  <div className="max-w-[10rem] truncate font-semibold text-ink">
                    {identity.name}
                  </div>
                  <div className="text-muted-foreground">{identity.role}</div>
                </div>
                <ChevronRight
                  className={`hidden h-3 w-3 text-muted-foreground transition sm:block ${userMenuOpen ? "rotate-90" : ""}`}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    <div className="border-b border-border px-4 py-3">
                      <div className="truncate text-sm font-semibold text-ink">{identity.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {identity.email || "Not signed in"}
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/portal"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-secondary"
                      >
                        <UserIcon className="h-4 w-4 text-muted-foreground" /> Taxpayer portal
                      </Link>
                      <Link
                        to="/contact"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-secondary"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" /> Help & settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
