import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { notifications } from "@/lib/kwali-mock";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notification Center — KARCIP" }] }),
  component: NotificationsPage,
});

const chip: Record<string, string> = {
  SMS: "bg-primary/10 text-primary",
  Email: "bg-gold/20 text-gold-foreground",
  Push: "bg-accent text-accent-foreground",
  WhatsApp: "bg-emerald-500/15 text-emerald-700",
};
const tagChip: Record<string, string> = {
  Reminder: "bg-gold/20 text-gold-foreground",
  Alert: "bg-destructive/10 text-destructive",
  Receipt: "bg-primary/10 text-primary",
  Compliance: "bg-orange-500/15 text-orange-700",
};

function NotificationsPage() {
  return (
    <DashboardShell title="Notification Center" subtitle="SMS, Email, WhatsApp and Push alerts across all revenue events">
      <div className="grid gap-4 md:grid-cols-4">
        {(["SMS","Email","Push","WhatsApp"] as const).map((c) => (
          <div key={c} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{c}</div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{notifications.filter(n => n.channel === c).length}</div>
            <div className="text-[11px] text-muted-foreground">sent today</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="font-semibold text-ink">Recent activity</div>
          <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">+ Send broadcast</button>
        </div>
        <ul className="divide-y divide-border">
          {notifications.map((n) => (
            <li key={n.id} className="flex gap-4 p-5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-base">
                {n.channel === "SMS" ? "💬" : n.channel === "Email" ? "📧" : n.channel === "WhatsApp" ? "🟢" : "🔔"}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-ink">{n.title}</div>
                  <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + chip[n.channel]}>{n.channel}</span>
                  <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + tagChip[n.tag]}>{n.tag}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{n.body}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{n.at}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardShell>
  );
}
