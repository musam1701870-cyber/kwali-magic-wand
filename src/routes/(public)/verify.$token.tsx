import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { SiteShell } from "@/shared/components/layout/SiteShell";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { QrImage } from "@/shared/components/ui/qr-image";
import {
  formatNaira,
  lookupObligations,
  verifyReceipt,
  type LookupResult,
  type ReceiptVerification,
} from "@/shared/lib/public-pay";
import { exportReceiptPDF } from "@/shared/lib/exporters";
import { receiptVerifyUrl } from "@/shared/lib/qr";

// The destination a receipt or ID-card QR code points at, and the result page
// for a typed receipt number or taxpayer ID.
//
// One URL, two things it can prove:
//   * a receipt token/number -> authenticity, amount, standing of a payment;
//   * an identity qr_token off a taxpayer ID card -> who this is, whether their
//     registration is active, and what is outstanding today.
// Disclosure is decided server-side: receipt tokens unlock payer context, typed
// receipt numbers confirm authenticity only, and identity lookups never expose
// more than public_lookup() returns.

export const Route = createFileRoute("/(public)/verify/$token")({
  head: () => ({ meta: [{ title: "Receipt verification — Kwali Area Council" }] }),
  component: VerifyTokenPage,
});

function VerifyTokenPage() {
  const { token } = Route.useParams();
  const [state, setState] = useState<"loading" | "done">("loading");
  const [result, setResult] = useState<ReceiptVerification | null>(null);
  const [identity, setIdentity] = useState<LookupResult | null>(null);

  useEffect(() => {
    let alive = true;
    setState("loading");
    setIdentity(null);
    // Try receipt verification first; if no receipt matches, the token may be
    // an identity QR from a taxpayer ID card, so fall back to public lookup.
    verifyReceipt(token)
      .then(async (r) => {
        if (r.valid || r.voided) return { receipt: r, identity: null };
        const id = await lookupObligations(token);
        return { receipt: r, identity: id.found ? id : null };
      })
      .then(({ receipt, identity }) => {
        if (!alive) return;
        setResult(receipt);
        setIdentity(identity);
        setState("done");
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const valid = result?.valid === true;
  const voided = result?.voided === true;

  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Verify another
        </Link>

        {state === "loading" ? (
          <div className="surface-card mt-4 flex flex-col items-center gap-3 p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">Checking this code…</div>
          </div>
        ) : valid ? (
          <ValidReceipt token={token} result={result!} />
        ) : voided ? (
          <VoidedReceipt result={result!} />
        ) : identity?.found ? (
          <ValidIdentity identity={identity} />
        ) : (
          <InvalidReceipt />
        )}
      </div>
    </SiteShell>
  );
}

function ValidIdentity({ identity }: { identity: LookupResult & { found: true } }) {
  const outstanding = identity.obligations.filter((o) => !o.paid);
  const settledToday = identity.obligations.filter((o) => o.paid);
  return (
    <>
      <Banner
        tone="success"
        icon={<CheckCircle2 className="h-6 w-6" />}
        title="Registered taxpayer"
        subtitle={`This ID card was issued by Kwali Area Council to a registered ${identity.entityLabel.toLowerCase()}.`}
      />

      <div className="surface-card mt-5 overflow-hidden">
        <div className="border-b border-border bg-secondary/40 px-5 py-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {identity.entityLabel}
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{identity.name}</div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">{identity.lookupId}</div>
        </div>

        <dl className="divide-y divide-border">
          {identity.ward && <Row label="Ward" value={`${identity.ward} ward`} />}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5">
            <dt className="text-xs text-muted-foreground">Registration</dt>
            <dd>
              <StatusBadge status={identity.status} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3.5">
            <dt className="text-xs text-muted-foreground">Today's standing</dt>
            <dd>
              {settledToday.length > 0 && outstanding.length === 0 ? (
                <StatusBadge tone="success">Settled</StatusBadge>
              ) : outstanding.length > 0 ? (
                <StatusBadge tone="danger">
                  Owes {formatNaira(outstanding.reduce((s, o) => s + o.amount, 0))}
                </StatusBadge>
              ) : (
                <StatusBadge tone="neutral">No dues today</StatusBadge>
              )}
            </dd>
          </div>
        </dl>

        {identity.obligations.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Obligations
            </div>
            <div className="mt-2 space-y-1.5">
              {identity.obligations.map((o) => (
                <div key={`${o.revenueType}-${o.period}`} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {o.label} <span className="text-muted-foreground">· {o.periodLabel}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{formatNaira(o.amount)}</span>
                    {o.paid ? (
                      <StatusBadge tone="success">Paid</StatusBadge>
                    ) : (
                      <StatusBadge tone="danger">Due</StatusBadge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
        Verification shows registration standing only — no phone numbers or personal details are
        disclosed.
      </p>
    </>
  );
}

function Banner({
  tone,
  icon,
  title,
  subtitle,
}: {
  tone: "success" | "danger" | "warning";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const styles =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : tone === "warning"
        ? "border-warning/40 bg-warning/12 text-warning-foreground"
        : "border-destructive/30 bg-destructive/10 text-destructive";

  return (
    <div className={`mt-4 flex items-start gap-3 rounded-2xl border px-5 py-4 ${styles}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="font-display text-lg font-bold leading-tight">{title}</div>
        <p className="mt-1 text-sm opacity-90">{subtitle}</p>
      </div>
    </div>
  );
}

function ValidReceipt({ token, result }: { token: string; result: ReceiptVerification }) {
  const [downloading, setDownloading] = useState(false);
  // Only the opaque token unlocks payer context; a typed receipt number does not.
  const detailed = Boolean(result.payerName);

  async function download() {
    setDownloading(true);
    try {
      await exportReceiptPDF({
        filename: `receipt-${result.receiptNo}`,
        receiptNo: result.receiptNo ?? "",
        payerName: result.payerName ?? "Kwali Area Council taxpayer",
        lines: [
          { label: "Revenue head", value: revenueLabel(result.revenueType) },
          ...(result.period ? [{ label: "Period", value: result.period }] : []),
          ...(result.channel ? [{ label: "Channel", value: titleCase(result.channel) }] : []),
          ...(result.entityRef ? [{ label: "Taxpayer ID", value: result.entityRef }] : []),
          ...(result.ward ? [{ label: "Ward", value: result.ward }] : []),
          {
            label: "Issued",
            value: result.issuedAt ? new Date(result.issuedAt).toLocaleString() : "—",
          },
        ],
        amount: formatNaira(result.amount ?? 0),
        note: "Thank you for paying your Kwali Area Council levy.",
        qrText: receiptVerifyUrl(token),
      });
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Could not generate the PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Banner
        tone="success"
        icon={<CheckCircle2 className="h-6 w-6" />}
        title="Genuine receipt"
        subtitle="This receipt was issued by Kwali Area Council and the payment behind it is confirmed."
      />

      <div className="surface-card mt-5 overflow-hidden">
        <div className="border-b border-border bg-secondary/40 px-5 py-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Amount paid
          </div>
          <div className="mt-1 font-display text-4xl font-bold text-primary">
            {formatNaira(result.amount ?? 0)}
          </div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">{result.receiptNo}</div>
        </div>

        <dl className="divide-y divide-border">
          <Row label="Revenue head" value={revenueLabel(result.revenueType)} />
          {result.period && <Row label="Period" value={result.period} />}
          {result.channel && <Row label="Paid by" value={titleCase(result.channel)} />}
          {result.payerName && <Row label="Paid for" value={result.payerName} />}
          {result.entityRef && <Row label="Taxpayer ID" value={result.entityRef} mono />}
          {result.ward && <Row label="Ward" value={`${result.ward} ward`} />}
          <Row
            label="Issued"
            value={result.issuedAt ? new Date(result.issuedAt).toLocaleString() : "—"}
          />
          <div className="flex items-center justify-between gap-3 px-5 py-3.5">
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd>
              <StatusBadge status="valid" />
            </dd>
          </div>
        </dl>

        <div className="flex flex-col items-center gap-4 border-t border-border px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <QrImage value={receiptVerifyUrl(token)} size={96} alt="Receipt verification QR code" />
            <div className="text-[11px] leading-relaxed text-muted-foreground">
              Scan any time to re-check
              <br />
              this receipt.
            </div>
          </div>
          <button
            onClick={() => void download()}
            disabled={downloading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60 sm:w-auto"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>

      {!detailed && (
        <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          Receipt numbers are sequential, so verifying by number confirms the payment without
          revealing who made it. Scan the QR code on the receipt to see the full details.
        </p>
      )}
    </>
  );
}

function VoidedReceipt({ result }: { result: ReceiptVerification }) {
  return (
    <>
      <Banner
        tone="warning"
        icon={<AlertTriangle className="h-6 w-6" />}
        title="Receipt cancelled"
        subtitle="This receipt was issued but the payment behind it was later reversed. It does not prove payment."
      />
      <div className="surface-card mt-5">
        <dl className="divide-y divide-border">
          <Row label="Receipt number" value={result.receiptNo ?? "—"} mono />
          <Row label="Original amount" value={formatNaira(result.amount ?? 0)} />
          <Row label="Reason" value={result.voidReason ?? "Payment reversed"} />
          <div className="flex items-center justify-between gap-3 px-5 py-3.5">
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd>
              <StatusBadge tone="danger">Cancelled</StatusBadge>
            </dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        If you believe this is wrong, take the receipt to any Kwali Area Council revenue office.
      </p>
    </>
  );
}

function InvalidReceipt() {
  return (
    <>
      <Banner
        tone="danger"
        icon={<XCircle className="h-6 w-6" />}
        title="Not a valid receipt"
        subtitle="No Kwali Area Council receipt matches this code. It may be mistyped, or it may not be genuine."
      />
      <div className="surface-card mt-5 p-5">
        <div className="text-sm font-semibold text-ink">What to do next</div>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li>Check for typing mistakes — receipt numbers look like RCP-2026-00000123.</li>
          <li>Scan the QR code printed on the receipt instead of typing the number.</li>
          <li>If someone gave you this receipt, ask them for the original.</li>
        </ul>
        <Link
          to="/verify"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
        >
          Try again
        </Link>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-right text-sm font-semibold text-ink ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

const REVENUE_LABELS: Record<string, string> = {
  daily_ticket: "Daily ticket",
  market_toll: "Market toll",
  market_rent: "Stall rent",
  tenement_rate: "Tenement rate",
  business_levy: "Business permit",
  permit_fee: "Permit fee",
  sanitation_levy: "Sanitation levy",
  penalty: "Penalty",
  other: "Other revenue",
};

function revenueLabel(key?: string | null): string {
  if (!key) return "Council levy";
  return REVENUE_LABELS[key] ?? titleCase(key);
}

function titleCase(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
