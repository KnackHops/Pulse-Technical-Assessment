"use client";

import { motion } from "motion/react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title="Toggle theme"
      className="theme-toggle fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/80 text-foreground shadow-sm backdrop-blur transition hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* SSR renders the default theme; the no-flash script may have switched
          <html> before hydration, so the glyph can differ — silence that. */}
      <span suppressHydrationWarning>{theme === "dark" ? "☀️" : "🌙"}</span>
    </motion.button>
  );
}
