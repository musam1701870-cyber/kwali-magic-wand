import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  ShieldCheck,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { OfficerGuard } from "@/shared/components/layout/RoleGuard";
import { IssuedIdCards } from "@/shared/components/ui/IssuedIdCards";
import { fmtNaira } from "@/shared/lib/utils";
import {
  fetchPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  recordPayment,
  type PendingRegistration,
  type RegistrationTable,
} from "@/shared/lib/revenue";

export const Route = createFileRoute("/(dashboard)/officer/")({
  head: () => ({ meta: [{ title: "Officer Dashboard — Kwali Revenue Portal" }] }),
  component: OfficerDashboard,
});

function OfficerDashboard() {
  return (
    <DashboardShell title="Officer Dashboard" subtitle="Revenue operations and compliance" requireAdmin={false}>
      <OfficerGuard>
        <OfficerDashboardContent />
      </OfficerGuard>
    </DashboardShell>
  );
}

type PaymentRow = {
  id: string;
  ref: string;
  collector_id: string | null;
  collector_role: string | null;
  source_ref: string | null;
  source_table: string;
  revenue_type: string;
  amount: number;
  channel: string;
  ward: string | null;
  created_at: string;
};

type Tab = "overview" | "approvals" | "collections" | "idcards";

const TAB_VALUES: Tab[] = ["overview", "approvals", "collections", "idcards"];

function OfficerDashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const locHash = useRouterState({ select: (s) => s.location.hash });
  const [activeTab, setActiveTabState] = useState<Tab>("overview");

  // Tab is driven by the URL hash (/officer#approvals) so the sidebar can deep-link
  // straight to a tab and stay in sync with the in-page tab bar.
  const setActiveTab = useCallback(
    (t: Tab) => {
      setActiveTabState(t);
      void navigate({ to: "/officer", hash: t === "overview" ? "" : t, replace: true });
    },
    [navigate],
  );
  useEffect(() => {
    const h = (locHash || "overview") as Tab;
    setActiveTabState(TAB_VALUES.includes(h) ? h : "overview");
  }, [locHash]);
  const [pending, setPending] = useState<PendingRegistration[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [collectorNames, setCollectorNames] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [actioningKey, setActioningKey] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRecord, setShowRecord] = useState(false);

  const stats = {
    pending_approvals: pending.length,
    collections_today: payments
      .filter((p) => p.created_at >= startOfToday())
      .reduce((s, p) => s + (Number(p.amount) || 0), 0),
    collections_month: payments
      .filter((p) => p.created_at >= startOfMonth())
      .reduce((s, p) => s + (Number(p.amount) || 0), 0),
    collections_count: payments.length,
  };

  useEffect(() => {
    if (!user) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoadingData(true);
    try {
      const [pendingRows, paymentsRes] = await Promise.all([
        fetchPendingRegistrations(),
        supabase
          .from("payments")
          .select("id, ref, collector_id, collector_role, source_ref, source_table, revenue_type, amount, channel, ward, created_at")
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      setPending(pendingRows);
      const pays = (paymentsRes.data as PaymentRow[]) || [];
      setPayments(pays);

      const ids = [...new Set(pays.map((p) => p.collector_id).filter(Boolean))] as string[];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map: Record<string, string> = {};
        for (const pr of profs ?? []) map[pr.id as string] = (pr.full_name as string) || "Collector";
        setCollectorNames(map);
      }
    } catch (e) {
      console.error("Error loading officer data:", e);
      toast.error("Could not load dashboard data");
    } finally {
      setLoadingData(false);
    }
  }

  async function handleApprove(item: PendingRegistration) {
    if (!user) return;
    setActioningKey(item.table + item.id);
    try {
      await approveRegistration(item.table as RegistrationTable, item.id, user.id);
      toast.success(`Approved ${item.name} (${item.ref})`);
      setPending((prev) => prev.filter((p) => !(p.table === item.table && p.id === item.id)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setActioningKey(null);
    }
  }

  async function handleReject() {
    if (!user || !rejecting) return;
    if (!rejectReason.trim()) {
      toast.error("Please give a reason");
      return;
    }
    setActioningKey(rejecting.table + rejecting.id);
    try {
      await rejectRegistration(rejecting.table as RegistrationTable, rejecting.id, user.id, rejectReason.trim());
      toast.success(`Rejected ${rejecting.name}`);
      setPending((prev) => prev.filter((p) => !(p.table === rejecting.table && p.id === rejecting.id)));
      setRejecting(null);
      setRejectReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setActioningKey(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<TrendingUp className="h-4 w-4" />}>
          Overview
        </TabButton>
        <TabButton active={activeTab === "approvals"} onClick={() => setActiveTab("approvals")} icon={<Clock className="h-4 w-4" />}>
          Approvals{stats.pending_approvals > 0 ? ` (${stats.pending_approvals})` : ""}
        </TabButton>
        <TabButton active={activeTab === "collections"} onClick={() => setActiveTab("collections")} icon={<FileText className="h-4 w-4" />}>
          Collections
        </TabButton>
        <TabButton active={activeTab === "idcards"} onClick={() => setActiveTab("idcards")} icon={<QrCode className="h-4 w-4" />}>
          ID Cards
        </TabButton>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Revenue Operations Overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">Approvals and collection activity across your wards</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Pending Approvals" value={stats.pending_approvals} icon={<Clock className="h-5 w-5 text-white" />} color="bg-amber-500" trend="Awaiting your review" />
            <StatCard label="Collections Today" value={stats.collections_today} icon={<FileText className="h-5 w-5 text-white" />} color="bg-green-500" trend="Confirmed receipts" isCurrency />
            <StatCard label="Collections This Month" value={stats.collections_month} icon={<TrendingUp className="h-5 w-5 text-white" />} color="bg-primary" trend="Month to date" isCurrency />
            <StatCard label="Total Receipts" value={stats.collections_count} icon={<Users className="h-5 w-5 text-white" />} color="bg-blue-500" trend="On record" />
          </div>

          <div className="surface-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <QuickAction onClick={() => setActiveTab("approvals")} icon={<Clock className="h-6 w-6" />} title="Review Approvals" subtitle="Approve or reject registrations" color="bg-amber-100 text-amber-600" />
              <QuickAction onClick={() => { setActiveTab("collections"); setShowRecord(true); }} icon={<Plus className="h-6 w-6" />} title="Record Collection" subtitle="Log a payment received" color="bg-green-100 text-green-600" />
              <QuickAction onClick={() => setActiveTab("collections")} icon={<FileText className="h-6 w-6" />} title="View Collections" subtitle="Browse the receipt ledger" color="bg-blue-100 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Approval Queue</h1>
            <p className="mt-1 text-sm text-muted-foreground">Every self-service registration lands here for review</p>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading pending registrations…</div>
          ) : pending.length === 0 ? (
            <div className="surface-card flex flex-col items-center gap-2 p-10 text-center">
              <CheckCircle className="h-10 w-10 text-success" />
              <p className="font-semibold text-ink">All caught up</p>
              <p className="text-sm text-muted-foreground">No registrations are awaiting approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((item) => {
                const busy = actioningKey === item.table + item.id;
                return (
                  <div key={item.table + item.id} className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-ink">{item.name}</p>
                        <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{item.ref}</span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.ward ? `Ward ${item.ward} · ` : ""}Submitted {item.created_at.split("T")[0]}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleApprove(item)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve
                      </button>
                      <button
                        onClick={() => { setRejecting(item); setRejectReason(""); }}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "collections" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Collections Ledger</h1>
              <p className="mt-1 text-sm text-muted-foreground">Confirmed receipts across all collectors</p>
            </div>
            <button
              onClick={() => setShowRecord(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Record Collection
            </button>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading collections…</div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-muted-foreground">No collections recorded yet.</div>
          ) : (
            <div className="surface-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <Th>Date</Th>
                    <Th>Receipt</Th>
                    <Th>Source</Th>
                    <Th>Type</Th>
                    <Th>Channel</Th>
                    <Th>Collector</Th>
                    <Th>Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface">
                      <td className="p-3 text-sm">{p.created_at.split("T")[0]}</td>
                      <td className="p-3 font-mono text-xs">{p.ref}</td>
                      <td className="p-3 text-sm">{p.source_ref || p.source_table}</td>
                      <td className="p-3 text-sm capitalize">{p.revenue_type.replace(/_/g, " ")}</td>
                      <td className="p-3 text-sm capitalize">{p.channel}</td>
                      <td className="p-3 text-sm">{(p.collector_id && collectorNames[p.collector_id]) || p.collector_role || "—"}</td>
                      <td className="p-3 text-sm font-semibold text-ink">{fmtNaira(Number(p.amount) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- ID Cards */}
      {activeTab === "idcards" && user && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">ID Cards I've Issued</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every trader and transport operator you registered — their digital ID card with its
              scannable QR, ready to reprint any time.
            </p>
          </div>
          <IssuedIdCards staffId={user.id} />
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <Modal onClose={() => setRejecting(null)} title={`Reject ${rejecting.name}`}>
          <p className="text-sm text-muted-foreground">Tell the applicant why this registration was rejected.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="e.g. CAC number could not be verified"
            className="mt-3 w-full rounded-lg border border-border bg-surface p-3 text-sm outline-none focus:border-primary"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setRejecting(null)} className="rounded-lg border border-border px-3 py-2 text-sm font-medium">Cancel</button>
            <button onClick={handleReject} className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-white">
              <XCircle className="h-4 w-4" /> Confirm Reject
            </button>
          </div>
        </Modal>
      )}

      {/* Record collection modal */}
      {showRecord && user && (
        <RecordCollectionModal
          onClose={() => setShowRecord(false)}
          onRecorded={() => {
            setShowRecord(false);
            void loadData();
          }}
          collectorId={user.id}
        />
      )}
    </main>
  );
}

function RecordCollectionModal({ collectorId, onClose, onRecorded }: { collectorId: string; onClose: () => void; onRecorded: () => void }) {
  const [amount, setAmount] = useState("");
  const [revenueType, setRevenueType] = useState("business_levy");
  const [channel, setChannel] = useState("cash");
  const [ward, setWard] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const { ref, receiptNo } = await recordPayment({
        collectorId,
        collectorRole: "officer",
        sourceTable: "manual",
        sourceRef: sourceRef || null,
        revenueType,
        amount: amt,
        channel,
        ward: ward || null,
        notes: notes || null,
      });
      toast.success(`Collection recorded · ${receiptNo ?? ref}`, {
        description: receiptNo ? "Official receipt issued." : undefined,
      });
      onRecorded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record collection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Record Collection">
      <div className="space-y-3">
        <Field label="Amount (₦)">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="0" className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm outline-none focus:border-primary" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Revenue type">
            <select value={revenueType} onChange={(e) => setRevenueType(e.target.value)} className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm outline-none focus:border-primary">
              <option value="business_levy">Business levy</option>
              <option value="tenement_rate">Tenement rate</option>
              <option value="market_toll">Market toll</option>
              <option value="daily_ticket">Transport ticket</option>
              <option value="permit_fee">Permit fee</option>
              <option value="sanitation_levy">Sanitation levy</option>
              <option value="penalty">Penalty</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Channel">
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm outline-none focus:border-primary">
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
              <option value="transfer">Transfer</option>
              <option value="online">Online</option>
              <option value="ussd">USSD</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ward">
            <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="e.g. Kwali Central" className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm outline-none focus:border-primary" />
          </Field>
          <Field label="Reference (optional)">
            <input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="Taxpayer / asset ref" className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm outline-none focus:border-primary" />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm outline-none focus:border-primary" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm font-medium">Cancel</button>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 font-display text-lg font-bold text-ink">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 text-left text-xs font-semibold text-muted-foreground">{children}</th>;
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
        active ? "bg-primary text-white shadow-sm" : "border border-border bg-card text-muted-foreground hover:text-ink"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function QuickAction({ onClick, icon, title, subtitle, color }: { onClick: () => void; icon: React.ReactNode; title: string; subtitle: string; color: string }) {
  return (
    <button onClick={onClick} className="surface-card surface-card--interactive group flex items-center gap-3 p-4 text-left">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="font-semibold text-ink group-hover:text-primary">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  );
}

function StatCard({ label, value, icon, color, trend, isCurrency }: { label: string; value: number; icon: React.ReactNode; color: string; trend: string; isCurrency?: boolean }) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>{icon}</div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-ink">{isCurrency ? fmtNaira(value) : value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] font-medium text-muted-foreground">{trend}</div>
    </div>
  );
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
