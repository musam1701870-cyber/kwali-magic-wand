import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/kwali-hero.jpg";
import crest from "@/assets/kwali-crest.png";
import { SiteNav, SiteFooter } from "@/components/site/SiteShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kwali Area Council — Pay Tenement, Business & Transport Levies Online" },
      {
        name: "description",
        content:
          "KURCMS — the Kwali Unified Revenue & Compliance Management System. Register, get your bill, pay online and receive an instant digital receipt for tenement, business, sanitation and transport levies.",
      },
      { property: "og:title", content: "Kwali Area Council Revenue Portal" },
      { property: "og:description", content: "Pay your Kwali council levies online in minutes." },
      { property: "og:image", content: heroImg },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: KwaliLanding,
});

// Local Nav replaced by shared SiteNav

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
        <div className="text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Official Council Portal
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] md:text-6xl">
            Pay your Kwali council levies <span className="text-gold">in minutes</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            Tenement, business, sanitation and transport revenues — one portal, one receipt.
            Register your property or vehicle, get an automatic bill, and pay securely with Paystack.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#register"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-lg hover:opacity-95"
            >
              Generate my bill →
            </a>
            <a
              href="#verify"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Verify a receipt
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-6 text-white">
            {[
              ["₦100", "Daily transport ticket"],
              ["4 steps", "Register → Pay → Receipt"],
              ["24/7", "Online & mobile"],
            ].map(([k, v]) => (
              <div key={v}>
                <dt className="font-display text-2xl font-bold text-gold">{k}</dt>
                <dd className="text-xs uppercase tracking-wider text-white/70">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gold/20 blur-2xl" aria-hidden />
          <img
            src={heroImg}
            alt="Aerial view of Kwali town"
            className="relative h-full w-full rounded-2xl border border-white/20 object-cover shadow-2xl"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", t: "Register", d: "Create an account with your phone, NIN or CAC number. Add your property, business or vehicle." },
  { n: "02", t: "Get your bill", d: "We auto-assess your tenement, business, sanitation or transport rate and generate an RRR reference." },
  { n: "03", t: "Pay online", d: "Pay securely with Paystack — card, transfer or USSD. Idempotent, no double charges." },
  { n: "04", t: "Get receipt", d: "Download your e-receipt with QR code. Enforcement officers verify it offline." },
];

function Steps() {
  return (
    <section id="how-it-works" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-3 text-4xl font-bold text-ink">Pay in 4 easy steps</h2>
          <p className="mt-4 text-muted-foreground">
            Designed for residents, business owners and transport operators across Kwali's 10 wards.
          </p>
        </div>
        <ol className="mt-14 grid gap-6 md:grid-cols-4">
          {steps.map((s) => (
            <li
              key={s.n}
              className="group relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="font-display text-5xl font-extrabold text-gold/50 group-hover:text-gold">
                {s.n}
              </div>
              <h3 className="mt-2 text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const features = [
  { i: "📍", t: "GPS Property Tracking", d: "Tag every property and business on a map for accurate assessment." },
  { i: "🔒", t: "Secure Paystack Payments", d: "PCI-compliant card, transfer and USSD with idempotency protection." },
  { i: "🧾", t: "Instant Bills & Receipts", d: "Auto-generated RRR bills and QR-signed digital receipts." },
  { i: "📊", t: "Compliance Dashboard", d: "See revenue, defaulters and ward-level heatmaps in real time." },
  { i: "🛵", t: "Transport QR Stickers", d: "Daily tickets and route permits for okada, keke and commercial vehicles." },
  { i: "📱", t: "Works on Any Device", d: "Responsive web portal plus an offline-capable enforcement mobile app." },
];

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
            <h2 className="mt-3 text-4xl font-bold text-ink">
              Built for Kwali residents, businesses & operators
            </h2>
          </div>
          <a href="#services" className="text-sm font-semibold text-primary hover:underline">
            See all services →
          </a>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.t}
              className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] transition hover:border-primary/40"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-2xl">
                {f.i}
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const services = [
  { t: "Tenement Rate", d: "Annual property rate for residential and commercial buildings.", price: "From ₦5,000/yr" },
  { t: "Business Premises", d: "Annual permit for shops, offices and SMEs operating in Kwali.", price: "From ₦10,000/yr" },
  { t: "Sanitation Levy", d: "Monthly refuse collection and environmental compliance.", price: "From ₦500/mo" },
  { t: "Tricycle Daily Ticket", d: "Daily route permit with QR-coded windshield sticker.", price: "₦100/day" },
  { t: "Motorbike Permit", d: "Annual okada registration plus daily compliance ticket.", price: "₦100/day" },
  { t: "Commercial Vehicle", d: "Loading bay and route permits for buses and trucks.", price: "Tiered" },
];

function Services() {
  return (
    <section id="services" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Services</p>
          <h2 className="mt-3 text-4xl font-bold text-ink">Council fee categories</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.t} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.d}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-foreground">
                  {s.price}
                </span>
                <a href="#register" className="text-sm font-semibold text-primary hover:underline">
                  Pay →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Transport() {
  return (
    <section id="transport" className="py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            New in KURCMS
          </p>
          <h2 className="mt-3 text-4xl font-bold text-ink">
            Transport ticketing, QR stickers & mobile enforcement
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every motorcycle, tricycle and commercial vehicle in Kwali gets a QR-coded sticker.
            Operators pay ₦100/day in seconds via USSD or app. Enforcement officers verify
            compliance on the road — even offline.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Daily ticket purchase via app, USSD or agent",
              "Tamper-evident QR sticker linked to plate number",
              "Offline-capable enforcement scanner with sync-on-connect",
              "Fines and warnings issued and tracked digitally",
            ].map((x) => (
              <li key={x} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                <span className="text-foreground">{x}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/40 p-6 text-center">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-xl bg-ink text-gold">
              <svg viewBox="0 0 100 100" className="h-24 w-24" aria-hidden>
                <rect x="0" y="0" width="100" height="100" fill="currentColor" opacity="0" />
                {Array.from({ length: 81 }).map((_, i) => {
                  const x = (i % 9) * 11 + 1;
                  const y = Math.floor(i / 9) * 11 + 1;
                  const fill = (i * 37) % 5 < 2;
                  return fill ? <rect key={i} x={x} y={y} width="10" height="10" fill="currentColor" /> : null;
                })}
              </svg>
            </div>
            <div className="mt-4 font-display text-lg font-bold text-ink">KWL-TRC-2026-0481</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Tricycle · Valid today
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              ● Compliant
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="register" className="px-6 py-20">
      <div
        className="mx-auto max-w-6xl overflow-hidden rounded-3xl p-12 text-center text-primary-foreground md:p-16"
        style={{ background: "var(--gradient-hero)" }}
      >
        <h2 className="font-display text-3xl font-bold md:text-5xl">
          Ready to pay your Kwali levies?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/85">
          Join thousands of property owners, businesses and transport operators paying with KURCMS.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#"
            className="inline-flex items-center rounded-md bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:opacity-95"
          >
            Create an account
          </a>
          <a
            href="#"
            className="inline-flex items-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Sign in
          </a>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  ["Who needs to pay tenement rate?", "Every property owner in Kwali — residential or commercial — is required to pay an annual tenement rate based on the property's assessed value."],
  ["How does the daily transport ticket work?", "Operators pay ₦100/day per tricycle or motorbike. A QR-coded sticker is issued and verified by enforcement officers on patrol."],
  ["Is online payment secure?", "Yes. Payments are processed by Paystack with PCI-DSS compliance and idempotency tokens to prevent duplicate charges."],
  ["Can I verify a receipt?", "Yes. Anyone can verify a receipt by scanning its QR code or entering the reference number on our Verify page."],
];

function FAQ() {
  return (
    <section id="faq" className="bg-surface py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</p>
          <h2 className="mt-3 text-4xl font-bold text-ink">Frequently asked questions</h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map(([q, a]) => (
            <details
              key={q}
              className="group rounded-2xl border border-border bg-card p-6 open:shadow-[var(--shadow-card)]"
            >
              <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-ink">
                {q}
                <span className="ml-4 text-gold transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function KwaliLanding() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <Hero />
        <Steps />
        <Features />
        <Services />
        <Transport />
        <CTA />
        <FAQ />
      </main>
      <SiteFooter />
    </div>
  );
}
