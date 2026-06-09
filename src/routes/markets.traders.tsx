import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { traders, markets, type Trader } from "@/lib/kwali-mock";
import {
  Search,
  UserPlus,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  QrCode,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/markets/traders")({
  head: () => ({ meta: [{ title: "Trader Directory — Kwali Market System" }] }),
  component: TradersPage,
});

function ComplianceBadge({ score }: { score: number }) {
  const color = score >= 85 ? "bg-emerald-50 text-emerald-700" : score >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${color}`}>{score}%</span>;
}

function CategoryBadge({ cat }: { cat: Trader["category"] }) {
  const map = {
    A: "bg-violet-50 text-violet-700 border-violet-200",
    B: "bg-blue-50 text-blue-700 border-blue-200",
    C: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${map[cat]}`}>Cat {cat}</span>;
}

function PaidBadge({ paid }: { paid: boolean }) {
  return paid
    ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Paid today</span>
    : <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"><XCircle className="h-3 w-3" />Unpaid</span>;
}

function TraderRow({ t, onClick }: { t: Trader; onClick: () => void }) {
  return (
    <tr onClick={onClick} className="cursor-pointer transition hover:bg-secondary/40">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {t.initials}
          </div>
          <div>
            <div className="font-semibold text-ink text-sm">{t.name}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{t.traderId}</div>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3.5 text-sm text-foreground md:table-cell">{t.tradeType}</td>
      <td className="hidden px-4 py-3.5 text-sm text-muted-foreground lg:table-cell">{t.marketName}</td>
      <td className="hidden px-4 py-3.5 lg:table-cell"><CategoryBadge cat={t.category} /></td>
      <td className="hidden px-4 py-3.5 sm:table-cell"><PaidBadge paid={t.paidToday} /></td>
      <td className="hidden px-4 py-3.5 xl:table-cell"><ComplianceBadge score={t.complianceScore} /></td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">{t.ward}</td>
    </tr>
  );
}

function TraderDrawer({ t, onClose }: { t: Trader; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative flex w-full max-w-sm flex-col overflow-y-auto rounded-l-2xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
            {t.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-bold text-ink">{t.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{t.traderId}</div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary">
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Status */}
        <div className="flex gap-2 border-b border-border px-5 py-3">
          <PaidBadge paid={t.paidToday} />
          <CategoryBadge cat={t.category} />
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {t.status}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-4 space-y-5">
          <section>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identity</h3>
            <dl className="space-y-2 text-sm">
              {[
                ["Phone", t.phone],
                ["Gender", t.gender],
                ["Ward", t.ward],
                ["NIN", t.nin ?? "Not provided"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <dt className="text-muted-foreground">{l}</dt>
                  <dd className="font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trade Details</h3>
            <dl className="space-y-2 text-sm">
              {[
                ["Market", t.marketName],
                ["Trade Type", t.tradeType],
                ["Zone", t.zone],
                ["Category", `Category ${t.category}`],
                ["Pass Type", t.passType],
                ["Daily Rate", `₦${t.dailyRate}`],
                ["Monthly Rate", `₦${t.monthlyRate.toLocaleString()}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <dt className="text-muted-foreground">{l}</dt>
                  <dd className="font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Compliance Profile</h3>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-display text-3xl font-bold text-primary">{t.complianceScore}%</div>
                  <div className="text-xs text-muted-foreground">Compliance Score</div>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/30" />
              </div>
              <div className="mt-3 h-2 rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${t.complianceScore}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-background p-2 text-center">
                  <div className="font-bold text-ink">{t.totalPayments}</div>
                  <div className="text-[10px] text-muted-foreground">Total Payments</div>
                </div>
                <div className="rounded-lg bg-background p-2 text-center">
                  <div className="font-bold text-ink">{t.lastPaid}</div>
                  <div className="text-[10px] text-muted-foreground">Last Paid</div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registration</h3>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <div className="font-semibold text-ink">Registered on {t.registeredAt}</div>
                <div className="text-xs text-muted-foreground">KURCMS Market Registration</div>
              </div>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4 space-y-2">
          {!t.paidToday && (
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95">
              <CheckCircle2 className="h-4 w-4" />
              Collect Payment (₦{t.dailyRate})
            </button>
          )}
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
            <QrCode className="h-4 w-4" />
            View / Print ID Card
          </button>
        </div>
      </div>
    </div>
  );
}

function TradersPage() {
  const [q, setQ] = useState("");
  const [filterMarket, setFilterMarket] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Trader | null>(null);

  const filtered = traders.filter((t) => {
    const matchQ = !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.traderId.includes(q) || t.phone.includes(q);
    const matchMarket = !filterMarket || t.marketId === filterMarket;
    const matchCat = !filterCategory || t.category === filterCategory;
    const matchStatus = !filterStatus || (filterStatus === "paid" ? t.paidToday : filterStatus === "unpaid" ? !t.paidToday : t.status === filterStatus);
    return matchQ && matchMarket && matchCat && matchStatus;
  });

  const totalPaid = traders.filter((t) => t.paidToday).length;
  const totalUnpaid = traders.filter((t) => !t.paidToday).length;
  const avgCompliance = Math.round(traders.reduce((s, t) => s + t.complianceScore, 0) / traders.length);

  return (
    <DashboardShell
      title="Trader Directory"
      subtitle="Markets"
      actions={
        <Link to="/markets/register"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95">
          <UserPlus className="h-4 w-4" />
          Register Trader
        </Link>
      }
    >
      {selected && <TraderDrawer t={selected} onClose={() => setSelected(null)} />}

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Registered Traders", value: traders.length, hint: "In system", icon: <Filter className="h-5 w-5" />, color: "bg-primary/8 text-primary" },
          { label: "Paid Today", value: totalPaid, hint: "Today's collections", icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-emerald-50 text-emerald-700" },
          { label: "Unpaid Today", value: totalUnpaid, hint: "Need collection", icon: <XCircle className="h-5 w-5" />, color: "bg-red-50 text-red-700" },
          { label: "Avg Compliance", value: `${avgCompliance}%`, hint: "Across all traders", icon: <TrendingUp className="h-5 w-5" />, color: "bg-amber-50 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${s.color}`}>{s.icon}</div>
            <div className="font-display text-2xl font-bold text-ink">{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
            <div className="text-[11px] text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, ID or phone…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
          />
        </div>
        <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none">
          <option value="">All Markets</option>
          {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none">
          <option value="">All Categories</option>
          <option value="A">Category A</option>
          <option value="B">Category B</option>
          <option value="C">Category C</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none">
          <option value="">All Statuses</option>
          <option value="paid">Paid Today</option>
          <option value="unpaid">Unpaid Today</option>
          <option value="Suspended">Suspended</option>
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} traders</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Trader</th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground md:table-cell">Trade Type</th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground lg:table-cell">Market</th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground lg:table-cell">Category</th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:table-cell">Today</th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground xl:table-cell">Score</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No traders match your search.</td></tr>
              ) : (
                filtered.map((t) => <TraderRow key={t.id} t={t} onClick={() => setSelected(t)} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom link */}
      <div className="mt-4 flex items-center gap-3">
        <Link to="/markets" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Market Overview
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link to="/markets/collect" className="text-sm font-semibold text-primary hover:underline">
          Go to Market Day Collection →
        </Link>
      </div>
    </DashboardShell>
  );
}
