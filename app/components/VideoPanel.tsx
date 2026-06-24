"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import Button from "./ui/Button";
import { hueCss } from "@/lib/hue";

export default function VideoPanel({
  localStream,
  remoteStream,
  peerId,
  peerIntro,
  onEnd,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerId: string;
  peerIntro: string | null;
  onEnd: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const name = peerIntro?.trim() ? peerIntro : "Stranger";

  useEffect(() => {
    if (localRef.current && localRef.current.srcObject !== localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteRef.current.srcObject !== remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute inset-0 z-30 overflow-hidden bg-background"
    >
      {/* Remote, full-bleed. Overlays float on top, so the video's intrinsic
          size can never push the controls off-screen (the 1.5 fix, structural). */}
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full bg-surface-2 object-cover"
      />

      {!remoteStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
          <motion.span
            className="h-8 w-8 rounded-full border-2 border-border border-t-accent"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm">Waiting for {name}&rsquo;s video…</p>
        </div>
      )}

      {/* Peer identity — matches the chat header / connection cards. Offset
          right of the fixed theme toggle (left-4) so they don't overlap. */}
      <div className="absolute left-16 top-4 flex max-w-[60%] items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-sm text-foreground shadow backdrop-blur">
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ background: hueCss(peerId) }}
        />
        <span className="truncate font-medium">{name}</span>
      </div>

      {/* Local self-view (mirrored, like every camera app). */}
      <video
        ref={localRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-24 right-4 h-[120px] w-[120px] -scale-x-100 rounded-lg border border-border bg-surface-2 object-cover shadow-lg sm:h-[140px] sm:w-[140px]"
      />

      {/* Control bar over a scrim so buttons stay legible on bright video. */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/60 to-transparent px-4 pb-6 pt-12">
        <Button variant="danger" onClick={onEnd} className="px-8 py-3">
          End video
        </Button>
      </div>
    </motion.div>
  );
}
