import { useState, type ReactNode } from "react";

/**
 * Sectioned page layout — a segmented tab bar that keeps the default view calm
 * and reveals each dataset only when its section is opened. Use for revenue
 * streams that carry several data families (register, collections, compliance,
 * insights) so no screen shows all of them at once.
 */
export function SectionTabs({
  sections,
  defaultId,
}: {
  sections: { id: string; label: string; hint?: string; badge?: number; content: ReactNode }[];
  defaultId?: string;
}) {
  const [active, setActive] = useState(defaultId ?? sections[0]?.id);
  const current = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-card)]">
        {sections.map((s) => {
          const on = s.id === current.id;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition " +
                (on
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground")
              }
            >
              {s.label}
              {s.badge !== undefined && s.badge > 0 && (
                <span
                  className={
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
                    (on ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary")
                  }
                >
                  {s.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {current.hint && (
        <p className="mt-3 px-1 text-xs text-muted-foreground">{current.hint}</p>
      )}
      <div className="mt-4">{current.content}</div>
    </div>
  );
}
