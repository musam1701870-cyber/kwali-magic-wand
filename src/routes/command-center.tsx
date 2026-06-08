import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { wardRevenue, sourceMix, markets, monthlyTrend } from "@/lib/kwali-mock";

export const Route = createFileRoute("/command-center")({
  head: () => ({ meta: [{ title: "Revenue Command Center — KARCIP" }] }),
  component: CommandCenterPage,
});

const fmt = (n: number) => "₦" + n.toLocaleString();

function CommandCenterPage() {
  return (
    <DashboardShell title="Revenue Command Center" subtitle="Real-time monitoring across wards, sources and officers">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue by ward">
          <ul className="divide-y divide-border">
            {wardRevenue.map((w) => (
              <li key={w.ward} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-ink">{w.ward}</div>
                  <div className="text-xs text-muted-foreground">Compliance {w.compliance}%</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{fmt(w.collected)}</div>
                  <div className="text-[11px] text-muted-foreground">of {fmt(w.expected)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Revenue by source">
          <ul className="space-y-3">
            {sourceMix.map((s) => (
              <li key={s.name}>
                <div className="flex justify-between text-sm font-semibold text-ink"><span>{s.name}</span><span>{s.value}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-gradient-to-r from-primary to-gold" style={{ width: `${s.value * 3}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Revenue by market">
          <ul className="divide-y divide-border">
            {markets.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-semibold text-ink">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.traders} traders · {m.ward}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{fmt(m.collected)}</div>
                  <div className="text-[11px] text-muted-foreground">Target {fmt(m.dailyTarget)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Top collecting officers">
          <ul className="divide-y divide-border">
            {[
              { name: "Ofc. Adamu", ward: "Yangoji", amount: 412000 },
              { name: "Ofc. Bello", ward: "Kwali", amount: 388000 },
              { name: "Ofc. Halima", ward: "Pai", amount: 301000 },
              { name: "Ofc. Yusuf", ward: "Dafa", amount: 254000 },
              { name: "Ofc. Sarah", ward: "Kilankwa", amount: 192000 },
            ].map((o) => (
              <li key={o.name} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-semibold text-ink">{o.name}</div>
                  <div className="text-xs text-muted-foreground">Ward {o.ward}</div>
                </div>
                <div className="font-bold text-primary">{fmt(o.amount)}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-6" title="Year-to-date trend">
        <div className="flex h-40 items-end gap-3">
          {monthlyTrend.map((m) => (
            <div key={m.m} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-gradient-to-t from-primary to-gold" style={{ height: `${(m.v / 11000) * 100}%` }} />
              <div className="text-[11px] font-semibold text-muted-foreground">{m.m}</div>
            </div>
          ))}
        </div>
      </Panel>
    </DashboardShell>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] ${className}`}>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
