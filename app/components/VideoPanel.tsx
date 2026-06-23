"use client";

import { useEffect, useRef } from "react";

export default function VideoPanel({
  localStream,
  remoteStream,
  onEnd,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEnd: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

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
    <div className="absolute inset-0 z-30 flex flex-col bg-background">
      {/* min-h-0 lets this flex child shrink to the track instead of growing to
          the video's intrinsic resolution, which otherwise shoves the control
          bar (and PiP) off the bottom of the screen once a stream loads. */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Remote (full screen) */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="h-full w-full bg-surface-2 object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            Waiting for stranger&rsquo;s video…
          </div>
        )}
        {/* Local (picture-in-picture) */}
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 h-40 w-28 rounded-lg border border-border bg-surface-2 object-cover"
        />
      </div>
      <div className="flex justify-center bg-surface p-4">
        <button
          onClick={onEnd}
          className="rounded-full bg-danger px-8 py-3 font-semibold text-danger-foreground hover:opacity-90"
        >
          End video
        </button>
      </div>
    </div>
  );
}
