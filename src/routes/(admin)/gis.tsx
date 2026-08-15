import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { wards } from "@/shared/lib/kwali-mock";

export const Route = createFileRoute("/(admin)/gis")({
  head: () => ({ meta: [{ title: "GIS Revenue Map — KARCIP" }] }),
  component: GisPage,
});

const layers = [
  "Properties",
  "Businesses",
  "Markets",
  "Hotels",
  "Filling Stations",
  "POS Operators",
  "Motorcycles",
  "Tricycles",
  "Vehicles",
  "Compliance heat",
] as const;
type Layer = (typeof layers)[number];

// Deterministic pseudo-count per layer — stable across SSR + client (no Math.random in render).
function layerCount(l: Layer) {
  let h = 0;
  for (let i = 0; i < l.length; i++) h = (h * 31 + l.charCodeAt(i)) % 100000;
  return (h % 900) + 50;
}

// Deterministic pin set — each pin belongs to a layer + ward + compliance status.
const PINS = Array.from({ length: 40 }).map((_, i) => {
  const x = ((i * 137) % 90) + 5;
  const y = ((i * 91) % 80) + 8;
  const status = i % 3; // 0 compliant, 1 partial, 2 defaulting
  const layer = layers[i % layers.length];
  const ward = wards[i % wards.length];
  return { i, x, y, status, layer, ward };
});

function GisPage() {
  const [activeLayers, setActiveLayers] = useState<Set<Layer>>(new Set(layers));
  const [activeWards, setActiveWards] = useState<Set<string>>(new Set(wards));
  const [hover, setHover] = useState<(typeof PINS)[number] | null>(null);

  const toggleLayer = (l: Layer) =>
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  const toggleWard = (w: string) =>
    setActiveWards((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });

  const visiblePins = useMemo(
    () => PINS.filter((p) => activeLayers.has(p.layer) && activeWards.has(p.ward)),
    [activeLayers, activeWards],
  );

  return (
    <DashboardShell
      title="GIS Revenue Map"
      subtitle="Interactive map of Kwali Area Council — toggle layers and wards to filter"
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div className="font-display text-sm font-bold text-ink">Map layers</div>
            <button
              onClick={() =>
                setActiveLayers((prev) =>
                  prev.size === layers.length ? new Set() : new Set(layers),
                )
              }
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              {activeLayers.size === layers.length ? "Clear all" : "Select all"}
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {layers.map((l) => (
              <li
                key={l}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activeLayers.has(l)}
                    onChange={() => toggleLayer(l)}
                    className="accent-primary"
                  />
                  <span className="text-ink">{l}</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{layerCount(l)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 font-display text-sm font-bold text-ink">Wards</div>
          <ul className="mt-2 space-y-1 text-xs">
            {wards.map((w) => (
              <li key={w}>
                <label className="flex items-center gap-2 text-ink">
                  <input
                    type="checkbox"
                    checked={activeWards.has(w)}
                    onChange={() => toggleWard(w)}
                    className="accent-primary"
                  />
                  {w}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative h-[560px] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 40%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 30%)," +
                "radial-gradient(circle at 70% 60%, color-mix(in oklab, var(--gold) 30%, transparent), transparent 25%)," +
                "linear-gradient(180deg, color-mix(in oklab, var(--surface) 80%, transparent), var(--surface))",
              backgroundSize: "cover",
            }}
          >
            <svg
              className="absolute inset-0 h-full w-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#g)" />
            </svg>

            {visiblePins.map((p) => {
              const color =
                p.status === 0 ? "bg-primary" : p.status === 1 ? "bg-gold" : "bg-destructive";
              return (
                <button
                  key={p.i}
                  onMouseEnter={() => setHover(p)}
                  onMouseLeave={() => setHover((h) => (h?.i === p.i ? null : h))}
                  className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${color} ring-4 ring-white/40 transition hover:scale-150 hover:ring-white/70`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  aria-label={`${p.layer} in ${p.ward}`}
                />
              );
            })}

            {hover && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg"
                style={{ left: `${hover.x}%`, top: `${hover.y - 2}%` }}
              >
                <div className="font-bold">{hover.layer}</div>
                <div className="text-white/70">
                  {hover.ward} ward ·{" "}
                  {hover.status === 0 ? "Compliant" : hover.status === 1 ? "Partial" : "Defaulting"}
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 rounded-lg bg-card/90 p-3 text-xs shadow-[var(--shadow-card)] backdrop-blur">
              <div className="font-bold text-ink">Legend</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" /> Compliant
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gold" /> Partial
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive" /> Defaulting
              </div>
            </div>
            <div className="absolute right-4 top-4 rounded-lg bg-card/90 p-3 text-xs shadow-[var(--shadow-card)] backdrop-blur">
              <div className="font-bold text-ink">Kwali Area Council</div>
              <div className="text-muted-foreground">
                {visiblePins.length} of {PINS.length} points shown
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
