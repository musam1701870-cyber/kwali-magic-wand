import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteShell, PageHeader } from "@/shared/components/layout/SiteShell";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/(public)/contact")({
  head: () => ({
    meta: [
      { title: "Contact Kwali Area Council" },
      {
        name: "description",
        content:
          "Reach the Kwali Area Council revenue office, lodge complaints, or get support for KURCMS payments and receipts.",
      },
    ],
  }),
  component: ContactPage,
});

const SUBJECTS = [
  "Payment issue",
  "Property assessment",
  "Transport ticket",
  "Sanitation complaint",
  "Other",
] as const;

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("Payment issue");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    const ticket = `KWL-SUP-${Math.floor(Math.random() * 9000 + 1000)}`;
    setSent(ticket);
    toast.success("Message sent", { description: `Ticket ${ticket} — we'll reply to ${email}` });
    setName("");
    setEmail("");
    setMessage("");
    setSubject("Payment issue");
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Contact"
        title="We're here to help"
        subtitle="Lodge a complaint, request a refund or talk to the revenue office."
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
        {sent ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-[var(--shadow-card)]">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <div>
              <h2 className="font-display text-xl font-bold text-emerald-800">Message received</h2>
              <p className="mt-2 text-sm text-emerald-700">
                Your support ticket <span className="font-mono font-bold">{sent}</span> has been
                logged. The revenue office typically responds within one working day.
              </p>
            </div>
            <button
              onClick={() => setSent(null)}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]"
          >
            <div>
              <label className="text-sm font-semibold text-ink">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Aisha Mohammed"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as typeof subject)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Tell us what's going on…"
              />
            </div>
            <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
              Send message
            </button>
          </form>
        )}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              Address
            </div>
            <p className="mt-2 text-foreground">
              Council Secretariat
              <br />
              Kwali Area Council, FCT, Nigeria
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              Phone & email
            </div>
            <p className="mt-2 text-foreground">
              <a href="tel:+2348000000000" className="hover:text-primary">
                +234 800 000 0000
              </a>
              <br />
              <a href="mailto:support@kwali.gov.ng" className="hover:text-primary">
                support@kwali.gov.ng
              </a>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              Office hours
            </div>
            <p className="mt-2 text-foreground">
              Mon – Fri · 8:00 AM – 4:00 PM
              <br />
              Sat · 9:00 AM – 1:00 PM
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
