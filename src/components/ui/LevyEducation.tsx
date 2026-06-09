/**
 * LevyEducation — contextual legal/education panels shown at point of registration.
 * Each panel is tailored to the specific category (property, business, market, transport).
 */
import { useState } from "react";
import { BookOpen, Scale, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Info, Landmark } from "lucide-react";

type Category = "property" | "business" | "market" | "transport";

type FAQ = { q: string; a: string };

type EducationContent = {
  heading: string;
  tagline: string;
  law: string;
  lawDetail: string;
  whoPaysBullets: string[];
  rateSummary: string;
  rateDetail: string;
  penalties: string[];
  exemptions: string[];
  faqs: FAQ[];
};

const content: Record<Category, EducationContent> = {
  property: {
    heading: "Why you pay Tenement Rate",
    tagline: "A legal obligation on every occupied property in Kwali Area Council",
    law: "Constitution of Nigeria (Section 7(5) & Fourth Schedule, Para 1(f)) + Kwali Area Council Tenement Rate Bye-Law",
    lawDetail:
      "Under the 1999 Constitution of Nigeria (as amended), local government authorities — including FCT Area Councils like Kwali — are granted the exclusive authority to assess and levy rates on privately owned houses and tenements. The Kwali Area Council Tenement Rate Bye-Law further mandates the appointment of Valuation Officers, defines the assessment metrics, sets penalty schedules, and prescribes the exact rate applicable within the council's jurisdiction.",
    whoPaysBullets: [
      "Tenanted property — the tenant (occupier) pays.",
      "Owner-occupied property — the landlord/owner pays.",
      "Vacant / undeveloped land — exempt (no building, no levy).",
      "Review your lease: some agreements shift liability to the landlord.",
    ],
    rateSummary: "Rate = Annual Rental Value (ARV) × 4%",
    rateDetail:
      "A Kwali Area Council Valuation Officer determines your property's Annual Rental Value (ARV) — the realistic open-market annual rent for the property. The council then applies a standard rate of 4 kobo per Naira (4%) of the ARV. Example: ARV ₦1,500,000 × 4% = ₦60,000 annual tenement rate.",
    penalties: [
      "Late-payment penalty interest accrues daily after the demand notice deadline.",
      "Revenue Task Force may seal the property until the debt is cleared.",
      "Council may file at Magistrate/Revenue Court to distrain (seize & sell) goods to recover the debt.",
    ],
    exemptions: [
      "Places of public worship (churches, mosques)",
      "Public burial grounds and cemeteries",
      "Registered non-profit charity homes / orphanages",
      "Official traditional palaces of recognised Kwali rulers",
      "Federal/State government buildings used exclusively for public utility",
      "Completely vacant, unoccupied buildings",
    ],
    faqs: [
      { q: "Is Tenement Rate the same as Ground Rent?", a: "No. Ground Rent is paid to the federal government (AGIS/FCDA) for the lease of the land itself. Tenement Rate is a separate municipal tax paid to Kwali Area Council for the developed, occupied structure. Both can apply simultaneously." },
      { q: "Can I challenge my assessment?", a: "Yes. File a formal Notice of Objection with the Head of the Valuation Unit at the Kwali Area Council Secretariat. Note: you must deposit 50% of the disputed rate upfront before your objection can be formally heard." },
      { q: "How do I verify a legitimate collector?", a: "Never pay cash to any field agent. All payments must be made via bank transfer or KURCMS. Always demand an official automated receipt bearing the council stamp and treasury signature." },
    ],
  },

  business: {
    heading: "Why you pay Business Premises Levy",
    tagline: "A statutory requirement for every commercial operation within Kwali Area Council",
    law: "Kwali Area Council Business Premises Regulation Bye-Law + FCT Act (Cap 503, LFN 2004)",
    lawDetail:
      "The Kwali Area Council Business Premises Regulation Bye-Law requires every person or corporate body operating a commercial premises within the council's jurisdiction to obtain an annual Business Premises Permit. This is distinct from your CAC registration (federal) — the council levy covers municipal services: roads, sanitation infrastructure, market supervision, and enforcement.",
    whoPaysBullets: [
      "Every shop, office, warehouse, or commercial space operator must pay.",
      "Corporate bodies (Ltd, BN) and sole traders are both liable.",
      "Mobile businesses (POS agents, hawkers) require a separate Mobile Trader Permit.",
      "Hotels, filling stations, event centres, and clinics have category-specific rates.",
    ],
    rateSummary: "Rate is tiered by business category and annual turnover band",
    rateDetail:
      "Kwali Area Council classifies businesses into categories (Retail, Hospitality, Industrial, Professional Services, etc.). Each category has a fixed annual levy set by the council. For example: small retail shop from ₦10,000/yr; hotel from ₦75,000/qtr; filling station from ₦250,000/yr. Rates are reviewed annually by the Revenue Director.",
    penalties: [
      "Operating without a valid permit: immediate sealing of premises.",
      "10% surcharge on unpaid levy after the December 31 deadline.",
      "Repeat non-compliance leads to a Revenue Court summons and criminal charges under the Bye-Law.",
    ],
    exemptions: [
      "Non-profit registered charities with CAMA exemption certificates",
      "Government-owned businesses operated strictly for public utility",
      "Religious organizations operating solely for worship (not commercial ancillaries)",
    ],
    faqs: [
      { q: "Do I still need this if I already registered with CAC?", a: "Yes. CAC registration is federal and only establishes your business as a legal entity. The Business Premises Permit is a local government levy for operating within Kwali's jurisdiction. Both are required." },
      { q: "What if I operate from home?", a: "Home-based businesses that receive clients or store commercial inventory are still subject to a reduced Home Office Levy. Purely online businesses with no physical footprint may apply for an exemption review." },
      { q: "What is included in the permit fee?", a: "Your permit fee contributes to road maintenance within the market/commercial zones, waste collection from business premises, council enforcement and inspection, and fire and environmental safety oversight." },
    ],
  },

  market: {
    heading: "Why traders pay Market Levies",
    tagline: "Market daily tickets and trader permits are backed by the Kwali Market Regulation Bye-Law",
    law: "Kwali Area Council Market Regulation Bye-Law + Fourth Schedule Para 1(f) of the 1999 Constitution",
    lawDetail:
      "The Kwali Area Council Market Regulation Bye-Law grants the council the authority to collect daily market tickets and trader registration fees from every person engaged in trade within any of its recognised markets. This includes hawkers, table-top traders, stall holders, and mobile traders. The levy funds market infrastructure, sanitation, security, waste management, and the digital trader identity system.",
    whoPaysBullets: [
      "Every trader operating in any Kwali Area Council recognised market must pay.",
      "Daily traders pay per market day (Category C ₦100, B ₦200, A ₦300).",
      "Frequent traders can subscribe to a Monthly Pass (₦2,000) to avoid daily queues.",
      "Market Association leaders are responsible for encouraging member compliance.",
    ],
    rateSummary: "Category C ₦100/day · Category B ₦200/day · Category A ₦300/day · Monthly Pass ₦2,000",
    rateDetail:
      "Traders are categorised by the scale of their trade: Category A = large traders (rice dealers, electronics, building materials), Category B = medium traders (fashion, foodstuff), Category C = small/informal traders (vegetables, tomatoes, pepper). A registered trader receives a QR-coded Digital Market ID that enforcement officers can scan to verify compliance instantly.",
    penalties: [
      "Unpaid traders may be barred from the market for the day by enforcement officers.",
      "Repeat non-payment leads to suspension of the trader's market identity card.",
      "Fines of up to ₦5,000 for traders found operating with a suspended or fake ID.",
    ],
    exemptions: [
      "Children under 15 assisting a registered parent/guardian trader",
      "Registered Physically Challenged traders (reduced rate, apply at the market office)",
    ],
    faqs: [
      { q: "Why do I need a Trader ID if I move around the market?", a: "The Kwali system tracks the person, not the location. Your QR-coded Trader ID (KWL-TRD-XXXXXX) stays with you regardless of where you trade within the market. Officers scan your card — you don't need a fixed stall." },
      { q: "What happens to my daily market fee?", a: "Market levies fund: daily market cleaning and waste disposal, security and enforcement patrols, infrastructure repairs, and the digital payment system itself. A portion also funds the Market Association welfare programme." },
      { q: "Can I pay with my phone?", a: "Yes. Pay via USSD, bank transfer, or the KURCMS app. Once paid, your Trader ID status instantly updates to 'PAID TODAY' — visible to any scanning officer." },
    ],
  },

  transport: {
    heading: "Why transport operators pay daily permits",
    tagline: "The Transport Levy is a mandatory daily route permit under the Kwali Motorcycle Uses Bye-Law",
    law: "Kwali Area Council Motorcycle Uses Bye-Law + Motor Parks Bye-Law + FCT Traffic Regulations",
    lawDetail:
      "The Kwali Area Council Motorcycle Uses Bye-Law and Motor Parks Bye-Law collectively require all commercial transport operators — including tricycles (keke), motorcycles (okada), taxis, and commercial buses — operating within or through Kwali Area Council's jurisdiction to hold a valid, current daily route permit. The permit is tied to the vehicle plate and owner identity. Enforcement officers equipped with mobile scanners verify compliance in real-time on the road.",
    whoPaysBullets: [
      "Every commercial tricycle (keke) operator must pay ₦100/day.",
      "Every commercial motorcycle (okada) operator must pay ₦100/day.",
      "Commercial vehicles (taxi, bus, truck) pay tiered rates.",
      "Annual permits are also available in addition to daily tickets.",
    ],
    rateSummary: "Tricycle/Motorbike ₦100/day · Commercial Vehicle tiered · Annual permit available",
    rateDetail:
      "Daily tickets are the primary collection mechanism. Each ticket generates a QR-coded sticker that enforcement officers scan on the road. The sticker is linked to the vehicle's plate number in the KURCMS database. Officers can verify compliance even offline — the scanner syncs when connectivity is restored.",
    penalties: [
      "Operating without a valid daily ticket: immediate fine (₦2,000 minimum).",
      "Expired or tampered QR sticker: fine of ₦5,000–₦10,000.",
      "Repeat offenders: vehicle impoundment until all outstanding fines and fees are paid.",
    ],
    exemptions: [
      "Private (non-commercial) vehicles are not subject to the daily transport levy",
      "Emergency service vehicles (ambulances, fire trucks) are fully exempt",
      "School buses operating under a registered educational institution may apply for reduced rates",
    ],
    faqs: [
      { q: "Can I pay the daily ₦100 via USSD?", a: "Yes. Dial the KURCMS USSD code, select 'Transport', enter your plate number and pay. Your compliance status updates instantly on the enforcement database." },
      { q: "What if an officer claims my paid sticker is invalid?", a: "Demand that the officer scan the QR code on your windshield sticker. The system will display your payment record including receipt number, date/time, and officer who issued it. Any discrepancy can be reported via the KURCMS helpline." },
      { q: "Do I need both an annual permit and daily tickets?", a: "The annual permit covers your vehicle registration in the system. Daily tickets cover your specific operating days. Both are required for full compliance." },
    ],
  },
};

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink"
      >
        {faq.q}
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="border-t border-border px-4 pb-3 pt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>}
    </div>
  );
}

