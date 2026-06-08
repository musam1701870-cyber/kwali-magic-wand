import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { businesses as seedBusinesses, businessCategories, wards } from "@/lib/kwali-mock";

export const Route = createFileRoute("/businesses")({
  head: () => ({ meta: [{ title: "Business Registry — Kwali Smart Revenue Platform" }] }),
  component: BusinessesPage,
});

type RegisteredBusiness = {
  id: string;
  ref: string;
  name: string;
  owner?: string;
  category: string;
  ward: string;
  address?: string;
  town?: string;
  landmark?: string;
  lat?: string;
  lng?: string;
  phone?: string;
  email?: string;
  tin?: string;
  staff?: number;
  status: "Active" | "Expired" | "Suspended";
  renewal: string;
  levy: number;
  registeredAt?: string;
};

const initial: RegisteredBusiness[] = seedBusinesses.map((b) => ({
  ...b,
  address: `${b.ward} Main Road`,
  town: b.ward,
  phone: "0803-000-0000",
}));

function BusinessesPage() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<RegisteredBusiness[]>(initial);
  const [filter, setFilter] = useState("");
  const [wardFilter, setWardFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selected, setSelected] = useState<RegisteredBusiness | null>(null);

  const filtered = useMemo(
    () =>
      list.filter((b) => {
        const q = filter.toLowerCase();
        const matchesText =
          !q ||
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.ref.toLowerCase().includes(q) ||
          (b.address?.toLowerCase().includes(q) ?? false) ||
          (b.owner?.toLowerCase().includes(q) ?? false);
        const matchesWard = wardFilter === "All" || b.ward === wardFilter;
        const matchesCat = categoryFilter === "All" || b.category === categoryFilter;
        return matchesText && matchesWard && matchesCat;
      }),
    [list, filter, wardFilter, categoryFilter]
  );

  const wardRevenue = useMemo(() => {
    const map = new Map<string, { count: number; levy: number }>();
    for (const w of wards) map.set(w, { count: 0, levy: 0 });
    for (const b of filtered) {
      const r = map.get(b.ward) ?? { count: 0, levy: 0 };
      r.count += 1;
      r.levy += b.levy;
      map.set(b.ward, r);
    }
    return Array.from(map.entries()).map(([ward, v]) => ({ ward, ...v }));
  }, [filtered]);

  const totalLevy = filtered.reduce((s, b) => s + b.levy, 0);

  function handleSave(newBiz: RegisteredBusiness) {
    setList((prev) => [newBiz, ...prev]);
    setOpen(false);
  }

  function downloadPDF(rows: RegisteredBusiness[], title: string) {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 76, 58);
    doc.rect(0, 0, pageW, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Kwali Smart Revenue Platform", 40, 30);
    doc.setFontSize(11);
    doc.text(title, 40, 50);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 40, 30, { align: "right" });
    doc.text(`Ward filter: ${wardFilter}   Category: ${categoryFilter}`, pageW - 40, 50, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Total businesses: ${rows.length}`, 40, 95);
    doc.text(`Total annual obligation: NGN ${rows.reduce((s, b) => s + b.levy, 0).toLocaleString()}`, 40, 110);

    autoTable(doc, {
      startY: 130,
      head: [["Ref", "Business", "Owner", "Category", "Ward", "Address", "Phone", "Renewal", "Levy (NGN)", "Status"]],
      body: rows.map((b) => [
        b.ref,
        b.name,
        b.owner ?? "—",
        b.category,
        b.ward,
        [b.address, b.town, b.landmark].filter(Boolean).join(", ") || "—",
        b.phone ?? "—",
        b.renewal,
        b.levy.toLocaleString(),
        b.status,
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [15, 76, 58], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 245] },
    });

    const wardSummary = wards
      .map((w) => {
        const r = rows.filter((b) => b.ward === w);
        return [w, String(r.length), r.reduce((s, b) => s + b.levy, 0).toLocaleString()];
      })
      .filter((r) => r[1] !== "0");

    if (wardSummary.length) {
      autoTable(doc, {
        head: [["Ward", "Businesses", "Annual obligation (NGN)"]],
        body: wardSummary,
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [191, 149, 63], textColor: 255 },
      });
    }

    doc.save(`KSRP-Business-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <DashboardShell
      title="Business Registry"
      subtitle="Register, track and report businesses across all wards of Kwali Area Council"
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => downloadPDF(filtered, "Business Registry Report")}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            ⬇ PDF report
          </button>
          <button
            onClick={() => setOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            + Register business
          </button>
        </div>
      }
    >
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Stat t="In view" v={String(filtered.length)} color="text-primary" />
        <Stat t="Active" v={String(filtered.filter((b) => b.status === "Active").length)} color="text-primary" />
        <Stat t="Expired / Suspended" v={String(filtered.filter((b) => b.status !== "Active").length)} color="text-destructive" />
        <Stat t="Annual obligation" v={"₦" + totalLevy.toLocaleString()} color="text-ink" />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-4">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search name, owner, address, ref…"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm lg:col-span-2"
        />
        <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="All">All wards ({wards.length})</option>
          {wards.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="All">All categories</option>
          {businessCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold text-ink">Revenue tracking by ward</div>
          <div className="text-xs text-muted-foreground">Based on current filter</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {wardRevenue.map((r) => {
            const max = Math.max(1, ...wardRevenue.map((x) => x.levy));
            const pct = Math.round((r.levy / max) * 100);
            return (
              <button
                key={r.ward}
                onClick={() => setWardFilter(r.ward)}
                className={`rounded-xl border p-3 text-left transition ${
                  wardFilter === r.ward ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-ink">{r.ward}</div>
                  <div className="text-xs text-muted-foreground">{r.count} biz</div>
                </div>
                <div className="mt-2 text-sm font-bold text-ink">₦{r.levy.toLocaleString()}</div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="font-semibold text-ink">Registered businesses</div>
          <div className="text-xs text-muted-foreground">{filtered.length} of {list.length}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Ref</th>
                <th className="px-5 py-3 text-left">Business</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Ward / Address</th>
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
                  <td className="px-5 py-4">
                    <div className="font-semibold text-ink">{b.name}</div>
                    {b.owner && <div className="text-xs text-muted-foreground">{b.owner}</div>}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{b.category}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-ink">{b.ward}</div>
                    <div className="text-xs text-muted-foreground">
                      {[b.address, b.town, b.landmark].filter(Boolean).join(", ") || "—"}
                    </div>
                  </td>
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
                    <button onClick={() => setSelected(b)} className="text-xs font-semibold text-primary hover:underline">
                      View / track
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No businesses match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && <RegisterModal onClose={() => setOpen(false)} onSave={handleSave} />}
      {selected && <DetailModal biz={selected} onClose={() => setSelected(null)} onPdf={() => downloadPDF([selected], `Business Profile — ${selected.name}`)} />}
    </DashboardShell>
  );
}

function RegisterModal({ onClose, onSave }: { onClose: () => void; onSave: (b: RegisteredBusiness) => void }) {
  const [form, setForm] = useState({
    name: "", owner: "", category: "", ward: wards[0], phone: "", email: "",
    address: "", town: "", landmark: "", lat: "", lng: "", levy: 10000, tin: "", staff: 1,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const ref = `KWL-BIZ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const renewal = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
          onSave({
            id: ref, ref, status: "Active", renewal, registeredAt: new Date().toISOString(),
            name: form.name, owner: form.owner, category: form.category, ward: form.ward,
            phone: form.phone, email: form.email, address: form.address, town: form.town,
            landmark: form.landmark, lat: form.lat, lng: form.lng, tin: form.tin,
            staff: Number(form.staff) || 0, levy: Number(form.levy) || 0,
          });
        }}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-ink">Register a business</h3>
            <p className="text-xs text-muted-foreground">Captures full location & ownership details for tracking.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">✕</button>
        </div>

        <Section title="Business details">
          <Field label="Business name"><input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Owner / proprietor"><input className="input" required value={form.owner} onChange={(e) => set("owner", e.target.value)} /></Field>
          <Field label="Business category" full>
            <select className="input" required value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="" disabled>Select a category…</option>
              {businessCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="TIN / RC number"><input className="input" value={form.tin} onChange={(e) => set("tin", e.target.value)} /></Field>
          <Field label="Number of staff"><input type="number" min={0} className="input" value={form.staff} onChange={(e) => set("staff", Number(e.target.value))} /></Field>
        </Section>

        <Section title="Location">
          <Field label="Ward">
            <select className="input" required value={form.ward} onChange={(e) => set("ward", e.target.value)}>
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Town / community"><input className="input" value={form.town} onChange={(e) => set("town", e.target.value)} /></Field>
          <Field label="Street address" full><input className="input" required value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="House no., street" /></Field>
          <Field label="Nearest landmark" full><input className="input" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} /></Field>
          <Field label="GPS latitude"><input className="input" value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="8.876" /></Field>
          <Field label="GPS longitude"><input className="input" value={form.lng} onChange={(e) => set("lng", e.target.value)} placeholder="7.027" /></Field>
        </Section>

        <Section title="Contact & obligation">
          <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Annual obligation (₦)"><input type="number" className="input" value={form.levy} onChange={(e) => set("levy", Number(e.target.value))} /></Field>
        </Section>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary">Cancel</button>
          <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">Save & generate ref</button>
        </div>
      </form>

      <style>{`.input{margin-top:.25rem;width:100%;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:.5rem .75rem;font-size:.875rem;color:hsl(var(--foreground))}`}</style>
    </div>
  );
}

function DetailModal({ biz, onClose, onPdf }: { biz: RegisteredBusiness; onClose: () => void; onPdf: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-muted-foreground">{biz.ref}</div>
            <h3 className="font-display text-2xl font-bold text-ink">{biz.name}</h3>
            <div className="text-sm text-muted-foreground">{biz.category} • {biz.ward}</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">✕</button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Info label="Owner" value={biz.owner} />
          <Info label="Status" value={biz.status} />
          <Info label="Phone" value={biz.phone} />
          <Info label="Email" value={biz.email} />
          <Info label="TIN / RC" value={biz.tin} />
          <Info label="Staff" value={biz.staff ? String(biz.staff) : undefined} />
          <Info label="Renewal due" value={biz.renewal} />
          <Info label="Annual obligation" value={`₦${biz.levy.toLocaleString()}`} />
          <Info full label="Address" value={[biz.address, biz.town, biz.landmark].filter(Boolean).join(", ")} />
          <Info label="GPS" value={biz.lat && biz.lng ? `${biz.lat}, ${biz.lng}` : undefined} />
          {biz.registeredAt && <Info label="Registered" value={new Date(biz.registeredAt).toLocaleString()} />}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary">Close</button>
          <button onClick={onPdf} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">Download PDF profile</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
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

function Info({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink">{value || "—"}</div>
    </div>
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
