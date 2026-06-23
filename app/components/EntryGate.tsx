"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Button from "./ui/Button";
import GateGlobe from "./GateGlobe";
import GateGrid from "./GateGrid";
import { MAX_INTRO_LEN } from "@/lib/types";

const INTRO_KEY = "pulse-intro";

// Radial fade so the globe dissolves into the background toward the edges.
const VIGNETTE: React.CSSProperties = {
  background:
    "radial-gradient(ellipse at center, transparent 30%, var(--background) 78%)",
};

export default function EntryGate({
  onReady,
}: {
  onReady: (
    lat: number,
    lng: number,
    intro: string,
  ) => void | Promise<void>;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [error, setError] = useState<string>("");
  // Bumped on each interaction to replay the emerald edge-pulse animation.
  const [pulseKey, setPulseKey] = useState(0);
  const pulse = () => setPulseKey((k) => k + 1);
  // Prefill from sessionStorage (survives refresh, clears on tab close — same
  // ephemeral model as the theme + the privacy ethos).
  const [intro, setIntro] = useState<string>(() => {
    try {
      return sessionStorage.getItem(INTRO_KEY) ?? "";
    } catch {
      return "";
    }
  });

  function updateIntro(value: string) {
    const next = value.slice(0, MAX_INTRO_LEN);
    setIntro(next);
    try {
      sessionStorage.setItem(INTRO_KEY, next);
    } catch {}
  }

  function enter() {
    pulse();
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location access.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // onReady joins the server; if that fails, surface it and stay on the
        // gate instead of leaving the button stuck on "Locating…".
        Promise.resolve(
          onReady(pos.coords.latitude, pos.coords.longitude, intro),
        ).catch(() => {
          setStatus("error");
          setError("Couldn't reach the server. Check your connection and try again.");
        });
      },
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is required to place you on the map."
            : "Couldn't get your location. Please try again.",
        );
      },
      // High accuracy + maximumAge:0 forces a fresh fix (Wi-Fi/GPS scan)
      // instead of reusing the browser's cached IP-based location.
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      {/* Animated green grid behind the globe. */}
      <GateGrid />
      <GateGlobe />
      {/* Fade the globe edges into the background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={VIGNETTE}
      />

      {/* Dead-center the panel (grid place-items-center is reliable here). */}
      <div className="absolute inset-0 grid place-items-center p-6">
        <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-surface/70 p-8 text-center shadow-2xl backdrop-blur-xl"
      >
        {/* Emerald edge-pulse, replayed on each interaction via the key. */}
        <motion.span
          key={pulseKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-accent"
          initial={{ opacity: pulseKey === 0 ? 0 : 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        <h1 className="text-4xl font-bold tracking-tight">Pulse</h1>
        <p className="mt-2 text-muted">
          A living globe of anonymous strangers. Drop onto the map and connect.
        </p>

        <div className="mt-6 text-left">
          <label htmlFor="intro" className="mb-1 block text-sm font-medium">
            Introduce yourself{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="intro"
            value={intro}
            suppressHydrationWarning
            onFocus={pulse}
            onChange={(e) => updateIntro(e.target.value)}
            maxLength={MAX_INTRO_LEN}
            placeholder="e.g. night owl, here to chat about music"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-ring"
          />
          <p className="mt-1 text-right text-xs text-muted">
            {intro.length}/{MAX_INTRO_LEN} · shown to strangers on hover
          </p>
        </div>

        <Button
          onClick={enter}
          disabled={status === "locating"}
          className="mt-6 w-full px-8 py-3"
        >
          {status === "locating" ? "Locating…" : "Enter Pulse"}
        </Button>

        {status === "error" && (
          <p className="mt-4 text-sm text-danger">{error}</p>
        )}

        <p className="mt-6 text-xs text-muted">
          No sign-up. Your dot is placed 1–3&nbsp;km from your real location.
          Nothing is stored — closing the tab ends everything.
        </p>
        </motion.div>
      </div>
    </div>
  );
}
