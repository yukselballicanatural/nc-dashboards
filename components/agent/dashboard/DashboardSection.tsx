import type { ReactNode } from "react";

/**
 * Dashboard bölümü — eyebrow (küçük büyük-harfli etiket) + başlık + içerik.
 * id, Aksiyon Merkezi'ndeki sayfa içi bağlantıların hedefi (scroll-mt ile
 * sticky üst barın altında konumlanır).
 */
export function DashboardSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: ReactNode;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-fg-muted">
          {eyebrow}
        </span>
        <h2 className="font-display text-[17px] font-bold text-fg">{title}</h2>
      </div>
      {children}
    </section>
  );
}
