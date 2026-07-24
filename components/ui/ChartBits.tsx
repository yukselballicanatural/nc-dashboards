"use client";

/**
 * Grafik ortak parçaları — eksen stili, tooltip çerçevesi, inline legend.
 * Tüm recharts grafikleri aynı görsel dili buradan alır (DRY).
 */

export const AXIS_TICK = {
  fill: "var(--fg-muted)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
} as const;

export function TooltipFrame({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}) {
  return (
    <div className="rounded-control border border-border bg-elevated px-3 py-2 shadow-card">
      <p className="mb-0.5 font-body text-[11px] text-fg-secondary">{title}</p>
      {rows.map((row) => (
        <p
          key={row.label}
          className="flex items-center gap-1.5 font-mono text-[12px] text-fg"
        >
          {row.color && (
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-pill"
              style={{ backgroundColor: row.color }}
            />
          )}
          <span className="text-fg-secondary">{row.label}:</span> {row.value}
        </p>
      ))}
    </div>
  );
}

/** İki serili grafiklerde başlık yanına konan mini legend. */
export function InlineLegend({
  items,
}: {
  items: Array<{ label: string; color: string; dashed?: boolean }>;
}) {
  return (
    <div className="flex items-center gap-4">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 font-body text-[11px] text-fg-secondary"
        >
          {item.dashed ? (
            <span
              aria-hidden
              className="h-0 w-4 border-t-2 border-dashed"
              style={{ borderColor: item.color }}
            />
          ) : (
            <span
              aria-hidden
              className="h-1 w-4 rounded-pill"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}
