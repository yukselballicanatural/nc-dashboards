"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";

/**
 * Staggered kart girişi — CLAUDE.md 3.4 madde 2.
 * Kartlar 50ms arayla fade+rise ile belirir. Reduced-motion'da süre/kayma 0.
 * Kullanım: <StaggerGroup className="grid ..."><StaggerItem>...</StaggerItem>...</StaggerGroup>
 */

function groupVariants(reduced: boolean): Variants {
  return {
    hidden: {},
    show: {
      transition: reduced ? {} : { staggerChildren: STAGGER.children },
    },
  };
}

function itemVariants(reduced: boolean): Variants {
  return {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : STAGGER.rise },
    show: {
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0 }
        : { duration: DURATION.cardEnter, ease: EASING.out },
    },
  };
}

export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      variants={groupVariants(reduced)}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div className={className} variants={itemVariants(reduced)}>
      {children}
    </motion.div>
  );
}
