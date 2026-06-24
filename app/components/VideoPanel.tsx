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
  chatOpen,
  onToggleChat,
  onEnd,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerId: string;
  peerIntro: string | null;
  chatOpen: boolean;
  onToggleChat: () => void;
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
      className={`fixed inset-0 z-30 overflow-hidden bg-background transition-[right] duration-300 ${
        chatOpen ? "md:right-[28rem]" : ""
      }`}
    >
      {/* Remote feed at its true aspect ratio (object-contain → letterboxed on
          the dark bg), so a portrait/phone caller isn't cropped. Overlays float
          on top, so the video can never push the controls off-screen (1.5 fix). */}
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        aria-label={`${name}'s video`}
        className="absolute inset-0 h-full w-full bg-surface-2 object-contain"
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
        aria-label="Your video"
        className="absolute bottom-24 right-4 h-[120px] w-[120px] -scale-x-100 rounded-lg border border-border bg-surface-2 object-cover shadow-lg sm:h-[140px] sm:w-[140px]"
      />

      {/* Control bar over a scrim so buttons stay legible on bright video. */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-4 bg-gradient-to-t from-black/60 to-transparent px-4 pb-6 pt-12">
        <Button
          variant="accent"
          size="icon"
          onClick={onToggleChat}
          aria-label={chatOpen ? "Hide chat" : "Show chat"}
          title={chatOpen ? "Hide chat" : "Show chat"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </Button>
        <Button
          variant="danger"
          size="icon"
          onClick={onEnd}
          aria-label="End video"
          title="End video"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="m16 16 6 4V8l-6 4M16 16V8a2 2 0 0 0-2-2H8m8 10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8M2 2l20 20" />
          </svg>
        </Button>
      </div>
    </motion.div>
  );
}
