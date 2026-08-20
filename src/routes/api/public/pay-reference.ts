import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { allowRequest, audit, ipHash, json, parseBody, rpcClient } from "@/shared/lib/api/public-request";

// Raises a PENDING payment for one obligation and returns a reference the payer
// can quote at a bank, to an agent, or over USSD.
//
// The row is 'pending', not 'confirmed': no money has been received yet. It only
// becomes revenue when confirm_payment() runs -- an officer clearing the transfer,
// an agent collecting against the reference, the reconciliation queue, or (later,
// with no change to this route) a gateway webhook. Receipts are issued by the
// database at that moment, never here.
//
// The amount is read from entity_obligations() inside the SQL function. The client
// cannot send a price, so a tampered request cannot under-pay a levy.

const ReferenceSchema = z.object({
  id: z.string().trim().min(4).max(80),
  challenge: z.string().trim().max(8).optional(),
  revenueType: z.string().trim().min(2).max(40),
  channel: z.enum(["transfer", "ussd", "cash", "pos"]).default("transfer"),
});

export const Route = createFileRoute("/api/public/pay-reference")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request): Promise<Response> {
  const parsed = ReferenceSchema.safeParse(await parseBody(request));
  if (!parsed.success) {
    return json({ ok: false, error: "invalid_request" }, 400);
  }

  const db = await rpcClient();
  const hash = await ipHash(request);

  if (!(await allowRequest(db, "pay-reference", hash, 10, 60))) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  const { data, error } = await db.rpc("create_payment_reference", {
    p_public_id: parsed.data.id,
    p_challenge: parsed.data.challenge ?? null,
    p_revenue_type: parsed.data.revenueType,
    p_channel: parsed.data.channel,
  });

  if (error) {
    return json({ ok: false, error: "reference_failed" }, 500);
  }

  const result = (data ?? { ok: false, error: "not_found" }) as Record<string, unknown>;

  await audit(db, {
    action: result.ok === true ? "public.reference.created" : "public.reference.rejected",
    entityTable: "payments",
    entityRef: (result.paymentRef as string) ?? null,
    detail: {
      revenue_type: parsed.data.revenueType,
      channel: parsed.data.channel,
      outcome: result.ok === true ? "created" : result.error,
    },
    ipHash: hash,
    userAgent: request.headers.get("user-agent"),
  });

  // Always 200: a rejected reference is a normal outcome, and returning a
  // distinct status for "no such id" would undo the uniform-response property
  // that keeps the lookup surface non-enumerable.
  return json(result);
}
