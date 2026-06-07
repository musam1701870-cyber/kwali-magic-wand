import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Kwali Area Council" },
      { name: "description", content: "Reach the Kwali Area Council revenue office, lodge complaints, or get support for KURCMS payments and receipts." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Contact" title="We're here to help" subtitle="Lodge a complaint, request a refund or talk to the revenue office." />
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div>
            <label className="text-sm font-semibold text-ink">Full name</label>
            <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Aisha Mohammed" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Email</label>
            <input type="email" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Subject</label>
            <select className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option>Payment issue</option>
              <option>Property assessment</option>
              <option>Transport ticket</option>
              <option>Sanitation complaint</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Message</label>
            <textarea rows={5} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Tell us what's going on…" />
          </div>
          <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
            Send message
          </button>
        </form>
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Address</div>
            <p className="mt-2 text-foreground">Council Secretariat<br/>Kwali Area Council, FCT, Nigeria</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Phone & email</div>
            <p className="mt-2 text-foreground">+234 800 000 0000<br/>support@kwali.gov.ng</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Office hours</div>
            <p className="mt-2 text-foreground">Mon – Fri · 8:00 AM – 4:00 PM<br/>Sat · 9:00 AM – 1:00 PM</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
