import { createFileRoute, Link } from "@tanstack/react-router";
import crest from "@/assets/kwali-crest.png";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Sign in — Kwali Revenue Portal" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between p-12 text-primary-foreground md:flex" style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="flex items-center gap-3">
          <img src={crest} alt="" className="h-10 w-10" />
          <div>
            <div className="font-display font-bold">Kwali Area Council</div>
            <div className="text-xs uppercase tracking-widest text-white/70">KURCMS</div>
          </div>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold">Pay levies. Print receipts.<br/>All in one portal.</h2>
          <p className="mt-3 max-w-sm text-white/80">Tenement, business, sanitation and transport — one login, one history.</p>
        </div>
        <div className="text-xs text-white/60">© Kwali Area Council</div>
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <form onSubmit={(e) => { e.preventDefault(); window.location.assign("/dashboard"); }} className="w-full max-w-md space-y-5">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Back home</Link>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use your phone number or email.</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Phone or email</label>
            <input className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="08012345678" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink">Password</label>
              <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
            </div>
            <input type="password" className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="••••••••" />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" className="rounded border-border" /> Keep me signed in
          </label>
          <button className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95">
            Sign in
          </button>
          <div className="text-center text-sm text-muted-foreground">
            New here? <Link to="/auth/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
