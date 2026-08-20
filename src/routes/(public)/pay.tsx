import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Copy,
  Loader2,
  MapPin,
  Phone,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { SiteShell } from "@/shared/components/layout/SiteShell";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import {
  createPaymentReference,
  formatNaira,
  lookupObligations,
  type LookupResult,
  type Obligation,
  type PaymentReference,
} from "@/shared/lib/public-pay";
import { CHANNELS, councilBank, councilUssd, type ChannelKey } from "@/shared/lib/payment-channels";

// The flagship flow: pay a council levy with no account, no app and no login.
//
// Designed for the hardest case first — a market trader on a small screen, on
// mobile data, who knows her Trader ID and her own phone number and nothing else.
// That constraint drives everything here: three short steps, one decision per
// screen, large tap targets, and no jargon.
//
// Security lives on the server. This page cannot read the database (RLS gives
// anonymous callers nothing) and cannot set a price: it posts an ID to
// /api/public/lookup and /api/public/pay-reference, which re-derive the amount
// from the taxpayer's registration every time.

export const Route = createFileRoute("/(public)/pay")({
  // A scanned QR arrives as /pay?id=<opaque token>, which needs no phone check
  // because holding the token is itself the proof.
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Make a payment — Kwali Area Council" },
      {
        name: "description",
        content:
          "Pay your Kwali Area Council levy with your taxpayer ID. No account needed — get an official receipt you can verify.",
      },
    ],
  }),
  component: PayPage,
});

type Step = "identify" | "choose" | "reference";

