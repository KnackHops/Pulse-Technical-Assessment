"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Renders children onto document.body, outside the app's <main>. Used to lift
// the chat panel out of the map's paint tree so its slide animation can't drag
// the Mapbox canvas. Guarded by a mount flag to avoid an SSR/hydration mismatch.
export default function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Intentional: flip to client-only after mount so createPortal has a DOM
    // target and SSR/first paint render nothing (no hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
