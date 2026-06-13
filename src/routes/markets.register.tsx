import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { markets, tradeTypes, marketZoneNames, wards, assetTypes } from "@/lib/kwali-mock";
import type { AssetType } from "@/lib/kwali-mock";
import { LevyEducation } from "@/components/ui/LevyEducation";
import {
  UserPlus,
  CheckCircle2,
  ArrowLeft,
  Download,
  QrCode,
  Copy,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/markets/register")({
  head: () => ({ meta: [{ title: "Register Trader — Kwali Market System" }] }),
  component: RegisterTraderPage,
});

type FormState = {
  name: string;
  phone: string;
  nin: string;
  gender: string;
  ward: string;
  village: string;
  marketId: string;
  tradeType: string;
  zone: string;
  category: string;
  assetType: AssetType;
  emergencyContact: string;
  emergencyPhone: string;
  passType: string;
};

const blank: FormState = {
  name: "", phone: "", nin: "", gender: "", ward: "", village: "",
  marketId: "", tradeType: "", zone: "", category: "C", assetType: "None / Market Trader Only",
  emergencyContact: "", emergencyPhone: "", passType: "Daily",
};

function QRPlaceholder({ traderId }: { traderId: string }) {
  // Simple deterministic "QR-like" visual
  const seed = traderId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <div className="grid h-28 w-28 grid-cols-7 gap-[1px] rounded-md bg-ink p-2">
      {Array.from({ length: 49 }).map((_, i) => {
        const on = ((i * 37 + seed) % 7) < 3 || i < 7 || i >= 42 || i % 7 === 0 || i % 7 === 6;
        return <div key={i} className={`rounded-[1px] ${on ? "bg-gold" : "bg-transparent"}`} />;
      })}
    </div>
  );
}

function TraderCard({ traderId, name, tradeType, market, assetType }: { traderId: string; name: string; tradeType: string; market: string; assetType?: string }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-primary shadow-[var(--shadow-elegant)]" style={{ width: 280 }}>
      {/* Card header */}
      <div className="flex items-center gap-3 bg-primary px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">{initials}</div>
        <div className="text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-white/70">Kwali Area Council</div>
          <div className="text-sm font-bold">Digital Market ID</div>
        </div>
      </div>
      {/* Card body */}
      <div className="flex items-center gap-4 bg-card px-4 py-4">
        <QRPlaceholder traderId={traderId} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trader Name</div>
          <div className="mt-0.5 text-base font-bold text-ink">{name}</div>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trade</div>
          <div className="text-xs font-semibold text-foreground">{tradeType}</div>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Market</div>
          <div className="text-xs font-semibold text-foreground">{market}</div>
          {assetType && assetType !== "None / Market Trader Only" && (
            <>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assets</div>
              <div className="text-xs font-semibold text-foreground">{assetType}</div>
            </>
          )}
          <div className="mt-3 rounded-md bg-primary/8 px-2 py-1 text-center">
            <div className="font-mono text-xs font-bold text-primary">{traderId}</div>
          </div>
        </div>
      </div>
      {/* Card footer */}
      <div className="flex items-center justify-between bg-secondary/50 px-4 py-2">
        <div className="text-[9px] text-muted-foreground">KSRP · Kwali Smart Revenue Platform</div>
        <div className="text-[9px] font-bold text-primary">2026</div>
      </div>
    </div>
  );
}

