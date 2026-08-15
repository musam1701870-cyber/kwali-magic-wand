import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import crest from "@/shared/assets/kwali-crest.png";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Truck, Store, AlertTriangle, CheckCircle, XCircle, MapPin, Clock, UserPlus, BarChart3, Download } from "lucide-react";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { MarshalGuard } from "@/shared/components/layout/RoleGuard";
import { fmtNaira } from "@/shared/lib/utils";

export const Route = createFileRoute("/(dashboard)/marshal/")({
  head: () => ({ meta: [{ title: "Marshal Dashboard — Kwali Revenue Portal" }] }),
  component: MarshalDashboard,
});

function MarshalDashboard() {
  return (
    <DashboardShell title="Marshal Dashboard" subtitle="Field operations and enforcement">
      <MarshalGuard>
        <MarshalDashboardContent />
      </MarshalGuard>
    </DashboardShell>
  );
}

function MarshalDashboardContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"transport" | "market" | "incidents" | "stats">("stats");
  const [transportVerifications, setTransportVerifications] = useState<TransportVerification[]>([]);
  const [marketVerifications, setMarketVerifications] = useState<MarketVerification[]>([]);
  const [incidents, setIncidents] = useState<EnforcementIncident[]>([]);
  const [stats, setStats] = useState<Stats>({ transport_today: 0, market_today: 0, incidents_today: 0, open_incidents: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    incident_type: "transport_ticket_evasion",
    subject_type: "transport_vehicle",
    subject_name: "",
    subject_identifier: "",
    ward: "",
    description: "",
    penalty_amount: 0,
  });

  type TransportVerification = {
    id: string;
    plate_number: string;
    vehicle_type: string;
    is_valid: boolean;
    verification_method: string;
    ward: string;
    created_at: string;
    vehicle: { plate_number: string; vehicle_type: string } | null;
  };

  type MarketVerification = {
    id: string;
    trader_name: string;
    market_name: string;
    stall_number: string;
    is_valid: boolean;
    verification_method: string;
    ward: string;
    created_at: string;
    stall: { stall_number: string; market_name: string } | null;
  };

  type EnforcementIncident = {
    id: string;
    incident_type: string;
    subject_type: string;
    subject_name: string;
    subject_identifier: string;
    ward: string;
    status: string;
    penalty_amount: number;
    created_at: string;
    resolved_at: string | null;
  };

  type Stats = {
    transport_today: number;
    market_today: number;
    incidents_today: number;
    open_incidents: number;
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Load stats
      const [transportRes, marketRes, incidentsRes, openIncidentsRes] = await Promise.all([
        supabase.from("transport_ticket_verifications")
          .select("id", { count: "exact", head: true })
          .eq("marshal_id", user.id)
          .gte("created_at", today),
        supabase.from("market_payment_verifications")
          .select("id", { count: "exact", head: true })
          .eq("marshal_id", user.id)
          .gte("created_at", today),
        supabase.from("enforcement_incidents")
          .select("id", { count: "exact", head: true })
          .eq("marshal_id", user.id)
          .gte("created_at", today),
        supabase.from("enforcement_incidents")
          .select("id", { count: "exact", head: true })
          .eq("marshal_id", user.id)
          .neq("status", "open"),
      ]);

      setStats({
        transport_today: transportRes.count || 0,
        market_today: marketRes.count || 0,
        incidents_today: incidentsRes.count || 0,
        open_incidents: openIncidentsRes.count || 0,
      });

      // Load transport verifications
      const transportData = await supabase.from("transport_ticket_verifications")
        .select("*")
        .eq("marshal_id", user.id)
        .gte("created_at", today)
        .order("created_at", { ascending: false });

      setTransportVerifications(transportData.data || []);

      // Load market verifications
      const marketData = await supabase.from("market_payment_verifications")
        .select("*")
        .eq("marshal_id", user.id)
        .gte("created_at", today)
        .order("created_at", { ascending: false });

      setMarketVerifications(marketData.data || []);

      // Load incidents
      const incidentsData = await supabase.from("enforcement_incidents")
        .select("*")
        .eq("marshal_id", user.id)
        .gte("created_at", today)
        .order("created_at", { ascending: false });

      setIncidents(incidentsData.data || []);
    } catch (error) {
      console.error("Error loading marshal data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      {/* Stats Overview */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Field Operations Overview</h1>
              <p className="mt-1 text-sm text-muted-foreground">Today's verification and enforcement activity</p>
            </div>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              <UserPlus className="h-4 w-4" />
              Log Incident
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Transport Verifications"
              value={stats.transport_today}
              icon={<Truck className="h-5 w-5" />}
              color="bg-blue-500"
              trend="+12% vs yesterday"
            />
            <StatCard
              label="Market Verifications"
              value={stats.market_today}
              icon={<Store className="h-5 w-5" />}
              color="bg-green-500"
              trend="+8% vs yesterday"
            />
            <StatCard
              label="Incidents Logged"
              value={stats.incidents_today}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="bg-red-500"
              trend="3 high priority"
            />
            <StatCard
              label="Open Cases"
              value={stats.open_incidents}
              icon={<Clock className="h-5 w-5" />}
              color="bg-amber-500"
              trend="Requires follow-up"
            />
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/marshal"
                state={{ tab: "transport" }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                  <QrCode className="h-6 w-6" />
                </div>
                <span className="font-semibold text-ink group-hover:text-primary">Scan Transport QR</span>
                <span className="text-xs text-muted-foreground">Verify daily tickets</span>
              </Link>
              <Link
                to="/marshal"
                state={{ tab: "market" }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white">
                  <QrCode className="h-6 w-6" />
                </div>
                <span className="font-semibold text-ink group-hover:text-primary">Scan Market Receipt</span>
                <span className="text-xs text-muted-foreground">Verify market payments</span>
              </Link>
              <Link
                to="/marshal"
                state={{ tab: "incidents" }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <span className="font-semibold text-ink group-hover:text-primary">Log Incident</span>
                <span className="text-xs text-muted-foreground">Report enforcement action</span>
              </Link>
              <Link
                to="/marshal"
                state={{ tab: "stats" }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <span className="font-semibold text-ink group-hover:text-primary">Overview</span>
                <span className="text-xs text-muted-foreground">View statistics</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Transport Tab */}
      {activeTab === "transport" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Transport Verifications</h1>
              <p className="mt-1 text-sm text-muted-foreground">Verified transport tickets and vehicle documents</p>
            </div>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              <UserPlus className="h-4 w-4" />
              Log Incident
            </button>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading verifications...</div>
          ) : transportVerifications.length === 0 ? (
            <div className="p-6 text-muted-foreground">No transport verifications found for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-border border-border">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Plate</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Vehicle Type</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Valid</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Method</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Ward</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transportVerifications.map((v) => (
                    <tr key={v.id} className="border-b border-border hover:bg-surface">
                      <td className="p-3 font-medium text-ink">{v.plate_number}</td>
                      <td className="p-3">{v.vehicle_type}</td>
                      <td className="p-3">
                        {v.is_valid ? (
                          <span className="bg-emerald-100 text-emerald-800 rounded px-2 py-1 text-xs">Valid</span>
                        ) : (
                          <span className="bg-destructive/10 text-destructive rounded px-2 py-1 text-xs">Invalid</span>
                        )}
                      </td>
                      <td className="p-3">{v.verification_method}</td>
                      <td className="p-3">{v.ward}</td>
                      <td className="p-3">{v.created_at.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Market Tab */}
      {activeTab === "market" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Market Verifications</h1>
              <p className="mt-1 text-sm text-muted-foreground">Verified market payment receipts</p>
            </div>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              <UserPlus className="h-4 w-4" />
              Log Incident
            </button>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading verifications...</div>
          ) : marketVerifications.length === 0 ? (
            <div className="p-6 text-muted-foreground">No market verifications found for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-border border-border">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Trader</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Market</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Stall</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Valid</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Method</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Ward</th>
                  </tr>
                </thead>
                <tbody>
                  {marketVerifications.map((v) => (
                    <tr key={v.id} className="border-b border-border hover:bg-surface">
                      <td className="p-3 font-medium text-ink">{v.trader_name}</td>
                      <td className="p-3">{v.market_name}</td>
                      <td className="p-3">{v.stall_number}</td>
                      <td className="p-3">
                        {v.is_valid ? (
                          <span className="bg-emerald-100 text-emerald-800 rounded px-2 py-1 text-xs">Valid</span>
                        ) : (
                          <span className="bg-destructive/10 text-destructive rounded px-2 py-1 text-xs">Invalid</span>
                        )}
                      </td>
                      <td className="p-3">{v.verification_method}</td>
                      <td className="p-3">{v.ward}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === "incidents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Enforcement Incidents</h1>
              <p className="mt-1 text-sm text-muted-foreground">Logged enforcement incidents and violations</p>
            </div>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              <UserPlus className="h-4 w-4" />
              Log Incident
            </button>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="p-6 text-muted-foreground">No incidents logged for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-border border-border">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Subject</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Ward</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Penalty</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((i) => (
                    <tr key={i.id} className="border-b border-border hover:bg-surface">
                      <td className="p-3">{i.incident_type}</td>
                      <td className="p-3 font-medium text-ink">{i.subject_name}</td>
                      <td className="p-3">{i.ward}</td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-xs ${i.status === "open" ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-800"}`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="p-3">{fmtNaira(i.penalty_amount)}</td>
                      <td className="p-3">{i.created_at.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Incident Form */}
          {showIncidentModal && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-ink mb-4">Log New Incident</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // TODO: Submit incident form
                  setShowIncidentModal(false);
                }}
              >
                <div className="grid gap-4 mb-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-ink mb-1">Incident Type</label>
                    <select
                      className="mt-1 block w-full rounded-lg border-border bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) => setIncidentForm({ ...incidentForm, incident_type: e.target.value })}
                    >
                      <option value="transport_ticket_evasion">Transport Ticket Evasion</option>
                      <option value="market_payment_default">Market Payment Default</option>
                      <option value="unauthorized_operation">Unauthorized Operation</option>
                      <option value="equipment_seizure">Equipment Seizure</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-ink mb-1">Subject Type</label>
                    <select
                      className="mt-1 block w-full rounded-lg border-border bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) => setIncidentForm({ ...incidentForm, subject_type: e.target.value })}
                    >
                      <option value="transport_vehicle">Transport Vehicle</option>
                      <option value="market_stall">Market Stall</option>
                      <option value="hospitality_permit">Hospitality Permit</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-ink mb-1">Subject Name / Identifier</label>
                    <input
                      value={incidentForm.subject_name}
                      onChange={(e) => setIncidentForm({ ...incidentForm, subject_name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-border bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. KWL-MTR-00123 or trader name"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-ink mb-1">Ward</label>
                    <select
                      className="mt-1 block w-full rounded-lg border-border bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) => setIncidentForm({ ...incidentForm, ward: e.target.value })}
                    >
                      <option value="Kwali">Kwali</option>
                      <option value="Yangoji">Yangoji</option>
                      <option value="Yebu">Yebu</option>
                      <option value="Ashara">Ashara</option>
                      <option value="Dafa">Dafa</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-ink mb-1">Description</label>
                    <textarea
                      value={incidentForm.description}
                      onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-border bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                      placeholder="Describe the incident..."
                    ></textarea>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-ink mb-1">Penalty Amount</label>
                    <input
                      type="number"
                      value={incidentForm.penalty_amount}
                      onChange={(e) => setIncidentForm({ ...incidentForm, penalty_amount: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-lg border-border bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowIncidentModal(false)}
                    className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
                  >
                    Log Incident
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {activeTab === "stats" && (
        <div className="mt-6 p-6 rounded-2xl border border-border bg-card shadow-sm">
          <h2 className="font-display text-bold text-ink mb-4">Summary</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transport Verifications</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{stats.transport_today}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Market Verifications</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{stats.market_today}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Incidents Logged</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{stats.incidents_today}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open Cases</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{stats.open_incidents}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, icon, color, trend }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-ink">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] font-medium text-muted-foreground">{trend}</div>
    </div>
  );
}