function PayPage() {
  const { id: scannedId } = Route.useSearch();

  const [step, setStep] = useState<Step>("identify");
  const [idInput, setIdInput] = useState(scannedId ?? "");
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [found, setFound] = useState<Extract<LookupResult, { found: true }> | null>(null);
  const [channel, setChannel] = useState<ChannelKey>("transfer");
  const [reference, setReference] = useState<Extract<PaymentReference, { ok: true }> | null>(null);

  // A QR token identifies the payer on its own, so skip straight past the
  // phone-number challenge when we arrive from a scan.
  const runLookup = useCallback(async (id: string, phoneLast4?: string) => {
    setBusy(true);
    setNotFound(false);
    const result = await lookupObligations(id.trim(), phoneLast4?.trim() || undefined);
    setBusy(false);
    if (!result.found) {
      setNotFound(true);
      setFound(null);
      return;
    }
    setFound(result);
    setStep("choose");
  }, []);

  useEffect(() => {
    if (scannedId) void runLookup(scannedId);
    // Only on arrival with a scanned token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedId]);

  const unpaid = (found?.obligations ?? []).filter((o) => !o.paid);
  const settled = (found?.obligations ?? []).filter((o) => o.paid);

  async function raiseReference(o: Obligation) {
    setBusy(true);
    const result = await createPaymentReference({
      id: idInput.trim() || (scannedId ?? ""),
      challenge: challenge.trim() || undefined,
      revenueType: o.revenueType,
      channel: channel === "cash" ? "cash" : channel,
    });
    setBusy(false);

    if (!result.ok) {
      toast.error(
        result.error === "no_open_obligation"
          ? "That levy has already been settled."
          : "Could not create a payment reference. Please try again.",
      );
      return;
    }
    setReference(result);
    setStep("reference");
  }

  function restart() {
    setStep("identify");
    setFound(null);
    setReference(null);
    setChallenge("");
    setIdInput("");
    setNotFound(false);
  }

  return (
    <SiteShell>
      {/* Compact hero — the page is a task, not a brochure. */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-3xl px-5 py-10 text-primary-foreground sm:px-6 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            No account needed
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Make a payment
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
            Enter your taxpayer ID to see exactly what you owe, pay it, and get an official receipt
            you can verify at any time.
          </p>
          <Stepper step={step} />
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        {step === "identify" && (
          <IdentifyStep
            idInput={idInput}
            setIdInput={setIdInput}
            challenge={challenge}
            setChallenge={setChallenge}
            busy={busy}
            notFound={notFound}
            onSubmit={() => void runLookup(idInput, challenge)}
          />
        )}

        {step === "choose" && found && (
          <ChooseStep
            found={found}
            unpaid={unpaid}
            settled={settled}
            channel={channel}
            setChannel={setChannel}
            busy={busy}
            onBack={restart}
            onPick={(o) => void raiseReference(o)}
          />
        )}

        {step === "reference" && reference && (
          <ReferenceStep reference={reference} channel={channel} onDone={restart} />
        )}
      </div>
    </SiteShell>
  );
}

/* ---------------------------------------------------------------- stepper -- */

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "identify", label: "Find your bill" },
    { key: "choose", label: "Choose what to pay" },
    { key: "reference", label: "Pay & get receipt" },
  ];
  const index = steps.findIndex((s) => s.key === step);

  return (
    <ol className="mt-7 flex items-center gap-2 text-[11px] font-semibold sm:text-xs">
      {steps.map((s, i) => {
        const state = i < index ? "done" : i === index ? "current" : "todo";
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span
              className={
                "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] " +
                (state === "done"
                  ? "border-gold bg-gold text-gold-foreground"
                  : state === "current"
                    ? "border-white bg-white text-primary"
                    : "border-white/35 text-white/70")
              }
            >
              {state === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={state === "todo" ? "hidden text-white/60 sm:inline" : "text-white"}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="hidden h-px flex-1 bg-white/25 sm:block" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------------------------------------- step one -- */

function IdentifyStep({
  idInput,
  setIdInput,
  challenge,
  setChallenge,
  busy,
  notFound,
  onSubmit,
}: {
  idInput: string;
  setIdInput: (v: string) => void;
  challenge: string;
  setChallenge: (v: string) => void;
  busy: boolean;
  notFound: boolean;
  onSubmit: () => void;
}) {
  const ready = idInput.trim().length >= 4 && challenge.replace(/\D/g, "").length === 4;

  return (
    <form
      className="surface-card p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy) onSubmit();
      }}
    >
      <h2 className="font-display text-lg font-bold text-ink">Find your bill</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your ID is on your registration slip, ID card or sticker.
      </p>

      <label className="mt-6 block">
        <span className="text-xs font-semibold text-ink">Taxpayer ID</span>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="KWL-TRD-2026-001234"
            aria-label="Taxpayer ID"
            className="w-full rounded-xl border border-input bg-background py-3.5 pl-10 pr-3 font-mono text-base tracking-wide text-ink outline-none transition focus:border-primary"
          />
        </div>
        <span className="mt-1.5 block text-[11px] text-muted-foreground">
          Spaces and dashes don't matter.
        </span>
      </label>

      <label className="mt-5 block">
        <span className="text-xs font-semibold text-ink">Last 4 digits of your phone number</span>
        <div className="relative mt-2">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={challenge}
            onChange={(e) => setChallenge(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="1234"
            aria-label="Last 4 digits of your phone number"
            className="w-full rounded-xl border border-input bg-background py-3.5 pl-10 pr-3 font-mono text-base tracking-[0.3em] text-ink outline-none transition focus:border-primary"
          />
        </div>
        <span className="mt-1.5 block text-[11px] text-muted-foreground">
          This confirms the bill is yours — the phone number you registered with.
        </span>
      </label>

      {notFound && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive"
        >
          <span className="font-semibold">We couldn't match that.</span> Check the ID and the last 4
          digits of your registered phone number, then try again. If it still fails, visit any Kwali
          revenue office or ask a marshal for help.
        </div>
      )}

      <button
        type="submit"
        disabled={!ready || busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground transition hover:opacity-95 disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Checking…
          </>
        ) : (
          <>
            Show what I owe <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <span>
          Have a QR code on your ID card or sticker? Scan it with your phone camera and it opens
          this page already filled in — no phone digits needed.
        </span>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Checking a receipt instead?{" "}
        <Link to="/verify" className="font-semibold text-primary hover:underline">
          Verify a receipt
        </Link>
      </p>
    </form>
  );
}

/* --------------------------------------------------------------- step two -- */

function ChooseStep({
  found,
  unpaid,
  settled,
  channel,
  setChannel,
  busy,
  onBack,
  onPick,
}: {
  found: Extract<LookupResult, { found: true }>;
  unpaid: Obligation[];
  settled: Obligation[];
  channel: ChannelKey;
  setChannel: (c: ChannelKey) => void;
  busy: boolean;
  onBack: () => void;
  onPick: (o: Obligation) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Who we matched — enough to recognise yourself, masked so a guessed ID
          cannot be used to harvest names. */}
      <div className="surface-card p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-bold leading-tight text-ink">{found.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{found.entityLabel}</span>
              {found.ward && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {found.ward} ward
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">{found.lookupId}</span>
              <StatusBadge status={found.status} />
            </div>
          </div>
        </div>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Not you? Start again
        </button>
      </div>

      {/* How to pay — chosen before the amount so the reference is issued for
          the right channel first time. */}
      <div className="surface-card p-5">
        <h2 className="font-display text-base font-bold text-ink">How do you want to pay?</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {CHANNELS.map((c) => {
            const selected = channel === c.key;
            const Icon = c.key === "transfer" ? Banknote : c.key === "ussd" ? Smartphone : Receipt;
            return (
              <button
                key={c.key}
                onClick={() => setChannel(c.key)}
                aria-pressed={selected}
                className={
                  "rounded-xl border p-3 text-left transition " +
                  (selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40")
                }
              >
                <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                <div className="mt-2 text-sm font-semibold text-ink">{c.title}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {c.blurb}
                </div>
                {!c.configured && (
                  <div className="mt-1.5 text-[10px] font-semibold text-warning-foreground">
                    Not yet available
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* What's owed */}
      <div className="surface-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">What you owe</h2>
          <p className="text-xs text-muted-foreground">
            Amounts come from your registration — tap one to pay it.
          </p>
        </div>

        {unpaid.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <div className="font-semibold text-ink">Nothing outstanding</div>
            <p className="text-sm text-muted-foreground">
              Every levy on this ID is settled. Thank you.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {unpaid.map((o) => (
              <li key={`${o.revenueType}-${o.period}`}>
                <button
                  disabled={busy}
                  onClick={() => onPick(o)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-secondary/40 disabled:opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink">{o.label}</div>
                    <div className="text-xs text-muted-foreground">{o.periodLabel}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold text-ink">
                      {formatNaira(o.amount)}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {settled.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Already paid
            </div>
            <ul className="mt-2 space-y-2">
              {settled.map((o) => (
                <li
                  key={`${o.revenueType}-${o.period}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {o.label} · {o.periodLabel}
                  </span>
                  {o.receiptNo && (
                    <Link
                      to="/verify/$token"
                      params={{ token: o.receiptNo }}
                      className="font-mono text-[11px] font-semibold text-primary hover:underline"
                    >
                      {o.receiptNo}
                    </Link>
                  )}
                  <StatusBadge status="paid" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- step three -- */

function ReferenceStep({
  reference,
  channel,
  onDone,
}: {
  reference: Extract<PaymentReference, { ok: true }>;
  channel: ChannelKey;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference.paymentRef);
      setCopied(true);
      toast.success("Reference copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — please write the reference down.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border bg-secondary/40 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Amount to pay
          </div>
          <div className="mt-1 font-display text-4xl font-bold text-primary">
            {formatNaira(reference.amount)}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {reference.label} · {reference.periodLabel}
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="text-xs font-semibold text-ink">Your payment reference</div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 break-all rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-3 font-mono text-base font-bold tracking-wide text-primary">
              {reference.paymentRef}
            </code>
            <button
              onClick={() => void copy()}
              aria-label="Copy reference"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border transition hover:bg-secondary"
            >
              {copied ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Copy className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Quote this reference when you pay. Write it down if you can't copy it.
          </p>

          <Instructions channel={channel} reference={reference.paymentRef} />

          {/* The honest part: nothing has been received yet. */}
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/12 px-4 py-3 text-[11px] leading-relaxed text-warning-foreground">
            <Receipt className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <span className="font-bold">Not paid yet.</span> Your official receipt is issued the
              moment the council confirms your money. Keep this reference — you'll use it to collect
              or check the receipt.
            </span>
          </div>
        </div>
      </div>

      <div className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Already paid and want to check your receipt?
        </div>
        <div className="flex gap-2">
          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"
          >
            <BadgeCheck className="h-4 w-4" /> Verify a receipt
          </Link>
          <button
            onClick={onDone}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          >
            Pay something else
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Channel instructions. Bank and USSD details are configuration, never hardcoded
 * here — printing a wrong account number would send real money to the wrong
 * place, so an unconfigured channel says so instead of guessing.
 */
function Instructions({ channel, reference }: { channel: ChannelKey; reference: string }) {
  if (channel === "transfer") {
    return (
      <div className="mt-5">
        <div className="text-xs font-semibold text-ink">Pay by bank transfer</div>
        {councilBank ? (
          <dl className="mt-2 divide-y divide-border rounded-xl border border-border">
            <Row label="Bank" value={councilBank.bankName} />
            <Row label="Account name" value={councilBank.accountName} />
            <Row label="Account number" value={councilBank.accountNumber} mono />
            <Row label="Narration / remark" value={reference} mono />
          </dl>
        ) : (
          <NotConfigured what="Bank transfer details have not been published yet." />
        )}
      </div>
    );
  }

  if (channel === "ussd") {
    return (
      <div className="mt-5">
        <div className="text-xs font-semibold text-ink">Pay by USSD</div>
        {councilUssd ? (
          <ol className="mt-2 space-y-2 rounded-xl border border-border p-4 text-sm text-muted-foreground">
            <li>
              Dial{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono font-bold text-ink">
                {councilUssd}
              </code>{" "}
              on the phone you registered.
            </li>
            <li>Choose "Pay council levy".</li>
            <li>
              Enter your reference{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-ink">
                {reference}
              </code>
              .
            </li>
            <li>Confirm the amount and enter your PIN.</li>
          </ol>
        ) : (
          <NotConfigured what="The council USSD code is not live yet." />
        )}
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="text-xs font-semibold text-ink">Pay cash to an agent</div>
      <ol className="mt-2 space-y-2 rounded-xl border border-border p-4 text-sm text-muted-foreground">
        <li>Show this reference to a council marshal, revenue officer or registered café agent.</li>
        <li>Pay the amount shown above.</li>
        <li>
          They record it against your reference and your official receipt is issued immediately —
          ask them to show it to you.
        </li>
      </ol>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`text-right text-sm font-semibold text-ink ${mono ? "font-mono tracking-wide" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function NotConfigured({ what }: { what: string }) {
  return (
    <div className="mt-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
      {what} Take your reference to any Kwali Area Council revenue office, or pay a council marshal
      or registered agent — your receipt is issued the same way.
    </div>
  );
}
