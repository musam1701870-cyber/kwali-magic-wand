import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import crest from "@/shared/assets/kwali-crest.png";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PayDialog, type PayTarget } from "@/shared/components/layout/PayDialog";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { TaxpayerIdCard } from "@/shared/components/ui/TaxpayerIdCard";
import { fetchMyPayments, type LedgerRow } from "@/shared/lib/revenue";
import heroBg from "@/shared/assets/abuja-city-gate.jpg";
import imgBusiness from "@/shared/assets/cat-business.jpg";
import imgProperty from "@/shared/assets/cat-property.jpg";
import imgMarket from "@/shared/assets/cat-market.jpg";
import imgTransport from "@/shared/assets/cat-transport.jpg";
import imgHotel from "@/shared/assets/cat-hotel.jpg";
import imgSanitation from "@/shared/assets/cat-sanitation.jpg";
import imgPos from "@/shared/assets/cat-pos.jpg";

export const Route = createFileRoute("/(dashboard)/portal")({
  head: () => ({ meta: [{ title: "My Portal — Kwali Smart Revenue Platform" }] }),
  component: PortalPage,
});

type Biz = {
  id: string;
  ref: string;
  business_name: string;
  category: string | null;
  ward: string | null;
  status: string;
  annual_rate: number | null;
  created_at: string;
  obligations: string[] | null;
};

// Informal-sector identities that get a digital ID card: market stalls and
// transport vehicles owned by this taxpayer. qr_token backs the scannable code.
type IdCardRow = {
  key: string;
  ref: string;
  qrToken: string | null;
  name: string;
  kind: string;
  lines: { label: string; value: string }[];
  status: string;
  issuedAt: string;
};

