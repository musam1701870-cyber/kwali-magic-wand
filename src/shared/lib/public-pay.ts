// Typed client for the public, no-login payment endpoints under
// /api/public/*. Those routes are the only public surface: the SQL functions
// behind them are granted to the service role only, so nothing here can reach
// the database directly.

export type Obligation = {
  revenueType: string;
  label: string;
  amount: number;
  period: string;
  periodLabel: string;
  paid: boolean;
  receiptNo: string | null;
};

export type LookupResult =
  | { found: false; error?: string }
  | {
      found: true;
      lookupId: string;
      sourceTable: string;
      name: string;
      entityLabel: string;
      ward: string | null;
      status: string;
      obligations: Obligation[];
    };

export type PaymentReference =
  | { ok: false; error: string }
  | {
      ok: true;
      paymentRef: string;
      amount: number;
      revenueType: string;
      label: string;
      periodLabel: string;
      name: string;
      ward: string | null;
      channel: string;
      expiresAt: string | null;
    };

export type ReceiptVerification = {
  valid: boolean;
  voided?: boolean;
  voidReason?: string | null;
  receiptNo?: string;
  amount?: number;
  revenueType?: string | null;
  channel?: string | null;
  issuedAt?: string;
  period?: string | null;
  payerName?: string | null;
  ward?: string | null;
  entityRef?: string | null;
  error?: string;
};

async function post<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== "object") return fallback;
    return data as T;
  } catch {
    return fallback;
  }
}

/** Resolve a taxpayer ID or scanned QR token to its open obligations. */
export function lookupObligations(id: string, challenge?: string): Promise<LookupResult> {
  return post<LookupResult>("/api/public/lookup", { id, challenge }, { found: false });
}

/** Raise a pending payment and get a reference to quote. */
export function createPaymentReference(input: {
  id: string;
  challenge?: string;
  revenueType: string;
  channel: "transfer" | "ussd" | "cash" | "pos";
}): Promise<PaymentReference> {
  return post<PaymentReference>("/api/public/pay-reference", input, {
    ok: false,
    error: "network",
  });
}

/** Verify a receipt by its QR token or its printed receipt number. */
export function verifyReceipt(token: string): Promise<ReceiptVerification> {
  return post<ReceiptVerification>("/api/public/verify-receipt", { token }, { valid: false });
}

export function formatNaira(amount: number): string {
  return `₦${Number(amount || 0).toLocaleString()}`;
}
