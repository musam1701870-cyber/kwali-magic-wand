import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TaxpayerIdCard } from "@/shared/components/ui/TaxpayerIdCard";
import { QrCode, Loader2, Search } from "lucide-react";

// Every ID card a staff member has issued — the market traders and transport
// operators they registered in the field. Each card carries the row's real
// qr_token so the code is scannable and verifiable.

type Card = {
  key: string;
  ref: string;
  qrToken: string | null;
  name: string;
  kind: string;
  lines: { label: string; value: string }[];
  status: string;
  issuedAt: string;
};

export function IssuedIdCards({ staffId }: { staffId: string }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      type Stall = {
        id: string; ref: string; qr_token: string | null; trader_name: string;
        market_name: string; stall_number: string | null; goods_category: string | null;
        ward: string | null; status: string; created_at: string;
      };
      type Vehicle = {
        id: string; ref: string; qr_token: string | null; operator_name: string;
        plate_number: string | null; vehicle_type: string; route: string | null;
        ward: string | null; status: string; created_at: string;
      };
      const [stalls, vehicles] = await Promise.all([
        supabase
          .from("market_stalls")
          .select("id,ref,qr_token,trader_name,market_name,stall_number,goods_category,ward,status,created_at")
          .eq("registered_by", staffId)
          .order("created_at", { ascending: false }),
        supabase
          .from("transport_vehicles")
          .select("id,ref,qr_token,operator_name,plate_number,vehicle_type,route,ward,status,created_at")
          .eq("registered_by", staffId)
          .order("created_at", { ascending: false }),
      ]);
      if (stalls.error) throw new Error(stalls.error.message);
      if (vehicles.error) throw new Error(vehicles.error.message);

      const out: Card[] = [];
      for (const s of (stalls.data ?? []) as Stall[]) {
        out.push({
          key: `stall-${s.id}`,
          ref: s.ref,
          qrToken: s.qr_token,
          name: s.trader_name,
          kind: "Market Trader",
          lines: [
            { label: "Market", value: s.market_name },
            { label: "Stall", value: s.stall_number ?? "—" },
            { label: "Goods", value: s.goods_category ?? "—" },
            { label: "Ward", value: s.ward ?? "—" },
          ],
          status: s.status,
          issuedAt: s.created_at.split("T")[0],
        });
      }
      for (const v of (vehicles.data ?? []) as Vehicle[]) {
        out.push({
          key: `veh-${v.id}`,
          ref: v.ref,
          qrToken: v.qr_token,
          name: v.operator_name,
          kind: "Transport Operator",
          lines: [
            { label: "Plate", value: v.plate_number ?? "—" },
            { label: "Vehicle", value: v.vehicle_type.replace(/-/g, " ") },
            { label: "Route", value: v.route ?? "—" },
            { label: "Ward", value: v.ward ?? "—" },
          ],
          status: v.status,
          issuedAt: v.created_at.split("T")[0],
        });
      }
      out.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
      setCards(out);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load issued ID cards");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = cards.filter((c) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      c.ref.toLowerCase().includes(term) ||
      c.kind.toLowerCase().includes(term) ||
      c.lines.some((l) => l.value.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="surface-card flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading issued ID cards…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface-card flex items-center gap-3 p-4">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, ref, market, plate…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {cards.length} issued
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <QrCode className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-ink">
            {cards.length === 0 ? "No ID cards issued yet" : "No cards match your search"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cards appear here for every trader or operator you register.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <TaxpayerIdCard
              key={c.key}
              refNo={c.ref}
              qrToken={c.qrToken}
              name={c.name}
              kind={c.kind}
              lines={c.lines}
              issuedAt={c.issuedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
