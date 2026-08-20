import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BadgeCheck, Loader2, Search, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/shared/components/layout/SiteShell";

// Landing point for "is this receipt real?". Accepts either the opaque token from
// a receipt QR code or the printed receipt number, then hands off to
// /verify/$token which does the actual check.

export const Route = createFileRoute("/(public)/verify/")({
  head: () => ({
    meta: [
      { title: "Verify a receipt — Kwali Area Council" },
      {
        name: "description",
        content:
          "Check that a Kwali Area Council payment receipt is genuine. Enter the receipt number or scan the QR code on the receipt.",
      },
    ],
  }),
  component: VerifyIndexPage,
});

function VerifyIndexPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const ready = value.trim().length >= 4;

  return (
    <SiteShell>
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-3xl px-5 py-10 text-primary-foreground sm:px-6 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Public verification
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Verify a receipt
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
            Confirm that a Kwali Area Council receipt is genuine, and that the payment behind it was
            never reversed.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <form
          className="surface-card p-5 sm:p-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready || busy) return;
            setBusy(true);
            void navigate({ to: "/verify/$token", params: { token: value.trim() } });
          }}
        >
          <label className="block">
            <span className="text-xs font-semibold text-ink">Receipt number or QR code</span>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="RCP-2026-00000123"
                aria-label="Receipt number or QR code"
                className="w-full rounded-xl border border-input bg-background py-3.5 pl-10 pr-3 font-mono text-base tracking-wide text-ink outline-none transition focus:border-primary"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={!ready || busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground transition hover:opacity-95 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Checking…
              </>
            ) : (
              <>
                Verify receipt <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              Scanning the QR code on the receipt with your phone camera opens the full verification
              directly — including who it was issued to.
            </span>
          </div>
        </form>

        <div className="surface-card mt-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">Need to pay a levy instead?</div>
          <Link
            to="/pay"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          >
            <BadgeCheck className="h-4 w-4" /> Make a payment
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
