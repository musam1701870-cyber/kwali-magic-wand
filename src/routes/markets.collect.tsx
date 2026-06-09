import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { traders, markets, marketOfficers, type Trader } from "@/lib/kwali-mock";
import {
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  MapPin,
  Receipt,
  AlertCircle,
  UserCheck,
  ArrowLeft,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/markets/collect")({
  head: () => ({ meta: [{ title: "Market Day Collection — Kwali Market System" }] }),
  component: CollectPage,
});

type CollectedTicket = {
  traderId: string;
  traderName: string;
  market: string;
  amount: number;
  receiptNo: string;
  time: string;
};

function CollectionReceipt({ ticket }: { ticket: CollectedTicket }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="flex-1">
          <div className="font-semibold text-emerald-800">Payment Collected</div>
          <div className="mt-0.5 text-xs text-emerald-700">{ticket.traderName} — {ticket.market}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-emerald-800">₦{ticket.amount}</div>
          <div className="text-[10px] text-emerald-600">{ticket.time}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 border-t border-emerald-200 pt-2">
        <Receipt className="h-3.5 w-3.5 text-emerald-600" />
        <span className="font-mono text-[11px] text-emerald-700">{ticket.receiptNo}</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600"><MapPin className="h-3 w-3" />GPS: 8.8799°N, 7.1341°E</span>
      </div>
    </div>
  );
}

