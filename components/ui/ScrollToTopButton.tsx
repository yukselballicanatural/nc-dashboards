"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

/**
 * Yukarı kaydırma butonu — sayfa belli bir miktar aşağı kaydırılınca belirir.
 * Çevresindeki ince halka, sayfanın ne kadarının kaydırıldığını canlı gösterir
 * (0 → tepe, 1 → sayfa sonu); tıklanınca tepeye kayar ve halka boşalırken
 * buton kısa bir "tamamlandı" darbesiyle (glow + check ikonu) tepki verir.
 */

const SHOW_AFTER_PX = 360;
const SIZE = 48;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScrollToTopButton() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  const reduced = usePrefersReducedMotion();
  const tickingRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0);
        setVisible(scrollTop > SHOW_AFTER_PX);
        tickingRef.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    setJustClicked(true);
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setJustClicked(false), 700);
  }, [reduced]);

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label="Sayfa başına dön"
          title="Sayfa başına dön"
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.85 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: justClicked && !reduced ? [1, 1.18, 1] : 1,
          }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.85 }}
          transition={
            justClicked
              ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
              : { duration: reduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }
          }
          style={
            justClicked
              ? { boxShadow: "0 0 0 7px rgba(14,169,139,0.18), var(--shadow-elevated)" }
              : undefined
          }
          className="fixed bottom-6 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-pill border border-border bg-surface text-brand shadow-elevated transition-shadow duration-200 hover:shadow-[0_16px_36px_rgba(14,169,139,0.26)] sm:bottom-8 sm:right-8"
        >
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="pointer-events-none absolute inset-0 -rotate-90"
            aria-hidden
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--border)"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--brand)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: reduced ? "none" : "stroke-dashoffset 120ms linear" }}
            />
          </svg>
          {justClicked ? (
            <Check size={18} strokeWidth={2.5} />
          ) : (
            <ArrowUp size={18} strokeWidth={2.5} />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
