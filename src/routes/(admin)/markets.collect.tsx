import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { TaxpayerIdCard } from "@/shared/components/ui/TaxpayerIdCard";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { recordPayment } from "@/shared/lib/revenue";
import { fmtNaira } from "@/shared/lib/utils";
import {
  Search,
  QrCode,
  CheckCircle2,
  Banknote,
  Receipt,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Store,
} from "lucide-react";

export const Route = createFileRoute("/(admin)/markets/collect")({
  head: () => ({ meta: [{ title: "Market Day Collection — Kwali Market System" }] }),
  component: CollectPage,
});

// Market daily-toll collection against the real register.
//
// A stall counts as PAID TODAY when a confirmed, unreversed market_toll payment
// exists against it with today's date — the same ledger the marshal dashboard
// and the taxpayer portal read, so nobody sees a different truth.

type Stall = {
  id: string;
  ref: string;
  qr_token: string | null;
  trader_name: string;
  trader_phone: string | null;
  market_name: string;
  stall_number: string | null;
  goods_category: string | null;
  ward: string | null;
  daily_toll: number | null;
  status: string;
};

type CollectedTicket = {
  stallId: string;
  traderName: string;
  market: string;
  amount: number;
  receiptNo: string | null;
  ref: string;
  time: string;
};

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function CollectPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Stall[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [paidToday, setPaidToday] = useState<Set<string>>(new Set());
  const [collecting, setCollecting] = useState<string | null>(null);
  const [collected, setCollected] = useState<CollectedTicket[]>([]);
  const [cardFor, setCardFor] = useState<Stall | null>(null);

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /** Refresh paid-today status for the stalls currently on screen. */
  const refreshPaid = useCallback(async (stalls: Stall[]) => {
    if (!stalls.length) return;
    const { data } = await supabase
      .from("payments")
      .select("source_id")
      .eq("source_table", "market_stalls")
      .in("source_id", stalls.map((s) => s.id))
      .eq("status", "confirmed")
      .gte("created_at", todayStart());
    setPaidToday(new Set(((data ?? []) as { source_id: string }[]).map((p) => p.source_id)));
  }, []);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return;
    setSearching(true);
    try {
      // Match on name, public ref, stall number, phone — or the opaque QR token
      // an officer gets by scanning the trader's ID card.
      const like = `%${term.replace(/[%_]/g, "")}%`;
      const { data, error } = await supabase
        .from("market_stalls")
        .select(
          "id, ref, qr_token, trader_name, trader_phone, market_name, stall_number, goods_category, ward, daily_toll, status",
        )
        .or(
          `trader_name.ilike.${like},ref.ilike.${like},stall_number.ilike.${like},trader_phone.ilike.${like},qr_token.eq.${term}`,
        )
        .eq("status", "Active")
        .order("trader_name")
        .limit(20);
      if (error) throw new Error(error.message);
      const stalls = (data ?? []) as Stall[];
      setResults(stalls);
      setSearched(true);
      await refreshPaid(stalls);
      if (stalls.length === 0) toast.info("No active trader matches that search");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const collect = async (stall: Stall) => {
    if (!user) return;
    const amount = Number(stall.daily_toll) || 100;
    setCollecting(stall.id);
    try {
      const day = new Date().toISOString().slice(0, 10);
      const { ref, receiptNo } = await recordPayment({
        collectorId: user.id,
        collectorRole: "officer",
        payerName: stall.trader_name,
        sourceTable: "market_stalls",
        sourceId: stall.id,
        sourceRef: stall.ref,
        revenueType: "market_toll",
        amount,
        channel: "cash",
        ward: stall.ward,
        obligationPeriod: day,
        // One toll per stall per day — a double-tap retries safely instead of
        // double-charging the trader.
        idempotencyKey: `toll:${stall.id}:${day}`,
      });
      const now = new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
      setCollected((prev) => [
        { stallId: stall.id, traderName: stall.trader_name, market: stall.market_name, amount, receiptNo, ref, time: now },
        ...prev,
      ]);
      setPaidToday((prev) => new Set(prev).add(stall.id));
      toast.success(`Toll collected · ${fmtNaira(amount)}`, {
        description: receiptNo ? `Receipt ${receiptNo}` : ref,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the toll");
    } finally {
      setCollecting(null);
    }
  };

  const totalToday = collected.reduce((s, c) => s + c.amount, 0);

  return (
    <DashboardShell
      title="Market Day Collection"
      subtitle="Daily tolls"
      actions={
        <Link
          to="/markets"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" /> Markets
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Search + results */}
        <div className="space-y-4 lg:col-span-2">
          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-bold text-ink">Find a trader</h2>
            <p className="text-sm text-muted-foreground">
              Search by name, trader ID, stall or phone — or scan the QR on their ID card. Today is{" "}
              <span className="font-semibold text-ink">{today}</span>.
            </p>
            <form onSubmit={search} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="e.g. Hauwa Musa · KWL-TRD-2026-… · B12"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                Find
              </button>
            </form>
          </div>

          {searched && results.length === 0 && !searching && (
            <div className="surface-card p-10 text-center">
              <Store className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-semibold text-ink">No active trader found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check the spelling, or ask a marshal to onboard the trader first.
              </p>
            </div>
          )}

          {results.map((stall) => {
            const paid = paidToday.has(stall.id);
            const toll = Number(stall.daily_toll) || 100;
            const busy = collecting === stall.id;
            return (
              <div key={stall.id} className="surface-card p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                    {stall.trader_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-display text-base font-bold text-ink">
                          {stall.trader_name}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">{stall.ref}</div>
                      </div>
                      {paid ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> PAID TODAY
                        </span>
                      ) : (
                        <StatusBadge tone="danger">NOT PAID</StatusBadge>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span><strong className="text-ink">Market:</strong> {stall.market_name}</span>
                      <span><strong className="text-ink">Stall:</strong> {stall.stall_number ?? "—"}</span>
                      <span><strong className="text-ink">Goods:</strong> {stall.goods_category ?? "—"}</span>
                      <span><strong className="text-ink">Ward:</strong> {stall.ward ?? "—"}</span>
                    </div>
                  </div>
                </div>

                {!paid && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface p-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Daily toll</div>
                      <div className="font-display text-xl font-bold text-ink">{fmtNaira(toll)}</div>
                    </div>
                    <button
                      onClick={() => collect(stall)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                      Collect {fmtNaira(toll)}
                    </button>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3 text-[11px]">
                  <button
                    onClick={() => setCardFor(stall)}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <QrCode className="h-3 w-3" /> View ID card
                  </button>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    {paid ? "Toll settled for today" : "Collect before trading begins"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Session summary + ID card preview */}
        <div className="space-y-4">
          <div className="surface-card p-5">
            <h3 className="font-display text-base font-bold text-ink">Today's session</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <div className="font-display text-2xl font-bold text-primary">{collected.length}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tolls collected
                </div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <div className="font-display text-2xl font-bold text-primary">{fmtNaira(totalToday)}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  This session
                </div>
              </div>
            </div>
          </div>

          {cardFor && (
            <div className="surface-card p-5">
              <h3 className="mb-3 font-display text-base font-bold text-ink">Trader ID card</h3>
              <TaxpayerIdCard
                refNo={cardFor.ref}
                qrToken={cardFor.qr_token}
                name={cardFor.trader_name}
                kind="Market Trader"
                lines={[
                  { label: "Market", value: cardFor.market_name },
                  { label: "Stall", value: cardFor.stall_number ?? "—" },
                  { label: "Goods", value: cardFor.goods_category ?? "—" },
                  { label: "Ward", value: cardFor.ward ?? "—" },
                ]}
              />
            </div>
          )}

          {collected.length > 0 && (
            <div className="surface-card p-5">
              <h3 className="font-display text-base font-bold text-ink">Collected this session</h3>
              <div className="mt-3 space-y-2">
                {collected.map((c) => (
                  <div
                    key={c.ref}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-emerald-800">
                          {c.traderName}
                        </div>
                        <div className="text-[11px] text-emerald-700">{c.market} · {c.time}</div>
                      </div>
                      <div className="shrink-0 font-bold text-emerald-800">{fmtNaira(c.amount)}</div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 border-t border-emerald-200 pt-1.5">
                      <Receipt className="h-3 w-3 text-emerald-600" />
                      <span className="font-mono text-[10px] text-emerald-700">
                        {c.receiptNo ?? c.ref}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
