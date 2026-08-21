import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  Wallet,
  Truck,
  Store,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  UserPlus,
  Award,
  ClipboardCheck,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { MarshalGuard } from "@/shared/components/layout/RoleGuard";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { TaxpayerIdCard } from "@/shared/components/ui/TaxpayerIdCard";
import { IssuedIdCards } from "@/shared/components/ui/IssuedIdCards";
import { fmtNaira } from "@/shared/lib/utils";
import {
  genRef,
  recordPayment,
  fetchCollectorTotals,
  fetchOnboardedCount,
  type CollectorTotals,
} from "@/shared/lib/revenue";

export const Route = createFileRoute("/(dashboard)/marshal/")({
  head: () => ({ meta: [{ title: "Marshal Dashboard — Kwali Revenue Portal" }] }),
  component: MarshalDashboard,
});

const WARDS = ["Kwali", "Yangoji", "Yebu", "Ashara", "Dafa", "Pai", "Gumbo", "Kilankwa"];

function MarshalDashboard() {
  return (
    <DashboardShell title="Marshal Dashboard" subtitle="Field operations and enforcement" requireAdmin={false}>
      <MarshalGuard>
        <MarshalDashboardContent />
      </MarshalGuard>
    </DashboardShell>
  );
}

// --- Row shapes (match `select("*")` results, so nullables are honest) --------
type TransportVerification = {
  id: string;
  plate_number: string;
  vehicle_type: string;
  is_valid: boolean;
  verification_method: string;
  ward: string | null;
  created_at: string;
};

type MarketVerification = {
  id: string;
  trader_name: string;
  market_name: string;
  stall_number: string | null;
  is_valid: boolean;
  verification_method: string;
  ward: string | null;
  created_at: string;
};

type EnforcementIncident = {
  id: string;
  incident_type: string;
  subject_type: string;
  subject_name: string | null;
  subject_identifier: string | null;
  ward: string | null;
  status: string;
  penalty_amount: number | null;
  created_at: string;
  resolved_at: string | null;
};

type PaymentRow = {
  id: string;
  ref: string;
  source_ref: string | null;
  source_table: string;
  revenue_type: string;
  amount: number;
  channel: string;
  ward: string | null;
  created_at: string;
};

type Tab = "overview" | "onboard" | "collections" | "verifications" | "incidents" | "idcards";

const TAB_VALUES: Tab[] = ["overview", "onboard", "collections", "verifications", "incidents", "idcards"];

const EMPTY_TOTALS: CollectorTotals = { today: 0, month: 0, allTime: 0, countToday: 0, countAllTime: 0 };

function MarshalDashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const locHash = useRouterState({ select: (s) => s.location.hash });
  const [activeTab, setActiveTabState] = useState<Tab>("overview");

  // The sidebar deep-links each tab via the URL hash (/marshal#collections).
  // Keep the hash as the single source of truth so sidebar nav and the in-page
  // tab bar can never drift apart.
  const setActiveTab = useCallback(
    (t: Tab) => {
      setActiveTabState(t);
      void navigate({ to: "/marshal", hash: t === "overview" ? "" : t, replace: true });
    },
    [navigate],
  );
  useEffect(() => {
    const h = (locHash || "overview") as Tab;
    setActiveTabState(TAB_VALUES.includes(h) ? h : "overview");
  }, [locHash]);

  const [transport, setTransport] = useState<TransportVerification[]>([]);
  const [market, setMarket] = useState<MarketVerification[]>([]);
  const [incidents, setIncidents] = useState<EnforcementIncident[]>([]);
  const [collections, setCollections] = useState<PaymentRow[]>([]);
  const [totals, setTotals] = useState<CollectorTotals>(EMPTY_TOTALS);
  const [onboarded, setOnboarded] = useState(0);

  const [loadingData, setLoadingData] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const [showIncident, setShowIncident] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoadingData(true);
    try {
      const [transportRes, marketRes, incidentsRes, collectionsRes, totalsRes, onboardedRes] = await Promise.all([
        supabase
          .from("transport_ticket_verifications")
          .select("id, plate_number, vehicle_type, is_valid, verification_method, ward, created_at")
          .eq("marshal_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("market_payment_verifications")
          .select("id, trader_name, market_name, stall_number, is_valid, verification_method, ward, created_at")
          .eq("marshal_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("enforcement_incidents")
          .select("id, incident_type, subject_type, subject_name, subject_identifier, ward, status, penalty_amount, created_at, resolved_at")
          .eq("marshal_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("payments")
          .select("id, ref, source_ref, source_table, revenue_type, amount, channel, ward, created_at")
          .eq("collector_id", user.id)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(100),
        fetchCollectorTotals(user.id),
        fetchOnboardedCount(user.id),
      ]);

      setTransport((transportRes.data as TransportVerification[]) || []);
      setMarket((marketRes.data as MarketVerification[]) || []);
      setIncidents((incidentsRes.data as EnforcementIncident[]) || []);
      setCollections((collectionsRes.data as PaymentRow[]) || []);
      setTotals(totalsRes);
      setOnboarded(onboardedRes);
    } catch (e) {
      console.error("Error loading marshal data:", e);
      toast.error("Could not load dashboard data");
    } finally {
      setLoadingData(false);
    }
  }

  const startToday = startOfToday();
  const transportToday = transport.filter((v) => v.created_at >= startToday).length;
  const marketToday = market.filter((v) => v.created_at >= startToday).length;
  const incidentsToday = incidents.filter((i) => i.created_at >= startToday).length;
  const openIncidents = incidents.filter((i) => i.status === "open").length;
  const verifiedToday = transportToday + marketToday;

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<Award className="h-4 w-4" />}>
          My Achievements
        </TabButton>
        <TabButton active={activeTab === "onboard"} onClick={() => setActiveTab("onboard")} icon={<UserPlus className="h-4 w-4" />}>
          Onboard Trader
        </TabButton>
        <TabButton active={activeTab === "collections"} onClick={() => setActiveTab("collections")} icon={<Wallet className="h-4 w-4" />}>
          Collections
        </TabButton>
        <TabButton active={activeTab === "verifications"} onClick={() => setActiveTab("verifications")} icon={<ClipboardCheck className="h-4 w-4" />}>
          Verifications
        </TabButton>
        <TabButton active={activeTab === "incidents"} onClick={() => setActiveTab("incidents")} icon={<AlertTriangle className="h-4 w-4" />}>
          Incidents{openIncidents > 0 ? ` (${openIncidents})` : ""}
        </TabButton>
        <TabButton active={activeTab === "idcards"} onClick={() => setActiveTab("idcards")} icon={<QrCode className="h-4 w-4" />}>
          ID Cards
        </TabButton>
      </div>

      {/* ---------------------------------------------------------------- Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">My Achievements</h1>
            <p className="mt-1 text-sm text-muted-foreground">Revenue you have covered and the work you have done in the field</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Collected Today" value={totals.today} icon={<Wallet className="h-5 w-5 text-white" />} color="bg-green-500" trend={`${totals.countToday} receipt${totals.countToday === 1 ? "" : "s"} today`} isCurrency />
            <StatCard label="Collected This Month" value={totals.month} icon={<TrendingUp className="h-5 w-5 text-white" />} color="bg-primary" trend="Month to date" isCurrency />
            <StatCard label="Collected All-Time" value={totals.allTime} icon={<Award className="h-5 w-5 text-white" />} color="bg-amber-500" trend={`${totals.countAllTime} receipts total`} isCurrency />
            <StatCard label="Traders Onboarded" value={onboarded} icon={<UserPlus className="h-5 w-5 text-white" />} color="bg-blue-500" trend="Registered by you" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Verifications Today" value={verifiedToday} icon={<ClipboardCheck className="h-5 w-5 text-white" />} color="bg-teal-500" trend={`${transportToday} transport · ${marketToday} market`} />
            <StatCard label="Transport Checks" value={transport.length} icon={<Truck className="h-5 w-5 text-white" />} color="bg-indigo-500" trend="Recent (last 100)" />
            <StatCard label="Incidents Logged" value={incidentsToday} icon={<AlertTriangle className="h-5 w-5 text-white" />} color="bg-red-500" trend="Today" />
            <StatCard label="Open Cases" value={openIncidents} icon={<Clock className="h-5 w-5 text-white" />} color="bg-orange-500" trend="Requires follow-up" />
          </div>

          <div className="surface-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction onClick={() => navigate({ to: "/register", search: { category: undefined } })} icon={<UserPlus className="h-6 w-6" />} title="Onboard Trader" subtitle="Full registration form" color="bg-blue-100 text-blue-600" />
              <QuickAction onClick={() => setShowRecord(true)} icon={<Plus className="h-6 w-6" />} title="Record Collection" subtitle="Log a toll / ticket collected" color="bg-green-100 text-green-600" />
              <QuickAction onClick={() => setActiveTab("verifications")} icon={<ClipboardCheck className="h-6 w-6" />} title="Verifications" subtitle="See tickets & receipts checked" color="bg-teal-100 text-teal-600" />
              <QuickAction onClick={() => setShowIncident(true)} icon={<AlertTriangle className="h-6 w-6" />} title="Log Incident" subtitle="Report an enforcement action" color="bg-red-100 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- Onboard */}
      {activeTab === "onboard" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Onboard a Trader</h1>
              <p className="mt-1 text-sm text-muted-foreground">Register market women, petty traders and okada/keke operators using the full council registration form.</p>
            </div>
            <button onClick={() => navigate({ to: "/register", search: { category: undefined } })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              <UserPlus className="h-4 w-4" /> Open Registration Form
            </button>
          </div>

          <div className="surface-card p-6">
            <p className="text-sm text-muted-foreground">
              You have onboarded <span className="font-semibold text-ink">{onboarded}</span> trader{onboarded === 1 ? "" : "s"} so far. Use{" "}
              <span className="font-semibold text-ink">Open Registration Form</span> to register a trader, transport operator or any other
              taxpayer with the full guided form — the same form used at the council office. The sidebar stays available while you work.
            </p>
            <button
              onClick={() => navigate({ to: "/register", search: { category: undefined } })}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              <UserPlus className="h-4 w-4" /> Start a registration
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- Collections */}
      {activeTab === "collections" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">My Collections</h1>
              <p className="mt-1 text-sm text-muted-foreground">Every toll, ticket and levy you have collected</p>
            </div>
            <button onClick={() => setShowRecord(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              <Plus className="h-4 w-4" /> Record Collection
            </button>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading collections…</div>
          ) : collections.length === 0 ? (
            <div className="p-6 text-muted-foreground">No collections recorded yet. Tap <span className="font-semibold">Record Collection</span> to log your first one.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <Th>Date</Th>
                    <Th>Receipt</Th>
                    <Th>Source</Th>
                    <Th>Type</Th>
                    <Th>Channel</Th>
                    <Th>Ward</Th>
                    <Th>Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface">
                      <td className="p-3 text-sm">{p.created_at.split("T")[0]}</td>
                      <td className="p-3 font-mono text-xs">{p.ref}</td>
                      <td className="p-3 text-sm">{p.source_ref || p.source_table}</td>
                      <td className="p-3 text-sm capitalize">{p.revenue_type.replace(/_/g, " ")}</td>
                      <td className="p-3 text-sm capitalize">{p.channel}</td>
                      <td className="p-3 text-sm">{p.ward || "—"}</td>
                      <td className="p-3 text-sm font-semibold text-ink">{fmtNaira(Number(p.amount) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- Verifications */}
      {activeTab === "verifications" && (
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Verifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">Transport tickets and market receipts you have checked</p>
          </div>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink"><Truck className="h-5 w-5 text-indigo-500" /> Transport ({transport.length})</h2>
            {loadingData ? (
              <div className="p-4 text-muted-foreground">Loading…</div>
            ) : transport.length === 0 ? (
              <div className="surface-card p-6 text-sm text-muted-foreground">No transport verifications yet.</div>
            ) : (
              <div className="surface-card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <Th>Plate</Th><Th>Type</Th><Th>Result</Th><Th>Method</Th><Th>Ward</Th><Th>Date</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {transport.map((v) => (
                      <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface">
                        <td className="p-3 font-medium text-ink">{v.plate_number}</td>
                        <td className="p-3 text-sm capitalize">{v.vehicle_type}</td>
                        <td className="p-3"><ValidPill ok={v.is_valid} /></td>
                        <td className="p-3 text-sm capitalize">{v.verification_method}</td>
                        <td className="p-3 text-sm">{v.ward || "—"}</td>
                        <td className="p-3 text-sm">{v.created_at.split("T")[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink"><Store className="h-5 w-5 text-green-500" /> Market ({market.length})</h2>
            {loadingData ? (
              <div className="p-4 text-muted-foreground">Loading…</div>
            ) : market.length === 0 ? (
              <div className="surface-card p-6 text-sm text-muted-foreground">No market verifications yet.</div>
            ) : (
              <div className="surface-card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <Th>Trader</Th><Th>Market</Th><Th>Stall</Th><Th>Result</Th><Th>Method</Th><Th>Ward</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.map((v) => (
                      <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface">
                        <td className="p-3 font-medium text-ink">{v.trader_name}</td>
                        <td className="p-3 text-sm">{v.market_name}</td>
                        <td className="p-3 text-sm">{v.stall_number || "—"}</td>
                        <td className="p-3"><ValidPill ok={v.is_valid} /></td>
                        <td className="p-3 text-sm capitalize">{v.verification_method}</td>
                        <td className="p-3 text-sm">{v.ward || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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

      {/* ---------------------------------------------------------------- Incidents */}
      {activeTab === "incidents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Enforcement Incidents</h1>
              <p className="mt-1 text-sm text-muted-foreground">Violations and enforcement actions you have logged</p>
            </div>
            <button onClick={() => setShowIncident(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              <AlertTriangle className="h-4 w-4" /> Log Incident
            </button>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading incidents…</div>
          ) : incidents.length === 0 ? (
            <div className="p-6 text-muted-foreground">No incidents logged yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <Th>Type</Th><Th>Subject</Th><Th>Ward</Th><Th>Status</Th><Th>Penalty</Th><Th>Date</Th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((i) => (
                    <tr key={i.id} className="border-b border-border last:border-0 hover:bg-surface">
                      <td className="p-3 text-sm capitalize">{i.incident_type.replace(/_/g, " ")}</td>
                      <td className="p-3 font-medium text-ink">{i.subject_name || i.subject_identifier || "—"}</td>
                      <td className="p-3 text-sm">{i.ward || "—"}</td>
                      <td className="p-3">
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="p-3 text-sm">{fmtNaira(Number(i.penalty_amount) || 0)}</td>
                      <td className="p-3 text-sm">{i.created_at.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showRecord && user && (
        <RecordCollectionModal collectorId={user.id} onClose={() => setShowRecord(false)} onDone={() => { setShowRecord(false); void loadData(); }} />
      )}
      {showIncident && user && (
        <IncidentModal marshalId={user.id} onClose={() => setShowIncident(false)} onDone={() => { setShowIncident(false); void loadData(); }} />
      )}
    </main>
  );
}

// ============================================================================
// Onboard trader (informal) — goes Active immediately, attributed to the marshal
// ============================================================================
function OnboardTraderModal({ marshalId, onClose, onDone }: { marshalId: string; onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState<"market" | "transport">("market");
  const [saving, setSaving] = useState(false);
  // After a successful insert, the freshly issued ID card is shown in place of
  // the form so the marshal can print/hand it over immediately.
  const [issued, setIssued] = useState<{
    ref: string;
    qrToken: string | null;
    name: string;
    kind: string;
    lines: { label: string; value: string }[];
  } | null>(null);

  // Shared / market
  const [traderName, setTraderName] = useState("");
  const [marketName, setMarketName] = useState("");
  const [stallNumber, setStallNumber] = useState("");
  const [goodsCategory, setGoodsCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [dailyToll, setDailyToll] = useState("100");

  // Transport
  const [operatorName, setOperatorName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<"motorcycle" | "tricycle" | "commercial-vehicle">("motorcycle");
  const [route, setRoute] = useState("");
  const [dailyTicket, setDailyTicket] = useState("100");

  const [ward, setWard] = useState(WARDS[0]);

  async function save() {
    setSaving(true);
    try {
      if (kind === "market") {
        if (!traderName.trim() || !marketName.trim()) {
          toast.error("Trader name and market are required");
          setSaving(false);
          return;
        }
        const ref = genRef("KWL-MKT");
        const { data: row, error } = await supabase.from("market_stalls").insert({
          owner_id: marshalId,
          registered_by: marshalId,
          ref,
          trader_name: traderName.trim(),
          market_name: marketName.trim(),
          stall_number: stallNumber.trim() || null,
          goods_category: goodsCategory.trim() || null,
          trader_phone: phone.trim() || null,
          ward,
          daily_toll: Number(dailyToll) || 0,
          status: "Active",
        }).select("ref, qr_token").single();
        if (error) throw new Error(error.message);
        toast.success(`${traderName} onboarded · ${ref}`);
        setIssued({
          ref,
          qrToken: (row?.qr_token as string) ?? null,
          name: traderName.trim(),
          kind: "Market Trader",
          lines: [
            { label: "Market", value: marketName.trim() },
            { label: "Stall", value: stallNumber.trim() || "—" },
            { label: "Goods", value: goodsCategory.trim() || "—" },
            { label: "Ward", value: ward },
          ],
        });
      } else {
        if (!operatorName.trim() || !plateNumber.trim()) {
          toast.error("Operator name and plate number are required");
          setSaving(false);
          return;
        }
        const ref = genRef("KWL-TRP");
        const { data: row, error } = await supabase.from("transport_vehicles").insert({
          owner_id: marshalId,
          registered_by: marshalId,
          ref,
          operator_name: operatorName.trim(),
          plate_number: plateNumber.trim().toUpperCase(),
          vehicle_type: vehicleType,
          operator_phone: phone.trim() || null,
          route: route.trim() || null,
          ward,
          daily_ticket_price: Number(dailyTicket) || 0,
          status: "Active",
        }).select("ref, qr_token").single();
        if (error) throw new Error(error.message);
        toast.success(`${operatorName} onboarded · ${ref}`);
        setIssued({
          ref,
          qrToken: (row?.qr_token as string) ?? null,
          name: operatorName.trim(),
          kind: "Transport Operator",
          lines: [
            { label: "Plate", value: plateNumber.trim().toUpperCase() },
            { label: "Vehicle", value: vehicleType.replace(/-/g, " ") },
            { label: "Route", value: route.trim() || "—" },
            { label: "Ward", value: ward },
          ],
        });
      }
      // Stay open on the issued card; the marshal closes via Done, which
      // triggers the parent's reload through onDone.
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not onboard trader");
    } finally {
      setSaving(false);
    }
  }

  // Success state: the trader's new ID card, ready to print or hand over.
  if (issued) {
    return (
      <Modal onClose={onDone} title="Trader Onboarded">
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-center text-sm text-muted-foreground">
            <span className="font-semibold text-ink">{issued.name}</span> is now live on the
            platform. Print or show this ID card — the QR code verifies identity and payment
            standing instantly.
          </p>
          <TaxpayerIdCard
            refNo={issued.ref}
            qrToken={issued.qrToken}
            name={issued.name}
            kind={issued.kind}
            lines={issued.lines}
            issuedAt={new Date().toISOString().split("T")[0]}
          />
          <button
            onClick={onDone}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white"
          >
            <CheckCircle className="h-4 w-4" /> Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Onboard a Trader">
      {/* Kind toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-surface p-1">
        <KindTab active={kind === "market"} onClick={() => setKind("market")} icon={<Store className="h-4 w-4" />} label="Market trader" />
        <KindTab active={kind === "transport"} onClick={() => setKind("transport")} icon={<Truck className="h-4 w-4" />} label="Transport" />
      </div>

      <div className="space-y-3">
        {kind === "market" ? (
          <>
            <Field label="Trader name *">
              <input value={traderName} onChange={(e) => setTraderName(e.target.value)} placeholder="e.g. Hauwa Musa" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Market *">
                <input value={marketName} onChange={(e) => setMarketName(e.target.value)} placeholder="e.g. Kwali Central" className={inputCls} />
              </Field>
              <Field label="Stall number">
                <input value={stallNumber} onChange={(e) => setStallNumber(e.target.value)} placeholder="e.g. B12" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Goods">
                <input value={goodsCategory} onChange={(e) => setGoodsCategory(e.target.value)} placeholder="e.g. Foodstuff" className={inputCls} />
              </Field>
              <Field label="Daily toll (₦)">
                <input value={dailyToll} onChange={(e) => setDailyToll(e.target.value)} inputMode="numeric" className={inputCls} />
              </Field>
            </div>
          </>
        ) : (
          <>
            <Field label="Operator name *">
              <input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} placeholder="e.g. Sani Bello" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plate number *">
                <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="e.g. ABC-123-KW" className={inputCls} />
              </Field>
              <Field label="Vehicle type">
                <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as typeof vehicleType)} className={inputCls}>
                  <option value="motorcycle">Okada (motorcycle)</option>
                  <option value="tricycle">Keke (tricycle)</option>
                  <option value="commercial-vehicle">Commercial vehicle</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Route">
                <input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="e.g. Kwali–Yangoji" className={inputCls} />
              </Field>
              <Field label="Daily ticket (₦)">
                <input value={dailyTicket} onChange={(e) => setDailyTicket(e.target.value)} inputMode="numeric" className={inputCls} />
              </Field>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ward">
            <select value={ward} onChange={(e) => setWard(e.target.value)} className={inputCls}>
              {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="080..." className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm font-medium">Cancel</button>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Onboard (go live)
        </button>
      </div>
    </Modal>
  );
}

// ============================================================================
// Record a collection into the payments ledger (collector = this marshal)
// ============================================================================
function RecordCollectionModal({ collectorId, onClose, onDone }: { collectorId: string; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [revenueType, setRevenueType] = useState("market_toll");
  const [channel, setChannel] = useState("cash");
  const [ward, setWard] = useState(WARDS[0]);
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
        collectorRole: "marshal",
        sourceTable: "field",
        sourceRef: sourceRef.trim() || null,
        revenueType,
        amount: amt,
        channel,
        ward: ward || null,
        notes: notes.trim() || null,
      });
      toast.success(`Collection recorded · ${receiptNo ?? ref}`, {
        description: receiptNo ? "Official receipt issued." : undefined,
      });
      onDone();
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
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="0" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Revenue type">
            <select value={revenueType} onChange={(e) => setRevenueType(e.target.value)} className={inputCls}>
              <option value="market_toll">Market toll</option>
              <option value="daily_ticket">Transport ticket</option>
              <option value="sanitation_levy">Sanitation levy</option>
              <option value="penalty">Penalty</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Channel">
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputCls}>
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
              <option value="transfer">Transfer</option>
              <option value="ussd">USSD</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ward">
            <select value={ward} onChange={(e) => setWard(e.target.value)} className={inputCls}>
              {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Reference (optional)">
            <input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="Trader / vehicle ref" className={inputCls} />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm font-medium">Cancel</button>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save
        </button>
      </div>
    </Modal>
  );
}

// ============================================================================
// Log an enforcement incident (persisted)
// ============================================================================
function IncidentModal({ marshalId, onClose, onDone }: { marshalId: string; onClose: () => void; onDone: () => void }) {
  const [incidentType, setIncidentType] = useState("transport_ticket_evasion");
  const [subjectType, setSubjectType] = useState("transport_vehicle");
  const [subjectName, setSubjectName] = useState("");
  const [ward, setWard] = useState(WARDS[0]);
  const [description, setDescription] = useState("");
  const [penalty, setPenalty] = useState("0");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!description.trim()) {
      toast.error("A short description is required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("enforcement_incidents").insert({
        marshal_id: marshalId,
        incident_type: incidentType,
        subject_type: subjectType,
        subject_name: subjectName.trim() || null,
        subject_identifier: subjectName.trim() || null,
        ward,
        description: description.trim(),
        penalty_amount: Number(penalty) || 0,
        status: "open",
      });
      if (error) throw new Error(error.message);
      toast.success("Incident logged");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log incident");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Log Incident">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Incident type">
            <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className={inputCls}>
              <option value="transport_ticket_evasion">Transport ticket evasion</option>
              <option value="market_payment_default">Market payment default</option>
              <option value="unauthorized_operation">Unauthorized operation</option>
              <option value="equipment_seizure">Equipment seizure</option>
            </select>
          </Field>
          <Field label="Subject type">
            <select value={subjectType} onChange={(e) => setSubjectType(e.target.value)} className={inputCls}>
              <option value="transport_vehicle">Transport vehicle</option>
              <option value="market_stall">Market stall</option>
              <option value="hospitality_permit">Hospitality permit</option>
            </select>
          </Field>
        </div>
        <Field label="Subject name / identifier">
          <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. KWL-TRP-00123 or trader name" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ward">
            <select value={ward} onChange={(e) => setWard(e.target.value)} className={inputCls}>
              {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Penalty (₦)">
            <input value={penalty} onChange={(e) => setPenalty(e.target.value)} inputMode="numeric" className={inputCls} />
          </Field>
        </div>
        <Field label="Description *">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the incident…" className={`${inputCls} resize-none`} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm font-medium">Cancel</button>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />} Log Incident
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- UI helpers
const inputCls = "w-full rounded-lg border border-border bg-surface p-2.5 text-sm outline-none focus:border-primary";

function ValidPill({ ok }: { ok: boolean }) {
  return ok ? (
    <StatusBadge tone="success" icon={<CheckCircle className="h-3 w-3" />}>Valid</StatusBadge>
  ) : (
    <StatusBadge tone="danger" icon={<XCircle className="h-3 w-3" />}>Invalid</StatusBadge>
  );
}

function KindTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition ${active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-ink"}`}>
      {icon}{label}
    </button>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 font-display text-lg font-bold text-ink">{title}</h3>
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
