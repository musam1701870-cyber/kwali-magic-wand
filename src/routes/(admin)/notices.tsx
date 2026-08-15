import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { demandNotices, taxpayers, type DemandNotice } from "@/shared/lib/kwali-mock";
import { exportReceiptPDF } from "@/shared/lib/exporters";
import { X } from "lucide-react";

export const Route = createFileRoute("/(admin)/notices")({
  head: () => ({ meta: [{ title: "Demand Notices — KARCIP" }] }),
  component: NoticesPage,
});

const STAGES = ["Demand", "Reminder", "Final Warning", "Enforcement"] as const;

const stageColor: Record<string, string> = {
  Demand: "bg-primary/10 text-primary",
  Reminder: "bg-gold/20 text-gold-foreground",
  "Final Warning": "bg-orange-500/15 text-orange-700",
  Enforcement: "bg-destructive/10 text-destructive",
};

function noticePDF(d: DemandNotice) {
  exportReceiptPDF({
    filename: `demand-notice-${d.ref}`,
    receiptNo: d.ref,
    payerName: d.taxpayer,
    lines: [
      { label: "Category", value: d.category },
      { label: "Stage", value: d.stage },
      { label: "Issued", value: d.issued },
      { label: "Payment due", value: d.due },
    ],
    amount: `₦${d.amount.toLocaleString()}`,
    note: `Settle before ${d.due} to avoid escalation. Pay at any Kwali revenue office or via the online portal quoting ${d.ref}.`,
  });
  toast.success("Notice PDF downloaded", { description: d.ref });
}

function deliver(channel: "SMS" | "Email" | "WhatsApp", d: DemandNotice) {
  const msg = `Kwali Area Council — ${d.stage} Notice ${d.ref}. Dear ${d.taxpayer}, ₦${d.amount.toLocaleString()} for ${d.category} is due by ${d.due}. Please settle to avoid enforcement.`;
  if (channel === "SMS") window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
  else if (channel === "Email")
    window.location.href = `mailto:?subject=${encodeURIComponent(`${d.stage} Notice ${d.ref}`)}&body=${encodeURIComponent(msg)}`;
  else window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  toast.success(`${channel} ready to send`, { description: `${d.taxpayer} · ${d.ref}` });
}

function NoticesPage() {
  const [notices, setNotices] = useState<DemandNotice[]>(demandNotices);
  const [issueOpen, setIssueOpen] = useState(false);

  return (
    <DashboardShell
      title="Demand Notice System"
      subtitle="Generate, deliver and track Demand, Reminder, Final Warning and Enforcement notices"
      actions={
        <button
          onClick={() => setIssueOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          + Issue notice
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        {STAGES.map((s) => (
          <div key={s} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {s}
            </div>
            <div className="mt-1 font-display text-xl font-bold text-ink">
              {notices.filter((d) => d.stage === s).length}
            </div>
            <div className="text-[11px] text-muted-foreground">Active notices</div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4 font-semibold text-ink">
          Recent notices
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Ref</th>
                <th className="px-5 py-3 text-left">Taxpayer</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-left">Stage</th>
                <th className="px-5 py-3 text-left">Issued</th>
                <th className="px-5 py-3 text-left">Due</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notices.map((d) => (
                <tr key={d.id}>
                  <td className="px-5 py-4 font-mono text-xs text-ink">{d.ref}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{d.taxpayer}</td>
                  <td className="px-5 py-4 text-muted-foreground">{d.category}</td>
                  <td className="px-5 py-4 text-right font-semibold text-ink">
                    ₦{d.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold " + stageColor[d.stage]
                      }
                    >
                      {d.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{d.issued}</td>
                  <td className="px-5 py-4 text-muted-foreground">{d.due}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1.5 text-[11px] font-semibold">
                      <button
                        onClick={() => noticePDF(d)}
                        className="rounded border border-border px-2 py-1 text-ink hover:border-primary"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => deliver("SMS", d)}
                        className="rounded border border-border px-2 py-1 text-ink hover:border-primary"
                      >
                        SMS
                      </button>
                      <button
                        onClick={() => deliver("Email", d)}
                        className="rounded border border-border px-2 py-1 text-ink hover:border-primary"
                      >
                        Email
                      </button>
                      <button
                        onClick={() => deliver("WhatsApp", d)}
                        className="rounded border border-border px-2 py-1 text-ink hover:border-primary"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {issueOpen && (
        <IssueModal
          onClose={() => setIssueOpen(false)}
          onIssue={(n) => {
            setNotices((prev) => [n, ...prev]);
            setIssueOpen(false);
            toast.success("Notice issued", { description: `${n.ref} · ${n.taxpayer}` });
          }}
        />
      )}
    </DashboardShell>
  );
}

function IssueModal({
  onClose,
  onIssue,
}: {
  onClose: () => void;
  onIssue: (n: DemandNotice) => void;
}) {
  const [taxpayer, setTaxpayer] = useState(taxpayers[0]?.name ?? "");
  const [category, setCategory] = useState("Tenement Rate 2026");
  const [amount, setAmount] = useState(5000);
  const [stage, setStage] = useState<DemandNotice["stage"]>("Demand");
  const [due, setDue] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Issue a demand notice</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const seq = String(Math.floor(Math.random() * 9000 + 1000));
            onIssue({
              id: `dn-${seq}`,
              ref: `KWL-DN-2026-${seq}`,
              taxpayer,
              category,
              amount,
              stage,
              issued: new Date().toISOString().slice(0, 10),
              due: due || "2026-09-30",
            });
          }}
          className="space-y-4 px-5 py-4"
        >
          <div>
            <label className="text-xs font-semibold text-ink">Taxpayer</label>
            <select
              value={taxpayer}
              onChange={(e) => setTaxpayer(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {taxpayers.map((t) => (
                <option key={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DemandNotice["stage"])}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Due date</label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Issue notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
