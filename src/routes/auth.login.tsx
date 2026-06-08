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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/portal` },
    });
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
          <div className="text-center text-sm text-muted-foreground">
            New here? <Link to="/auth/signup" className="font-semibold text-primary hover:underline">Create a taxpayer account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
