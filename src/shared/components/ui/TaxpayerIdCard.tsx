import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, ShieldCheck, Printer, RotateCw } from "lucide-react";
import { QrImage } from "@/shared/components/ui/qr-image";
import { identityVerifyUrl } from "@/shared/lib/qr";
import { exportIdCardPDF } from "@/shared/lib/exporters";
import crest from "@/shared/assets/kwali-crest.png";

/**
 * Digital taxpayer ID card for the informal sector — market women, petty
 * traders and transport operators.
 *
 * The QR encodes the entity's opaque qr_token as a public verify URL, never a
 * name or amount: a photographed or lost card leaks nothing, and any phone
 * camera resolves it without an app. Scanning lands on /verify/$token which
 * confirms identity and payment standing.
 */
export function TaxpayerIdCard({
  refNo,
  qrToken,
  name,
  kind,
  lines,
  issuedAt,
  compact = false,
}: {
  /** Public reference, e.g. KWL-TRD-2026-001234 — printed openly on the card. */
  refNo: string;
  /** Opaque token backing the QR code. If missing, the card renders without a code. */
  qrToken: string | null;
  name: string;
  /** e.g. "Market Trader" or "Transport Operator". */
  kind: string;
  lines: { label: string; value: string }[];
  issuedAt?: string;
  /** compact = sidebar/list size; default = full card with download action. */
  compact?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [side, setSide] = useState<"front" | "back">("front");
  const verifyUrl = qrToken ? identityVerifyUrl(qrToken) : null;
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function download() {
    if (downloading) return;
    setDownloading(true);
    try {
      await exportIdCardPDF({
        filename: `kwali-id-${refNo}`,
        idNo: refNo,
        name,
        lines: [{ label: "Category", value: kind }, ...lines],
        footer: "Kwali Area Council · Informal Sector Taxpayer ID",
        qrText: verifyUrl ?? undefined,
      });
      toast.success("ID card downloaded", { description: refNo });
    } catch {
      toast.error("Could not generate the PDF");
    } finally {
      setDownloading(false);
    }
  }

  const cardCls = compact ? "w-full max-w-[300px]" : "w-full max-w-[340px]";

  // Back of the card — terms, return instructions, validity. Flippable.
  const back = (
    <div className="overflow-hidden rounded-2xl border border-primary/25 shadow-[var(--shadow-elegant)]">
      <div className="flex items-center gap-2.5 bg-[linear-gradient(135deg,oklch(0.3_0.09_162),oklch(0.22_0.06_160))] px-4 py-3 text-white">
        <img src={crest} alt="" className="h-8 w-8" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/70">Kwali Area Council</div>
          <div className="text-sm font-bold">Card Information</div>
        </div>
      </div>
      <div className="bg-[linear-gradient(160deg,oklch(0.3_0.09_162),oklch(0.22_0.06_160))] px-4 py-4 text-white">
        <ul className="space-y-1.5 text-[10px] leading-relaxed text-white/85">
          <li>· Identifies the holder as a registered Kwali Area Council taxpayer.</li>
          <li>· Not a national ID — for revenue & compliance use only.</li>
          <li>· Officers verify by scanning the QR on the front.</li>
          <li>· If found, return to any Kwali Area Council revenue office.</li>
        </ul>
        <div className="mt-3 border-t border-white/15 pt-2">
          <div className="font-mono text-[10px] text-gold">{refNo}</div>
          <div className="mt-0.5 text-[9px] text-white/60">Valid while registration remains Active</div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 bg-[oklch(0.2_0.05_160)] px-4 py-2 text-white/60">
        <span className="text-[9px]">Helpline · Kwali Revenue Dept</span>
        {!compact && (
          <button
            onClick={() => setSide("front")}
            className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-white/10"
          >
            <RotateCw className="h-3 w-3" /> Front
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={cardCls}>
      {side === "back" ? back : (
      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-[var(--shadow-elegant)]">
        {/* Header band */}
        <div className="flex items-center gap-2.5 bg-[linear-gradient(135deg,oklch(0.42_0.13_158),oklch(0.3_0.09_162))] px-4 py-3">
          <img src={crest} alt="" className="h-8 w-8" />
          <div className="min-w-0 flex-1 leading-tight text-white">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/70">
              Kwali Area Council
            </div>
            <div className="truncate text-sm font-bold">Taxpayer ID · {kind}</div>
          </div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-gold" />
        </div>

        {/* Body */}
        <div className="flex items-center gap-4 px-4 py-4">
          {verifyUrl ? (
            <QrImage value={verifyUrl} size={compact ? 84 : 104} alt={`Verify ${refNo}`} />
          ) : (
            <div
              className="grid shrink-0 place-items-center rounded-lg bg-secondary text-[10px] font-semibold text-muted-foreground"
              style={{ width: compact ? 84 : 104, height: compact ? 84 : 104 }}
            >
              No QR
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </span>
              <div className="min-w-0 truncate text-sm font-bold text-ink">{name}</div>
            </div>
            <dl className="mt-2 space-y-1">
              {lines.slice(0, compact ? 2 : 4).map((l) => (
                <div key={l.label} className="flex justify-between gap-2 text-[11px]">
                  <dt className="shrink-0 uppercase tracking-wide text-muted-foreground">
                    {l.label}
                  </dt>
                  <dd className="truncate font-semibold text-foreground">{l.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 rounded-md bg-primary/8 px-2 py-1 text-center font-mono text-[11px] font-bold text-primary">
              {refNo}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-4 py-2">
          <span className="text-[9px] text-muted-foreground">
            Scan QR to verify · KSRP {issuedAt ? `· Issued ${issuedAt}` : ""}
          </span>
          {!compact && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSide("back")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-bold text-ink transition hover:bg-secondary"
              >
                <RotateCw className="h-3 w-3" /> Back
              </button>
              <button
                onClick={download}
                disabled={downloading}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Printer className="h-3 w-3" />
                )}
                Print / PDF
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
