import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import crest from "@/assets/kwali-crest.png";
import { useAuth } from "@/hooks/useAuth";

export function SiteNav() {
  const { user, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const navItems: { to: string; label: string; exact?: boolean }[] = [
    { to: "/", label: "Home", exact: true },
    { to: "/services", label: "Services" },
    { to: "/transport", label: "Transport" },
    { to: "/sanitation", label: "Sanitation" },
    { to: "/bylaws", label: "Bylaws" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-3" aria-label="Kwali Area Council — home">
          <img src={crest} alt="" className="h-10 w-10 transition group-hover:rotate-[-4deg]" />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-primary sm:text-base">Kwali Area Council</div>
            <div className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
              Smart Revenue Platform · KSRP
            </div>
          </div>
        </Link>
        <ul className="hidden items-center gap-1 text-sm font-medium text-foreground lg:flex">
          {navItems.map((n) => (
            <li key={n.to}>
              <Link
                to={n.to as "/"}
                activeOptions={n.exact ? { exact: true } : undefined}
                className="relative inline-flex items-center rounded-md px-3 py-2 text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&.active]:text-primary"
                activeProps={{ className: "active text-primary" }}
              >
                <span className="relative">
                  {n.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-gold transition-all duration-300 group-hover:w-full" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Link to="/portal" className="hidden rounded-md px-4 py-2 text-sm font-semibold text-primary transition hover:bg-secondary sm:inline-flex">
                My Portal
              </Link>
              {isAdmin && (
                <Link to="/executive"
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:-translate-y-0.5 hover:opacity-95">
                  Admin Dashboard
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/auth/login" className="hidden rounded-md px-4 py-2 text-sm font-semibold text-primary transition hover:bg-secondary sm:inline-flex">
                Sign in
              </Link>
              <Link to="/auth/signup"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:-translate-y-0.5 hover:opacity-95">
                Register
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="ml-1 grid h-10 w-10 place-items-center rounded-md border border-border bg-card text-ink transition hover:bg-secondary lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 text-sm font-medium">
            {navItems.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to as "/"}
                  onClick={() => setOpen(false)}
                  activeOptions={n.exact ? { exact: true } : undefined}
                  className="block rounded-md px-3 py-3 text-foreground transition hover:bg-secondary hover:text-primary"
                  activeProps={{ className: "bg-secondary text-primary" }}
                >
                  {n.label}
                </Link>
              </li>
            ))}
            {!user && (
              <li className="pt-1">
                <Link to="/auth/login" onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 text-primary hover:bg-secondary">Sign in</Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={crest} alt="" className="h-9 w-9" />
            <div>
              <div className="font-display font-bold text-primary">Kwali Area Council</div>
              <div className="text-xs text-muted-foreground">KSRP · Kwali Smart Revenue Platform</div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            A modern revenue management and taxpayer service platform for Kwali Area Council —
            unifying property, business, transport, market and compliance revenue across the council's 10 wards.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-ink">Quick links</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></li>
            <li><Link to="/properties" className="hover:text-primary">Properties</Link></li>
            <li><Link to="/payments" className="hover:text-primary">Payments</Link></li>
            <li><Link to="/transport" className="hover:text-primary">Transport tickets</Link></li>
            <li><Link to="/compliance" className="hover:text-primary">Compliance</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-ink">Contact</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Council Secretariat, Kwali, FCT</li>
            <li>support@kwali.gov.ng</li>
            <li>+234 800 000 0000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Kwali Area Council · All rights reserved
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-6 py-16 text-primary-foreground">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 font-display text-3xl font-bold md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-white/85">{subtitle}</p>}
      </div>
    </section>
  );
}
