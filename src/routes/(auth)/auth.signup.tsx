import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import crest from "@/shared/assets/kwali-crest.png";
import { wards } from "@/shared/lib/kwali-mock";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/hooks/useAuth";
import heroBg from "@/shared/assets/abuja-city-gate.jpg";
import imgBusiness from "@/shared/assets/cat-business.jpg";
import imgProperty from "@/shared/assets/cat-property.jpg";
import imgMarket from "@/shared/assets/cat-market.jpg";
import imgTransport from "@/shared/assets/cat-transport.jpg";
import imgHotel from "@/shared/assets/cat-hotel.jpg";
import imgSanitation from "@/shared/assets/cat-sanitation.jpg";
import imgPos from "@/shared/assets/cat-pos.jpg";
import { LevyEducation } from "@/shared/components/ui/LevyEducation";
import { StepProgress } from "@/shared/components/ui/StepProgress";

const STEPS = ["Account type", "Your details", "Secure account"];

export const Route = createFileRoute("/(auth)/auth/signup")({
  head: () => ({ meta: [{ title: "Create taxpayer account — Kwali Revenue Portal" }] }),
  validateSearch: (search) => ({
    category: search.category as string | undefined,
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const search = useSearch({ from: "/(auth)/auth/signup" });
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [ward, setWard] = useState(wards[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<
    "property" | "business" | "transport" | "market" | "hospitality" | "sanitation" | "pos" | ""
  >(search.category || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(search.category ? 1 : 0);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/portal" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Enter-key on an earlier step advances instead of submitting.
    if (step < STEPS.length - 1) {
      if (stepValid) next();
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        data: { full_name: `${first} ${last}`.trim(), phone, ward, account_type: accountType },
      },
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/portal" });
  };

  const google = async () => {
    const { lovable } = await import("@/integrations/lovable");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/portal",
    });
    if (result.error) setError(result.error.message);
    else if (!result.redirected) navigate({ to: "/portal" });
  };

  const accountTypes = [
    {
      id: "property" as const,
      label: "Property Owner",
      desc: "Residential or commercial building",
      img: imgProperty,
    },
    {
      id: "business" as const,
      label: "Business Owner",
      desc: "Shop, office, hotel, POS, etc.",
      img: imgBusiness,
    },
    {
      id: "market" as const,
      label: "Market Trader",
      desc: "Stall, hawker, table-top",
      img: imgMarket,
    },
    {
      id: "transport" as const,
      label: "Transport Operator",
      desc: "Keke, okada, commercial vehicle",
      img: imgTransport,
    },
    {
      id: "hospitality" as const,
      label: "Hospitality & Events",
      desc: "Hotels, lodges, event centres",
      img: imgHotel,
    },
    {
      id: "sanitation" as const,
      label: "Sanitation Services",
      desc: "Waste pickup & environmental compliance",
      img: imgSanitation,
    },
    {
      id: "pos" as const,
      label: "POS & Mobile Money",
      desc: "POS agents, mobile money kiosks",
      img: imgPos,
    },
  ];

  // Per-step validation gate for the Continue button.
  const stepValid =
    step === 0 ? !!accountType : step === 1 ? first.trim() !== "" && last.trim() !== "" : true;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 md:p-16 text-primary-foreground md:flex">
        <img
          src={heroBg}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f1a]/95 via-[#0f4c3a]/85 to-[#0a1f1a]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.18),transparent_60%)]" />
        <Link to="/" className="relative flex items-center gap-4">
          <img src={crest} alt="" className="h-12 w-12" />
          <div>
            <div className="font-display text-xl font-bold">Kwali Area Council</div>
            <div className="text-xs uppercase tracking-widest text-white/70 mt-1">
              Smart Revenue Platform
            </div>
          </div>
        </Link>
        <div className="relative space-y-6">
          <h2 className="font-display text-4xl font-extrabold leading-tight">Create your taxpayer account.</h2>
          <ul className="mt-4 space-y-3 text-base text-white/90">
            <li className="flex items-center gap-3"><span className="text-xl">✓</span> Register your business or property online</li>
            <li className="flex items-center gap-3"><span className="text-xl">✓</span> Receive automatic bills and digital receipts</li>
            <li className="flex items-center gap-3"><span className="text-xl">✓</span> Pay levies securely from your dashboard</li>
          </ul>
          <div className="mt-10 grid grid-cols-4 gap-3 pt-8 border-t border-white/10">
            {[
              { img: imgBusiness, label: "Business" },
              { img: imgProperty, label: "Property" },
              { img: imgMarket, label: "Markets" },
              { img: imgTransport, label: "Transport" },
            ].map((c) => (
              <div
                key={c.label}
                className="relative overflow-hidden rounded-xl border border-white/15"
              >
                <img
                  src={c.img}
                  alt={c.label}
                  className="aspect-square h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 text-xs font-bold uppercase tracking-wider text-white">
                  {c.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/60 pt-6 border-t border-white/10">© Kwali Area Council · FCT</div>
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <form onSubmit={submit} className="w-full max-w-md space-y-4">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Back home
            </Link>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink">
              Create taxpayer account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              A quick three-step setup — you'll register your property or business inside the
              portal.
            </p>
          </div>

          <StepProgress
            steps={STEPS}
            current={step}
            onJump={setStep}
            className="rounded-xl border border-border bg-card p-4"
          />

          {/* Step 1 — Account type (shown only if no pre-selected category) */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-ink">I am registering as a…</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {accountTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAccountType(t.id)}
                      className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left transition ${
                        accountType === t.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="relative z-10">
                        <div className="text-xs font-bold text-ink">{t.label}</div>
                        <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                      </div>
                      {accountType === t.id && (
                        <div className="absolute right-2 top-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="h-2.5 w-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {/* Contextual legal education */}
              {accountType && <LevyEducation category={accountType} />}
            </div>
          )}

          {/* Pre-selected category confirmation (when coming from homepage) */}
          {search.category && step === 1 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {accountTypes.find((t) => t.id === search.category)?.img && (
                    <img
                      src={accountTypes.find((t) => t.id === search.category)!.img}
                      alt=""
                      className="h-6 w-6 rounded"
                    />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">Registering as: <span className="text-primary">{accountTypes.find((t) => t.id === search.category)?.label}</span></div>
                  <div className="text-xs text-muted-foreground">Change selection on the previous step if needed</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Your details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First name" value={first} onChange={setFirst} required />
                <Input label="Last name" value={last} onChange={setLast} required />
              </div>
              <Input
                label="Phone number"
                value={phone}
                onChange={setPhone}
                placeholder="08012345678"
              />
              <div>
                <label className="text-sm font-semibold text-ink">Ward</label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                >
                  {wards.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3 — Secure account */}
          {step === 2 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={google}
                className="w-full rounded-md border border-border bg-card py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                Continue with Google
              </button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> OR{" "}
                <div className="h-px flex-1 bg-border" />
              </div>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                required
              />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
          )}

          {/* Wizard navigation */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold text-ink hover:bg-secondary"
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={!stepValid}
                className="flex-1 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
              >
                Continue
              </button>
            ) : (
              <button
                disabled={submitting}
                className="flex-1 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create account"}
              </button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
      />
    </div>
  );
}
