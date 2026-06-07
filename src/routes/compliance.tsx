import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { violations } from "@/lib/kwali-mock";

export const Route = createFileRoute("/compliance")({
  head: () => ({ meta: [{ title: "Compliance & Enforcement — Kwali Revenue Portal" }] }),
  component: CompliancePage,
});

function CompliancePage() {
  const [scan, setScan] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; ref: string; msg: string }>(null);

  function verify() {
    if (!scan.trim()) return;
    const ok = scan.toUpperCase().startsWith("KWL-");
    setResult({ ok, ref: scan, msg: ok ? "Valid ticket — operator is compliant." : "No matching ticket found in KURCMS." });
  }

  return (
    <DashboardShell title="Compliance & enforcement" subtitle="Verify QR stickers on the road and review issued violations.">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scanner */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">QR scanner</h2>
          <p className="text-sm text-muted-foreground">Type or paste a ticket reference to simulate a scan.</p>
          <div className="mt-4 grid place-items-center rounded-xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center">
            <div className="text-5xl">📷</div>
            <div className="mt-2 text-xs text-muted-foreground">Camera preview (mock)</div>
          </div>
          <div className="mt-4 flex gap-2">
            <input value={scan} onChange={(e) => setScan(e.target.value)} placeholder="KWL-TRC-2026-0481" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={verify} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">Verify</button>
          </div>
          {result && (
            <div className={"mt-4 rounded-xl p-4 text-sm " + (result.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
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
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Scans today</div>
            <div className="mt-2 font-display text-3xl font-bold text-primary">128</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Compliant</div>
            <div className="mt-2 font-display text-3xl font-bold text-primary">109 <span className="text-sm text-muted-foreground">(85%)</span></div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Violations issued</div>
            <div className="mt-2 font-display text-3xl font-bold text-destructive">19</div>
          </div>
        </div>

        {/* Recent enforcement */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-lg font-bold text-ink">Recent activity</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-start gap-2"><span>✓</span> Ofc. Adamu verified KWL-TRC-2026-0481 in Kwali — compliant.</li>
            <li className="flex items-start gap-2"><span className="text-destructive">✗</span> Ofc. Bello flagged ABC-211-LP for missing sticker — fine ₦5,000.</li>
            <li className="flex items-start gap-2"><span className="text-destructive">✗</span> Ofc. Halima flagged KWL-T-2210 for tampered QR — escalated.</li>
            <li className="flex items-start gap-2"><span>✓</span> Ofc. Adamu verified KWL-M-3392 in Yangoji — compliant.</li>
          </ul>
        </div>
      </div>

      {/* Violations table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4 font-semibold text-ink">Violations log</div>
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
                <td className="px-5 py-4 text-right font-semibold text-ink">₦{v.fine.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <span className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                    (v.status === "Paid" ? "bg-primary/10 text-primary" : v.status === "Open" ? "bg-destructive/10 text-destructive" : "bg-gold/20 text-gold-foreground")
                  }>{v.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
