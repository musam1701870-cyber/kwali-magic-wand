import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/kwali-hero.jpg";
import heroBg from "@/assets/kwali-hero-wide.jpg";
import { SiteNav, SiteFooter } from "@/components/site/SiteShell";
import { useEffect, useState } from "react";
import { wards } from "@/lib/kwali-mock";
import imgBusiness from "@/assets/cat-business.jpg";
import imgProperty from "@/assets/cat-property.jpg";
import imgMarket from "@/assets/cat-market.jpg";
import imgTransport from "@/assets/cat-transport.jpg";
import imgHotel from "@/assets/cat-hotel.jpg";
import imgSanitation from "@/assets/cat-sanitation.jpg";
import imgPos from "@/assets/cat-pos.jpg";

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
  const [ward, setWard] = useState(wards[0]);
  const [ref, setRef] = useState("");
  const slides = [
    { img: imgProperty, tag: "Tenement Rate", title: "Houses, land & shops" },
    { img: imgBusiness, tag: "Business Permit", title: "Shops, offices & SMEs" },
    { img: imgMarket, tag: "Market Tickets", title: "Stalls & lockup shops" },
    { img: imgTransport, tag: "Transport Levy", title: "Keke, okada & buses" },
    { img: imgHotel, tag: "Hospitality Permit", title: "Hotels & event centres" },
    { img: imgSanitation, tag: "Sanitation Levy", title: "Refuse & environment" },
    { img: imgPos, tag: "POS Operator Permit", title: "POS & mobile money" },
  ];
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 3800);
    return () => clearInterval(id);
  }, [slides.length]);
  const active = slides[slide];
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <img src={heroBg} alt="" aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.18),transparent_60%)]" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
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

          {/* Quick-pay strip */}
          <form
            onSubmit={(e) => { e.preventDefault(); window.location.assign(`/auth/login?ref=${encodeURIComponent(ref)}&ward=${encodeURIComponent(ward)}`); }}
            className="mt-7 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md"
            aria-label="Quick pay or verify a bill"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="Ward"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white outline-none ring-gold/40 focus:ring-2"
              >
                {wards.map((w) => <option key={w} value={w} className="text-ink">{w}</option>)}
              </select>
              <input
                aria-label="Bill or receipt reference"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Enter bill / receipt ref (e.g. KWL-REF-2026-00481)"
                className="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/60 outline-none ring-gold/40 focus:ring-2"
              />
              <button className="rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-gold-foreground transition hover:-translate-y-0.5 hover:opacity-95">
                Quick pay →
              </button>
            </div>
            <div className="mt-2 text-[11px] text-white/70">No reference? <Link to="/auth/signup" className="underline">Create an account</Link> to generate one.</div>
          </form>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth/signup"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-lg hover:opacity-95"
            >
              Register as a taxpayer →
            </Link>
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sign in to pay
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gold/20 blur-2xl" aria-hidden />
          {/* Category slider */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            {slides.map((s, i) => (
              <img key={s.tag} src={s.img} alt={s.title}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === slide ? "opacity-100" : "opacity-0"}`}
                loading={i === 0 ? "eager" : "lazy"} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" /> {active.tag}
            </div>
            <div className="absolute bottom-16 left-5 right-5 text-white">
              <div className="font-display text-2xl font-bold drop-shadow-md">{active.title}</div>
              <div className="mt-1 text-xs text-white/80">Register, get billed, pay — all in one place.</div>
            </div>
            <div className="absolute bottom-4 left-5 flex gap-1.5">
              {slides.map((s, i) => (
                <button key={s.tag} aria-label={`Show ${s.tag}`} onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-gold" : "w-1.5 bg-white/50 hover:bg-white"}`} />
              ))}
            </div>
          </div>

          {/* Floating stats card */}
          <div className="absolute -bottom-10 -left-4 hidden w-[280px] rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)] sm:block md:-left-10">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <div className="flex gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-[11px] font-semibold text-ink">Kwali Revenue Portal</div>
              <div className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-secondary/40 p-2">
                <div className="font-display text-base font-extrabold text-primary">35,000+</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Properties</div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-2">
                <div className="font-display text-base font-extrabold text-primary">19,000+</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Businesses</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link to="/auth/signup" className="rounded-md bg-primary py-1.5 text-center text-[11px] font-bold text-primary-foreground hover:opacity-95">Generate Bill</Link>
              <Link to="/auth/login" className="rounded-md bg-gold py-1.5 text-center text-[11px] font-bold text-gold-foreground hover:opacity-95">Pay Now</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Council stats band ----------
