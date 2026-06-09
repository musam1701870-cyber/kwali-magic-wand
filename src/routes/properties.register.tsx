import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { wards } from "@/lib/kwali-mock";
import { LevyEducation } from "@/components/ui/LevyEducation";

export const Route = createFileRoute("/properties/register")({
  head: () => ({ meta: [{ title: "Register a property — Kwali Revenue Portal" }] }),
  component: RegisterPropertyPage,
});

function RegisterPropertyPage() {
  return (
    <DashboardShell title="Register a property" subtitle="Tag it with GPS so assessment is accurate.">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Education panel — shown before the form */}
        <LevyEducation category="property" />

        <form onSubmit={(e) => { e.preventDefault(); window.location.assign("/properties"); }} className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink">Property type</label>
              <select className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option>Residential</option>
                <option>Commercial</option>
                <option>Mixed-use</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Ward</label>
              <select className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {wards.map((w) => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Street address</label>
            <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="12 Old Garki Road" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-ink">Plot size (sqm)</label>
              <input type="number" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Latitude</label>
              <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="8.8742" />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Longitude</label>
              <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="7.0192" />
            </div>
          </div>

          <div className="rounded-xl border-2 border-dashed border-border bg-secondary/40 p-8 text-center">
            <div className="text-3xl">📍</div>
            <div className="mt-2 text-sm font-semibold text-ink">Capture GPS coordinates</div>
            <div className="text-xs text-muted-foreground">Tap the button on a mobile device to auto-fill.</div>
            <button type="button" className="mt-3 rounded-md border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5">Use current location</button>
          </div>

          <div className="flex justify-end gap-3">
            <Link to="/properties" className="rounded-md border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-secondary">Cancel</Link>
            <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">Register property</button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
