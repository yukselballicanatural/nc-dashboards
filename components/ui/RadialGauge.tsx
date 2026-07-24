"use client";

import { motion } from "framer-motion";
import type { StatusLevel } from "@/lib/types/agent-data";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { DURATION, EASING } from "@/lib/motion";
import { formatPercent } from "@/lib/utils/format";

/**
 * Radial (yarım daire) gauge — CLAUDE.md 4.4 (SLA/Connection) ve 4.6 (hedef).
 * Yay 0'dan gerçek değere çizilerek dolar (3.4 madde 4, ~700ms); ortadaki
 * yüzde count-up ile sayar. Renk, hedefe yakınlığa göre semantik durumdan
 * gelir (3.1): ≥%100 yeşil · ≥%85 sarı · ≥%70 turuncu · altı kırmızı.
 */

const STATUS_STROKE: Record<StatusLevel, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  risk: "var(--risk)",
  critical: "var(--critical)",
  neutral: "var(--neutral)",
};

export function gaugeStatus(valuePct: number, targetPct: number): StatusLevel {
  if (targetPct <= 0) return "neutral";
  const ratio = valuePct / targetPct;
  if (ratio >= 1) return "success";
  if (ratio >= 0.85) return "warning";
  if (ratio >= 0.7) return "risk";
  return "critical";
}

// Yarım daire geometrisi
const R = 80;
const ARC_LEN = Math.PI * R; // ≈ 251.3

export function RadialGauge({
  label,
  valuePct,
  targetPct,
  size = 200,
  stroke: strokeOverride,
  showTarget = true,
}: {
  label: string;
  valuePct: number;
  targetPct: number;
  /** SVG genişliği (px) — yükseklik oranla hesaplanır. */
  size?: number;
  /** Verilirse durum rengi yerine bu stroke kullanılır (örn. hero gauge'da marka rengi). */
  stroke?: string;
  /** "Hedef: %X" satırını gizlemek için false (hero gauge kendi alt satırını basar). */
  showTarget?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const animatedPct = useCountUp(valuePct);
  const status = gaugeStatus(valuePct, targetPct);
  const stroke = strokeOverride ?? STATUS_STROKE[status];

  // Gauge %100'den fazlasını çizemez (değer hedef değil, mutlak yüzdedir).
  const fillRatio = Math.min(valuePct, 100) / 100;
  const dashOffset = ARC_LEN * (1 - fillRatio);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size * 0.62 }}>
        <svg
          viewBox="0 0 200 118"
          width={size}
          height={size * 0.62}
          aria-label={`${label}: ${formatPercent(valuePct)}, hedef ${formatPercent(targetPct, 0)}`}
          role="img"
        >
          {/* Taban yay */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--border)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Değer yayı — 0'dan dolarak çizilir */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            initial={{ strokeDashoffset: reduced ? dashOffset : ARC_LEN }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: DURATION.chart, ease: EASING.out }
            }
          />
        </svg>
        {/* Ortadaki değer */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="font-mono text-[26px] font-semibold leading-none text-fg">
            {formatPercent(animatedPct)}
          </span>
        </div>
      </div>
      <span className="font-display text-[13px] font-semibold text-fg">
        {label}
      </span>
      {showTarget && (
        <span className="font-body text-[11px] text-fg-muted">
          Hedef: {formatPercent(targetPct, 0)}
        </span>
      )}
    </div>
  );
}
