import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/shared/components/layout/SiteShell";
import { TaxpayerIdCard } from "@/shared/components/ui/TaxpayerIdCard";
import { QrCode, Search, Loader2, Printer } from "lucide-react";

export const Route = createFileRoute("/(public)/reprint-card")({
  head: () => ({ meta: [{ title: "Reprint your ID card — Kwali Area Council" }] }),
  component: ReprintCardPage,
});

// Public ID-card reprint. A trader or operator who misplaced their card enters
// the phone number they registered with; every card on that number comes back,
// ready to view front/back and print. No account or login needed — the phone
// is the proof, the same way the QR token is elsewhere.

type Card = {
  kind: string;
  ref: string;
  qrToken: string | null;
  name: string;
  status: string;
  issuedAt: string;
  lines: { label: string; value: string }[];
};

function ReprintCardPage() {
  const [phone, setPhone] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function find(e?: React.FormEvent) {
    e?.preventDefault();
    const p = phone.trim();
    if (p.length < 7) {
      toast.error("Enter the full phone number you registered with");
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch("/api/public/id-card-by-phone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });
      const data = (await res.json()) as { found: boolean; cards?: Card[] };
      setCards(data.cards ?? []);
      setSearched(true);
      if (!data.found) toast.info("No registered card found for that number");
    } catch {
      toast.error("Could not look up the card. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Printer className="h-3 w-3" /> Lost your card?
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
            Reprint your Taxpayer ID card
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Enter the phone number you registered with. Your card will appear below — flip it to see
            the back, then print or download it. No login needed.
          </p>
        </div>

        {/* Lookup form */}
        <form
          onSubmit={find}
          className="surface-card mx-auto mt-8 flex max-w-md flex-col gap-3 p-5 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="e.g. 0803 000 0000"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            Find my card
          </button>
        </form>

        {/* Results */}
        {searched && cards.length > 0 && (
          <div className="mt-10">
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-semibold text-ink">{cards.length}</span> card
              {cards.length === 1 ? "" : "s"} found — click <strong>Back</strong> to flip,{" "}
              <strong>Print / PDF</strong> to save or print.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-6">
              {cards.map((c) => (
                <div key={c.ref} className="space-y-2">
                  <TaxpayerIdCard
                    refNo={c.ref}
                    qrToken={c.qrToken}
                    name={c.name}
                    kind={c.kind}
                    lines={c.lines}
                    issuedAt={c.issuedAt}
                  />
                  <p className="text-center text-[11px] text-muted-foreground">
                    {c.kind} · {c.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {searched && cards.length === 0 && (
          <div className="surface-card mx-auto mt-8 max-w-md p-8 text-center">
            <QrCode className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold text-ink">No card found for that number</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Check the number and try again, or visit any Kwali Area Council revenue office with a
              valid ID for help.
            </p>
          </div>
        )}

        {/* Reassurance */}
        <p className="mx-auto mt-10 max-w-md text-center text-[11px] leading-relaxed text-muted-foreground">
          Your card's QR code only proves identity and payment standing — it never shows your phone
          number or personal details to whoever scans it.
        </p>
      </div>
    </SiteShell>
  );
}
