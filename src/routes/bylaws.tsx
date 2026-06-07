import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";
import { bylaws } from "@/lib/kwali-mock";

export const Route = createFileRoute("/bylaws")({
  head: () => ({
    meta: [
      { title: "Council Bylaws & Regulations — Kwali Area Council" },
      { name: "description", content: "Browse the council bylaws governing tenement, sanitation, motor parks, advertisement, market regulation and more across Kwali." },
    ],
  }),
  component: BylawsPage,
});

function BylawsPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Council bylaws & regulations" subtitle="The full set of bylaws empowering the council to assess, collect and enforce rates and permits." />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bylaws.map((b) => (
            <a
              key={b}
              href="#"
              className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold text-ink shadow-[var(--shadow-card)] hover:border-primary"
            >
              <span>{b}</span>
              <span className="text-gold transition group-hover:translate-x-1">→</span>
            </a>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Bylaws are published under the Kwali Area Council Enabling Law. Updated copies are available at the council secretariat.
        </p>
      </section>
    </SiteShell>
  );
}
