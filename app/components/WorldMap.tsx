"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import type { PeerDot } from "@/lib/types";
import { useTheme } from "./ThemeProvider";
import { MAP_STYLE } from "@/lib/mapStyle";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "pk.eyJ1IjoicHVsc2UtbWFwIiwiYSI6ImNrMDBkZW1vMDAwMDAwMDAifQ.AAAAAAAAAAAAAAAAAAAAAA";

// Markers closer than COLLISION_PX (screen px) are treated as stacked; peers in
// a cluster get fanned out by SPREAD_PX so none hides (or is unclickable) under
// "Me" or another peer.
const COLLISION_PX = 30;
const SPREAD_PX = 30;

// Deterministic per-id hue (0–359) — drives the dot fill, glow, and pulse ring.
function dotHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export default function WorldMap({
  peers,
  me,
  meId,
  onPeerClick,
  canConnect,
}: {
  peers: PeerDot[];
  me: { lat: number; lng: number } | null;
  meId: string;
  onPeerClick: (id: string) => void;
  canConnect: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const meMarkerRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const { theme } = useTheme();

  // Marker click handlers are bound once, so read the live click handler +
  // connectability through refs (synced in an effect, never during render).
  const onPeerClickRef = useRef(onPeerClick);
  const canConnectRef = useRef(canConnect);
  useEffect(() => {
    onPeerClickRef.current = onPeerClick;
    canConnectRef.current = canConnect;
  });

  // Fan out markers that overlap on screen so a peer never hides (and stays
  // clickable) under "Me" or another peer when their privacy offsets collide.
  // Offset is purely visual (px); grouping uses the true projected coords, so
  // it's stable across pans and only needs re-running when zoom changes spacing.
  const declutter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    type P = { marker: Marker; px: { x: number; y: number }; fixed: boolean };
    const pts: P[] = [];
    if (meMarkerRef.current) {
      pts.push({
        marker: meMarkerRef.current,
        px: map.project(meMarkerRef.current.getLngLat()),
        fixed: true, // "Me" stays put; only peers move around it.
      });
    }
    for (const marker of markersRef.current.values()) {
      pts.push({ marker, px: map.project(marker.getLngLat()), fixed: false });
    }

    const used = new Array(pts.length).fill(false);
    for (let i = 0; i < pts.length; i++) {
      if (used[i]) continue;
      const group = [i];
      used[i] = true;
      for (let j = i + 1; j < pts.length; j++) {
        if (used[j]) continue;
        const dx = pts[i].px.x - pts[j].px.x;
        const dy = pts[i].px.y - pts[j].px.y;
        if (dx * dx + dy * dy < COLLISION_PX * COLLISION_PX) {
          group.push(j);
          used[j] = true;
        }
      }

      const movable = group.filter((k) => !pts[k].fixed);
      if (group.length === 1) {
        if (movable.length) pts[group[0]].marker.setOffset([0, 0]);
        continue;
      }
      movable.forEach((k, idx) => {
        const angle = (2 * Math.PI * idx) / movable.length - Math.PI / 2;
        pts[k].marker.setOffset([
          Math.cos(angle) * SPREAD_PX,
          Math.sin(angle) * SPREAD_PX,
        ]);
      });
    }
  }, []);

  // Initialise the map once.
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    const markers = markersRef.current;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        // Initial style follows the current theme; later toggles call setStyle
        // in the effect below. Markers are DOM overlays, so they survive a swap.
        style: MAP_STYLE[theme],
        // Open centered on the user if we know where they are, else world view.
        center: me ? [me.lng, me.lat] : [0, 20],
        zoom: me ? 4 : 1.4,
        attributionControl: true,
      });
      map.on("load", () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      markers.forEach((m) => m.remove());
      markers.clear();
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // `me`/`theme` are only read for the initial map; we don't want to re-init on
    // change (theme swaps go through setStyle below, recenters are not wanted).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the basemap when the theme toggles. Markers are separate DOM overlays,
  // so they persist across setStyle — no need to re-add them.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(MAP_STYLE[theme]);
  }, [theme, ready]);

  // Show / move the user's own "you are here" pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !me) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      if (!meMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "pulse-me";
        el.title = "You are here";
        el.style.setProperty("--dot-hue", String(dotHue(meId)));
        el.innerHTML = `<span class="pulse-me-label">Me</span>`;
        meMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([me.lng, me.lat])
          .addTo(map);
      } else {
        meMarkerRef.current.setLngLat([me.lng, me.lat]);
      }
      declutter();
    })();

    return () => {
      cancelled = true;
    };
  }, [me, ready, meId, declutter]);

  // Reconcile markers whenever the peer list changes (or the map becomes ready).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      const markers = markersRef.current;
      const seen = new Set<string>();

      for (const peer of peers) {
        seen.add(peer.id);
        let marker = markers.get(peer.id);
        if (!marker) {
          const el = document.createElement("button");
          el.className = "pulse-dot";
          const hue = dotHue(peer.id);
          el.style.setProperty("--dot-hue", String(hue));
          el.style.background = `hsl(${hue} 70% 60%)`;
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            if (canConnectRef.current) onPeerClickRef.current(peer.id);
          });
          marker = new mapboxgl.Marker({ element: el })
            .setLngLat([peer.lng, peer.lat])
            .addTo(map);
          markers.set(peer.id, marker);
        }
        // Updated every pass (not just on create) since intro/busy can change.
        const el = marker.getElement();
        el.classList.toggle("busy", peer.busy);
        // Inline white lock while busy (DOM svg — reliable vs CSS mask).
        const lock = el.querySelector<SVGElement>(".pulse-dot-lock");
        if (peer.busy) {
          if (!lock) {
            el.insertAdjacentHTML(
              "beforeend",
              `<svg class="pulse-dot-lock" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 0 1 6 0v3H9z"/></svg>`,
            );
          }
        } else if (lock) {
          lock.remove();
        }
        // Styled hover pill for the intro (matches the gate/Me labels). Create /
        // update / remove the label child to mirror the current intro.
        const intro = peer.intro?.trim();
        let label = el.querySelector<HTMLSpanElement>(".pulse-dot-label");
        if (intro) {
          if (!label) {
            label = document.createElement("span");
            label.className = "pulse-dot-label";
            el.appendChild(label);
          }
          label.textContent = intro;
        } else if (label) {
          label.remove();
        }
        el.setAttribute("aria-label", intro ? intro : "Tap to connect");
      }

      // Drop markers for peers that went offline. Stop tracking immediately,
      // then play the exit animation before actually removing the marker.
      for (const [id, marker] of markers) {
        if (!seen.has(id)) {
          markers.delete(id);
          marker.getElement().classList.add("leaving");
          setTimeout(() => marker.remove(), 260);
        }
      }

      declutter();
    })();

    return () => {
      cancelled = true;
    };
  }, [peers, ready, declutter]);

  // Re-evaluate overlap whenever zoom changes the on-screen spacing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const handler = () => declutter();
    map.on("zoom", handler);
    return () => {
      map.off("zoom", handler);
    };
  }, [ready, declutter]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full bg-surface-2" />

      {!TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="max-w-md rounded-lg bg-surface p-4 text-sm text-foreground">
            Set{" "}
            <code className="text-accent">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{" "}
            <code>.env</code> to load the map.
          </p>
        </div>
      )}

      {/* Online count */}
      <div className="absolute bottom-4 left-4 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs text-muted backdrop-blur">
        {peers.length} online
      </div>
    </div>
  );
}
