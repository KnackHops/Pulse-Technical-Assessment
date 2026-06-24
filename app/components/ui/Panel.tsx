"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Reusable edge-anchored slide-in shell (chat, video, …). Mirrors the
// Toast/RequestingCard pattern: the caller wraps it in <AnimatePresence> + a
// conditional mount, the Panel owns the slide. Reduced-motion → fade only.
export default function Panel({
  children,
  className = "",
  side = "right",
}: {
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
}) {
  const reduce = useReducedMotion();
  const offscreen = reduce ? 0 : side === "right" ? "100%" : "-100%";
  const edge = side === "right" ? "inset-y-0 right-0 border-l" : "inset-y-0 left-0 border-r";

  return (
    <motion.aside
      initial={{ x: offscreen, opacity: reduce ? 0 : 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: offscreen, opacity: reduce ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className={`fixed z-30 flex flex-col border-border bg-surface text-foreground shadow-2xl ${edge} ${className}`}
    >
      {children}
    </motion.aside>
  );
}
