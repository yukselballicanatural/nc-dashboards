"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { DURATION } from "@/lib/motion";

/**
 * Sayı geçiş animasyonu — `useCountUp`'ın CANLI veri için olan kardeşi.
 *
 * Fark: `useCountUp` hedef her değiştiğinde 0'dan sayar (ilk yükleme KPI'ları
 * için doğru). Canlı/tik atan bir sayaçta bu, her artışta rakamın sıfıra
 * düşmesi anlamına gelir. Bu hook ise O ANDA GÖSTERİLEN değerden yeni hedefe
 * geçer: ilk mount'ta 0 → hedef (aynı giriş efekti), sonraki tiklerde
 * 41 → 42 gibi yumuşak bir artış.
 *
 * prefers-reduced-motion aktifse animasyon atlanır, hedef anında döner
 * (CLAUDE.md 3.4 madde 7). setState yalnızca rAF callback'inde çağrılır.
 */
export function useTweenNumber(
  target: number,
  durationMs: number = DURATION.countUp * 1000,
): number {
  const prefersReduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  /** Animasyonun başlayacağı değer — render'lar arası son gösterilen sayı. */
  const displayRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced) return;

    const from = displayRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (target - from) * eased;
      displayRef.current = value;
      setDisplay(value);
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
