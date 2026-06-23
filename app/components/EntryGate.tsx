"use client";

import { useState } from "react";
import Button from "./ui/Button";
import { MAX_INTRO_LEN } from "@/lib/types";

const INTRO_KEY = "pulse-intro";

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
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 bg-background p-6 text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pulse</h1>
        <p className="mt-2 max-w-sm text-muted">
          A living globe of anonymous strangers. Drop onto the map and connect.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <label htmlFor="intro" className="mb-1 block text-sm font-medium">
          Introduce yourself{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="intro"
          value={intro}
          suppressHydrationWarning
          onChange={(e) => updateIntro(e.target.value)}
          maxLength={MAX_INTRO_LEN}
          placeholder="e.g. night owl, here to chat about music"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-ring"
        />
        <p className="mt-1 text-right text-xs text-muted">
          {intro.length}/{MAX_INTRO_LEN} · shown to strangers when they hover your dot
        </p>
      </div>

      <Button onClick={enter} disabled={status === "locating"} className="px-8 py-3">
        {status === "locating" ? "Locating…" : "Enter Pulse"}
      </Button>

      {status === "error" && (
        <p className="max-w-sm text-center text-sm text-danger">{error}</p>
      )}

      <p className="max-w-sm text-center text-xs text-muted">
        No sign-up. Your dot is placed 1–3&nbsp;km from your real location.
        Nothing is stored — closing the tab ends everything.
      </p>
    </div>
  );
}
