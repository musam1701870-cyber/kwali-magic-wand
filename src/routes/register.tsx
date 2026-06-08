import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { businessCategories, wards } from "@/lib/kwali-mock";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Taxpayer Registration — Kwali Smart Revenue Platform" }] }),
  component: RegisterPage,
});

// ---------- Domain ----------
const taxpayerTypes: { id: string; title: string; desc: string; icon: string; tag: string }[] = [
  { id: "individual", title: "Individual Taxpayer", desc: "Personal income & development levy", icon: "👤", tag: "Personal" },
  { id: "sole", title: "Sole Proprietor", desc: "Owner-operated small business", icon: "🧑‍💼", tag: "Business" },
  { id: "cac", title: "CAC Registered Business", desc: "Auto-verify via RC number", icon: "🏛️", tag: "Business" },
  { id: "llc", title: "Limited Liability Company", desc: "Private / public limited company", icon: "🏢", tag: "Company" },
  { id: "hotel", title: "Hotel / Lodge", desc: "Hospitality establishment", icon: "🏨", tag: "Hospitality" },
  { id: "restaurant", title: "Restaurant / Eatery", desc: "Food & beverage outlet", icon: "🍽️", tag: "Hospitality" },
  { id: "filling", title: "Filling Station", desc: "Petroleum products dealer", icon: "⛽", tag: "Hazard" },
  { id: "event", title: "Event Centre", desc: "Halls, banquet, conference", icon: "🎪", tag: "Hospitality" },
  { id: "complex", title: "Shopping Complex", desc: "Plaza / mall management", icon: "🏬", tag: "Property" },
  { id: "supermarket", title: "Supermarket", desc: "Retail chain or independent", icon: "🛍️", tag: "Retail" },
  { id: "market", title: "Market Authority", desc: "Council-owned market", icon: "🏪", tag: "Market" },
  { id: "trader", title: "Market Trader", desc: "Stall / lockup operator", icon: "🧺", tag: "Market" },
  { id: "lockup", title: "Lockup Shop", desc: "Lease & rates", icon: "🔐", tag: "Market" },
  { id: "pos", title: "POS Operator", desc: "Agency banking", icon: "💳", tag: "Financial" },
  { id: "professional", title: "Professional Firm", desc: "Law, audit, consult, ICT", icon: "💼", tag: "Services" },
  { id: "school", title: "School", desc: "Private nursery / primary / secondary", icon: "🏫", tag: "Education" },
  { id: "hospital", title: "Hospital / Clinic", desc: "Private healthcare", icon: "🏥", tag: "Health" },
  { id: "pharmacy", title: "Pharmacy", desc: "Patent medicine / pharmacy", icon: "💊", tag: "Health" },
  { id: "manufacturing", title: "Manufacturing", desc: "Factory / production", icon: "🏭", tag: "Industrial" },
  { id: "warehouse", title: "Warehouse", desc: "Storage & logistics", icon: "📦", tag: "Industrial" },
  { id: "construction", title: "Construction Co.", desc: "Engineering & building", icon: "🏗️", tag: "Industrial" },
  { id: "religious", title: "Religious Organization", desc: "Church / mosque / mission", icon: "🛐", tag: "Non-Profit" },
  { id: "ngo", title: "NGO", desc: "Non-governmental org", icon: "🤝", tag: "Non-Profit" },
  { id: "association", title: "Association / Union", desc: "Trade or community group", icon: "👥", tag: "Non-Profit" },
  { id: "motorcycle", title: "Motorcycle (Okada)", desc: "Commercial bike rider", icon: "🏍️", tag: "Transport" },
  { id: "tricycle", title: "Tricycle (Keke)", desc: "Commercial tricycle", icon: "🛺", tag: "Transport" },
  { id: "commercial-vehicle", title: "Commercial Vehicle", desc: "Bus / taxi / haulage", icon: "🚌", tag: "Transport" },
  { id: "property-owner", title: "Property Owner", desc: "Tenement rate payer", icon: "🏠", tag: "Property" },
  { id: "landlord", title: "Landlord", desc: "Rental property income", icon: "🔑", tag: "Property" },
  { id: "developer", title: "Property Developer", desc: "Real estate development", icon: "📐", tag: "Property" },
];

