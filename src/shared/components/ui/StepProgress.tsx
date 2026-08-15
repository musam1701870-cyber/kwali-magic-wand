// Shared wizard header: step label, completion percentage, progress bar, and
// numbered chips. Used by every taxpayer registration flow so long forms read
// as short, navigable steps.
import { Check } from "lucide-react";

type Props = {
  steps: string[];
  current: number;
  onJump?: (i: number) => void;
  className?: string;
};

export function StepProgress({ steps, current, onJump, className }: Props) {
  const total = steps.length;
  const clamped = Math.min(Math.max(current, 0), total - 1);
  const pct = Math.round(((clamped + 1) / total) * 100);
  const remaining = 100 - pct;

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Step {clamped + 1} of {total}
          </div>
          <div className="font-display text-lg font-bold text-ink">{steps[clamped]}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-primary">{pct}%</div>
          <div className="text-[11px] text-muted-foreground">
            {remaining > 0 ? `${remaining}% to go` : "All steps complete"}
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-primary to-gold transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
        {steps.map((label, i) => {
          const done = i < clamped;
          const active = i === clamped;
          const canJump = !!onJump && i < clamped;
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && onJump?.(i)}
                className={
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition " +
                  (active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/10 text-primary " +
                        (canJump ? "hover:bg-primary/20 cursor-pointer" : "")
                      : "bg-secondary text-muted-foreground")
                }
              >
                <span
                  className={
                    "grid h-4 w-4 place-items-center rounded-full text-[10px] " +
                    (active
                      ? "bg-primary-foreground/20"
                      : done
                        ? "bg-primary/20"
                        : "bg-background/60")
                  }
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {i < total - 1 && <span className="h-px w-3 bg-border" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
