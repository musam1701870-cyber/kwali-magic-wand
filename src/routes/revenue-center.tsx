import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { wards, businesses, properties, payments, markets, taxpayers, vehicles, demandNotices } from "@/lib/kwali-mock";
import { exportCSV, exportPDF, exportXLSX, type ExportRow } from "@/lib/exporters";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileText, Filter, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/revenue-center")({
  head: () => ({ meta: [{ title: "Revenue Center — KARCIP" }] }),
  component: RevenueCenter,
});

const fmt = (n: number) => "₦" + n.toLocaleString();

type Category = "all" | "businesses" | "properties" | "markets" | "transport" | "taxpayers" | "payments" | "notices";

const CATEGORY_LABEL: Record<Category, string> = {
  all: "All Revenue",
  businesses: "Businesses",
  properties: "Properties",
  markets: "Markets & Traders",
  transport: "Transport",
  taxpayers: "Taxpayers",
  payments: "Payments",
  notices: "Demand Notices",
};

function RevenueCenter() {
  const [category, setCategory] = useState<Category>("all");
  const [ward, setWard] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const reset = () => { setWard("all"); setStatus("all"); setFrom(""); setTo(""); setQ(""); };

  // Normalize all datasets into a unified record + keep typed source for exports
  const datasets = useMemo(() => {
    const inDate = (d?: string) => {
      if (!d) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };
    const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());

    return {
      businesses: businesses
        .filter((b) => (ward === "all" || b.ward === ward) && (status === "all" || b.status === status) && match(`${b.name} ${b.ref} ${b.category}`))
        .map<ExportRow>((b) => ({ Ref: b.ref, Name: b.name, Category: b.category, Ward: b.ward, Status: b.status, Renewal: b.renewal, "Annual Levy": b.levy })),
      properties: properties
        .filter((p) => (ward === "all" || p.ward === ward) && (status === "all" || p.status === status) && match(`${p.address} ${p.pin}`))
        .map<ExportRow>((p) => ({ PIN: p.pin, Address: p.address, Ward: p.ward, Type: p.type, Status: p.status, "Annual Rate": p.annualRate })),
      markets: markets
        .filter((m) => (ward === "all" || m.ward === ward) && match(m.name))
        .map<ExportRow>((m) => ({ Market: m.name, Ward: m.ward, Traders: m.traders, Stalls: m.stalls, "Daily Target": m.dailyTarget, Collected: m.collected, "Compliance %": m.compliance })),
      transport: vehicles
        .filter((v) => (ward === "all" || v.ward === ward) && match(`${v.plate} ${v.operator}`))
        .map<ExportRow>((v) => ({ Plate: v.plate, Type: v.type, Operator: v.operator, Ward: v.ward, "Daily Fee": v.daily, Active: v.active ? "Yes" : "No" })),
      taxpayers: taxpayers
        .filter((t) => (ward === "all" || t.ward === ward) && (status === "all" || t.status === status) && match(`${t.tin} ${t.name}`))
        .map<ExportRow>((t) => ({ TIN: t.tin, Name: t.name, Type: t.type, Ward: t.ward, Phone: t.phone, "Compliance %": t.compliance, Status: t.status, Outstanding: t.outstanding })),
      payments: payments
        .filter((p) => inDate(p.date) && (status === "all" || p.status === status) && match(`${p.rrr} ${p.category}`))
        .map<ExportRow>((p) => ({ RRR: p.rrr, Category: p.category, Channel: p.channel, Date: p.date, Status: p.status, Amount: p.amount })),
      notices: demandNotices
        .filter((d) => inDate(d.issued) && match(`${d.ref} ${d.taxpayer} ${d.category}`))
        .map<ExportRow>((d) => ({ Ref: d.ref, Taxpayer: d.taxpayer, Category: d.category, Stage: d.stage, Issued: d.issued, Due: d.due, Amount: d.amount })),
    };
  }, [ward, status, from, to, q]);

  const activeRows: ExportRow[] = useMemo(() => {
    if (category === "all") return Object.values(datasets).flat();
    return datasets[category];
  }, [category, datasets]);

  const totals = useMemo(() => {
    const sum = (rows: ExportRow[], key: string) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    return {
      businesses: { count: datasets.businesses.length, value: sum(datasets.businesses, "Annual Levy") },
      properties: { count: datasets.properties.length, value: sum(datasets.properties, "Annual Rate") },
      markets: { count: datasets.markets.length, value: sum(datasets.markets, "Collected") },
      transport: { count: datasets.transport.length, value: sum(datasets.transport, "Daily Fee") },
      taxpayers: { count: datasets.taxpayers.length, value: sum(datasets.taxpayers, "Outstanding") },
      payments: { count: datasets.payments.length, value: sum(datasets.payments, "Amount") },
      notices: { count: datasets.notices.length, value: sum(datasets.notices, "Amount") },
    };
  }, [datasets]);

  const grandTotal = useMemo(() =>
    totals.businesses.value + totals.properties.value + totals.markets.value + totals.payments.value,
  [totals]);

  const exportBase = `kwali-${category}-${new Date().toISOString().slice(0, 10)}`;
  const exportSubtitle = `Ward: ${ward === "all" ? "All wards" : ward} • Status: ${status} • ${from || "—"} → ${to || "—"}${q ? ` • search: "${q}"` : ""}`;
  const exportTotals = [
    { label: "Records", value: activeRows.length.toLocaleString() },
    { label: "Sum of amounts", value: fmt(activeRows.reduce((s, r) => s + Object.values(r).filter((v) => typeof v === "number").reduce((a: number, b) => a + (b as number), 0), 0)) },
  ];

  const doExport = (kind: "csv" | "xlsx" | "pdf") => {
    if (!activeRows.length) return;
    if (kind === "csv") exportCSV(exportBase, activeRows);
    if (kind === "xlsx") exportXLSX(exportBase, activeRows, CATEGORY_LABEL[category]);
    if (kind === "pdf") exportPDF({ filename: exportBase, title: `${CATEGORY_LABEL[category]} Report`, subtitle: exportSubtitle, rows: activeRows, totals: exportTotals });
  };

  const statusOptions = useMemo(() => {
    if (category === "businesses") return ["Active", "Expired", "Suspended"];
    if (category === "properties") return ["Paid", "Outstanding", "Overdue"];
    if (category === "taxpayers") return ["Compliant", "Partial", "Defaulting", "Blacklisted"];
    if (category === "payments") return ["Successful", "Pending", "Failed"];
    return [];
  }, [category]);

  return (
    <DashboardShell
      title="Revenue Center"
      subtitle="Unified registry, filters and exports across every revenue stream"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => doExport("csv")} disabled={!activeRows.length}><Download className="mr-2 h-4 w-4" />CSV</Button>
          <Button variant="outline" size="sm" onClick={() => doExport("xlsx")} disabled={!activeRows.length}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
          <Button size="sm" onClick={() => doExport("pdf")} disabled={!activeRows.length}><FileText className="mr-2 h-4 w-4" />PDF Report</Button>
        </div>
      }
    >
      {/* KPI strip */}
      <div className="grid gap-3 md:grid-cols-5">
        <KpiCard label="Filtered records" value={activeRows.length.toLocaleString()} accent />
        <KpiCard label="Business levies" value={fmt(totals.businesses.value)} />
        <KpiCard label="Property rates" value={fmt(totals.properties.value)} />
        <KpiCard label="Market collected" value={fmt(totals.markets.value)} />
        <KpiCard label="Payments captured" value={fmt(totals.payments.value)} />
      </div>

      {/* Filters */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" /> Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="mr-2 h-3 w-3" />Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Ward</label>
              <Select value={ward} onValueChange={setWard}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All wards</SelectItem>
                  {wards.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus} disabled={!statusOptions.length}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Search</label>
              <Input placeholder="Name, ref, TIN, plate…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as Category)} className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-card">
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <TabsTrigger key={c} value={c} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {CATEGORY_LABEL[c]}
              <Badge variant="secondary" className="ml-2">{c === "all" ? activeRows.length : datasets[c].length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
          <TabsContent key={c} value={c} className="mt-4">
            <DataTable rows={c === "all" ? Object.values(datasets).flat() : datasets[c]} grandTotal={c === "all" ? grandTotal : undefined} />
          </TabsContent>
        ))}
      </Tabs>
    </DashboardShell>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={accent ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-xl font-bold text-ink">{value}</div>
      </CardContent>
    </Card>
  );
}

function DataTable({ rows, grandTotal }: { rows: ExportRow[]; grandTotal?: number }) {
  if (!rows.length) {
    return <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No records match your filters.</div>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary/60 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>{cols.map((c) => <th key={c} className="px-4 py-3 text-left font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.slice(0, 250).map((r, i) => (
              <tr key={i} className="hover:bg-secondary/30">
                {cols.map((c) => <td key={c} className="px-4 py-2.5 text-ink">{typeof r[c] === "number" && /amount|levy|rate|fee|outstanding|target|collected/i.test(c) ? fmt(r[c] as number) : String(r[c])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-4 py-2 text-xs text-muted-foreground">
        <span>Showing {Math.min(rows.length, 250)} of {rows.length} records</span>
        {grandTotal !== undefined && <span className="font-semibold text-ink">Combined revenue: {fmt(grandTotal)}</span>}
      </div>
    </div>
  );
}
