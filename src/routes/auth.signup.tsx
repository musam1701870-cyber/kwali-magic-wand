import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import crest from "@/assets/kwali-crest.png";
import { wards } from "@/lib/kwali-mock";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import heroBg from "@/assets/abuja-city-gate.jpg";
import imgBusiness from "@/assets/cat-business.jpg";
import imgProperty from "@/assets/cat-property.jpg";
import imgMarket from "@/assets/cat-market.jpg";
import imgTransport from "@/assets/cat-transport.jpg";
import { LevyEducation } from "@/components/ui/LevyEducation";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Create taxpayer account — Kwali Revenue Portal" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [ward, setWard] = useState(wards[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"property" | "business" | "transport" | "market" | "">(""); 
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && user) navigate({ to: "/portal" }); }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        data: { full_name: `${first} ${last}`.trim(), phone, ward, account_type: accountType },
      },
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    navigate({ to: "/portal" });
  };

  const google = async () => {
    const { lovable } = await import("@/integrations/lovable");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/portal" });
    if (result.error) setError(result.error.message);
    else if (!result.redirected) navigate({ to: "/portal" });
  };

  const accountTypes = [
    { id: "property" as const, label: "Property Owner", desc: "Residential or commercial building", img: imgProperty },
    { id: "business" as const, label: "Business Owner", desc: "Shop, office, hotel, POS, etc.", img: imgBusiness },
    { id: "market" as const, label: "Market Trader", desc: "Stall, hawker, table-top", img: imgMarket },
    { id: "transport" as const, label: "Transport Operator", desc: "Keke, okada, commercial vehicle", img: imgTransport },
  ];

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-primary-foreground md:flex">
        <img src={heroBg} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f1a]/95 via-[#0f4c3a]/85 to-[#0a1f1a]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.18),transparent_60%)]" />
        <Link to="/" className="relative flex items-center gap-3">
          <img src={crest} alt="" className="h-10 w-10" />
          <div>
            <div className="font-display font-bold">Kwali Area Council</div>
            <div className="text-xs uppercase tracking-widest text-white/70">Smart Revenue Platform</div>
          </div>
        </Link>
        <div className="relative">
          <h2 className="font-display text-3xl font-bold">Create your taxpayer account.</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            <li>✓ Register your business or property online</li>
            <li>✓ Receive automatic bills and digital receipts</li>
            <li>✓ Pay levies securely from your dashboard</li>
          </ul>
          <div className="mt-8 grid grid-cols-4 gap-2">
            {[
              { img: imgBusiness, label: "Business" },
              { img: imgProperty, label: "Property" },
              { img: imgMarket, label: "Markets" },
              { img: imgTransport, label: "Transport" },
            ].map((c) => (
              <div key={c.label} className="relative overflow-hidden rounded-lg border border-white/15">
                <img src={c.img} alt={c.label} className="aspect-square h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-1 left-1.5 text-[10px] font-bold uppercase tracking-wider text-white">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/60">© Kwali Area Council · FCT</div>
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <form onSubmit={submit} className="w-full max-w-md space-y-4">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Back home</Link>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink">Create taxpayer account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Step 1: account. Step 2: register your business in your portal.</p>
          </div>

          {/* Account type selector */}
          <div>
            <label className="text-sm font-semibold text-ink">I am registering as a…</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {accountTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAccountType(t.id)}
                  className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left transition ${
                    accountType === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-ink">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                  </div>
                  {accountType === t.id && (
                    <div className="absolute right-2 top-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Contextual legal education */}
          {accountType && (
            <LevyEducation category={accountType} />
          )}

          <button type="button" onClick={google}
            className="w-full rounded-md border border-border bg-card py-2.5 text-sm font-semibold hover:bg-secondary">
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={first} onChange={setFirst} required />
            <Input label="Last name" value={last} onChange={setLast} required />
          </div>
          <Input label="Phone number" value={phone} onChange={setPhone} placeholder="08012345678" />
          <div>
            <label className="text-sm font-semibold text-ink">Ward</label>
            <select value={ward} onChange={(e) => setWard(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </div>
          <Input label="Email address" type="email" value={email} onChange={setEmail} required />
          <Input label="Password" type="password" value={password} onChange={setPassword} required />

          {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}

          <button disabled={submitting}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60">
            {submitting ? "Creating account…" : "Create account"}
          </button>
          <div className="text-center text-sm text-muted-foreground">
            Have an account? <Link to="/auth/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-ink">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
    </div>
  );
}
