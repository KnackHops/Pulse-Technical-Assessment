"use client";

import { motion } from "motion/react";

// Animated transient notice. Wrap in <AnimatePresence> at the call site and give
// it a `key` (e.g. the message) so it re-animates when the text changes.
// Centering uses motion's `x: "-50%"` rather than a Tailwind translate class so
// it doesn't fight the transform motion drives.
export default function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -8, x: "-50%" }}
      className="absolute left-1/2 top-20 z-30 rounded-full border border-border bg-surface/90 px-4 py-2 text-sm text-foreground shadow-lg backdrop-blur"
    >
      {message}
    </motion.div>
  );
}
