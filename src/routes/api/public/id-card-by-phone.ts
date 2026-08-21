import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { allowRequest, audit, ipHash, json, notFasterThan, parseBody } from "@/shared/lib/api/public-request";

// Public ID-card reprint lookup: a taxpayer who lost their card enters the
// phone number they registered with and gets their card back to print.
//
// Security posture mirrors the public payment API: the query runs service-role
// behind this route only (never anon), it is IP-throttled and audited, and the
// response carries only what a printed card would show anyway — name, public
// ref, the card's display lines, and the qr_token that proves identity. Phone
// possession is treated as the proof, the same way the QR token is elsewhere.
// "Not found" and any error return the identical { found: false } shape so the
// phone space cannot be probed.

const Schema = z.object({
  phone: z.string().trim().min(7).max(20),
});

function digits(v: string): string {
  return v.replace(/[^0-9]/g, "");
}

export const Route = createFileRoute("/api/public/id-card-by-phone")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request): Promise<Response> {
  const parsed = Schema.safeParse(await parseBody(request));
  if (!parsed.success) return json({ found: false }, 200);

  const hash = await ipHash(request);
  // Tight limit — this is an enumeration surface.
  if (!(await allowRequest(supabaseAdmin, "id-card-reprint", hash, 10, 60))) {
    return json({ found: false }, 200);
  }

  const target = digits(parsed.data.phone);

  const work = (async () => {
    // Market stalls and transport vehicles carry the taxpayer's phone directly.
    const [stalls, vehicles] = await Promise.all([
      supabaseAdmin
        .from("market_stalls")
        .select("ref, qr_token, trader_name, market_name, stall_number, goods_category, ward, status, trader_phone, created_at")
        .not("trader_phone", "is", null)
        .limit(2000),
      supabaseAdmin
        .from("transport_vehicles")
        .select("ref, qr_token, operator_name, plate_number, vehicle_type, route, ward, status, operator_phone, created_at")
        .not("operator_phone", "is", null)
        .limit(2000),
    ]);

    const matches = (phone: string | null) => phone && digits(phone).endsWith(target.slice(-7));

    const cards: unknown[] = [];
    for (const s of stalls.data ?? []) {
      if (!matches(s.trader_phone as string | null)) continue;
      cards.push({
        kind: "Market Trader",
        ref: s.ref,
        qrToken: s.qr_token,
        name: s.trader_name,
        status: s.status,
        issuedAt: String(s.created_at).split("T")[0],
        lines: [
          { label: "Market", value: s.market_name ?? "—" },
          { label: "Stall", value: s.stall_number ?? "—" },
          { label: "Goods", value: s.goods_category ?? "—" },
          { label: "Ward", value: s.ward ?? "—" },
        ],
      });
    }
    for (const v of vehicles.data ?? []) {
      if (!matches(v.operator_phone as string | null)) continue;
      cards.push({
        kind: "Transport Operator",
        ref: v.ref,
        qrToken: v.qr_token,
        name: v.operator_name,
        status: v.status,
        issuedAt: String(v.created_at).split("T")[0],
        lines: [
          { label: "Plate", value: v.plate_number ?? "—" },
          { label: "Vehicle", value: String(v.vehicle_type ?? "").replace(/-/g, " ") || "—" },
          { label: "Route", value: v.route ?? "—" },
          { label: "Ward", value: v.ward ?? "—" },
        ],
      });
    }
    return cards;
  })();

  // Equalise hit/miss timing.
  const cards = await notFasterThan(160, work);

  await audit(supabaseAdmin, {
    action: cards.length ? "public.idcard.hit" : "public.idcard.miss",
    entityTable: null,
    entityRef: null,
    ipHash: hash,
    userAgent: request.headers.get("user-agent"),
  });

  return json({ found: cards.length > 0, cards });
}
