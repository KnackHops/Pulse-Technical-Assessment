"use client";

import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap } from "mapbox-gl";
import { useTheme } from "./ThemeProvider";
import { MAP_STYLE } from "@/lib/mapStyle";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// Decorative sample pins so the gate shows off the "introduce yourself" feature.
const DEMO_PINS: { lng: number; lat: number; intro: string }[] = [
  { lng: 121.0, lat: 14.6, intro: "night owl, here to chat" },
  { lng: -0.12, lat: 51.5, intro: "learning guitar 🎸" },
  { lng: 139.7, lat: 35.68, intro: "anyone up?" },
  { lng: -74.0, lat: 40.71, intro: "coffee + code" },
  { lng: 2.35, lat: 48.85, intro: "bonjour from Paris" },
  { lng: 151.2, lat: -33.87, intro: "good morning ☀️" },
];

function makePin(intro: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText =
    "display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;";
  const label = document.createElement("div");
  label.textContent = intro;
  label.style.cssText =
    "font-size:10px;font-weight:600;color:#fff;background:rgba(0,0,0,0.65);padding:1px 7px;border-radius:9999px;white-space:nowrap;";
  const dot = document.createElement("div");
  dot.style.cssText =
    "width:10px;height:10px;border-radius:9999px;background:#34d399;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 8px rgba(52,211,153,0.85);";
  el.append(label, dot);
  return el;
}

// Decorative, non-interactive spinning globe behind the entry gate. Renders
// nothing if there's no token (gate falls back to a plain background).
export default function GateGlobe() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!TOKEN || !ref.current) return;
    let cancelled = false;
    let raf = 0;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !ref.current) return;
      mapboxgl.accessToken = TOKEN;
      const map = new mapboxgl.Map({
        container: ref.current,
        style: MAP_STYLE[theme],
        projection: "globe",
        center: [0, 18],
        zoom: 2.3,
        interactive: false,
        attributionControl: false,
      });
      mapRef.current = map;

      // Transparent "space" so the CSS green grid behind the globe shows around
      // the sphere — no starfield/atmosphere fill.
      const applyFog = () => {
        try {
          map.setFog({
            color: "rgba(0,0,0,0)",
            "high-color": "rgba(0,0,0,0)",
            "space-color": "rgba(0,0,0,0)",
            "star-intensity": 0,
            "horizon-blend": 0.1,
          });
        } catch {}
      };
      map.on("style.load", applyFog);

      // Demo pins (geo-anchored, so they revolve with the globe).
      for (const p of DEMO_PINS) {
        new mapboxgl.Marker({ element: makePin(p.intro) })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
      }

      // Gentle auto-rotation, skipped when the user prefers reduced motion.
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const spin = () => {
        if (cancelled || !mapRef.current) return;
        const c = mapRef.current.getCenter();
        c.lng += 0.12;
        mapRef.current.setCenter(c);
        raf = requestAnimationFrame(spin);
      };
      map.on("load", () => {
        // Ensure the canvas matches the container (it may have had no resolved
        // size at construction time behind the absolutely-positioned gate).
        map.resize();
        if (!cancelled && !reduce) raf = requestAnimationFrame(spin);
      });
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Init once; theme swaps go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setStyle(MAP_STYLE[theme]);
  }, [theme]);

  // Transparent background so the green grid behind it shows through.
  return (
    <div
      ref={ref}
      className="absolute inset-0 h-full w-full bg-transparent"
      aria-hidden
    />
  );
}
