import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import crest from "@/assets/kwali-crest.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "My Portal — Kwali Smart Revenue Platform" }] }),
  component: PortalPage,
});

type Biz = {
  id: string; ref: string; business_name: string; category: string | null;
  ward: string | null; status: string; annual_rate: number | null; created_at: string;
  obligations: string[] | null;
};

function PortalPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Biz[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    supabase.from("businesses").select("id,ref,business_name,category,ward,status,annual_rate,created_at,obligations")
      .eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setList((data ?? []) as Biz[]); setBusy(false); });
  }, [user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  const totalDue = list.reduce((s, b) => s + Number(b.annual_rate ?? 0), 0);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={crest} alt="" className="h-9 w-9" />
            <div className="leading-tight">
              <div className="font-display text-sm font-bold text-primary">Kwali Area Council</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">My Taxpayer Portal</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && <Link to="/executive" className="rounded-md border border-border px-3 py-2 text-xs font-semibold">Admin dashboard →</Link>}
            <div className="hidden text-right text-xs sm:block">
              <div className="font-semibold">{user.email}</div>
              <div className="text-muted-foreground">Taxpayer</div>
            </div>
            <button onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="rounded-md bg-secondary px-3 py-2 text-xs font-semibold">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/80">Welcome back</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Manage your registrations & payments</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
            Register a new business, view your demand notices, and pay any council levy securely from this portal.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-md bg-white px-5 py-2.5 text-sm font-bold text-primary shadow">
              + Register a new business
            </Link>
            <a href="#payments" className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Make a payment
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="My registrations" value={String(list.length)} />
          <Stat label="Annual obligations" value={`₦${totalDue.toLocaleString()}`} />
          <Stat label="Active wards" value={String(new Set(list.map((b) => b.ward).filter(Boolean)).size)} />
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">My businesses</h2>
            <Link to="/register" className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
              + New registration
            </Link>
          </div>
          {busy ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading your records…</div>
          ) : list.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-surface/50 p-10 text-center">
              <div className="text-3xl">🏢</div>
              <div className="mt-2 font-semibold">No businesses yet</div>
              <p className="mt-1 text-sm text-muted-foreground">Register your first business to receive a Taxpayer ID and bill.</p>
              <Link to="/register" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Start registration →
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3">Ref</th><th className="px-3 py-3">Business</th>
                    <th className="px-3 py-3">Category</th><th className="px-3 py-3">Ward</th>
                    <th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Annual ₦</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((b) => (
                    <tr key={b.id} className="border-b border-border/60">
                      <td className="px-3 py-3 font-mono text-xs">{b.ref}</td>
                      <td className="px-3 py-3 font-semibold">{b.business_name}</td>
                      <td className="px-3 py-3">{b.category ?? "—"}</td>
                      <td className="px-3 py-3">{b.ward ?? "—"}</td>
                      <td className="px-3 py-3">
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " +
                          (b.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                           b.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-secondary")}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">{Number(b.annual_rate ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">
                        <button className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Pay</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="payments" className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Payment history</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your payments and digital receipts will appear here.</p>
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted-foreground">
            No payments yet — pay any obligation above to get started.
          </div>
        </section>
      </main>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="mt-2 text-2xl font-bold text-primary">{value}</div>
  </div>
);
