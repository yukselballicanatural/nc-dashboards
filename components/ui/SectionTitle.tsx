import type { ReactNode } from "react";

/**
 * Panel/bölüm başlığı — CLAUDE.md 3.2 tip ölçeği (14-15px display 600).
 * `hint`: panelin ne anlattığını agent diliyle açıklayan tek satır (v2 —
 * "rakamların anlamını anlayabilsin" ilkesi). `aside`: sağ slot (legend vb.)
 */
export function SectionTitle({
  children,
  hint,
  aside,
}: {
  children: ReactNode;
  hint?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-[15px] font-semibold text-fg">
          {children}
        </h2>
        {hint && (
          <p className="font-body text-[11px] leading-snug text-fg-muted">
            {hint}
          </p>
        )}
      </div>
      {aside}
    </div>
  );
}