function StatsBand() {
  const stats = [
    { v: "₦1.42B", l: "Collected YTD 2026", sub: "Verified revenue" },
    { v: "12,480", l: "Registered taxpayers", sub: "Active accounts" },
    { v: "94%", l: "Compliance rate", sub: "Across 10 wards" },
    { v: "10", l: "Wards covered", sub: "Full FCT coverage" },
  ];
  return (
    <section className="relative overflow-hidden border-y border-border bg-card">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.06),transparent_70%)]" aria-hidden />
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.l} className={`relative flex flex-col items-center px-6 py-10 text-center ${i > 0 ? '' : ''}`}>
            <div className="font-display text-4xl font-extrabold text-primary md:text-5xl">{s.v}</div>
            <div className="mt-2 text-sm font-bold text-ink">{s.l}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
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
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            How it works
          </span>
          <h2 className="mt-4 text-4xl font-bold text-ink">Pay in 4 easy steps</h2>
          <p className="mt-4 text-muted-foreground">
            Designed for residents, business owners and transport operators across Kwali's 10 wards.
          </p>
        </div>
        <ol className="relative mt-14 grid gap-6 md:grid-cols-4">
          {/* connector line on desktop */}
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" aria-hidden />
          {steps.map((s) => (
            <li
              key={s.n}
              className="group relative rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-sm font-extrabold text-primary-foreground shadow-sm">
                {s.n}
              </div>
              <h3 className="text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const features = [
  { img: imgBusiness, t: "Shops & Offices", d: "Yearly business permit for shops, offices and SMEs across Kwali." },
  { img: imgProperty, t: "Houses & Land", d: "Annual tenement rates and ground rent for residential or commercial property." },
  { img: imgMarket, t: "Market Stalls", d: "Daily market tickets, stall allocation and lockup shop fees." },
  { img: imgTransport, t: "Keke, Okada & Buses", d: "₦100 daily ticket plus QR sticker for tricycles, bikes and buses." },
  { img: imgHotel, t: "Hotels & Event Centres", d: "Operating permits for hotels, lodges, lounges and event halls." },
  { img: imgSanitation, t: "Waste & Sanitation", d: "Monthly refuse pickup enrolment and environmental compliance fees." },
  { img: imgPos, t: "POS & Mobile Money", d: "Annual operator permit for POS agents and mobile-money kiosks." },
];

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Revenue categories
            </span>
            <h2 className="mt-4 text-4xl font-bold text-ink">
              Every council levy in one portal
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Choose a category to register or pay — plain-English descriptions so you know exactly what each fee covers.</p>
          </div>
          <Link to="/services" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            See all services <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <Link
              to="/auth/signup"
              key={f.t}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={f.img} alt={f.t} loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">Revenue stream</div>
                  <div className="font-display text-base font-bold text-white">{f.t}</div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <p className="text-sm text-muted-foreground">{f.d}</p>
                <span className="shrink-0 text-sm font-semibold text-primary opacity-0 transition group-hover:opacity-100">→</span>
              </div>
            </Link>
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
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Services
          </span>
          <h2 className="mt-4 text-4xl font-bold text-ink">Council fee categories</h2>
          <p className="mt-3 text-muted-foreground">All levies and permits handled through one secure portal.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.t} className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-elegant)]">
              <h3 className="text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-foreground">
                  {s.price}
                </span>
                <Link to="/auth/signup" className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition group-hover:opacity-100 hover:underline">
                  Pay now <span aria-hidden>→</span>
                </Link>
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
          <Link
            to="/auth/signup"
            className="inline-flex items-center rounded-md bg-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-lg transition hover:-translate-y-0.5 hover:opacity-95"
          >
            Create an account →
          </Link>
          <Link
            to="/auth/login"
            className="inline-flex items-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Sign in
          </Link>
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
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            FAQ
          </span>
          <h2 className="mt-4 text-4xl font-bold text-ink">Frequently asked questions</h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map(([q, a]) => (
            <details
              key={q}
              className="group rounded-2xl border border-border bg-card p-6 transition open:shadow-[var(--shadow-card)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-bold text-muted-foreground transition group-open:rotate-45 group-open:border-primary/30 group-open:bg-primary/8 group-open:text-primary">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReceiptLookup() {
  return (
    <section id="verify" className="bg-surface py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Verify a receipt</p>
        <h2 className="mt-3 text-3xl font-bold text-ink">Confirm any KURCMS payment</h2>
        <p className="mt-3 text-muted-foreground">
          Enter a receipt reference (e.g. <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">KWL-REF-2026-00481</code>) or scan the QR on the receipt.
        </p>
        <form className="mx-auto mt-6 flex max-w-xl overflow-hidden rounded-full border border-border bg-card shadow-[var(--shadow-card)]" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Enter receipt reference" className="flex-1 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-muted-foreground" />
          <button type="submit" className="bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-95">Verify</button>
        </form>
      </div>
    </section>
  );
}

const accountTypes = [
  { icon: "🏠", title: "Resident / Property Owner", desc: "Register your home or land, get a tenement assessment and pay annual rates plus monthly sanitation levy.", perks: ["Tenement rate billing", "Sanitation pickup enrolment", "Multiple properties on one dashboard"] },
  { icon: "🏢", title: "Business Owner", desc: "Register your shop, office or SME with CAC details and pay your annual business premises permit.", perks: ["Business premises permit", "Signage & advert levies", "Compliance certificate"] },
  { icon: "🛵", title: "Transport Operator", desc: "Onboard your tricycle, motorbike or commercial vehicle and pay daily route permits in seconds.", perks: ["Daily ₦100 ticket", "QR sticker for windshield", "Offline verifiable receipts"] },
];

function AccountTypes() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Get started
          </span>
          <h2 className="mt-4 text-4xl font-bold text-ink">Choose your account type</h2>
          <p className="mt-3 text-muted-foreground">Pick the role that fits — you can add more profiles later from your dashboard.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {accountTypes.map((a) => (
            <div key={a.title} className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl shadow-sm">{a.icon}</div>
              <h3 className="mt-5 text-lg font-bold text-ink">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {a.perks.map((p) => (
                  <li key={p} className="flex gap-2 text-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /><span>{p}</span></li>
                ))}
              </ul>
              <Link to="/auth/signup" className="mt-6 inline-flex w-fit items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95">Create account <span aria-hidden>→</span></Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { initials: "MA", name: "Mallam Abubakar", role: "Landlord, Kwali Town", body: "I used to travel to the council secretariat just to pay my tenement rate. Now I do it from my phone in minutes and the receipt downloads instantly." },
  { initials: "BO", name: "Blessing Ogaji", role: "Shop owner, Yangoji", body: "Renewing my business premises permit on KURCMS took less than five minutes. The compliance certificate is accepted on the spot during inspections." },
  { initials: "SI", name: "Sani Idris", role: "Tricycle operator, Kilankwa", body: "₦100 a day, paid by USSD, QR sticker on the windshield — no more arguments with task force officers. The scanner shows I'm compliant." },
];

function Testimonials() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            What residents say
          </span>
          <h2 className="mt-4 text-4xl font-bold text-ink">Trusted by Kwali property, business & transport owners</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]">
              <div className="flex gap-0.5 text-gold">{'★'.repeat(5)}</div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">&ldquo;{t.body}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">{t.initials}</div>
                <div>
                  <div className="text-sm font-bold text-ink">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const notices = [
  { tag: "Urgent", tagColor: "bg-red-100 text-red-700", date: "2026 Assessment Year", title: "2026 Tenement, Business & Sanitation Levy now open", body: "All property owners, businesses and transport operators across Kwali's 10 wards are required to complete their 2026 assessment. Register or sign in to generate your bill and pay online." },
  { tag: "Deadline", tagColor: "bg-amber-100 text-amber-700", date: "Dec 31, 2026", title: "10% surcharge after the deadline", body: "Payments received after December 31, 2026 will attract a 10% late-payment surcharge on the outstanding amount. Pay early to remain compliant." },
  { tag: "New", tagColor: "bg-emerald-100 text-emerald-700", date: "Now live", title: "GPS property mapping rolled out across all wards", body: "Every property registered on KURCMS is now geo-tagged. Ward officers validate your assessment on the map, and enforcement uses GPS for accurate routing." },
];

function Notices() {
  return (
    <section id="notices" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Council notices
          </span>
          <h2 className="mt-4 text-4xl font-bold text-ink">Important announcements</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {notices.map((n) => (
            <article key={n.title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${n.tagColor}`}>{n.tag}</span>
                <span className="text-xs text-muted-foreground">{n.date}</span>
              </div>
              <h3 className="mt-4 text-base font-bold leading-snug text-ink">{n.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
              <Link to="/auth/signup" className="mt-5 flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Read more <span aria-hidden>→</span>
              </Link>
            </article>
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
        <StatsBand />
        <ReceiptLookup />
        <Features />
        <Transport />
        <AccountTypes />
        <Testimonials />
        <Notices />
        <CTA />
        <FAQ />
      </main>
      <SiteFooter />
    </div>
  );
}