const obligationsMap: Record<string, string[]> = {
  hotel: ["Hotel Operating Permit", "Business Premises Levy", "Tenement Rate", "Environmental Levy", "Signage Permit", "Waste Management Fee", "Fire Compliance", "Tourism Levy"],
  filling: ["Business Premises Levy", "Tenement Rate", "Environmental Levy", "Hazard Compliance Levy", "Signage Permit", "Operational Permit", "Fire Compliance"],
  restaurant: ["Business Premises Levy", "Tenement Rate", "Food Hygiene Permit", "Signage Permit", "Waste Management Fee"],
  event: ["Operating Permit", "Tenement Rate", "Noise Compliance", "Waste Management", "Signage Permit"],
  supermarket: ["Business Premises Levy", "Tenement Rate", "Signage Permit", "Waste Management", "Weights & Measures"],
  complex: ["Tenement Rate", "Signage Permit", "Waste Management", "Property Management Levy"],
  market: ["Daily Toll Collection", "Stall Allocation Fee", "Sanitation Levy"],
  trader: ["Daily Market Toll", "Sanitation Levy", "Stall Fee"],
  lockup: ["Annual Lockup Rent", "Sanitation Levy"],
  pos: ["POS Operator Permit", "Signage Permit", "Sanitation Levy"],
  professional: ["Business Premises Levy", "Practice Permit"],
  school: ["School Operating Permit", "Tenement Rate", "Sanitation"],
  hospital: ["Health Facility Permit", "Tenement Rate", "Medical Waste Levy"],
  pharmacy: ["Pharmacy Permit", "Business Premises Levy", "Signage Permit"],
  manufacturing: ["Factory Permit", "Environmental Levy", "Tenement Rate", "Hazard Levy"],
  warehouse: ["Storage Permit", "Tenement Rate", "Environmental Levy"],
  construction: ["Building Approval", "Site Levy", "Environmental Levy"],
  religious: ["Sanitation Levy"],
  ngo: ["Operating Permit"],
  association: ["Annual Registration"],
  motorcycle: ["Rider Permit", "Vehicle Sticker", "Park Levy"],
  tricycle: ["Operator Permit", "Vehicle Sticker", "Park Levy"],
  "commercial-vehicle": ["Operator Permit", "Loading Levy", "Park Levy"],
  "property-owner": ["Tenement Rate", "Ground Rent"],
  landlord: ["Tenement Rate", "Rental Income Levy"],
  developer: ["Building Approval", "Development Levy", "Tenement Rate"],
  individual: ["Personal Development Levy"],
  sole: ["Business Premises Levy", "Personal Development Levy"],
  cac: ["Business Premises Levy", "Signage Permit"],
  llc: ["Business Premises Levy", "Signage Permit", "Tenement Rate"],
};

const documentsMap: Record<string, string[]> = {
  default: ["Valid ID (NIN slip / Passport / Driver's License)", "Utility Bill", "Passport Photograph"],
  business: ["CAC Certificate", "MEMART", "Tax Clearance Certificate", "Utility Bill", "Passport Photograph", "Site Photographs"],
  property: ["Property Title Document", "Survey Plan", "Building Approval", "Utility Bill"],
  hazard: ["DPR / NMDPRA License", "Fire Safety Certificate", "Environmental Impact Assessment", "CAC Certificate"],
};

const steps = [
  "Taxpayer Type",
  "Business Information",
  "Ownership Information",
  "Location Information",
  "Property & Tenement",
  "Revenue Classification",
  "Documents & Verification",
  "Review & Submit",
];

type FormState = {
  type: string;
  // step 2
  businessName: string; tradingName: string; category: string; industry: string;
  rc: string; tin: string; incorporated: string; size: string; employees: string;
  turnover: string; phone: string; email: string; website: string;
  cacVerified: boolean;
  // step 3
  ownerName: string; directors: string; nin: string; bvn: string;
  ownerPhone: string; ownerEmail: string; nationality: string; residential: string; emergency: string;
  // step 4
  state: string; lga: string; ward: string; district: string; street: string;
  building: string; lat: string; lng: string; landmark: string;
  // step 5
  propertyMatched: boolean; assessmentRef: string; propertyValue: string;
  annualRate: string; outstanding: string; propertyClass: string;
  // step 6
  obligations: string[];
  // step 7
  uploaded: string[];
  // consent
  consent: boolean;
};

