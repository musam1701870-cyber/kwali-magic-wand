import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import crest from "@/assets/kwali-crest.png";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={crest} alt="Kwali Area Council crest" className="h-10 w-10" />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-primary">Kwali Area Council</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Revenue Portal · KURCMS
            </div>
          </div>
        </Link>
        <ul className="hidden items-center gap-6 text-sm font-medium text-foreground lg:flex">
          <li><Link to="/" className="hover:text-primary" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>Home</Link></li>
          <li><Link to="/services" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Services</Link></li>
          <li><Link to="/transport" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Transport</Link></li>
          <li><Link to="/sanitation" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Sanitation</Link></li>
          <li><Link to="/bylaws" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Bylaws</Link></li>
          <li><Link to="/compliance" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Compliance</Link></li>
          <li><Link to="/about" className="hover:text-primary" activeProps={{ className: "text-primary" }}>About</Link></li>
          <li><Link to="/contact" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Contact</Link></li>
        </ul>
        <div className="flex items-center gap-2">
          <Link
            to="/auth/login"
            className="hidden rounded-md px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95"
          >
            Pay now
          </Link>
        </div>
      </nav>
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
              <div className="text-xs text-muted-foreground">KURCMS · Revenue Portal</div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The official Kwali Unified Revenue & Compliance Management System for residents,
            businesses and transport operators across the council's 10 wards.
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
