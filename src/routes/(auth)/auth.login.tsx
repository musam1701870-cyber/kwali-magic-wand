import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import crest from "@/shared/assets/kwali-crest.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  ChevronRight,
  Eye,
  EyeOff,
  BadgeCheck,
  Gavel,
} from "lucide-react";

export const Route = createFileRoute("/(auth)/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — Kwali Revenue Portal" }] }),
  component: LoginPage,
});

const DEMO_ACCOUNTS = [
  {
    label: "Chairman",
    email: "chairman@kwali.demo",
    password: "Kwali2026!",
    description: "Executive dashboard, revenue performance, ward intelligence, reports",
    icon: <LayoutDashboard className="h-4 w-4" />,
    role: "Chairman",
    color: "border-emerald-300/50 bg-emerald-50/50 hover:bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Admin / Super Admin",
    email: "admin@kwali.demo",
    password: "Kwali2026!",
    description: "Full admin dashboard, all reports, revenue intelligence",
    icon: <Gavel className="h-4 w-4" />,
    role: "Admin",
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10",
    badge: "bg-primary/10 text-primary",
  },
  {
    label: "Revenue Officer",
    email: "officer@kwali.demo",
    password: "Kwali2026!",
    description: "Market collection, compliance checks, demand notices",
    icon: <ShieldCheck className="h-4 w-4" />,
    role: "Officer",
    color: "border-amber-300/50 bg-amber-50/50 hover:bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    label: "Marshal / Enforcement",
    email: "marshal@kwali.demo",
    password: "Kwali2026!",
    description: "Field verification, ticket checks, enforcement incidents",
    icon: <BadgeCheck className="h-4 w-4" />,
    role: "Marshal",
    color: "border-red-300/50 bg-red-50/50 hover:bg-red-50",
    badge: "bg-red-100 text-red-700",
  },
  {
    label: "Taxpayer",
    email: "taxpayer@kwali.demo",
    password: "Kwali2026!",
    description: "Pay levies, view bills, download receipts",
    icon: <Users className="h-4 w-4" />,
    role: "Taxpayer",
    color: "border-border hover:bg-secondary/60",
    badge: "bg-secondary text-foreground",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading, roles } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on role from user_roles table
      if (isAdmin || roles.includes("chairman")) {
        navigate({ to: "/executive" });
      } else if (roles.includes("marshal")) {
        navigate({ to: "/marshal" });
      } else if (roles.includes("officer")) {
        navigate({ to: "/officer" });
      } else {
        navigate({ to: "/portal" });
      }
    }
  }, [user, isAdmin, loading, roles, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) setError(error.message);
  };

  const loginAsDemo = async (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setError(null);
    setDemoLoading(acc.email);
    // Pre-fill for visibility, then sign in
    setEmail(acc.email);
    setPassword(acc.password);
    const { error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });
    setDemoLoading(null);
    if (error) {
      // Seed first then retry
      try {
        await fetch("/api/public/seed-demo", { method: "POST" });
        const { error: e2 } = await supabase.auth.signInWithPassword({
          email: acc.email,
          password: acc.password,
        });
        if (e2) setError("Demo account not ready yet. Try clicking again in a moment.");
      } catch {
        setError("Could not connect. Ensure Supabase is configured.");
      }
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left panel */}
      <div
        className="hidden flex-col justify-between p-12 md:p-16 text-primary-foreground md:flex"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Link to="/" className="flex items-center gap-4">
          <img src={crest} alt="" className="h-12 w-12" />
          <div>
            <div className="font-display text-xl font-bold">Kwali Area Council</div>
            <div className="text-xs uppercase tracking-widest text-white/70 mt-1">
              Smart Revenue Platform
            </div>
          </div>
        </Link>
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-tight">Welcome back.</h2>
            <p className="mt-4 max-w-sm text-white/90 text-base leading-relaxed">
              Sign in to manage revenue, pay levies, or access the executive dashboard.
            </p>
          </div>

          {/* Demo account previews on left panel */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="text-xs font-bold uppercase tracking-widest text-white/50">
              Demo accounts available
            </div>
            {DEMO_ACCOUNTS.map((a) => (
              <div
                key={a.email}
                className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/8 px-4 py-3 backdrop-blur"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                  {a.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-white">{a.label}</div>
                  <div className="truncate text-sm text-white/60 mt-0.5">{a.description}</div>
                </div>
                <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold text-white">
                  {a.role}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-white/60 pt-4 border-t border-white/10">
          © Kwali Area Council · FCT
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <span>←</span> Back home
            </Link>
            <h1 className="font-display text-4xl font-extrabold text-ink tracking-tight">
              Sign in
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Use a demo account below or sign in with your own credentials.
            </p>
          </div>

          {/* ── Demo Accounts ── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Demo accounts — click to login instantly
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                No signup needed
              </span>
            </div>
            <div className="space-y-3">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  disabled={demoLoading === a.email}
                  onClick={() => loginAsDemo(a)}
                  className={`group w-full rounded-xl border-2 px-5 py-4 text-left transition ${a.color.replace("border-", "border-2 ")}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.badge}`}
                    >
                      {a.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-base">{a.label}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${a.badge}`}
                        >
                          {a.role}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{a.description}</div>
                      <div className="mt-1.5 font-mono text-[11px] text-muted-foreground/70">
                        {a.email}
                      </div>
                    </div>
                    {demoLoading === a.email ? (
                      <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border">
              Password for all accounts:{" "}
              <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">Kwali2026!</code>
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest text-muted-foreground">
              <span className="bg-background px-4">Or use your credentials</span>
            </div>
          </div>

          {/* ── Regular sign in form ── */}
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base outline-none ring-primary/30 transition focus:ring-2 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-ink">Password</label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 pr-12 text-base outline-none ring-primary/30 transition focus:ring-2 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <button
              disabled={submitting}
              className="w-full rounded-lg bg-primary py-3.5 text-base font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60 mt-2"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border">
              New here?{" "}
              <Link to="/auth/signup" className="font-semibold text-primary hover:underline">
                Create a taxpayer account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
