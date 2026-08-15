import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import crest from "@/shared/assets/kwali-crest.png";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ShieldCheck, TrendingUp, Users, Clock, AlertTriangle, CheckCircle, Download, Search, Filter } from "lucide-react";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { OfficerGuard } from "@/shared/components/layout/RoleGuard";
import { fmtNaira } from "@/shared/lib/utils";

export const Route = createFileRoute("/(dashboard)/officer/")({
  head: () => ({ meta: [{ title: "Officer Dashboard — Kwali Revenue Portal" }] }),
  component: OfficerDashboard,
});

function OfficerDashboard() {
  return (
    <DashboardShell title="Officer Dashboard" subtitle="Revenue operations and compliance">
      <OfficerGuard>
        <OfficerDashboardContent />
      </OfficerGuard>
    </DashboardShell>
  );
}

function OfficerDashboardContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "collections" | "demands" | "compliance">("overview");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [demands, setDemands] = useState<DemandNotice[]>([]);
  const [compliance, setCompliance] = useState<ComplianceItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState({
    total_businesses: 0,
    active_businesses: 0,
    collections_today: 0,
    pending_demands: 0,
    compliance_rate: 0,
  });

  type Business = {
    id: string;
    ref: string;
    business_name: string;
    owner_name: string;
    ward: string;
    status: string;
    created_at: string;
  };

  type Collection = {
    id: string;
    business_id: string;
    amount: number;
    payment_method: string;
    reference: string;
    created_at: string;
    business: Business | null;
  };

  type DemandNotice = {
    id: string;
    business_id: string;
    notice_number: string;
    amount: number;
    status: string;
    issued_at: string;
    due_date: string;
    business: Business | null;
  };

  type ComplianceItem = {
    id: string;
    business_id: string;
    check_type: string;
    status: string;
    notes: string;
    checked_at: string;
    business: Business | null;
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      // Load businesses in officer's ward(s) - for demo, load all
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      setBusinesses(bizData || []);
      setStats(prev => ({
        ...prev,
        total_businesses: bizData?.length || 0,
        active_businesses: bizData?.filter(b => b.status === "Active").length || 0,
      }));

      // Load collections
      const { data: collData } = await supabase
        .from("collections")
        .select("*")
        .eq("officer_id", user.id)
        .order("created_at", { ascending: false });

      setCollections(collData || []);
      setStats(prev => ({
        ...prev,
        collections_today: collData?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
      }));

      // Load demand notices
      const { data: demandData } = await supabase
        .from("demand_notices")
        .select("*")
        .eq("officer_id", user.id)
        .order("created_at", { ascending: false });

      setDemands(demandData || []);
      setStats(prev => ({
        ...prev,
        pending_demands: demandData?.filter(d => d.status === "pending").length || 0,
      }));

      // Load compliance checks
      const { data: compData } = await supabase
        .from("compliance_checks")
        .select("*")
        .eq("officer_id", user.id)
        .order("checked_at", { ascending: false });

      setCompliance(compData || []);
      setStats(prev => ({
        ...prev,
        compliance_rate: compData?.length
          ? Math.round((compData.filter(c => c.status === "compliant").length / compData.length) * 100)
          : 0,
      }));
    } catch (error) {
      console.error("Error loading officer data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      {/* Stats Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Revenue Operations Overview</h1>
              <p className="mt-1 text-sm text-muted-foreground">Today's collection and compliance activity</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Businesses"
              value={stats.total_businesses}
              icon={<Users className="h-5 w-5" />}
              color="bg-blue-500"
              trend={stats.active_businesses + " active"}
            />
            <StatCard
              label="Collections Today"
              value={stats.collections_today}
              icon={<FileText className="h-5 w-5" />}
              color="bg-green-500"
              trend="vs target"
              isCurrency
            />
            <StatCard
              label="Pending Demands"
              value={stats.pending_demands}
              icon={<Clock className="h-5 w-5" />}
              color="bg-amber-500"
              trend="Requires follow-up"
            />
            <StatCard
              label="Compliance Rate"
              value={stats.compliance_rate}
              icon={<ShieldCheck className="h-5 w-5" />}
              color="bg-primary-500"
              trend="% compliant"
            />
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/officer"
                state={{ tab: "collections" }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="font-semibold text-ink group-hover:text-primary">Record Collection</span>
                <span className="text-xs text-muted-foreground">Log payment received</span>
              </Link>
              <Link
                to="/officer"
                state={{ tab: "demands" }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <span className="font-semibold text-ink group-hover:text-primary">Issue Demand</span>
                <span className="text-xs text-muted-foreground">Send demand notice</span>
              </Link>
              <Link
                to="/officer"
                state={{ tab: "compliance" }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="font-semibold text-ink group-hover:text-primary">Compliance Check</span>
                <span className="text-xs text-muted-foreground">Perform inspection</span>
              </Link>
              <Link
                to="/officer"
                state={{ tab: "overview" }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="font-semibold text-ink group-hover:text-primary">Overview</span>
                <span className="text-xs text-muted-foreground">View statistics</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === "collections" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Collections</h1>
              <p className="mt-1 text-sm text-muted-foreground">Record and track revenue collections</p>
            </div>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="p-6 text-muted-foreground">No collections recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-border border-border">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Business</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Method</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Reference</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-surface">
                      <td className="p-3 font-medium text-ink">{c.business?.business_name || "Unknown"}</td>
                      <td className="p-3">{fmtNaira(c.amount)}</td>
                      <td className="p-3">{c.payment_method}</td>
                      <td className="p-3">{c.reference}</td>
                      <td className="p-3">{c.created_at.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Demands Tab */}
      {activeTab === "demands" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Demand Notices</h1>
              <p className="mt-1 text-sm text-muted-foreground">Issue and track demand notices</p>
            </div>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading demands...</div>
          ) : demands.length === 0 ? (
            <div className="p-6 text-muted-foreground">No demand notices issued.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-border border-border">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Notice #</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Business</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Due Date</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {demands.map((d) => (
                    <tr key={d.id} className="border-b border-border hover:bg-surface">
                      <td className="p-3 font-medium text-ink">{d.notice_number}</td>
                      <td className="p-3">{d.business?.business_name || "Unknown"}</td>
                      <td className="p-3">{fmtNaira(d.amount)}</td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-xs ${d.status === "paid" ? "bg-emerald-100 text-emerald-800" : d.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-destructive/10 text-destructive"}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3">{d.due_date.split("T")[0]}</td>
                      <td className="p-3">{d.issued_at.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Compliance Checks</h1>
              <p className="mt-1 text-sm text-muted-foreground">Track business compliance inspections</p>
            </div>
          </div>

          {loadingData ? (
            <div className="p-6 text-muted-foreground">Loading compliance checks...</div>
          ) : compliance.length === 0 ? (
            <div className="p-6 text-muted-foreground">No compliance checks performed.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-border border-border">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Business</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Check Type</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Notes</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {compliance.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-surface">
                      <td className="p-3 font-medium text-ink">{c.business?.business_name || "Unknown"}</td>
                      <td className="p-3">{c.check_type}</td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-xs ${c.status === "compliant" ? "bg-emerald-100 text-emerald-800" : "bg-destructive/10 text-destructive"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3">{c.notes || "-"}</td>
                      <td className="p-3">{c.checked_at.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, icon, color, trend, isCurrency }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend: string;
  isCurrency?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-ink">
            {isCurrency ? fmtNaira(value) : value}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] font-medium text-muted-foreground">{trend}</div>
    </div>
  );
}