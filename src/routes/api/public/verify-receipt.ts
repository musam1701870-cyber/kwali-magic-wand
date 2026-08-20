import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { allowRequest, audit, ipHash, json, parseBody, rpcClient } from "@/shared/lib/api/public-request";

// Receipt verification for anyone: the payer, an officer at a checkpoint, a
// landlord checking a tenant's tenement receipt.
//
// Two entry points with different disclosure, handled inside verify_receipt():
//   * the opaque verify_token carried by the QR code / receipt link -- unguessable,
//     so the fuller masked view is returned;
//   * a receipt number typed off paper -- sequential and therefore guessable, so it
//     confirms authenticity, amount and date but discloses no payer or ward.
// A receipt whose payment was later reversed reports as voided rather than valid.

const VerifySchema = z.object({
  token: z.string().trim().min(4).max(120),
});

export const Route = createFileRoute("/api/public/verify-receipt")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
      // GET so a QR code can point straight at a shareable verification URL.
      GET: ({ request }) => handleGet(request),
    },
  },
});

async function handleGet(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  return verify(request, token);
}

async function handle(request: Request): Promise<Response> {
  const parsed = VerifySchema.safeParse(await parseBody(request));
  if (!parsed.success) {
    return json({ valid: false, error: "invalid_request" }, 400);
  }
  return verify(request, parsed.data.token);
}

async function verify(request: Request, rawToken: string): Promise<Response> {
  const parsed = VerifySchema.safeParse({ token: rawToken });
  if (!parsed.success) {
    return json({ valid: false, error: "invalid_request" }, 400);
  }

  const db = await rpcClient();
  const hash = await ipHash(request);

  if (!(await allowRequest(db, "verify-receipt", hash, 30, 60))) {
    return json({ valid: false, error: "rate_limited" }, 429);
  }

  const { data, error } = await db.rpc("verify_receipt", { p_token: parsed.data.token });
  if (error) {
    return json({ valid: false, error: "verify_failed" }, 500);
  }

  const result = (data ?? { valid: false }) as Record<string, unknown>;

  await audit(db, {
    action: result.valid === true ? "public.verify.valid" : "public.verify.invalid",
    entityTable: "receipts",
    entityRef: (result.receiptNo as string) ?? null,
    ipHash: hash,
    userAgent: request.headers.get("user-agent"),
  });

  return json(result);
}
