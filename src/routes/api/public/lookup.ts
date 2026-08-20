import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  allowRequest,
  audit,
  ipHash,
  json,
  notFasterThan,
  parseBody,
  rpcClient,
} from "@/shared/lib/api/public-request";

// Public, unauthenticated obligation lookup: "here is my ID, what do I owe?"
//
// This is the only way an anonymous caller can resolve a taxpayer ID. RLS gives
// anon zero read access to the registration tables, and public_lookup() is
// granted to service_role only -- never to anon -- precisely so that every public
// resolution passes through this chokepoint, where it is validated, throttled and
// audited. Granting the RPC to anon instead would hand the whole ref space to
// anyone holding the publishable key that ships in the client bundle.

const LookupSchema = z.object({
  // A printed reference (KWL-TRD-2026-001234) or a scanned QR token.
  id: z.string().trim().min(4).max(80),
  // Last 4 digits of the registered phone. Required for a reference; ignored for
  // a QR token, where possession of the token is itself the proof.
  challenge: z.string().trim().max(8).optional(),
});

export const Route = createFileRoute("/api/public/lookup")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request): Promise<Response> {
  const parsed = LookupSchema.safeParse(await parseBody(request));
  if (!parsed.success) {
    return json({ found: false, error: "invalid_request" }, 400);
  }

  const db = await rpcClient();
  const hash = await ipHash(request);

  // Tight limit: this endpoint is the enumeration surface.
  if (!(await allowRequest(db, "lookup", hash, 12, 60))) {
    return json({ found: false, error: "rate_limited" }, 429);
  }

  const lookup = db
    .rpc("public_lookup", {
      p_public_id: parsed.data.id,
      p_challenge: parsed.data.challenge ?? null,
    })
    .then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return (data ?? { found: false }) as Record<string, unknown>;
    });

  let result: Record<string, unknown>;
  try {
    // Equalise timing so a hit and a miss are indistinguishable to a caller
    // measuring latency; the shapes are already identical.
    result = await notFasterThan(160, lookup);
  } catch {
    return json({ found: false, error: "lookup_failed" }, 500);
  }

  await audit(db, {
    action: result.found === true ? "public.lookup.hit" : "public.lookup.miss",
    entityTable: (result.sourceTable as string) ?? null,
    entityRef: (result.lookupId as string) ?? null,
    ipHash: hash,
    userAgent: request.headers.get("user-agent"),
  });

  return json(result);
}
