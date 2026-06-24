"use client";

import { motion } from "motion/react";

export type ToastVariant = "info" | "success" | "danger";

// Per-variant border + text color (background/blur stays shared). info = neutral
// pill (default); success = accent; danger = error.
const VARIANTS: Record<ToastVariant, string> = {
  info: "border-border text-foreground",
  success: "border-accent text-accent",
  danger: "border-danger text-danger",
};

// Animated transient notice. Wrap in <AnimatePresence> at the call site and give
// it a `key` (e.g. the message) so it re-animates when the text changes.
// Centering uses motion's `x: "-50%"` rather than a Tailwind translate class so
// it doesn't fight the transform motion drives.
export default function Toast({
  message,
  variant = "info",
}: {
  message: string;
  variant?: ToastVariant;
}) {
  return (
    <motion.div
      role={variant === "danger" ? "alert" : "status"}
      aria-live={variant === "danger" ? "assertive" : "polite"}
      initial={{ opacity: 0, y: -8, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -8, x: "-50%" }}
      className={`absolute left-1/2 top-20 z-30 rounded-full border bg-surface/90 px-4 py-2 text-sm shadow-lg backdrop-blur ${VARIANTS[variant]}`}
    >
      {message}
    </motion.div>
  );
}
