import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { wards } from "@/lib/kwali-mock";

export const Route = createFileRoute("/gis")({
  head: () => ({ meta: [{ title: "GIS Revenue Map — KARCIP" }] }),
  component: GisPage,
});

const layers = ["Properties","Businesses","Markets","Hotels","Filling Stations","POS Operators","Motorcycles","Tricycles","Vehicles","Compliance heat"] as const;

function GisPage() {
  return (
    <DashboardShell title="GIS Revenue Map" subtitle="Interactive map of Kwali Area Council">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="font-display text-sm font-bold text-ink">Map layers</div>
          <ul className="mt-3 space-y-2 text-sm">
            {layers.map((l) => (
              <li key={l} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary">
                <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-primary" /><span className="text-ink">{l}</span></label>
                <span className="text-[10px] text-muted-foreground">{Math.floor(Math.random()*900+50)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 font-display text-sm font-bold text-ink">Wards</div>
          <ul className="mt-2 space-y-1 text-xs">
            {wards.map((w) => (
              <li key={w}><label className="flex items-center gap-2 text-ink"><input type="checkbox" defaultChecked className="accent-primary" />{w}</label></li>
            ))}
          </ul>
        </div>

        <div className="relative h-[560px] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="absolute inset-0" style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 30%)," +
              "radial-gradient(circle at 70% 60%, color-mix(in oklab, var(--gold) 30%, transparent), transparent 25%)," +
              "linear-gradient(180deg, color-mix(in oklab, var(--surface) 80%, transparent), var(--surface))",
            backgroundSize: "cover",
          }}>
            <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#g)" />
            </svg>
            {/* random pins */}
            {Array.from({ length: 28 }).map((_, i) => {
              const x = (i * 137) % 90 + 5;
              const y = (i * 91) % 80 + 8;
              const t = i % 3;
              const color = t === 0 ? "bg-primary" : t === 1 ? "bg-gold" : "bg-destructive";
              return (
                <div key={i} className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${color} ring-4 ring-white/40`}
                  style={{ left: `${x}%`, top: `${y}%` }} />
              );
            })}
            <div className="absolute bottom-4 left-4 rounded-lg bg-card/90 p-3 text-xs shadow-[var(--shadow-card)] backdrop-blur">
              <div className="font-bold text-ink">Legend</div>
              <div className="mt-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /> Compliant</div>
              <div className="mt-1 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gold" /> Partial</div>
              <div className="mt-1 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-destructive" /> Defaulting</div>
            </div>
            <div className="absolute right-4 top-4 rounded-lg bg-card/90 p-3 text-xs shadow-[var(--shadow-card)] backdrop-blur">
              <div className="font-bold text-ink">Kwali Area Council</div>
              <div className="text-muted-foreground">10 wards · 8,920 properties</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
