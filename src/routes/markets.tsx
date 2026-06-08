import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { markets } from "@/lib/kwali-mock";

export const Route = createFileRoute("/markets")({
  head: () => ({ meta: [{ title: "Market Management — KARCIP" }] }),
  component: MarketsPage,
});

const fmt = (n: number) => "₦" + n.toLocaleString();

function MarketsPage() {
  return (
    <DashboardShell title="Market Management" subtitle="Markets, traders, stalls, daily tickets, compliance and analytics"
      actions={<button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">+ Register market</button>}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {markets.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{m.ward}</div>
            <div className="mt-1 font-display text-lg font-bold text-ink">{m.name}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-muted-foreground">Traders</div><div className="font-bold text-ink">{m.traders}</div></div>
              <div><div className="text-muted-foreground">Stalls</div><div className="font-bold text-ink">{m.stalls}</div></div>
              <div><div className="text-muted-foreground">Target</div><div className="font-bold text-ink">{fmt(m.dailyTarget)}</div></div>
              <div><div className="text-muted-foreground">Collected</div><div className="font-bold text-primary">{fmt(m.collected)}</div></div>
            </div>
            <div className="mt-3"><div className="h-1.5 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${m.compliance}%` }} /></div></div>
            <div className="mt-1 text-[11px] text-muted-foreground">Compliance {m.compliance}%</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-bold text-ink">Issue daily ticket</h2>
        <p className="text-sm text-muted-foreground">Mock — generate a market trader ticket with QR.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            {markets.map((m) => <option key={m.id}>{m.name}</option>)}
          </select>
          <input placeholder="Trader name" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Stall / Hawker" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option>Daily ticket ₦200</option><option>Lockup shop ₦500</option><option>Open space ₦150</option><option>Hawker ₦100</option>
          </select>
        </div>
        <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Generate ticket & receipt</button>
      </div>
    </DashboardShell>
  );
}