function TraderSearchResult({ t, onCollect }: { t: Trader; onCollect: (t: Trader) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      {/* Trader info */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
          {t.initials}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-display text-lg font-bold text-ink">{t.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{t.traderId}</div>
            </div>
            {t.paidToday ? (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                PAID TODAY
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">
                <XCircle className="h-4 w-4" />
                NOT PAID TODAY
              </div>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><strong className="text-ink">Trade:</strong> {t.tradeType}</span>
            <span><strong className="text-ink">Market:</strong> {t.marketName}</span>
            <span><strong className="text-ink">Zone:</strong> {t.zone}</span>
            <span><strong className="text-ink">Category:</strong> Category {t.category}</span>
          </div>
        </div>
      </div>

      {/* Payment action */}
      {!t.paidToday ? (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Amount Due</div>
              <div className="font-display text-2xl font-bold text-ink">₦{t.dailyRate}</div>
              <div className="text-[11px] text-muted-foreground">
                {t.passType === "Monthly" ? "Monthly pass holder · ₦2,000/mo" : `Daily ticket · Category ${t.category}`}
              </div>
            </div>
            <button
              onClick={() => onCollect(t)}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
            >
              <Banknote className="h-4 w-4" />
              Collect ₦{t.dailyRate}
            </button>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Last paid: {t.lastPaid} · Compliance score: {t.complianceScore}%
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>Already paid today. Last payment: <strong>{t.lastPaid}</strong></span>
        </div>
      )}

      {/* Compliance bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Compliance Score</span>
          <span className="font-semibold">{t.complianceScore}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary">
          <div
            className={`h-1.5 rounded-full transition-all ${t.complianceScore >= 85 ? "bg-emerald-500" : t.complianceScore >= 60 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${t.complianceScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CollectPage() {
  const [q, setQ] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("m1");
  const [results, setResults] = useState<Trader[]>([]);
  const [searched, setSearched] = useState(false);
  const [collected, setCollected] = useState<CollectedTicket[]>([]);
  const [localPaid, setLocalPaid] = useState<Set<string>>(new Set());

  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const officer = marketOfficers[0];
  const market = markets.find((m) => m.id === selectedMarket);

  // Today's session stats
  const marketTraders = traders.filter((t) => t.marketId === selectedMarket);
  const paidCount = marketTraders.filter((t) => t.paidToday || localPaid.has(t.id)).length;
  const totalRevenue = collected.reduce((s, c) => s + c.amount, 0) + marketTraders.filter((t) => t.paidToday).reduce((s, t) => s + t.dailyRate, 0);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    const found = traders.filter((t) => {
      const inMarket = !selectedMarket || t.marketId === selectedMarket;
      const matchQ = t.name.toLowerCase().includes(q.toLowerCase()) || t.traderId.toLowerCase().includes(q.toLowerCase()) || t.phone.includes(q);
      return inMarket && matchQ;
    });
    setResults(found);
    setSearched(true);
  };

  const collect = (t: Trader) => {
    const n = Math.floor(100000 + Math.random() * 899999);
    const receiptNo = `KWL-MKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${n}`;
    const now = new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
    setCollected((prev) => [{ traderId: t.id, traderName: t.name, market: t.marketName, amount: t.dailyRate, receiptNo, time: now }, ...prev]);
    setLocalPaid((prev) => new Set([...prev, t.id]));
    setResults((prev) => prev.map((r) => r.id === t.id ? { ...r, paidToday: true } : r));
  };

  return (
    <DashboardShell
      title="Market Day Collection"
      subtitle="Markets"
      actions={
        <Link to="/markets" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" /> Markets
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Search & collect */}
        <div className="space-y-5 lg:col-span-2">
          {/* Officer + day header */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-display text-base font-bold text-ink">{officer.name}</div>
                  <div className="text-xs text-muted-foreground">{officer.badge} · Revenue Officer</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-ink">{today}</span>
              </div>
            </div>
            {/* Market selector */}
            <div className="mt-4 flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={selectedMarket}
                onChange={(e) => { setSelectedMarket(e.target.value); setResults([]); setSearched(false); }}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none"
              >
                {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Session
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 font-display text-base font-bold text-ink">Search Trader</h2>
            <form onSubmit={search} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Name, Trader ID or phone number…"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none ring-primary/30 transition focus:ring-2"
                />
              </div>
              <button type="submit"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-95">
                <Search className="h-4 w-4" /> Search
              </button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
              <QrCode className="h-3 w-3" />
              In the mobile app, officers can scan the trader's QR card directly
            </p>
          </div>

          {/* Results */}
          {searched && (
            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <div className="font-semibold text-ink">No trader found</div>
                  <p className="mt-1 text-sm text-muted-foreground">Check the name or ID. If this is a new trader, register them first.</p>
                  <Link to="/markets/register"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-95">
                    Register New Trader
                  </Link>
                </div>
              ) : (
                results.map((t) => (
                  <TraderSearchResult
                    key={t.id}
                    t={{ ...t, paidToday: t.paidToday || localPaid.has(t.id) }}
                    onCollect={collect}
                  />
                ))
              )}
            </div>
          )}

          {/* Recent collections */}
          {collected.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Receipts Issued This Session</h3>
              {collected.map((c) => <CollectionReceipt key={c.receiptNo} ticket={c} />)}
            </div>
          )}
        </div>

        {/* Right: Session summary */}
        <div className="space-y-5">
          {/* Today's stats */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 font-display text-base font-bold text-ink">Today's Session</h2>
            <div className="text-xs font-semibold text-muted-foreground mb-1">{market?.name}</div>
            <div className="space-y-3">
              {[
                { label: "Registered", value: market?.traders ?? 0, icon: <UserCheck className="h-4 w-4" />, color: "text-primary" },
                { label: "Present (est.)", value: Math.round((market?.traders ?? 0) * 0.77), icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-600" },
                { label: "Paid Today", value: paidCount + collected.length, icon: <Banknote className="h-4 w-4" />, color: "text-emerald-700" },
                { label: "Revenue Collected", value: `₦${(totalRevenue + collected.reduce((s, c) => s + c.amount, 0)).toLocaleString()}`, icon: <Receipt className="h-4 w-4" />, color: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={s.color}>{s.icon}</span>
                    {s.label}
                  </span>
                  <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Officer stats */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 font-display text-base font-bold text-ink">Officer Performance</h2>
            <div className="space-y-3">
              {marketOfficers.slice(0, 3).map((o) => (
                <div key={o.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {o.name.split(" ").map((p) => p[0]).join("").slice(1, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{o.name}</div>
                    <div className="text-[11px] text-muted-foreground">{o.receiptsToday} receipts</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">₦{(o.collectedToday / 1000).toFixed(0)}K</div>
                    <div className={`text-[10px] font-semibold ${o.efficiency >= 85 ? "text-emerald-600" : "text-amber-600"}`}>{o.efficiency}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick tip */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p className="text-xs leading-relaxed text-foreground/80">
                Every collection generates a <strong>receipt number</strong>, <strong>officer ID</strong>, <strong>GPS stamp</strong> and <strong>timestamp</strong>. No receipt = no valid collection.
              </p>
            </div>
          </div>

          {/* Nav links */}
          <div className="space-y-2">
            <Link to="/markets/traders"
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
              <UserCheck className="h-4 w-4 text-primary" /> Trader Directory
            </Link>
            <Link to="/markets/register"
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
              <UserCheck className="h-4 w-4 text-primary" /> Register New Trader
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
