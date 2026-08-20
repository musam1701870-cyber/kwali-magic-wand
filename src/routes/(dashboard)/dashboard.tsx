import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { PayDialog, type PayTarget } from "@/shared/components/layout/PayDialog";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { properties, payments, violations } from "@/shared/lib/kwali-mock";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  BadgeCheck,
  ArrowRight,
  Plus,
  Receipt,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/(dashboard)/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kwali Revenue Portal" }] }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  hint,
  trend,
  trendUp,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  accent?: "gold" | "primary" | "destructive" | "success";
}) {
  const iconBg =
    accent === "gold"
      ? "bg-amber-50 text-amber-600"
      : accent === "destructive"
        ? "bg-red-50 text-red-600"
        : accent === "success"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-primary/8 text-primary";
  const valueColor =
    accent === "destructive"
      ? "text-destructive"
      : accent === "gold"
        ? "text-amber-700"
        : accent === "success"
          ? "text-emerald-700"
          : "text-ink";

  return (
    <div className="surface-card surface-card--interactive group relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${iconBg}`}>{icon}</div>
        {trend && (
          <StatusBadge
            tone={trendUp ? "success" : "danger"}
            icon={
              trendUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )
            }
          >
            {trend}
          </StatusBadge>
        )}
      </div>
      <div className={`mt-4 font-display text-3xl font-bold tracking-tight ${valueColor}`}>
        {value}
      </div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}

function DashboardPage() {
  const [paidRefs, setPaidRefs] = useState<Set<string>>(new Set());
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);

  const unpaidBills = properties.filter((p) => p.status !== "Paid" && !paidRefs.has(p.pin));
  const outstanding = unpaidBills.reduce((s, p) => s + p.annualRate, 0);
  const totalPaid =
    payments.filter((p) => p.status === "Successful").reduce((s, p) => s + p.amount, 0) +
    properties.filter((p) => paidRefs.has(p.pin)).reduce((s, p) => s + p.annualRate, 0);
  const openVio = violations.filter((v) => v.status === "Open").length;
  const overdueCount = unpaidBills.filter((p) => p.status === "Overdue").length;

  return (
    <DashboardShell
      title="Overview"
      subtitle="Taxpayer Portal"
      requireAdmin={false}
      actions={
        <Link
          to="/properties/register"
          className="hidden items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 sm:inline-flex"
        >
          <Plus className="h-4 w-4" />
          Add property
        </Link>
      }
    >
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Outstanding balance"
          value={`₦${outstanding.toLocaleString()}`}
          hint={`${unpaidBills.length} bills pending`}
          trend="+2 new"
          trendUp={false}
          accent="destructive"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Paid this year"
          value={`₦${totalPaid.toLocaleString()}`}
          hint={`${payments.filter((p) => p.status === "Successful").length} successful payments`}
          trend="↑ 12%"
          trendUp={true}
          accent="success"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Active permits"
          value="3"
          hint="Tenement · Business · Sanitation"
          accent="gold"
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Open violations"
          value={String(openVio)}
          hint={`${overdueCount} overdue properties`}
          accent="destructive"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* Main content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Outstanding bills table */}
        <div className="surface-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Outstanding bills</h2>
              <p className="text-xs text-muted-foreground">Properties requiring payment</p>
            </div>
            <Link
              to="/properties"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {unpaidBills.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                🎉 All bills settled. Nothing outstanding.
              </div>
            ) : (
              unpaidBills.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-secondary/40"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${p.status === "Overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {p.type.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink text-sm">
                      {p.type} — {p.address}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PIN {p.pin} · Ward {p.ward}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-ink text-sm">
                      ₦{p.annualRate.toLocaleString()}
                    </div>
                    <div className="mt-1 flex justify-end">
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setPayTarget({
                        ref: p.pin,
                        payer: p.address,
                        category: `${p.type} — Tenement Rate`,
                        amount: p.annualRate,
                        meta: [
                          { label: "Ward", value: p.ward },
                          { label: "Property", value: p.type },
                        ],
                      })
                    }
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-95"
                  >
                    Pay now
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="surface-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold text-ink">Quick actions</h2>
              <p className="text-xs text-muted-foreground">Frequently used shortcuts</p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {[
                {
                  to: "/transport",
                  label: "Buy daily ticket",
                  icon: <Zap className="h-5 w-5" />,
                  color: "bg-amber-50 text-amber-700 hover:bg-amber-100",
                },
                {
                  to: "/properties/register",
                  label: "Register property",
                  icon: <Plus className="h-5 w-5" />,
                  color: "bg-primary/8 text-primary hover:bg-primary/15",
                },
                {
                  to: "/payments",
                  label: "View receipts",
                  icon: <Receipt className="h-5 w-5" />,
                  color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                },
                {
                  to: "/compliance",
                  label: "Verify QR",
                  icon: <BadgeCheck className="h-5 w-5" />,
                  color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
                },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className={`flex flex-col items-center gap-2 rounded-xl p-3.5 text-center text-xs font-semibold transition ${a.color}`}
                >
                  {a.icon}
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent payments */}
          <div className="surface-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Recent payments</h2>
                <p className="text-xs text-muted-foreground">Last 3 transactions</p>
              </div>
              <Link
                to="/payments"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {payments.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{p.category}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.date} · {p.channel}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-bold text-emerald-700">
                    ₦{p.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PayDialog
        target={payTarget}
        onClose={() => setPayTarget(null)}
        onPaid={(ref) => setPaidRefs((prev) => new Set(prev).add(ref))}
      />
    </DashboardShell>
  );
}
