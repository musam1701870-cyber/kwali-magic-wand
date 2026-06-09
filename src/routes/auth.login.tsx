import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import crest from "@/assets/kwali-crest.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, LayoutDashboard, Users, ChevronRight, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — Kwali Revenue Portal" }] }),
  component: LoginPage,
});

const DEMO_ACCOUNTS = [
  {
    label: "Admin / Chairman",
    email: "admin@kwali.demo",
    password: "Kwali2026!",
    description: "Full executive dashboard, all reports, revenue intelligence",
    icon: <LayoutDashboard className="h-4 w-4" />,
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
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: isAdmin ? "/executive" : "/portal" });
  }, [user, isAdmin, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) setError(error.message);
  };

  const loginAsDemo = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setError(null);
    setDemoLoading(acc.email);
    // Pre-fill for visibility, then sign in
    setEmail(acc.email);
    setPassword(acc.password);
    const { error } = await supabase.auth.signInWithPassword({ email: acc.email, password: acc.password });
    setDemoLoading(null);
    if (error) {
      // Seed first then retry
      try {
        await fetch("/api/public/seed-demo", { method: "POST" });
        const { error: e2 } = await supabase.auth.signInWithPassword({ email: acc.email, password: acc.password });
        if (e2) setError("Demo account not ready yet. Try clicking again in a moment.");
      } catch {
        setError("Could not connect. Ensure Supabase is configured.");
      }
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left panel */}
      <div className="hidden flex-col justify-between p-12 text-primary-foreground md:flex" style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="flex items-center gap-3">
          <img src={crest} alt="" className="h-10 w-10" />
          <div>
            <div className="font-display font-bold">Kwali Area Council</div>
            <div className="text-xs uppercase tracking-widest text-white/70">Smart Revenue Platform</div>
          </div>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold">Welcome back.</h2>
          <p className="mt-3 max-w-sm text-white/80">Sign in to manage revenue, pay levies, or access the executive dashboard.</p>

          {/* Demo account previews on left panel */}
          <div className="mt-8 space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Demo accounts available</div>
            {DEMO_ACCOUNTS.map((a) => (
              <div key={a.email} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 backdrop-blur">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">{a.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{a.label}</div>
                  <div className="truncate text-[11px] text-white/60">{a.description}</div>
                </div>
                <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">{a.role}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-white/60">© Kwali Area Council · FCT</div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Back home</Link>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use a demo account below or your own credentials.</p>
          </div>

          {/* ── Demo Accounts ── */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Demo accounts — click to login instantly</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">No signup needed</span>
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  disabled={demoLoading === a.email}
                  onClick={() => loginAsDemo(a)}
                  className={`group w-full rounded-xl border px-4 py-3 text-left transition ${a.color}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.badge}`}>{a.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-sm">{a.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.badge}`}>{a.role}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{a.description}</div>
                      <div className="mt-1 font-mono text-[11px] text-muted-foreground/70">{a.email}</div>
                    </div>
                    {demoLoading === a.email
                      ? <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    }
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground text-center">
              Password for all accounts: <code className="rounded bg-secondary px-1 py-0.5 font-mono">Kwali2026!</code>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            OR sign in with your own account
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* ── Regular sign in form ── */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-ink">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Password</label>
              <div className="relative mt-1">
                <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 pr-10 text-sm outline-none ring-primary/30 transition focus:ring-2" />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <button disabled={submitting}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60">
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              New here? <Link to="/auth/signup" className="font-semibold text-primary hover:underline">Create a taxpayer account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
