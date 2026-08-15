import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { notifications as seed, wards, type Notification } from "@/shared/lib/kwali-mock";
import { X } from "lucide-react";

export const Route = createFileRoute("/(admin)/notifications")({
  head: () => ({ meta: [{ title: "Notification Center — KARCIP" }] }),
  component: NotificationsPage,
});

const CHANNELS = ["SMS", "Email", "Push", "WhatsApp"] as const;

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
  const [feed, setFeed] = useState<Notification[]>(seed);
  const [composeOpen, setComposeOpen] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = { SMS: 0, Email: 0, Push: 0, WhatsApp: 0 };
    feed.forEach((n) => {
      map[n.channel] = (map[n.channel] ?? 0) + 1;
    });
    return map;
  }, [feed]);

  return (
    <DashboardShell
      title="Notification Center"
      subtitle="SMS, Email, WhatsApp and Push alerts across all revenue events"
      actions={
        <button
          onClick={() => setComposeOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          + Send broadcast
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        {CHANNELS.map((c) => (
          <div key={c} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {c}
            </div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{counts[c]}</div>
            <div className="text-[11px] text-muted-foreground">sent today</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="font-semibold text-ink">Recent activity</div>
          <button
            onClick={() => setComposeOpen(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
          >
            + Send broadcast
          </button>
        </div>
        <ul className="divide-y divide-border">
          {feed.map((n) => (
            <li key={n.id} className="flex gap-4 p-5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-base">
                {n.channel === "SMS"
                  ? "💬"
                  : n.channel === "Email"
                    ? "📧"
                    : n.channel === "WhatsApp"
                      ? "🟢"
                      : "🔔"}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-ink">{n.title}</div>
                  <span
                    className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + chip[n.channel]}
                  >
                    {n.channel}
                  </span>
                  <span
                    className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + tagChip[n.tag]}
                  >
                    {n.tag}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{n.body}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{n.at}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSend={(n, audience) => {
            setFeed((prev) => [n, ...prev]);
            setComposeOpen(false);
            toast.success("Broadcast queued", { description: `${n.channel} · ${audience}` });
          }}
        />
      )}
    </DashboardShell>
  );
}

function ComposeModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (n: Notification, audience: string) => void;
}) {
  const [channel, setChannel] = useState<Notification["channel"]>("SMS");
  const [tag, setTag] = useState<Notification["tag"]>("Reminder");
  const [audience, setAudience] = useState("All wards");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const max = 300;

  const audiences = ["All wards", "Defaulters only", ...wards];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Send a broadcast</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !body.trim()) return toast.error("Add a title and message.");
            const seq = String(Math.floor(Math.random() * 9000 + 1000));
            onSend(
              {
                id: `n-${seq}`,
                channel,
                tag,
                title: title.trim(),
                body: body.trim(),
                at: "Just now",
              },
              audience,
            );
          }}
          className="space-y-4 px-5 py-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Notification["channel"])}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Category</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as Notification["tag"])}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {(["Reminder", "Alert", "Receipt", "Compliance"] as const).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {audiences.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Tenement rate due 30 Sept"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">Message</label>
              <span className="text-[11px] text-muted-foreground">
                {body.length}/{max}
              </span>
            </div>
            <textarea
              value={body}
              maxLength={max}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Dear taxpayer, …"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Send broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
