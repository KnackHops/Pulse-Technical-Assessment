"use client";

import { motion, useReducedMotion } from "motion/react";
import Button from "./ui/Button";
import { hueCss } from "@/lib/hue";

const RING = 18; // svg circle radius
const CIRC = 2 * Math.PI * RING;

// Top-center floating card shown while we wait for a stranger to answer. Floats
// over the map (no backdrop) so the globe stays visible. The ring drains over
// `timeoutMs` purely as a visual cue — the real timeout lives in page.tsx.
export default function RequestingCard({
  peerId,
  intro,
  timeoutMs,
  onCancel,
}: {
  peerId: string;
  intro: string | null;
  timeoutMs: number;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -12, x: "-50%" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="absolute left-1/2 top-20 z-30 flex w-[min(20rem,calc(100vw-2rem))] items-center gap-3 rounded-2xl border border-border bg-surface/90 p-4 text-left shadow-xl backdrop-blur"
    >
      {/* Peer hue dot with a draining countdown ring around it. */}
      <div className="relative h-12 w-12 shrink-0">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
          <circle
            cx="24"
            cy="24"
            r={RING}
            fill="none"
            stroke="var(--border)"
            strokeWidth="3"
          />
          <motion.circle
            cx="24"
            cy="24"
            r={RING}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: reduce ? 0 : CIRC }}
            transition={{ duration: timeoutMs / 1000, ease: "linear" }}
          />
        </svg>
        <motion.span
          className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: hueCss(peerId) }}
          animate={reduce ? undefined : { opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          Requesting connection…
        </p>
        {intro ? (
          <p className="truncate text-xs text-muted">“{intro}”</p>
        ) : (
          <p className="text-xs text-muted">Waiting for them to answer</p>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </motion.div>
  );
}
