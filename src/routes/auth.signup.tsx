import { createFileRoute, Link } from "@tanstack/react-router";
import crest from "@/assets/kwali-crest.png";
import { wards } from "@/lib/kwali-mock";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Create account — Kwali Revenue Portal" }] }),
  component: SignupPage,
});

function SignupPage() {
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
          <h2 className="font-display text-3xl font-bold">Create your account in under a minute.</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            <li>✓ NIN or CAC verification</li>
            <li>✓ One account for all council levies</li>
            <li>✓ Receipts delivered to your phone & email</li>
          </ul>
        </div>
        <div className="text-xs text-white/60">© Kwali Area Council</div>
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <form onSubmit={(e) => { e.preventDefault(); window.location.assign("/dashboard"); }} className="w-full max-w-md space-y-4">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Back home</Link>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink">Create account</h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-ink">First name</label>
              <input className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Last name</label>
              <input className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Account type</label>
            <select className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
              <option>Individual / Property owner</option>
              <option>Business</option>
              <option>Transport operator</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Phone number</label>
            <input className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="08012345678" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Ward</label>
            <select className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">NIN or CAC number</label>
            <input className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Password</label>
            <input type="password" className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
          </div>
          <button className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95">
            Create account
          </button>
          <div className="text-center text-sm text-muted-foreground">
            Have an account? <Link to="/auth/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
