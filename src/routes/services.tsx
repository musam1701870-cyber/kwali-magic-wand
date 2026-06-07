import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";
import { feeCategories } from "@/lib/kwali-mock";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Fee Categories — Kwali Revenue Portal" },
      { name: "description", content: "All Kwali Area Council fee categories — tenement, business, sanitation, transport, advertisement, environmental." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Services" title="All council fee categories" subtitle="Pick the levy that applies to you. Each category links to a payment flow with auto-assessment." />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {feeCategories.map((s) => (
            <div key={s.code} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  {s.code}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">{s.price}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.desc}</p>
              <Link to="/dashboard" className="mt-5 inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
                Pay this fee →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