function PortalPage() {
  const { user, isAdmin, loading, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Biz[]>([]);
  const [idCards, setIdCards] = useState<IdCardRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  // Payment state comes from the ledger, not from local component state, so it
  // survives a refresh and matches what the council's own records show.
  const [myPayments, setMyPayments] = useState<LedgerRow[]>([]);
  const [paidRefs, setPaidRefs] = useState<Set<string>>(new Set());

  const reloadPayments = useCallback(async () => {
    if (!user) return;
    const rows = await fetchMyPayments(user.id);
    setMyPayments(rows);
    // A business counts as settled when a confirmed, un-reversed payment exists.
    setPaidRefs(
      new Set(
        rows
          .filter((r) => r.status === "confirmed" && !r.voided && r.sourceRef)
          .map((r) => r.sourceRef as string),
      ),
    );
  }, [user]);

  // Single consolidated redirect — runs only after auth finishes loading.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    // Only redirect away once we know the user's actual role.
    // roles.length === 0 just means "plain taxpayer" (no row in user_roles).
    if (roles.includes("marshal")) {
      navigate({ to: "/marshal" });
    } else if (roles.includes("officer")) {
      navigate({ to: "/officer" });
    }
  }, [user, loading, roles, navigate]);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    supabase
      .from("businesses")
      .select("id,ref,business_name,category,ward,status,annual_rate,created_at,obligations")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setList((data ?? []) as Biz[]);
        setBusy(false);
      });
  }, [user]);

  // ID cards come from the informal-sector tables — the market women, petty
  // traders and keke/okada operators this portal primarily serves.
  useEffect(() => {
    if (!user) return;
    type Stall = {
      id: string; ref: string; qr_token: string | null; trader_name: string;
      market_name: string; stall_number: string | null; goods_category: string | null;
      ward: string | null; status: string; created_at: string;
    };
    type Vehicle = {
      id: string; ref: string; qr_token: string | null; operator_name: string;
      plate_number: string; vehicle_type: string; route: string | null;
      ward: string | null; status: string; created_at: string;
    };
    Promise.all([
      supabase
        .from("market_stalls")
        .select("id,ref,qr_token,trader_name,market_name,stall_number,goods_category,ward,status,created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("transport_vehicles")
        .select("id,ref,qr_token,operator_name,plate_number,vehicle_type,route,ward,status,created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([stalls, vehicles]) => {
      const cards: IdCardRow[] = [];
      for (const s of (stalls.data ?? []) as Stall[]) {
        cards.push({
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
        cards.push({
          key: `vehicle-${v.id}`,
          ref: v.ref,
          qrToken: v.qr_token,
          name: v.operator_name,
          kind: "Transport Operator",
          lines: [
            { label: "Plate", value: v.plate_number },
            { label: "Vehicle", value: v.vehicle_type.replace(/-/g, " ") },
            { label: "Route", value: v.route ?? "—" },
            { label: "Ward", value: v.ward ?? "—" },
          ],
          status: v.status,
          issuedAt: v.created_at.split("T")[0],
        });
      }
      setIdCards(cards);
    });
  }, [user]);

  useEffect(() => {
    void reloadPayments();
  }, [reloadPayments]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const totalDue = list.reduce((s, b) => s + Number(b.annual_rate ?? 0), 0);

  const categories = [
    {
      name: "Shops & Offices",
      desc: "Pay your yearly business permit for shops, offices and SMEs.",
      img: imgBusiness,
      to: "/register?category=business",
    },
    {
      name: "Houses & Land",
      desc: "Settle yearly rates on your home, land or rental property.",
      img: imgProperty,
      to: "/register?category=property",
    },
    {
      name: "Market Stalls",
      desc: "Buy daily market tickets or pay your stall and lockup fees.",
      img: imgMarket,
      to: "/register?category=market",
    },
    {
      name: "Keke, Okada & Buses",
      desc: "Get the ₦100 daily ticket and route permits for your vehicle.",
      img: imgTransport,
      to: "/register?category=transport",
    },
    {
      name: "Hotels & Event Centres",
      desc: "Pay operating permits for hotels, lodges and event halls.",
      img: imgHotel,
      to: "/register?category=hospitality",
    },
    {
      name: "Waste & Sanitation",
      desc: "Sign up for refuse pickup and pay your monthly sanitation levy.",
      img: imgSanitation,
      to: "/register?category=sanitation",
    },
    {
      name: "POS & Mobile Money",
      desc: "Annual operator permit for POS agents and mobile-money kiosks.",
      img: imgPos,
      to: "/register?category=pos",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={crest} alt="" className="h-9 w-9" />
            <div className="leading-tight">
              <div className="font-display text-sm font-bold text-primary">Kwali Area Council</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                My Taxpayer Portal
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/executive"
                className="rounded-md border border-border px-3 py-2 text-xs font-semibold"
              >
                Admin dashboard →
              </Link>
            )}
            <div className="hidden text-right text-xs sm:block">
              <div className="font-semibold">{user.email}</div>
              <div className="text-muted-foreground">Taxpayer</div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="rounded-md bg-secondary px-3 py-2 text-xs font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Hero with Abuja City Gate */}
        <div className="relative overflow-hidden rounded-2xl border border-border shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)]">
          <img
            src={heroBg}
            alt="Abuja City Gate"
            className="absolute inset-0 h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f1a]/95 via-[#0f4c3a]/80 to-[#0a1f1a]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.18),transparent_60%)]" />
          <div className="relative px-8 py-12 sm:px-12 sm:py-16 text-white">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a84c]" />
              FCT · Kwali Area Council · Taxpayer Portal
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
              Welcome back
              {user.user_metadata?.full_name
                ? `, ${user.user_metadata.full_name.split(" ")[0]}`
                : ""}
              .
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
              Register obligations, settle assessments and download receipts — all council revenue
              streams unified in one secure dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register?category=business"
                className="rounded-md bg-white px-5 py-2.5 text-sm font-bold text-[#0f4c3a] shadow hover:bg-white/95"
              >
                + New registration
              </Link>
              <a
                href="#payments"
                className="rounded-md border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
              >
                Make a payment
              </a>
              <a
                href="#categories"
                className="rounded-md px-5 py-2.5 text-sm font-semibold text-white/85 hover:text-white"
              >
                Browse tax categories →
              </a>
            </div>

            {/* KPI strip embedded in hero */}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <HeroStat label="My registrations" value={String(list.length)} />
              <HeroStat label="Annual obligations" value={`₦${totalDue.toLocaleString()}`} />
              <HeroStat
                label="Active wards"
                value={String(new Set(list.map((b) => b.ward).filter(Boolean)).size)}
              />
            </div>
          </div>
        </div>

        {/* Tax categories with imagery */}
        <section id="categories" className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Tax & revenue categories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a category to register an obligation or pay a levy.
              </p>
            </div>
            <Link
              to="/services"
              className="hidden text-xs font-semibold text-primary hover:underline sm:inline"
            >
              View all services →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                to={c.to}
                className="surface-card surface-card--interactive group overflow-hidden"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={c.img}
                    alt={c.name}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                      Revenue stream
                    </div>
                    <div className="font-display text-base font-bold text-white">{c.name}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                  <span className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                    Open →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Digital ID cards — informal sector identity with scannable QR */}
        {idCards.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">My ID cards</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Show the QR code to any enforcement officer — it confirms your identity and
                  payment standing instantly.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {idCards.map((c) => (
                <div key={c.key} className="space-y-2">
                  <TaxpayerIdCard
                    refNo={c.ref}
                    qrToken={c.qrToken}
                    name={c.name}
                    kind={c.kind}
                    lines={c.lines}
                    issuedAt={c.issuedAt}
                  />
                  <div className="flex justify-center">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="surface-card mt-10 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">My businesses</h2>
            <Link
              to="/register?category=business"
              className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              + New registration
            </Link>
          </div>
          {busy ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading your records…
            </div>
          ) : list.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-surface/50 p-10 text-center">
              <div className="text-3xl">🏢</div>
              <div className="mt-2 font-semibold">No businesses yet</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Register your first business to receive a Taxpayer ID and bill.
              </p>
              <Link
                to="/register?category=business"
                className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Start registration →
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3">Ref</th>
                    <th className="px-3 py-3">Business</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Ward</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Annual ₦</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((b) => {
                    const paid = paidRefs.has(b.ref);
                    return (
                      <tr key={b.id} className="border-b border-border/60">
                        <td className="px-3 py-3 font-mono text-xs">{b.ref}</td>
                        <td className="px-3 py-3 font-semibold">{b.business_name}</td>
                        <td className="px-3 py-3">{b.category ?? "—"}</td>
                        <td className="px-3 py-3">{b.ward ?? "—"}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={paid ? "Paid" : b.status} />
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {Number(b.annual_rate ?? 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {paid ? (
                            <StatusBadge tone="success">Settled</StatusBadge>
                          ) : (
                            <button
                              onClick={() =>
                                setPayTarget({
                                  ref: b.ref,
                                  payer: b.business_name,
                                  category: b.category ?? "Business Permit",
                                  amount: Number(b.annual_rate ?? 0),
                                  meta: [{ label: "Ward", value: b.ward ?? "—" }],
                                  // Identifies the real row, so the dialog raises a
                                  // genuine ledger payment and the server re-derives
                                  // the amount rather than trusting this page.
                                  sourceTable: "businesses",
                                  sourceId: b.id,
                                  revenueType: "business_levy",
                                })
                              }
                              className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-95"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="payments" className="surface-card mt-8 p-6">
          <h2 className="font-display text-lg font-bold">Payment history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every payment recorded against your account, with its official receipt.
          </p>
          {myPayments.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted-foreground">
              No payments yet — pay any obligation above to get started.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {myPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink">
                      {p.payerName ?? p.sourceRef ?? "Council levy"}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {p.receiptNo ?? p.ref} · {p.revenueType.replace(/_/g, " ")}
                      {p.obligationPeriod ? ` · ${p.obligationPeriod}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold text-ink">
                      ₦{p.amount.toLocaleString()}
                    </span>
                    {p.voided ? (
                      <StatusBadge tone="danger">Reversed</StatusBadge>
                    ) : (
                      <StatusBadge status={p.status === "confirmed" ? "Paid" : p.status} />
                    )}
                    {p.verifyToken && (
                      <Link
                        to="/verify/$token"
                        params={{ token: p.verifyToken }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Receipt
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <PayDialog
        target={payTarget}
        onClose={() => setPayTarget(null)}
        // Re-read the ledger rather than guessing locally: the row is 'pending'
        // until the council confirms the money, and the UI should say so.
        onPaid={() => void reloadPayments()}
      />
    </div>
  );
}

const HeroStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur">
    <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">{label}</div>
    <div className="mt-1.5 font-display text-2xl font-bold text-white">{value}</div>
  </div>
);