export function LevyEducation({ category }: { category: Category }) {
  const c = content[category];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5">
      {/* Header — always visible */}
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm font-bold text-ink">{c.heading}</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">Backed by Law</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{c.tagline}</p>
          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-primary/15 bg-white/60 px-3 py-2 text-xs text-foreground/80">
            <Scale className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
            <span>{c.law}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-lg border border-primary/20 bg-white/60 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          {expanded ? "Less" : "Learn more"}
        </button>
      </div>

      {/* Rate summary pill — always visible */}
      <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
        <Info className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-semibold text-ink">{c.rateSummary}</span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-primary/15 px-5 pb-5 pt-4 space-y-5">
          {/* Law detail */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Legal Basis</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{c.lawDetail}</p>
          </div>

          {/* Who pays */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Who is liable?</span>
            </div>
            <ul className="space-y-1.5">
              {c.whoPaysBullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Rate detail */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-700">How the rate is calculated</div>
            <p className="text-sm leading-relaxed text-amber-800">{c.rateDetail}</p>
          </div>

          {/* Penalties */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Consequences of non-payment</span>
            </div>
            <ul className="space-y-1.5">
              {c.penalties.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Exemptions */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Exemptions</div>
            <ul className="space-y-1.5">
              {c.exemptions.map((e) => (
                <li key={e} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {e}
                </li>
              ))}
            </ul>
          </div>

          {/* FAQs */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Frequently Asked Questions</div>
            <div className="space-y-2">
              {c.faqs.map((faq) => <FAQItem key={faq.q} faq={faq} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
