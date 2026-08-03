import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Temel kart — CLAUDE.md 3.3: büyük radius, ince border, yumuşak gölge.
 * hoverable=true → 3.4 madde 5: hafif yükselme (scale 1.01) + gölge artışı, 150ms.
 * Kalan `div` prop'ları (onClick, role, tabIndex, aria-*...) doğrudan iletilir —
 * kart tıklanabilir bir bileşen (ör. detay paneli açan) olarak kullanılabilsin.
 */
export function Card({
  children,
  className,
  hoverable = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-5 shadow-soft",
        hoverable &&
          "transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.01] hover:shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
