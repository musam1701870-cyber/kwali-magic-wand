import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import crest from "@/assets/kwali-crest.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — Kwali Revenue Portal" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<Array<{ email: string; role: string; password: string }> | null>(null);

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

  const google = async () => {
    const { lovable } = await import("@/integrations/lovable");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/portal" });
    if (result.error) setError(result.error.message);
  };

  const loadDemo = async () => {
    setDemoLoading(true); setError(null);
    try {
      const res = await fetch("/api/public/seed-demo", { method: "POST" });
      const body = await res.json();
      if (!body.ok) throw new Error(body.error || "Seed failed");
      setDemoAccounts(body.accounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load demo accounts");
    } finally {
      setDemoLoading(false);
    }
  };

  const fillDemo = (acc: { email: string; password: string }) => {
    setEmail(acc.email); setPassword(acc.password);
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
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
          <p className="mt-3 max-w-sm text-white/80">Sign in to register a business, view bills, or pay levies online.</p>
        </div>
        <div className="text-xs text-white/60">© Kwali Area Council</div>
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <form onSubmit={submit} className="w-full max-w-md space-y-4">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Back home</Link>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink">Sign in</h1>
          </div>

          <button type="button" onClick={google}
            className="w-full rounded-md border border-border bg-card py-2.5 text-sm font-semibold hover:bg-secondary">
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <div>
            <label className="text-sm font-semibold text-ink">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
          </div>

          {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}

          <button disabled={submitting}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60">
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Demo mode</div>
                <div className="text-xs text-muted-foreground">Generate test accounts to explore the platform.</div>
              </div>
              <button type="button" onClick={loadDemo} disabled={demoLoading}
                className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60">
                {demoLoading ? "Loading…" : demoAccounts ? "Refresh" : "Load demo accounts"}
              </button>
            </div>
            {demoAccounts && (
              <ul className="mt-3 space-y-1.5">
                {demoAccounts.map((a) => (
                  <li key={a.email} className="flex items-center justify-between rounded-md bg-card px-2.5 py-1.5 text-xs">
                    <div className="min-w-0">
                      <div className="font-mono truncate">{a.email}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{a.role} · pwd: {a.password}</div>
                    </div>
                    <button type="button" onClick={() => fillDemo(a)}
                      className="ml-2 shrink-0 rounded bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            New here? <Link to="/auth/signup" className="font-semibold text-primary hover:underline">Create a taxpayer account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
