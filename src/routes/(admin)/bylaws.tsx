import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHeader } from "@/shared/components/layout/SiteShell";
import { bylaws } from "@/shared/lib/kwali-mock";

export const Route = createFileRoute("/(admin)/bylaws")({
  head: () => ({
    meta: [
      { title: "Council Bylaws & Regulations — Kwali Area Council" },
      {
        name: "description",
        content:
          "Browse the council bylaws governing tenement, sanitation, motor parks, advertisement, market regulation and more across Kwali.",
      },
    ],
  }),
  component: BylawsPage,
});

function BylawsPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Legal"
        title="Council bylaws & regulations"
        subtitle="The full set of bylaws empowering the council to assess, collect and enforce rates and permits."
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bylaws.map((b) => (
            <details
              key={b}
              className="group rounded-xl border border-border bg-card px-5 py-4 text-sm shadow-[var(--shadow-card)] open:border-primary"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink">
                <span>{b}</span>
                <span className="text-gold transition group-open:rotate-90">→</span>
              </summary>
              <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                The {b} is made under the Kwali Area Council Enabling Law, empowering the council to
                assess, levy and enforce the associated rates, permits and penalties. It sets out
                obligations for taxpayers, assessment procedures, applicable fees and the
                enforcement and appeals process. A certified copy is available on request at the
                council secretariat.
              </p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Bylaws are published under the Kwali Area Council Enabling Law. Updated copies are
          available at the council secretariat.
        </p>
      </section>
    </SiteShell>
  );
}
