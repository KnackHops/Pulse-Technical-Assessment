"use client";

// Two stacked grids sharing the same 44px origin: a faint base, and a brighter
// copy revealed only through a moving diagonal mask band. The lit lines ARE the
// grid lines (aligned by construction) and the band sweeps like radar. The sweep
// is CSS (`@keyframes grid-sweep` in globals.css) and auto-disables under
// prefers-reduced-motion.

const GRID = "44px 44px";

const baseGrid: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(52,211,153,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(52,211,153,0.10) 1px, transparent 1px)",
  backgroundSize: GRID,
};

const sweepGrid: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(52,211,153,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(52,211,153,0.6) 1px, transparent 1px)",
  backgroundSize: GRID,
};

export default function GateGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={baseGrid} />
      <div className="gate-grid-sweep absolute inset-0" style={sweepGrid} />
    </div>
  );
}
