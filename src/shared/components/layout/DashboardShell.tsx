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
  description?: string;
  items: { to: string; label: string; icon: ReactNode; sub?: boolean; hash?: string }[];
}[] = [
  {
    label: "Overview",
    description: "Council revenue health at a glance",
    items: [
      {
        to: "/executive",
        label: "Executive Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      { to: "/revenue-center", label: "Revenue Records", icon: <Banknote className="h-4 w-4" /> },
      {
        to: "/intelligence",
        label: "Revenue Watch",
        icon: <TrendingUp className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Business & Property",
    description: "Registered businesses and rated properties",
    items: [
      { to: "/businesses", label: "Businesses", icon: <Building2 className="h-4 w-4" /> },
      { to: "/properties", label: "Properties", icon: <Home className="h-4 w-4" /> },
    ],
  },
  {
    label: "Taxpayers",
    description: "Individuals and organisations that pay levies",
    items: [{ to: "/taxpayers", label: "Taxpayer Registry", icon: <Users className="h-4 w-4" /> }],
  },
  {
    label: "Transport & Markets",
    description: "Vehicles, market stalls and trader identity",
    items: [
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
    description: "Payments, compliance and demand notices",
    items: [
      { to: "/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
      { to: "/compliance", label: "Compliance", icon: <ShieldCheck className="h-4 w-4" /> },
      { to: "/notices", label: "Demand Notices", icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    label: "Reports & Tools",
    description: "Ward map, reports and alerts",
    items: [
      { to: "/gis", label: "Ward Map", icon: <Map className="h-4 w-4" /> },
      { to: "/reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
      { to: "/notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
      { to: "/staff", label: "Staff Accounts", icon: <UserPlus className="h-4 w-4" /> },
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
      { to: "/pay", label: "Make a Payment", icon: <Banknote className="h-4 w-4" /> },
      { to: "/verify", label: "Verify a Receipt", icon: <ShieldCheck className="h-4 w-4" /> },
      { to: "/transport", label: "Transport Tickets", icon: <Bike className="h-4 w-4" /> },
      { to: "/register", label: "Register", icon: <UserPlus className="h-4 w-4" /> },
      { to: "/contact", label: "Help & Support", icon: <HelpCircle className="h-4 w-4" /> },
    ],
  },
];

// Marshal navigation — tabs deep-link into the marshal dashboard via the URL hash.
const marshalGroups: typeof navGroups = [
  {
    label: "Field Operations",
    description: "Verify tickets and record incidents on the road",
    items: [
      { to: "/marshal", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      {
        to: "/marshal",
        label: "Onboard Trader",
        icon: <UserPlus className="h-4 w-4" />,
        hash: "onboard",
      },
      {
        to: "/marshal",
        label: "Collections",
        icon: <CreditCard className="h-4 w-4" />,
        hash: "collections",
      },
      {
        to: "/marshal",
        label: "Verifications",
        icon: <ClipboardList className="h-4 w-4" />,
        hash: "verifications",
      },
      {
        to: "/marshal",
        label: "Enforcement",
        icon: <AlertTriangle className="h-4 w-4" />,
        hash: "incidents",
      },
    ],
  },
  {
    label: "Support",
    items: [{ to: "/contact", label: "Help & Support", icon: <HelpCircle className="h-4 w-4" /> }],
  },
];

// Chairman / Executive navigation
const chairmanGroups: typeof navGroups = [
  {
    label: "Executive",
    description: "Chairman command center for Kwali Area Council",
    items: [
      {
        to: "/executive",
        label: "Executive Overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        to: "/executive/revenue",
        label: "Revenue Performance",
        icon: <Banknote className="h-4 w-4" />,
      },
      {
        to: "/executive/intelligence",
        label: "Revenue Watch",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      { to: "/executive/wards", label: "Ward Performance", icon: <Map className="h-4 w-4" /> },
      {
        to: "/executive/compliance",
        label: "Taxpayer & Compliance",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        to: "/executive/payments",
        label: "Payments & Settlement",
        icon: <CreditCard className="h-4 w-4" />,
      },
      { to: "/executive/markets", label: "Markets", icon: <ShoppingCart className="h-4 w-4" /> },
      { to: "/executive/transport", label: "Transport", icon: <Bike className="h-4 w-4" /> },
      {
        to: "/executive/enforcement",
        label: "Enforcement",
        icon: <AlertTriangle className="h-4 w-4" />,
      },
      { to: "/executive/gis", label: "Council GIS", icon: <Map className="h-4 w-4" /> },
      {
        to: "/executive/reports",
        label: "Executive Reports",
        icon: <FileText className="h-4 w-4" />,
      },
      { to: "/executive/notices", label: "Notices", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
];

// Officer navigation — tabs deep-link into the officer dashboard via the URL hash.
const officerGroups: typeof navGroups = [
  {
    label: "Revenue Operations",
    items: [
      { to: "/officer", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      {
        to: "/officer",
        label: "Approvals",
        icon: <CheckCircle className="h-4 w-4" />,
        hash: "approvals",
      },
      {
        to: "/officer",
        label: "Collections",
        icon: <CreditCard className="h-4 w-4" />,
        hash: "collections",
      },
    ],
  },
  {
    label: "Business & Property",
    description: "Registered businesses and rated properties",
    items: [
      { to: "/businesses", label: "Businesses", icon: <Building2 className="h-4 w-4" /> },
      { to: "/properties", label: "Properties", icon: <Home className="h-4 w-4" /> },
    ],
  },
  {
    label: "Transport & Markets",
    description: "Vehicles, market stalls and trader identity",
    items: [
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

  // Derive display role from the actual roles array, NOT user_metadata.
  const role = isAdmin
    ? "Administrator"
    : roles.includes("chairman")
      ? "Chairman"
      : roles.includes("marshal")
        ? "Marshal"
        : roles.includes("officer")
          ? "Revenue Officer"
          : roles.includes("taxpayer")
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
  const locHash = useRouterState({ select: (s) => s.location.hash });
  const { user, isAdmin, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const identity = deriveIdentity(user, isAdmin, roles);
  const notifCount = notifications.length;

  // Select navigation groups based on the actual roles array — never from user_metadata.
  const groups = isAdmin
    ? navGroups
    : roles.includes("chairman")
      ? chairmanGroups
      : roles.includes("marshal")
        ? marshalGroups
        : roles.includes("officer")
          ? officerGroups
          : taxpayerGroups;

  useEffect(() => {
    if (loading) return;
    if (requireAdmin) {
      if (!user) navigate({ to: "/auth/login" });
      else if (!isAdmin && !roles.includes("chairman") && !roles.includes("officer")) {
        navigate({ to: "/portal" });
      }
    }
  }, [loading, user, isAdmin, requireAdmin, navigate, roles]);

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
      ...groups.flatMap((g) => g.items.map((i) => ({ to: i.to, label: i.label, hash: i.hash }))),
      ...extraSearchTargets.map((t) => ({ ...t, hash: undefined as string | undefined })),
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

  if (requireAdmin && (loading || !user || (!isAdmin && !roles.includes("chairman") && !roles.includes("officer")))) {
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
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">
            {g.label}
          </p>
          {g.description && (
            <p className="mb-1 px-3 text-[11px] leading-snug text-sidebar-muted/80">
              {g.description}
            </p>
          )}
          <div className="space-y-0.5">
            {g.items.map((n) => {
              const pathMatch =
                pathname === n.to ||
                (n.to !== "/markets" && pathname.startsWith(n.to + "/")) ||
                (n.to === "/markets" && pathname === "/markets");
              // Items that deep-link to a tab (hash) are only active when the hash
              // matches; the plain base item is active when there's no hash.
              const active = pathMatch && (n.hash ?? "") === locHash;
              return (
                <Link
                  key={n.hash ? `${n.to}#${n.hash}` : n.to}
                  to={n.to}
                  hash={n.hash}
                  onClick={onNavigate}
                  className={[
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    n.sub ? "ml-4 py-2" : "",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_2.5px_0_0_0_var(--color-gold)]"
                      : n.sub
                        ? "text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
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
      <aside className="sidebar-panel hidden w-64 shrink-0 flex-col border-r border-sidebar-border md:flex">
        {/* Brand */}
        <Link
          to="/"
          className="group flex items-center gap-3 border-b border-sidebar-border px-5 py-4 transition hover:bg-white/5"
        >
          <div className="relative">
            <img src={crest} alt="Kwali Crest" className="h-9 w-9 drop-shadow-sm" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white/25 bg-success" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-sm font-bold text-sidebar-foreground">
              Kwali Area Council
            </div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">
              {isAdmin
                ? "KSRP Admin"
                : roles.includes("chairman")
                  ? "Executive Dashboard"
                  : roles.includes("marshal")
                    ? "Marshal Portal"
                    : roles.includes("officer")
                      ? "Officer Portal"
                      : "Taxpayer Portal"}
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavList />
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <Link
            to="/contact"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <HelpCircle className="h-4 w-4" />
            Help & support
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition hover:bg-white/10 hover:text-red-300"
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
          <aside className="sidebar-panel relative flex h-full w-72 max-w-[85%] flex-col shadow-2xl">
            <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
              <img src={crest} alt="Kwali Crest" className="h-9 w-9" />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate font-display text-sm font-bold text-sidebar-foreground">
                  Kwali Area Council
                </div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">
                  {isAdmin
                    ? "KSRP Admin"
                    : roles.includes("chairman")
                      ? "Executive Dashboard"
                      : roles.includes("marshal")
                        ? "Marshal Portal"
                        : roles.includes("officer")
                          ? "Officer Portal"
                          : "Taxpayer Portal"}
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="border-t border-sidebar-border p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition hover:bg-white/10 hover:text-red-300"
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
                  if (e.key === "Enter" && searchResults[0])
                    navigate({ to: searchResults[0].to, hash: searchResults[0].hash });
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
                    key={`${r.to}#${r.hash ?? ""}`}
                    onClick={() => navigate({ to: r.to, hash: r.hash })}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-secondary"
                  >
                    <span className="font-medium">{r.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {r.hash ? `${r.to}#${r.hash}` : r.to}
                    </span>
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
            {/* Always reachable, in every role: staff assist walk-in payers, and a
                taxpayer's most common task is paying. Works with no account. */}
            <Link
              to="/pay"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-bold text-gold-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
            >
              <Banknote className="h-4 w-4" />
              <span className="hidden sm:inline">Make payment</span>
              <span className="sm:hidden">Pay</span>
            </Link>

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
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),oklch(0.32_0.1_160))] text-[11px] font-bold text-primary-foreground shadow-sm">
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
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
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
