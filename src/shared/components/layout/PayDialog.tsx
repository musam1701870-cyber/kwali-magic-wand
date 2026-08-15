import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, X, ShieldCheck } from "lucide-react";
import { exportReceiptPDF } from "@/shared/lib/exporters";

export type PayTarget = {
  ref: string;
  payer: string;
  category: string;
  amount: number;
  meta?: { label: string; value: string }[];
};

const CHANNELS = ["Card", "Bank transfer", "USSD", "Wallet"] as const;

/**
 * Reusable payment dialog used across the taxpayer surfaces (dashboard, portal,
 * properties). Simulates a gateway charge, then issues a downloadable receipt.
 */
export function PayDialog({
  target,
  onClose,
  onPaid,
}: {
  target: PayTarget | null;
  onClose: () => void;
  onPaid?: (ref: string) => void;
}) {
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("Card");
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");

  if (!target) return null;

  const receiptNo = `KWL-REF-2026-${target.ref.replace(/\D/g, "").slice(-5).padStart(5, "0")}`;

  function pay() {
    setStatus("processing");
    // Simulate a payment-gateway round-trip.
    window.setTimeout(() => {
      setStatus("done");
      onPaid?.(target!.ref);
      toast.success("Payment successful", {
        description: `${target!.category} · ₦${target!.amount.toLocaleString()} · ${receiptNo}`,
      });
    }, 1100);
  }

  function downloadReceipt() {
    exportReceiptPDF({
      filename: `receipt-${receiptNo}`,
      receiptNo,
      payerName: target!.payer,
      lines: [
        { label: "Revenue head", value: target!.category },
        { label: "Reference", value: target!.ref },
        { label: "Channel", value: channel },
        ...(target!.meta ?? []),
      ],
      amount: `₦${target!.amount.toLocaleString()}`,
      note: "Thank you for paying your Kwali Area Council levy.",
    });
    toast.success("Receipt downloaded");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {status === "done" ? "Payment complete" : "Confirm payment"}
            </h2>
            <p className="text-xs text-muted-foreground">{target.ref}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {status === "done" ? (
          <div className="px-5 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="mt-4 font-display text-2xl font-bold text-ink">
              ₦{target.amount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">{target.category}</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{receiptNo}</div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={downloadReceipt}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
              >
                Download receipt
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4">
            {/* Amount */}
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Amount due
              </div>
              <div className="font-display text-3xl font-bold text-primary">
                ₦{target.amount.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {target.category} · {target.payer}
              </div>
            </div>

            {/* Channel */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-ink">Payment channel</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={
                      "rounded-lg border px-3 py-2.5 text-sm font-medium transition " +
                      (channel === c
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Secured by KURCMS · your payment is encrypted end-to-end.
            </div>

            <button
              onClick={pay}
              disabled={status === "processing"}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-70"
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>Pay ₦{target.amount.toLocaleString()}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