const empty: FormState = {
  type: "", businessName: "", tradingName: "", category: "", industry: "", rc: "", tin: "",
  incorporated: "", size: "", employees: "", turnover: "", phone: "", email: "", website: "",
  cacVerified: false, ownerName: "", directors: "", nin: "", bvn: "", ownerPhone: "", ownerEmail: "",
  nationality: "Nigerian", residential: "", emergency: "", state: "FCT", lga: "Kwali", ward: "",
  district: "", street: "", building: "", lat: "", lng: "", landmark: "", propertyMatched: false,
  assessmentRef: "", propertyValue: "", annualRate: "", outstanding: "", propertyClass: "",
  obligations: [], uploaded: [], consent: false,
};

const STORAGE_KEY = "ksrp-registration-draft";

function RegisterPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [matching, setMatching] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Require auth
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/signup" });
  }, [user, loading, navigate]);

  // Load draft
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { const d = JSON.parse(raw); setForm({ ...empty, ...d.form }); setStep(d.step ?? 0); } catch {}
    }
  }, []);
  // Auto-save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, step, savedAt: new Date().toISOString() }));
  }, [form, step]);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const completeness = useMemo(() => {
    const required = [form.type, form.businessName || form.ownerName, form.phone || form.ownerPhone,
      form.ward, form.street, form.obligations.length > 0, form.uploaded.length > 0];
    const done = required.filter(Boolean).length;
    return Math.round((done / required.length) * 100);
  }, [form]);

  const risk = useMemo(() => {
    let score = 100;
    if (!form.cacVerified && ["cac", "llc"].includes(form.type)) score -= 25;
    if (!form.nin) score -= 15;
    if (!form.uploaded.length) score -= 20;
    if (!form.lat || !form.lng) score -= 10;
    if (!form.tin) score -= 10;
    return Math.max(5, score);
  }, [form]);

  const verifyCAC = async () => {
    if (!form.rc) return;
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 900));
    update({
      cacVerified: true,
      businessName: form.businessName || "Kwali Heritage Resources Ltd",
      incorporated: form.incorporated || "2019-04-12",
      industry: form.industry || "General Commerce",
      directors: form.directors || "A. Musa, J. Okeke, B. Ibrahim",
    });
    setVerifying(false);
  };

  const matchProperty = async () => {
    setMatching(true);
    await new Promise((r) => setTimeout(r, 900));
    const value = 120_000_000;
    update({
      propertyMatched: true,
      assessmentRef: `KWL-PRP-2026-${Math.floor(1000 + Math.random() * 8999)}`,
      propertyValue: value.toLocaleString(),
      annualRate: (value * 0.02).toLocaleString(),
      outstanding: "800,000",
      propertyClass: form.type === "filling" || form.type === "manufacturing" ? "Hazard / Industrial" : "Commercial",
    });
    setMatching(false);
  };

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!form.consent || !user) return;
    setSaving(true); setSaveError(null);
    const ref = `KWL-TIN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
    const annual = Number((form.annualRate || "0").replace(/[^\d.]/g, "")) || 0;
    const { error } = await supabase.from("businesses").insert({
      owner_id: user.id, ref,
      taxpayer_type: form.type,
      business_name: form.businessName || form.ownerName || "Unnamed",
      trading_name: form.tradingName, category: form.category, industry: form.industry,
      rc_number: form.rc, tin: form.tin, phone: form.phone, email: form.email, website: form.website,
      owner_name: form.ownerName, nin: form.nin, bvn: form.bvn,
      ward: form.ward, district: form.district, street: form.street, building: form.building,
      landmark: form.landmark, lat: form.lat, lng: form.lng,
      property_class: form.propertyClass, assessment_ref: form.assessmentRef,
      annual_rate: annual, obligations: form.obligations, documents: form.uploaded,
      status: isAdmin ? "Active" : "Pending",
    });
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setSubmitted(ref);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (submitted) return <SuccessScreen id={submitted} form={form} />;

  return (
    <DashboardShell
      title="Taxpayer Registration"
      subtitle="Guided onboarding for every revenue category in Kwali Area Council"
      actions={
        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right text-xs">
            <div className="text-muted-foreground">Draft auto-saved</div>
            <div className="font-semibold text-primary">{completeness}% complete</div>
          </div>
          <Link to="/businesses" className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold">Exit</Link>
        </div>
      }
    >
      <Stepper step={step} onJump={(i) => i < step && setStep(i)} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {step === 0 && <Step1 form={form} update={update} />}
          {step === 1 && <Step2 form={form} update={update} verifying={verifying} verifyCAC={verifyCAC} />}
          {step === 2 && <Step3 form={form} update={update} />}
          {step === 3 && <Step4 form={form} update={update} />}
          {step === 4 && <Step5 form={form} update={update} matching={matching} matchProperty={matchProperty} />}
          {step === 5 && <Step6 form={form} update={update} />}
          {step === 6 && <Step7 form={form} update={update} />}
          {step === 7 && <Step8 form={form} update={update} risk={risk} completeness={completeness} submit={submit} />}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <button onClick={back} disabled={step === 0}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-40">
              ← Back
            </button>
            <div className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</div>
            {step < steps.length - 1 ? (
              <button onClick={next} disabled={step === 0 && !form.type}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                Continue →
              </button>
            ) : (
              <button onClick={submit} disabled={!form.consent}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                Submit Registration
              </button>
            )}
          </div>
        </div>

        <SidePanel form={form} step={step} completeness={completeness} risk={risk} />
      </div>
    </DashboardShell>
  );
}

// ---------- Stepper ----------
function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="font-semibold text-primary">Step {step + 1} of {steps.length}</div>
        <div className="text-muted-foreground">{steps[step]}</div>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
      <ol className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {steps.map((s, i) => {
          const done = i < step, active = i === step;
          return (
            <li key={s}>
              <button onClick={() => onJump(i)} disabled={i > step}
                className={"w-full rounded-lg border px-2 py-2 text-left text-[11px] transition " + (
                  active ? "border-primary bg-primary/5 text-primary" :
                  done ? "border-border bg-surface text-foreground hover:bg-secondary" :
                  "border-border bg-card text-muted-foreground"
                )}>
                <div className="flex items-center gap-2">
                  <span className={"flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " +
                    (done ? "bg-primary text-primary-foreground" : active ? "border-2 border-primary text-primary" : "bg-secondary")}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="font-semibold leading-tight">{s}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------- Side Panel ----------
function SidePanel({ form, step, completeness, risk }: { form: FormState; step: number; completeness: number; risk: number }) {
  const selectedType = taxpayerTypes.find((t) => t.id === form.type);
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Onboarding Summary</div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
            {selectedType?.icon ?? "🪪"}
          </div>
          <div>
            <div className="text-sm font-bold">{selectedType?.title ?? "Select a category"}</div>
            <div className="text-xs text-muted-foreground">{form.businessName || form.ownerName || "Untitled draft"}</div>
          </div>
        </div>
        <dl className="mt-4 space-y-2 text-xs">
          <Row k="Ward" v={form.ward || "—"} />
          <Row k="RC Number" v={form.rc || "—"} />
          <Row k="TIN" v={form.tin || "—"} />
          <Row k="Obligations" v={String(form.obligations.length)} />
          <Row k="Documents" v={String(form.uploaded.length)} />
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completeness</div>
        <div className="mt-2 text-2xl font-bold">{completeness}%</div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-emerald-500" style={{ width: `${completeness}%` }} />
        </div>
        <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Compliance Readiness</div>
        <div className="mt-2 flex items-center gap-2">
          <div className={"text-2xl font-bold " + (risk >= 75 ? "text-emerald-600" : risk >= 50 ? "text-amber-600" : "text-rose-600")}>
            {risk}
          </div>
          <div className="text-xs text-muted-foreground">/ 100 score</div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-xs">
        <div className="font-bold text-primary">Need help?</div>
        <p className="mt-1 text-muted-foreground">
          {step === 0 && "Pick the category that best matches your activity. We'll tailor the rest of the form."}
          {step === 1 && "Entering an RC number lets us auto-verify with the Corporate Affairs Commission."}
          {step === 2 && "Provide accurate principal officer details — NIN/BVN improve trust score."}
          {step === 3 && "Drop a pin on the map; we use coordinates to attach the right ward & district."}
          {step === 4 && "We try to match existing tenement assessments so you don't pay twice."}
          {step === 5 && "We automatically suggest the levies and permits applicable to your category."}
          {step === 6 && "Drag & drop your documents. We accept PDF, JPG and PNG up to 10MB each."}
          {step === 7 && "Review every section. Submission generates a Taxpayer ID and revenue account."}
        </p>
        <a href="/contact" className="mt-3 inline-block font-semibold text-primary">Call a revenue officer →</a>
      </div>
    </aside>
  );
}
const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
);

// ---------- Inputs ----------
function Field({ label, hint, children, span = 1 }: { label: string; hint?: string; children: ReactNode; span?: 1 | 2 }) {
  return (
    <label className={"block " + (span === 2 ? "md:col-span-2" : "")}>
      <div className="mb-1 text-xs font-semibold text-foreground">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </label>
  );
}
const inputCls = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

// ---------- STEP 1 ----------
function Step1({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const [q, setQ] = useState("");
  const filtered = taxpayerTypes.filter((t) =>
    t.title.toLowerCase().includes(q.toLowerCase()) || t.tag.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Who are you registering today?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pick a category — we'll tailor the rest of the wizard.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories (e.g. hotel, POS, market)…"
        className={"mt-4 " + inputCls} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const active = form.type === t.id;
          return (
            <button key={t.id} type="button" onClick={() => update({ type: t.id })}
              className={"rounded-xl border p-4 text-left transition " + (
                active ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
              )}>
              <div className="flex items-start justify-between">
                <div className="text-2xl">{t.icon}</div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{t.tag}</span>
              </div>
              <div className="mt-3 text-sm font-bold">{t.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t.desc}</div>
              {active && <div className="mt-3 text-[11px] font-semibold text-primary">✓ Selected</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- STEP 2 ----------
function Step2({ form, update, verifying, verifyCAC }: { form: FormState; update: (p: Partial<FormState>) => void; verifying: boolean; verifyCAC: () => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Business Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter your RC number for instant CAC verification, or fill manually.</p>

      <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="RC Number (CAC)" hint="We'll auto-fill verified company details">
            <input value={form.rc} onChange={(e) => update({ rc: e.target.value, cacVerified: false })}
              placeholder="e.g. RC 1234567" className={inputCls + " w-56"} />
          </Field>
          <button onClick={verifyCAC} disabled={verifying || !form.rc}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {verifying ? "Verifying…" : form.cacVerified ? "Re-verify" : "Verify with CAC"}
          </button>
          {form.cacVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              ✓ Verified • CAC Match Successful
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Business Name">
          <input value={form.businessName} onChange={(e) => update({ businessName: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Trading Name (optional)">
          <input value={form.tradingName} onChange={(e) => update({ tradingName: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Business Category">
          <select value={form.category} onChange={(e) => update({ category: e.target.value })} className={inputCls}>
            <option value="">Select…</option>
            {businessCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Industry Type">
          <input value={form.industry} onChange={(e) => update({ industry: e.target.value })} className={inputCls} placeholder="e.g. Hospitality" />
        </Field>
        <Field label="TIN (FIRS)">
          <input value={form.tin} onChange={(e) => update({ tin: e.target.value })} className={inputCls} placeholder="e.g. 12345678-0001" />
        </Field>
        <Field label="Date of Incorporation">
          <input type="date" value={form.incorporated} onChange={(e) => update({ incorporated: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Business Size">
          <select value={form.size} onChange={(e) => update({ size: e.target.value })} className={inputCls}>
            <option value="">Select…</option><option>Micro</option><option>Small</option><option>Medium</option><option>Large</option>
          </select>
        </Field>
        <Field label="Number of Employees">
          <input type="number" value={form.employees} onChange={(e) => update({ employees: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Annual Turnover Range">
          <select value={form.turnover} onChange={(e) => update({ turnover: e.target.value })} className={inputCls}>
            <option value="">Select…</option>
            <option>Below ₦5M</option><option>₦5M – ₦25M</option><option>₦25M – ₦100M</option>
            <option>₦100M – ₦500M</option><option>Above ₦500M</option>
          </select>
        </Field>
        <Field label="Phone Number">
          <input value={form.phone} onChange={(e) => update({ phone: e.target.value })} className={inputCls} placeholder="0803-000-0000" />
        </Field>
        <Field label="Email Address">
          <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Website (optional)">
          <input value={form.website} onChange={(e) => update({ website: e.target.value })} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

// ---------- STEP 3 ----------
function Step3({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Ownership Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">Principal officer / proprietor identity & contact.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Owner / Principal Officer Name">
          <input value={form.ownerName} onChange={(e) => update({ ownerName: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Directors / Shareholders">
          <input value={form.directors} onChange={(e) => update({ directors: e.target.value })} className={inputCls} placeholder="Comma separated" />
        </Field>
        <Field label="NIN" hint="11-digit National Identification Number">
          <input value={form.nin} onChange={(e) => update({ nin: e.target.value })} className={inputCls} />
        </Field>
        <Field label="BVN">
          <input value={form.bvn} onChange={(e) => update({ bvn: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Owner Phone">
          <input value={form.ownerPhone} onChange={(e) => update({ ownerPhone: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Owner Email">
          <input type="email" value={form.ownerEmail} onChange={(e) => update({ ownerEmail: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Nationality">
          <input value={form.nationality} onChange={(e) => update({ nationality: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Residential Address" span={2}>
          <input value={form.residential} onChange={(e) => update({ residential: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Emergency Contact" span={2}>
          <input value={form.emergency} onChange={(e) => update({ emergency: e.target.value })} className={inputCls} placeholder="Name & phone" />
        </Field>
      </div>
    </div>
  );
}

// ---------- STEP 4 ----------
function Step4({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const pin = () => {
    update({ lat: (8.85 + Math.random() * 0.2).toFixed(6), lng: (7.05 + Math.random() * 0.2).toFixed(6) });
  };
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Location Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pin the exact location — we use this for assessment & GIS mapping.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="State"><input value={form.state} onChange={(e) => update({ state: e.target.value })} className={inputCls} /></Field>
          <Field label="LGA / Area Council"><input value={form.lga} onChange={(e) => update({ lga: e.target.value })} className={inputCls} /></Field>
          <Field label="Ward">
            <select value={form.ward} onChange={(e) => update({ ward: e.target.value })} className={inputCls}>
              <option value="">Select ward…</option>
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="District / Community">
            <input value={form.district} onChange={(e) => update({ district: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Street" span={2}>
            <input value={form.street} onChange={(e) => update({ street: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Building Number"><input value={form.building} onChange={(e) => update({ building: e.target.value })} className={inputCls} /></Field>
          <Field label="Landmark"><input value={form.landmark} onChange={(e) => update({ landmark: e.target.value })} className={inputCls} placeholder="Near…" /></Field>
          <Field label="Latitude"><input value={form.lat} onChange={(e) => update({ lat: e.target.value })} className={inputCls} /></Field>
          <Field label="Longitude"><input value={form.lng} onChange={(e) => update({ lng: e.target.value })} className={inputCls} /></Field>
        </div>

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <div className="relative h-56 overflow-hidden rounded-lg border border-border"
            style={{ background: "repeating-linear-gradient(45deg, hsl(var(--muted)/.5) 0 12px, hsl(var(--muted)) 12px 14px)" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              {form.lat && form.lng ? (
                <div className="rounded-lg bg-card px-3 py-2 text-center shadow">
                  <div className="text-lg">📍</div>
                  <div className="text-[11px] font-bold">{form.lat}, {form.lng}</div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No pin set</div>
              )}
            </div>
          </div>
          <button onClick={pin} className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            📍 Drop pin at my location
          </button>
          <div className="mt-2 text-[11px] text-muted-foreground">GIS coordinates are used to attach the correct ward & assessment zone automatically.</div>
        </div>
      </div>
    </div>
  );
}

// ---------- STEP 5 ----------
function Step5({ form, update, matching, matchProperty }: { form: FormState; update: (p: Partial<FormState>) => void; matching: boolean; matchProperty: () => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Property & Tenement Assessment</h2>
      <p className="mt-1 text-sm text-muted-foreground">We match existing assessments using RC number, address, GPS and property identifiers to prevent duplicate billing.</p>

      <button onClick={matchProperty} disabled={matching}
        className="mt-4 rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50">
        {matching ? "Searching property records…" : "🔎 Run smart property match"}
      </button>

      {form.propertyMatched && (
        <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-emerald-800">✓ Existing Assessment Found</div>
            <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Confidence 94%</span>
          </div>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <Row k="Assessment Ref" v={form.assessmentRef} />
            <Row k="Property Class" v={form.propertyClass} />
            <Row k="Assessed Value" v={`₦${form.propertyValue}`} />
            <Row k="Annual Tenement Rate" v={`₦${form.annualRate}`} />
            <Row k="Outstanding" v={`₦${form.outstanding}`} />
            <Row k="Status" v={<span className="text-amber-700">Active — payment outstanding</span>} />
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Assessment Reference (manual)"><input value={form.assessmentRef} onChange={(e) => update({ assessmentRef: e.target.value })} className={inputCls} /></Field>
        <Field label="Property Classification">
          <select value={form.propertyClass} onChange={(e) => update({ propertyClass: e.target.value })} className={inputCls}>
            <option value="">Select…</option><option>Residential</option><option>Commercial</option>
            <option>Mixed-use</option><option>Hazard / Industrial</option><option>Institutional</option>
          </select>
        </Field>
        <Field label="Assessed Property Value (₦)"><input value={form.propertyValue} onChange={(e) => update({ propertyValue: e.target.value })} className={inputCls} /></Field>
        <Field label="Annual Tenement Rate (₦)"><input value={form.annualRate} onChange={(e) => update({ annualRate: e.target.value })} className={inputCls} /></Field>
      </div>
    </div>
  );
}

// ---------- STEP 6 ----------
function Step6({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const suggested = obligationsMap[form.type] ?? ["Business Premises Levy"];
  const toggle = (o: string) => {
    update({ obligations: form.obligations.includes(o) ? form.obligations.filter((x) => x !== o) : [...form.obligations, o] });
  };
  useEffect(() => {
    if (form.obligations.length === 0) update({ obligations: suggested });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type]);

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Revenue Classification</h2>
      <p className="mt-1 text-sm text-muted-foreground">Based on your category, the system suggests the following obligations. Toggle as needed.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {suggested.map((o) => {
          const on = form.obligations.includes(o);
          return (
            <label key={o} className={"flex cursor-pointer items-start gap-3 rounded-xl border p-4 " + (on ? "border-primary bg-primary/5" : "border-border bg-card")}>
              <input type="checkbox" checked={on} onChange={() => toggle(o)} className="mt-1" />
              <div>
                <div className="text-sm font-bold">{o}</div>
                <div className="text-[11px] text-muted-foreground">Calculated annually based on classification & ward.</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ---------- STEP 7 ----------
function Step7({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const isProperty = ["property-owner", "landlord", "developer", "complex"].includes(form.type);
  const isHazard = ["filling", "manufacturing", "warehouse"].includes(form.type);
  const docs = [
    ...(isHazard ? documentsMap.hazard : ["cac", "llc", "sole"].includes(form.type) ? documentsMap.business : documentsMap.default),
    ...(isProperty ? documentsMap.property : []),
  ];
  const add = (name: string) => update({ uploaded: Array.from(new Set([...form.uploaded, name])) });
  const remove = (name: string) => update({ uploaded: form.uploaded.filter((u) => u !== name) });

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Documents & Verification</h2>
      <p className="mt-1 text-sm text-muted-foreground">Drag & drop or click to upload. PDF, JPG, PNG up to 10MB.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {docs.map((d) => {
          const uploaded = form.uploaded.includes(d);
          return (
            <div key={d} className={"rounded-xl border-2 border-dashed p-4 " + (uploaded ? "border-emerald-400 bg-emerald-50" : "border-border bg-card")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold">{d}</div>
                  <div className="text-[11px] text-muted-foreground">{uploaded ? "Uploaded — preview available" : "Required for compliance"}</div>
                </div>
                <div className="text-2xl">{uploaded ? "📄" : "⬆️"}</div>
              </div>
              {uploaded ? (
                <button onClick={() => remove(d)} className="mt-3 text-xs font-semibold text-rose-600">Remove</button>
              ) : (
                <button onClick={() => add(d)} className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Choose file
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- STEP 8 ----------
function Step8({ form, update, risk, completeness, submit }: { form: FormState; update: (p: Partial<FormState>) => void; risk: number; completeness: number; submit: () => void }) {
  const selectedType = taxpayerTypes.find((t) => t.id === form.type);
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Review & Submit</h2>
      <p className="mt-1 text-sm text-muted-foreground">Confirm everything looks right. You can edit any section.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Completeness" value={`${completeness}%`} tone="primary" />
        <Stat label="Compliance Readiness" value={`${risk}/100`} tone={risk >= 75 ? "good" : risk >= 50 ? "warn" : "bad"} />
        <Stat label="Obligations" value={String(form.obligations.length)} tone="primary" />
      </div>

      <div className="mt-6 space-y-3">
        <ReviewBlock title="Taxpayer Category" body={selectedType?.title ?? "—"} />
        <ReviewBlock title="Business" body={`${form.businessName || "—"} • ${form.category || "—"} • RC ${form.rc || "—"} • TIN ${form.tin || "—"}`} />
        <ReviewBlock title="Ownership" body={`${form.ownerName || "—"} • NIN ${form.nin || "—"} • ${form.ownerPhone || "—"}`} />
        <ReviewBlock title="Location" body={`${form.building || ""} ${form.street || "—"}, ${form.ward || "—"} ward • ${form.lat || "?"}, ${form.lng || "?"}`} />
        <ReviewBlock title="Property & Tenement" body={form.propertyMatched ? `${form.assessmentRef} • ₦${form.annualRate}/yr (${form.propertyClass})` : "No prior assessment matched"} />
        <ReviewBlock title="Revenue Obligations" body={form.obligations.join(" • ") || "—"} />
        <ReviewBlock title="Documents" body={form.uploaded.length ? form.uploaded.join(" • ") : "None uploaded"} />
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
        <input type="checkbox" checked={form.consent} onChange={(e) => update({ consent: e.target.checked })} className="mt-1" />
        <span>I declare that the information provided is true and accurate. I authorise Kwali Area Council to verify
          these details with CAC, FIRS, NIMC and relevant agencies, and to assess applicable revenue obligations.</span>
      </label>
    </div>
  );
}

const Stat = ({ label, value, tone }: { label: string; value: string; tone: "primary" | "good" | "warn" | "bad" }) => {
  const colors = { primary: "text-primary", good: "text-emerald-600", warn: "text-amber-600", bad: "text-rose-600" } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={"mt-2 text-2xl font-bold " + colors[tone]}>{value}</div>
    </div>
  );
};
const ReviewBlock = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
    <div className="mt-1 text-sm">{body}</div>
  </div>
);

// ---------- Success ----------
function SuccessScreen({ id, form }: { id: string; form: FormState }) {
  const selectedType = taxpayerTypes.find((t) => t.id === form.type);
  return (
    <DashboardShell title="Registration Submitted" subtitle="Your taxpayer profile has been created">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
        <h2 className="mt-4 font-display text-2xl font-bold">Welcome, {form.businessName || form.ownerName || "Taxpayer"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your registration is being reviewed by a Kwali revenue officer.</p>

        <div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Taxpayer ID</div>
          <div className="mt-1 font-mono text-xl font-bold text-primary">{id}</div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 text-left">
          <Stat label="Category" value={selectedType?.title.split(" ")[0] ?? "—"} tone="primary" />
          <Stat label="Obligations" value={String(form.obligations.length)} tone="good" />
          <Stat label="Documents" value={String(form.uploaded.length)} tone="primary" />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/businesses" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">View business registry</Link>
          <Link to="/executive" className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-semibold">Go to dashboard</Link>
        </div>
      </div>
    </DashboardShell>
  );
}
