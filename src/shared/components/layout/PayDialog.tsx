import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Copy, Loader2, Receipt, ShieldCheck, Smartphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/shared/lib/public-pay";
import { CHANNELS, councilBank, councilUssd, type ChannelKey } from "@/shared/lib/payment-channels";
import type { RegistrationTable } from "@/shared/lib/revenue";

export type PayTarget = {
  /** The entity's public reference, shown to the payer. */
  ref: string;
  payer: string;
  category: string;
  amount: number;
  meta?: { label: string; value: string }[];
  /**
   * The registration row being paid for. When present the dialog raises a real
   * payment in the central ledger; without it there is nothing genuine to pay
   * against and the dialog sends the user to the public payment flow instead.
   */
  sourceTable?: RegistrationTable;
  sourceId?: string;
  /** Which levy this settles (defaults to the entity's main annual charge). */
  revenueType?: string;
};

/**
 * The taxpayer-facing payment dialog.
 *
 * This used to simulate a gateway with a 1100ms setTimeout: it showed a success
 * screen, offered a receipt PDF, and wrote nothing anywhere — so a citizen's
 * "payment" vanished on refresh and never reached the ledger. It now raises a
 * real PENDING payment through raise_self_payment(), which re-derives the amount
 * from the taxpayer's registration and enforces ownership in the database.
 *
 * It deliberately does NOT claim the money has arrived. With the card gateway
 * deferred, the payer gets a reference to pay against; the official receipt is
 * issued by the database the moment the council confirms the funds.
 */
