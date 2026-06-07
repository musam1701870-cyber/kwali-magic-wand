import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Kwali Area Council — KURCMS" },
      { name: "description", content: "Kwali Area Council is one of six FCT area councils, serving 10 wards. KURCMS unifies revenue, compliance and citizen services." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="About the council" title="Kwali Area Council" subtitle="One of the six area councils of the Federal Capital Territory, serving residents and businesses across 10 wards." />
      <section className="mx-auto max-w-4xl px-6 py-16 prose prose-emerald">
        <h2 className="font-display text-2xl font-bold text-ink">Our mandate</h2>
        <p className="text-muted-foreground">
          The council is empowered by the constitution and local government enabling laws to deliver
          primary services — sanitation, primary education, primary healthcare, market regulation,
          motor-park administration, tenement assessment and revenue collection — to the people of Kwali.
        </p>
        <h2 className="mt-10 font-display text-2xl font-bold text-ink">What is KURCMS?</h2>
        <p className="text-muted-foreground">
          The Kwali Unified Revenue & Compliance Management System (KURCMS) is the council's
          digital revenue portal. It replaces paper tickets and manual ledgers with a single,
          auditable system used by residents, business owners, transport operators and enforcement officers.
        </p>
        <h2 className="mt-10 font-display text-2xl font-bold text-ink">Our 10 wards</h2>
        <ul className="grid grid-cols-2 gap-2 text-sm text-foreground md:grid-cols-3">
          {["Kwali","Yangoji","Yebu","Ashara","Dafa","Gumbo","Kilankwa","Kundu","Pai","Wako"].map((w) => (
            <li key={w} className="rounded-lg border border-border bg-card px-4 py-3">{w}</li>
          ))}
        </ul>
      </section>
    </SiteShell>
  );
}
