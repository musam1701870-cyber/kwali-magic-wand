// Helpers shared by the public (unauthenticated) API routes under
// src/routes/api/public/. Deliberately dependency-free and side-effect-free so
// it can be imported from anywhere without dragging server-only code along.
//
// Everything here exists to make the public payment surface safe to expose:
// per-IP throttling keys, uniform JSON shapes, and timing equalisation so a
// caller cannot distinguish "no such taxpayer id" from "wrong verification"
// by measuring how long the answer took.

/** Best-effort client IP behind Vercel's proxy chain. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    // Left-most entry is the original client; the rest are proxies.
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * SHA-256 of a salted client IP. The audit trail and the throttle both need a
 * stable per-caller key, but retaining a raw address for every citizen who
 * checks a bill is more personal data than this feature needs. Salted because an
 * unsalted hash of an IPv4 address is trivially reversible by brute force.
 */
export async function ipHash(request: Request): Promise<string> {
  const salt = process.env.PUBLIC_ID_SALT || process.env.SUPABASE_PROJECT_ID || "kwali";
  const bytes = new TextEncoder().encode(`${salt}:${clientIp(request)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      // Bills and receipts are per-caller and must never be cached by a CDN.
      "cache-control": "no-store",
    },
  });
}

export async function parseBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Resolve no earlier than `ms` from now. Equalises the response time of the
 * "found" and "not found" branches, which would otherwise differ by the cost of
 * the obligations query and leak the existence of an id.
 */
export async function notFasterThan<T>(ms: number, work: Promise<T>): Promise<T> {
  const [result] = await Promise.all([
    work,
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
  return result;
}

/**
 * The generated Supabase types in src/integrations/supabase/types.ts come from
 * `supabase gen types` and do not yet know about the functions added by the
 * 20260817* migrations. Rather than scatter casts at every call site, RPC calls
 * for those functions go through this one narrow, documented seam. Regenerating
 * the types will make it redundant.
 */
export type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/** Loads the service-role client and exposes it for the new RPCs. */
export async function rpcClient(): Promise<RpcClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as RpcClient;
}

/**
 * Fixed-window throttle backed by public.request_throttle. Postgres rather than
 * process memory because this app runs as serverless functions: each request can
 * land on a different instance, so an in-memory counter would enforce nothing.
 * Returns true when the request may proceed.
 */
export async function allowRequest(
  db: RpcClient,
  action: string,
  hash: string,
  limit: number,
  windowSeconds = 60,
): Promise<boolean> {
  const { data, error } = await db.rpc("check_throttle", {
    p_bucket: `${action}:${hash}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  // Fail closed on an unexpected throttle error: better to turn a caller away
  // than to leave the public surface unmetered.
  if (error) return false;
  return data === true;
}

export async function audit(
  db: RpcClient,
  entry: {
    action: string;
    entityTable?: string | null;
    entityRef?: string | null;
    detail?: Record<string, unknown>;
    ipHash?: string | null;
    userAgent?: string | null;
  },
): Promise<void> {
  // Audit is observational: never let a logging failure break a payment.
  await db
    .rpc("log_audit", {
      p_action: entry.action,
      p_entity_table: entry.entityTable ?? null,
      p_entity_id: null,
      p_entity_ref: entry.entityRef ?? null,
      p_detail: entry.detail ?? {},
      p_actor: null,
      p_ip_hash: entry.ipHash ?? null,
      p_user_agent: entry.userAgent ?? null,
    })
    .catch(() => undefined);
}