export function PayDialog({
  target,
  onClose,
  onPaid,
}: {
  target: PayTarget | null;
  onClose: () => void;
  /** Fired once a reference exists, so the caller can refresh its list. */
  onPaid?: (ref: string) => void;
}) {
  const [channel, setChannel] = useState<ChannelKey>("transfer");
  const [status, setStatus] = useState<"idle" | "working" | "done">("idle");
  const [reference, setReference] = useState<{
    paymentRef: string;
    amount: number;
    label: string;
    periodLabel: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!target) return null;

  const payable = Boolean(target.sourceTable && target.sourceId);

  async function raise() {
    if (!target?.sourceTable || !target.sourceId) return;
    setStatus("working");
    const { data, error } = await supabase.rpc("raise_self_payment", {
      p_table: target.sourceTable,
      p_id: target.sourceId,
      p_revenue_type: target.revenueType ?? defaultRevenueType(target.sourceTable),
      p_channel: channel,
    });

    const result = (data ?? null) as {
      ok?: boolean;
      error?: string;
      paymentRef?: string;
      amount?: number;
      label?: string;
      periodLabel?: string;
    } | null;

    if (error || !result?.ok || !result.paymentRef) {
      setStatus("idle");
      toast.error(
        result?.error === "no_open_obligation"
          ? "This levy is already settled."
          : result?.error === "not_permitted"
            ? "This bill belongs to another account."
            : "Could not start the payment. Please try again.",
      );
      return;
    }

    setReference({
      paymentRef: result.paymentRef,
      amount: Number(result.amount ?? target.amount),
      label: result.label ?? target.category,
      periodLabel: result.periodLabel ?? "",
    });
    setStatus("done");
    onPaid?.(target.ref);
  }

  async function copyRef() {
    if (!reference) return;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="surface-card relative max-h-[90vh] w-full max-w-md overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {status === "done" ? "Payment reference ready" : "Pay this levy"}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">{target.ref}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {!payable ? (
          <NoRealBill onClose={onClose} />
        ) : status === "done" && reference ? (
          <div className="px-5 py-5">
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Amount to pay
              </div>
              <div className="font-display text-3xl font-bold text-primary">
                {formatNaira(reference.amount)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {reference.label}
                {reference.periodLabel ? ` · ${reference.periodLabel}` : ""}
              </div>
            </div>

            <div className="mt-4 text-xs font-semibold text-ink">Your payment reference</div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-3 font-mono text-sm font-bold tracking-wide text-primary">
                {reference.paymentRef}
              </code>
              <button
                onClick={() => void copyRef()}
                aria-label="Copy reference"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border transition hover:bg-secondary"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            <ChannelInstructions channel={channel} reference={reference.paymentRef} />

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/12 px-3 py-2.5 text-[11px] leading-relaxed text-warning-foreground">
              <Receipt className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-bold">Not paid yet.</span> Your official receipt appears here
                and in your payment history as soon as the council confirms the money.
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                to="/verify"
                className="flex-1 rounded-lg border border-border py-2.5 text-center text-sm font-semibold transition hover:bg-secondary"
              >
                Verify a receipt
              </Link>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4">
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Amount due
              </div>
              <div className="font-display text-3xl font-bold text-primary">
                {formatNaira(target.amount)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {target.category} · {target.payer}
              </div>
            </div>

            {target.meta && target.meta.length > 0 && (
              <dl className="mt-3 divide-y divide-border rounded-xl border border-border">
                {target.meta.map((m) => (
                  <div key={m.label} className="flex justify-between gap-3 px-3 py-2 text-xs">
                    <dt className="text-muted-foreground">{m.label}</dt>
                    <dd className="font-semibold text-ink">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-4">
              <label className="text-xs font-semibold text-ink">How do you want to pay?</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {CHANNELS.map((c) => {
                  const selected = channel === c.key;
                  const Icon =
                    c.key === "transfer" ? Banknote : c.key === "ussd" ? Smartphone : Receipt;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setChannel(c.key)}
                      aria-pressed={selected}
                      className={
                        "rounded-lg border px-2 py-2.5 text-center text-xs font-medium transition " +
                        (selected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/40")
                      }
                    >
                      <Icon className="mx-auto h-4 w-4" />
                      <span className="mt-1 block">{c.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2 text-[11px] leading-relaxed text-success">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The amount is confirmed against your registration on the council's server — never from
              this page.
            </div>

            <button
              onClick={() => void raise()}
              disabled={status === "working"}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-70"
            >
              {status === "working" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparing…
                </>
              ) : (
                <>Get payment reference</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Shown for a row that has no real registration behind it (the sample records
 * still used by some admin views). Rather than simulate a payment, point the user
 * at the flow that actually works.
 */
function NoRealBill({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-5 py-6 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Receipt className="h-6 w-6" />
      </div>
      <div className="mt-3 font-semibold text-ink">Pay with your taxpayer ID</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your ID on the payment page to see your live bill and get an official receipt.
      </p>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold transition hover:bg-secondary"
        >
          Cancel
        </button>
        <Link
          to="/pay"
          className="flex-1 rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-95"
        >
          Make a payment
        </Link>
      </div>
    </div>
  );
}

function ChannelInstructions({
  channel,
  reference,
}: {
  channel: ChannelKey;
  reference: string;
}) {
  if (channel === "transfer") {
    return (
      <div className="mt-4">
        <div className="text-xs font-semibold text-ink">Bank transfer</div>
        {councilBank ? (
          <dl className="mt-2 divide-y divide-border rounded-xl border border-border text-xs">
            <Row label="Bank" value={councilBank.bankName} />
            <Row label="Account name" value={councilBank.accountName} />
            <Row label="Account number" value={councilBank.accountNumber} mono />
            <Row label="Narration" value={reference} mono />
          </dl>
        ) : (
          <Unconfigured what="Bank transfer details have not been published yet." />
        )}
      </div>
    );
  }
  if (channel === "ussd") {
    return (
      <div className="mt-4">
        <div className="text-xs font-semibold text-ink">USSD</div>
        {councilUssd ? (
          <p className="mt-2 rounded-xl border border-border p-3 text-xs text-muted-foreground">
            Dial <code className="font-mono font-bold text-ink">{councilUssd}</code>, choose "Pay
            council levy" and enter reference{" "}
            <code className="font-mono text-ink">{reference}</code>.
          </p>
        ) : (
          <Unconfigured what="The council USSD code is not live yet." />
        )}
      </div>
    );
  }
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-ink">Cash to an agent</div>
      <p className="mt-2 rounded-xl border border-border p-3 text-xs text-muted-foreground">
        Show this reference to a council marshal, revenue officer or registered agent. They record
        the payment and your receipt is issued immediately.
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right font-semibold text-ink ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function Unconfigured({ what }: { what: string }) {
  return (
    <p className="mt-2 rounded-xl border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
      {what} Take your reference to any council revenue office or pay a registered agent.
    </p>
  );
}

/** The primary levy for each entity type, used when the caller doesn't specify. */
function defaultRevenueType(table: RegistrationTable): string {
  switch (table) {
    case "market_stalls":
      return "market_rent";
    case "transport_vehicles":
      return "daily_ticket";
    case "properties":
      return "tenement_rate";
    case "businesses":
      return "business_levy";
    case "hospitality_permits":
    case "pos_operators":
      return "permit_fee";
    case "sanitation_subscriptions":
      return "sanitation_levy";
  }
}
