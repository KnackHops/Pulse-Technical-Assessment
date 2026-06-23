"use client";

import { useEffect, useRef, useState } from "react";

// "N online" pill that briefly flashes emerald (border + text) whenever the
// count changes — a small "someone joined/left" cue. Used on the gate + map.
export default function OnlineCounter({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (prev.current === count) return;
    prev.current = count;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border bg-surface/80 px-3 py-1.5 text-xs backdrop-blur transition-colors duration-300 ${
        flash ? "border-accent text-accent" : "border-border text-muted"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
          flash ? "bg-accent" : "bg-muted"
        }`}
      />
      {count} online
    </div>
  );
}
