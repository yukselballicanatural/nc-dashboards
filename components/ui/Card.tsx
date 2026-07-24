import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Temel kart — CLAUDE.md 3.3: büyük radius, ince border, yumuşak gölge.
 * hoverable=true → 3.4 madde 5: hafif yükselme (scale 1.01) + gölge artışı, 150ms.
 */
export function Card({
  children,
  className,
  hoverable = false,
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-5 shadow-soft",
        hoverable &&
          "transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.01] hover:shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
