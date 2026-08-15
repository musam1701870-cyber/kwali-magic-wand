import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { violations, vehicles } from "@/shared/lib/kwali-mock";

export const Route = createFileRoute("/(admin)/compliance")({
  head: () => ({ meta: [{ title: "Compliance & Enforcement — Kwali Revenue Portal" }] }),
  component: CompliancePage,
});

type ScanResult = { ok: boolean; ref: string; msg: string };

function CompliancePage() {
  const [scan, setScan] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [log, setLog] = useState<{ ok: boolean; text: string }[]>([]);
  const [scans, setScans] = useState(0);

  const compliantCount = log.filter((l) => l.ok).length;
  const compliantPct = scans ? Math.round((compliantCount / scans) * 100) : 0;

  const violationStats = useMemo(() => {
    const open = violations.filter((v) => v.status === "Open").length;
    const outstanding = violations
      .filter((v) => v.status !== "Paid")
      .reduce((a, v) => a + v.fine, 0);
    return { total: violations.length, open, outstanding };
  }, []);

  function verify() {
    const q = scan.trim();
    if (!q) return;
    const upper = q.toUpperCase();

    // Real checks against KURCMS data: known violation plate → non-compliant; active vehicle → compliant.
    const flagged = violations.find((v) => v.plate.toUpperCase() === upper);
    const vehicle = vehicles.find((v) => v.plate.toUpperCase() === upper);

    let res: ScanResult;
    if (flagged) {
      res = {
        ok: false,
        ref: q,
        msg: `Outstanding violation ${flagged.ref} — ₦${flagged.fine.toLocaleString()} (${flagged.status}).`,
      };
    } else if (vehicle) {
      res = vehicle.active
        ? {
            ok: true,
            ref: q,
            msg: `${vehicle.type} operated by ${vehicle.operator} — daily ticket active.`,
          }
        : {
            ok: false,
            ref: q,
            msg: `${vehicle.type} registered but ticket inactive — issue a fresh ticket.`,
          };
    } else if (upper.startsWith("KWL-")) {
      res = { ok: true, ref: q, msg: "Valid KURCMS ticket — operator is compliant." };
    } else {
      res = { ok: false, ref: q, msg: "No matching ticket or vehicle found in KURCMS." };
    }

    setResult(res);
    setScans((s) => s + 1);
    setLog((prev) =>
      [
        {
          ok: res.ok,
          text: `${res.ok ? "Verified" : "Flagged"} ${q} — ${res.ok ? "compliant" : "non-compliant"}.`,
        },
        ...prev,
      ].slice(0, 6),
    );
    toast[res.ok ? "success" : "error"](res.ok ? "Compliant" : "Non-compliant", { description: q });
  }

  return (
    <DashboardShell
      title="Compliance & enforcement"
      subtitle="Verify QR stickers on the road and review issued violations."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scanner */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">QR scanner</h2>
          <p className="text-sm text-muted-foreground">
            Type or paste a plate or ticket reference to simulate a scan.
          </p>
          <div className="mt-4 grid place-items-center rounded-xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center">
            <div className="text-5xl">📷</div>
            <div className="mt-2 text-xs text-muted-foreground">Camera preview (mock)</div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              placeholder="KWL-TRC-2026-0481 or ABC-211-LP"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={verify}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Verify
            </button>
          </div>
          {result && (
            <div
              className={
                "mt-4 rounded-xl p-4 text-sm " +
                (result.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")
              }
            >
              <div className="font-bold">{result.ok ? "✓ Compliant" : "✗ Non-compliant"}</div>
              <div className="text-xs opacity-80">{result.msg}</div>
              <div className="mt-1 font-mono text-xs">{result.ref}</div>
            </div>
          )}
          <div className="mt-4 rounded-lg bg-gold/10 p-3 text-xs text-gold-foreground">
            Offline mode: scans are queued and synced when connectivity returns.
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Scans this session
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-primary">{scans}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Compliant</div>
            <div className="mt-2 font-display text-3xl font-bold text-primary">
              {compliantCount}{" "}
              <span className="text-sm text-muted-foreground">({compliantPct}%)</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Open violations · fines due
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-destructive">
              {violationStats.open}{" "}
              <span className="text-sm text-muted-foreground">
                / ₦{violationStats.outstanding.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Recent enforcement */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Recent activity</h2>
          {log.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No scans yet this session. Verify a plate or ticket to populate the log.
            </p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {log.map((l, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={l.ok ? "" : "text-destructive"}>{l.ok ? "✓" : "✗"}</span>{" "}
                  {l.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Violations table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4 font-semibold text-ink">
          Violations log{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({violationStats.total})
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">Ref</th>
              <th className="px-5 py-3 text-left">Plate</th>
              <th className="px-5 py-3 text-left">Offense</th>
              <th className="px-5 py-3 text-left">Ward</th>
              <th className="px-5 py-3 text-left">Officer</th>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-right">Fine</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {violations.map((v) => (
              <tr key={v.id}>
                <td className="px-5 py-4 font-mono text-xs text-ink">{v.ref}</td>
                <td className="px-5 py-4 text-foreground">{v.plate}</td>
                <td className="px-5 py-4 text-foreground">{v.type}</td>
                <td className="px-5 py-4 text-muted-foreground">{v.ward}</td>
                <td className="px-5 py-4 text-muted-foreground">{v.officer}</td>
                <td className="px-5 py-4 text-muted-foreground">{v.date}</td>
                <td className="px-5 py-4 text-right font-semibold text-ink">
                  ₦{v.fine.toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={
                      "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                      (v.status === "Paid"
                        ? "bg-primary/10 text-primary"
                        : v.status === "Open"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-gold/20 text-gold-foreground")
                    }
                  >
                    {v.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
