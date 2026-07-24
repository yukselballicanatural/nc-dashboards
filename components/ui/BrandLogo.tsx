"use client";

import Image from "next/image";
import { useTheme } from "@/components/theme/ThemeProvider";
import logoLight from "@/public/brand/natural-clinic-logo.png";
import logoDark from "@/public/brand/natural-clinic-logo-white.png";

/**
 * Marka logosu — tek kaynak. Koyu temada beyaz logo, açık temada renkli logo.
 * Tüm panellerin (agent/takım lideri/bölge müdürü/admin) üst navigasyonu bunu
 * kullanır ki tema-logo davranışı her yerde birebir aynı olsun.
 */
export function BrandLogo({ height = 38 }: { height?: number }) {
  const { theme } = useTheme();
  return (
    <Image
      src={theme === "dark" ? logoDark : logoLight}
      alt="Natural Clinic"
      height={height}
      className="w-auto"
      style={{ height }}
      priority
    />
  );
}
