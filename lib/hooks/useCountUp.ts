"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { DURATION } from "@/lib/motion";

/**
 * KPI count-up animasyonu — CLAUDE.md 3.4 madde 3.
 * 0'dan hedefe ease-out ile sayar (varsayılan 600ms); ilk yüklemede ve
 * hedef değer değiştiğinde çalışır. prefers-reduced-motion aktifse
 * (merkezi hook) animasyon tamamen atlanır, hedef değer anında döner.
 * setState yalnızca rAF callback'inde çağrılır (React 19 hook kuralı).
 */
export function useCountUp(
  target: number,
  durationMs: number = DURATION.countUp * 1000,
): number {
  const prefersReduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced) {
      return; // animasyon yok — hook doğrudan target döndürür (aşağıda)
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, durationMs, prefersReduced]);

  return prefersReduced ? target : display;
}
