import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { vehicles } from "@/lib/kwali-mock";
import { LevyEducation } from "@/components/ui/LevyEducation";

export const Route = createFileRoute("/transport")({
  head: () => ({ meta: [{ title: "Transport Ticketing — Kwali Revenue Portal" }] }),
  component: TransportPage,
});

function QrPlaceholder({ value }: { value: string }) {
  // Deterministic QR-looking pattern based on string hash
  let h = 0;
  for (const c of value) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 text-ink">
      <rect x="0" y="0" width="100" height="100" fill="white" />
      {Array.from({ length: 100 }).map((_, i) => {
        const x = (i % 10) * 10;
        const y = Math.floor(i / 10) * 10;
        const on = (((h >> (i % 31)) ^ i * 7) & 3) === 0;
        return on ? <rect key={i} x={x} y={y} width="10" height="10" fill="currentColor" /> : null;
      })}
      {/* finders */}
      <rect x="0" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="70" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="0" y="70" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
    </svg>
  );
}

function TransportPage() {
  const [type, setType] = useState<"Tricycle" | "Motorbike" | "Commercial">("Tricycle");
  const [days, setDays] = useState(1);
  const [issued, setIssued] = useState<{ ref: string; plate: string; type: string; days: number } | null>(null);
  const [plate, setPlate] = useState("KWL-T-2481");

  const dailyRates = { Tricycle: 100, Motorbike: 100, Commercial: 500 };
  const total = dailyRates[type] * days;

  return (
    <DashboardShell title="Transport ticketing" subtitle="Buy daily tickets, manage QR stickers and view active permits.">
      <div className="mb-6">
        <LevyEducation category="transport" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Buy ticket */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-ink">Buy a daily ticket</h2>
          <p className="text-sm text-muted-foreground">Issues a QR-coded permit linked to the plate number.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {(["Tricycle", "Motorbike", "Commercial"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={"rounded-xl border p-4 text-left transition " + (type === t ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}
              >
                <div className="text-2xl">{t === "Tricycle" ? "🛺" : t === "Motorbike" ? "🏍️" : "🚌"}</div>
                <div className="mt-2 font-semibold text-ink">{t}</div>
                <div className="text-xs text-muted-foreground">₦{dailyRates[t]}/day</div>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink">Plate / vehicle number</label>
              <input value={plate} onChange={(e) => setPlate(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Number of days</label>
              <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value)))} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-secondary/40 p-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Total</div>
              <div className="font-display text-2xl font-bold text-primary">₦{total.toLocaleString()}</div>
            </div>
            <button
              onClick={() => setIssued({ ref: `KWL-${type.slice(0, 3).toUpperCase()}-2026-${Math.floor(Math.random() * 9000 + 1000)}`, plate, type, days })}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Pay & issue ticket
            </button>
          </div>

          {issued && (
            <div className="mt-6 rounded-2xl border-2 border-primary/40 bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-primary">Active ticket</div>
                  <div className="mt-1 font-display text-xl font-bold text-ink">{issued.ref}</div>
                  <div className="text-sm text-muted-foreground">{issued.type} · {issued.plate} · {issued.days} day{issued.days > 1 ? "s" : ""}</div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">● Compliant</div>
                </div>
                <QrPlaceholder value={issued.ref} />
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Print sticker</button>
                <button className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Send via SMS</button>
              </div>
            </div>
          )}
        </div>

        {/* My vehicles */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Registered vehicles</h2>
          <div className="mt-4 space-y-3">
            {vehicles.map((v) => (
              <div key={v.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-ink">{v.plate}</div>
                  <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (v.active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                    {v.active ? "Ticket active" : "No ticket"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{v.type} · {v.operator}</div>
                <div className="text-xs text-muted-foreground">Ward {v.ward} · ₦{v.daily}/day</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
