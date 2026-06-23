"use client";

import { motion } from "motion/react";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "accent" | "danger" | "outline" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variants: Record<Variant, string> = {
  accent: "bg-accent text-accent-foreground hover:opacity-90",
  danger: "bg-danger text-danger-foreground hover:opacity-90",
  outline: "border border-border text-foreground hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-6 py-2.5 text-sm",
};

export default function Button({
  variant = "accent",
  size = "md",
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof motion.button> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