function RegisterTraderPage() {
  const [form, setForm] = useState<FormState>(blank);
  const [step, setStep] = useState<"form" | "success">("form");
  const [traderId, setTraderId] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid = form.name && form.phone && form.gender && form.ward && form.marketId && form.tradeType && form.zone && form.category && form.assetType;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const n = Math.floor(100000 + Math.random() * 899999);
    setTraderId(`KWL-TRD-${String(n).padStart(6, "0")}`);
    setStep("success");
  };

  const copy = () => {
    navigator.clipboard.writeText(traderId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedMarket = markets.find((m) => m.id === form.marketId);

  return (
    <DashboardShell
      title="Register Trader"
      subtitle="Markets"
      actions={
        <Link to="/markets" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to Markets
        </Link>
      }
    >
      {step === "form" ? (
        <div className="mx-auto max-w-3xl">
          {/* Education panel */}
          <div className="mb-6">
            <LevyEducation category="market" />
          </div>

          {/* Header */}
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Trader Registration Form</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Register a new trader to generate their unique Trader ID and Digital Market ID card.
                  Collect only essential details — takes under 1 minute.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Personal Info */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Personal Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-ink">Full Name <span className="text-destructive">*</span></label>
                  <input value={form.name} onChange={set("name")} required placeholder="e.g. Mary Yakubu"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">Phone Number <span className="text-destructive">*</span></label>
                  <input value={form.phone} onChange={set("phone")} required placeholder="0803-441-2210" type="tel"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">NIN <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
                  <input value={form.nin} onChange={set("nin")} placeholder="12345678901"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">Gender <span className="text-destructive">*</span></label>
                  <select value={form.gender} onChange={set("gender")} required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2">
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">Ward <span className="text-destructive">*</span></label>
                  <select value={form.ward} onChange={set("ward")} required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2">
                    <option value="">Select ward</option>
                    {wards.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-ink">Village / Area <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
                  <input value={form.village} onChange={set("village")} placeholder="e.g. Pai, Yebu, Kilankwa"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2" />
                </div>
              </div>
            </div>

            {/* Market & Trade Info */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Market & Trade Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-ink">Market <span className="text-destructive">*</span></label>
                  <select value={form.marketId} onChange={set("marketId")} required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2">
                    <option value="">Select market</option>
                    {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">Type of Goods Sold <span className="text-destructive">*</span></label>
                  <select value={form.tradeType} onChange={set("tradeType")} required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2">
                    <option value="">Select trade type</option>
                    {tradeTypes.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">Usual Trading Zone <span className="text-destructive">*</span></label>
                  <select value={form.zone} onChange={set("zone")} required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2">
                    <option value="">Select zone</option>
                    {marketZoneNames.map((z) => <option key={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">Trader Category <span className="text-destructive">*</span></label>
                  <select value={form.category} onChange={set("category")} required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2">
                    <option value="C">Category C — Small trader (₦100/day)</option>
                    <option value="B">Category B — Medium trader (₦200/day)</option>
                    <option value="A">Category A — Large trader (₦300/day)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">A = Rice, Electronics, Building Materials · B = Fashion, Foodstuff · C = Vegetables, Tomatoes</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-ink">Assets / Business Type <span className="text-destructive">*</span></label>
                  <select value={form.assetType} onChange={set("assetType")} required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2">
                    <option value="">Select asset type</option>
                    {assetTypes.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">Physical/business assets owned or operated by the trader. Select "None" if market trader only.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">Preferred Pass Type</label>
                  <select value={form.passType} onChange={set("passType")}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2">
                    <option value="Daily">Daily Ticket (pay every market day)</option>
                    <option value="Monthly">Monthly Pass (₦2,000 · no daily stress)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Emergency Contact <span className="font-normal normal-case text-muted-foreground">(optional)</span></h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-ink">Contact Name</label>
                  <input value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="Next of kin or guarantor"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink">Contact Phone</label>
                  <input value={form.emergencyPhone} onChange={set("emergencyPhone")} placeholder="0814-220-9981" type="tel"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="text-destructive">*</span> Required fields · Trader ID generated instantly on submit
              </p>
              <button type="submit" disabled={!valid}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-40">
                <UserPlus className="h-4 w-4" />
                Register & Generate ID
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ── Success screen ── */
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            <div>
              <h2 className="font-display text-lg font-bold text-emerald-800">Trader Registered Successfully!</h2>
              <p className="mt-1 text-sm text-emerald-700">
                <strong>{form.name}</strong> has been registered. Their Digital Market ID has been generated below.
                Print or share the QR card with the trader.
              </p>
            </div>
          </div>

          {/* Trader ID */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trader ID</div>
                <div className="mt-1 font-mono text-2xl font-bold text-primary">{traderId}</div>
                <div className="mt-1 text-sm text-muted-foreground">{form.marketId ? selectedMarket?.name : ""} · {form.tradeType}</div>
              </div>
              <button onClick={copy}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold transition hover:bg-secondary">
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy ID"}
              </button>
            </div>
          </div>

          {/* QR Card preview */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <h3 className="font-display text-base font-bold text-ink">Digital Market ID Card</h3>
              <span className="ml-auto text-xs text-muted-foreground">Print or share with trader</span>
            </div>
            <div className="flex justify-center">
              <TraderCard
                traderId={traderId}
                name={form.name}
                tradeType={form.tradeType || "—"}
                market={selectedMarket?.name ?? "—"}
                assetType={form.assetType}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Registration Summary</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ["Name", form.name], ["Phone", form.phone],
                ["Gender", form.gender], ["Ward", form.ward],
                ["Market", selectedMarket?.name ?? "—"], ["Trade Type", form.tradeType],
                ["Zone", form.zone], ["Category", `Category ${form.category}`],
                ["Assets", form.assetType], ["Pass Type", form.passType],
                ["NIN", form.nin || "Not provided"], ["Village", form.village || "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex flex-col">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{l}</dt>
                  <dd className="font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setForm(blank); setStep("form"); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              <UserPlus className="h-4 w-4" />
              Register another trader
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
              <Download className="h-4 w-4" />
              Print ID card
            </button>
            <Link to="/markets/traders" className="flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
              <Users className="h-4 w-4" />
              View trader list
            </Link>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
