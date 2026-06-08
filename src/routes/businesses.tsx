import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { businesses, businessCategories, wards } from "@/lib/kwali-mock";

export const Route = createFileRoute("/businesses")({
  head: () => ({ meta: [{ title: "Business Registry — Kwali Smart Revenue Platform" }] }),
  component: BusinessesPage,
});

function BusinessesPage() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(filter.toLowerCase()) ||
      b.category.toLowerCase().includes(filter.toLowerCase()) ||
      b.ref.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <DashboardShell
      title="Businesses"
      subtitle="Register, renew, classify and issue digital business permits"
      actions={
        <button onClick={() => setOpen(true)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
          + Register business
        </button>
      }
    >
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Stat t="Active" v={String(businesses.filter((b) => b.status === "Active").length)} color="text-primary" />
        <Stat t="Expired" v={String(businesses.filter((b) => b.status === "Expired").length)} color="text-gold-foreground" />
        <Stat t="Suspended" v={String(businesses.filter((b) => b.status === "Suspended").length)} color="text-destructive" />
        <Stat t="Total annual obligation" v={"₦" + businesses.reduce((s, b) => s + b.levy, 0).toLocaleString()} color="text-ink" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by name, category or reference…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm sm:max-w-md"
        />
        <div className="text-xs text-muted-foreground">{filtered.length} of {businesses.length} businesses</div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4 font-semibold text-ink">Registered businesses</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Ref</th>
                <th className="px-5 py-3 text-left">Business</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Ward</th>
                <th className="px-5 py-3 text-left">Renewal</th>
                <th className="px-5 py-3 text-right">Annual levy</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="px-5 py-4 font-mono text-xs text-ink">{b.ref}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{b.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{b.category}</td>
                  <td className="px-5 py-4 text-muted-foreground">{b.ward}</td>
                  <td className="px-5 py-4 text-muted-foreground">{b.renewal}</td>
                  <td className="px-5 py-4 text-right font-semibold text-ink">₦{b.levy.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                        (b.status === "Active"
                          ? "bg-primary/10 text-primary"
                          : b.status === "Expired"
                          ? "bg-gold/20 text-gold-foreground"
                          : "bg-destructive/10 text-destructive")
                      }
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-xs font-semibold text-primary hover:underline">Generate permit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && <RegisterModal onClose={() => setOpen(false)} />}
    </DashboardShell>
  );
}

function RegisterModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-ink">Register a business</h3>
            <p className="text-xs text-muted-foreground">Add a new business to the Kwali revenue register.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">✕</button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Business name">
            <input className="input" placeholder="e.g. Yangoji Mini Mart" required />
          </Field>
          <Field label="Owner / proprietor">
            <input className="input" placeholder="Full name" required />
          </Field>

          <Field label="Business category" full>
            <select className="input" required defaultValue="">
              <option value="" disabled>Select a category…</option>
              {businessCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Ward">
            <select className="input" required>
              {wards.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </Field>
          <Field label="Phone">
            <input className="input" placeholder="0803-000-0000" />
          </Field>

          <Field label="Business address" full>
            <input className="input" placeholder="Street, town, landmark" />
          </Field>

          <Field label="Annual obligation (₦)">
            <input type="number" className="input" placeholder="10000" />
          </Field>
          <Field label="TIN / RC number">
            <input className="input" placeholder="Optional" />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-secondary">
            Cancel
          </button>
          <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
            Save business
          </button>
        </div>
      </form>

      <style>{`.input{margin-top:.25rem;width:100%;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:.5rem .75rem;font-size:.875rem;color:hsl(var(--foreground))}`}</style>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <label className={`block text-sm font-semibold text-ink ${full ? "md:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}

function Stat({ t, v, color }: { t: string; v: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t}</div>
      <div className={`mt-1 font-display text-xl font-bold ${color}`}>{v}</div>
    </div>
  );
}
