import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * StatusBadge — the one canonical "state" pill for the whole app.
 *
 * Wraps the `.status-badge` CSS primitive (defined in styles.css) so every
 * status chip — traders, payments, incidents, verifications, notices — derives
 * its tint + text from the semantic tokens and reads identically in light/dark.
 *
 * Prefer <StatusBadge status="active" /> (auto-resolves tone from the label)
 * and reach for an explicit `tone` only when the label is ambiguous.
 */
export type StatusTone = "success" | "warning" | "info" | "danger" | "neutral";

const TONE_CLASS: Record<StatusTone, string> = {
  success: "status-badge--success",
  warning: "status-badge--warning",
  info: "status-badge--info",
  danger: "status-badge--danger",
  neutral: "status-badge--neutral",
};

/** Domain status words → semantic tone. Extend here, not at call sites. */
const TONE_BY_WORD: Record<string, StatusTone> = {
  // success — money in, verified, resolved, live
  active: "success",
  live: "success",
  paid: "success",
  settled: "success",
  approved: "success",
  verified: "success",
  valid: "success",
  compliant: "success",
  completed: "success",
  closed: "success",
  resolved: "success",
  success: "success",
  // warning — needs attention soon
  pending: "warning",
  awaiting: "warning",
  processing: "warning",
  review: "warning",
  partial: "warning",
  due: "warning",
  draft: "warning",
  // danger — action required / bad state
  open: "danger",
  overdue: "danger",
  rejected: "danger",
  declined: "danger",
  flagged: "danger",
  invalid: "danger",
  suspended: "danger",
  expired: "danger",
  failed: "danger",
  defaulter: "danger",
  // info — neutral informational states
  new: "info",
  submitted: "info",
  info: "info",
};

export function resolveTone(status: string): StatusTone {
  return TONE_BY_WORD[status.trim().toLowerCase()] ?? "neutral";
}

export interface StatusBadgeProps {
  /** Status label. Its tone is auto-resolved unless `tone` is given. */
  status?: string;
  /** Force a tone regardless of the label. */
  tone?: StatusTone;
  /** Optional leading icon; when present it replaces the default status dot. */
  icon?: ReactNode;
  /** Custom label content (falls back to `status`). */
  children?: ReactNode;
  className?: string;
  /** Show the label capitalized (domain statuses are often lowercase). */
  capitalize?: boolean;
}

export function StatusBadge({
  status,
  tone,
  icon,
  children,
  className,
  capitalize = true,
}: StatusBadgeProps) {
  const resolved = tone ?? (status ? resolveTone(status) : "neutral");
  return (
    <span
      className={cn(
        "status-badge",
        TONE_CLASS[resolved],
        capitalize && "capitalize",
        // an explicit icon takes the dot's place
        icon && "before:hidden",
        className,
      )}
    >
      {icon}
      {children ?? status}
    </span>
  );
}
