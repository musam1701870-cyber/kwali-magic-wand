import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";

export const Route = createFileRoute("/sanitation")({
  head: () => ({
    meta: [
      { title: "Sanitation Levy & Environmental Compliance — Kwali" },
      { name: "description", content: "Monthly refuse collection, commercial waste permits and environmental compliance certificates for Kwali residents and businesses." },
    ],
  }),
  component: SanitationPage,
});

const benefits = [
  { i: "🚛", t: "Scheduled refuse collection", d: "Door-to-door pickup twice a week in your ward." },
  { i: "♻️", t: "Recycling drop-off points", d: "Plastics, glass and metals diverted from landfill." },
  { i: "🌳", t: "Cleaner public spaces", d: "Markets, motor parks and roadsides kept clean." },
  { i: "🛡️", t: "Disease prevention", d: "Vector control and drainage maintenance." },
];

const penalties = [
  { t: "Late payment", d: "10% surcharge after the monthly deadline." },
  { t: "Illegal dumping", d: "₦25,000 fine and clean-up cost." },
  { t: "No commercial waste permit", d: "₦50,000 fine and possible closure." },
];

function SanitationPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Environment" title="Sanitation levy & compliance" subtitle="Pay your monthly sanitation fee and obtain commercial waste and environmental compliance permits." />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Residential</div>
            <div className="mt-2 font-display text-4xl font-bold text-primary">₦500<span className="text-sm text-muted-foreground">/mo</span></div>
            <p className="mt-3 text-sm text-muted-foreground">Per household, includes door-to-door refuse collection.</p>
          </div>
          <div className="rounded-2xl border-2 border-primary bg-card p-6 text-center shadow-[var(--shadow-elegant)]">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">SME</div>
            <div className="mt-2 font-display text-4xl font-bold text-primary">₦2,000<span className="text-sm text-muted-foreground">/mo</span></div>
            <p className="mt-3 text-sm text-muted-foreground">Shops, kiosks and small businesses under 50sqm.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Commercial</div>
            <div className="mt-2 font-display text-4xl font-bold text-primary">₦8,000<span className="text-sm text-muted-foreground">/mo</span></div>
            <p className="mt-3 text-sm text-muted-foreground">Hotels, factories and large commercial premises.</p>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">What you get</h2>
            <div className="mt-4 space-y-3">
              {benefits.map((b) => (
                <div key={b.t} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-xl">{b.i}</div>
                  <div>
                    <div className="font-semibold text-ink">{b.t}</div>
                    <div className="text-sm text-muted-foreground">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Penalties for non-compliance</h2>
            <div className="mt-4 space-y-3">
              {penalties.map((p) => (
                <div key={p.t} className="rounded-xl border-l-4 border-destructive bg-destructive/5 p-4">
                  <div className="font-semibold text-ink">{p.t}</div>
                  <div className="text-sm text-muted-foreground">{p.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
