"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import Toast, { type ToastVariant } from "./components/ui/Toast";
import EntryGate from "./components/EntryGate";
import WorldMap from "./components/WorldMap";
import ConnectionPrompt from "./components/ConnectionPrompt";
import RequestingCard from "./components/RequestingCard";
import ChatPanel, { type ChatMessage } from "./components/ChatPanel";
import VideoPanel from "./components/VideoPanel";
import { join, leave, poll, sendSignal } from "@/lib/api";
import { PeerSession, type DescType, type PeerControl } from "@/lib/webrtc";
import { POLL_INTERVAL_MS } from "@/lib/presence";
import { type PeerDot, type SignalMsg } from "@/lib/types";

type Conn =
  | { kind: "idle" }
  | { kind: "requesting"; peerId: string }
  | { kind: "incoming"; peerId: string }
  | { kind: "connecting"; peerId: string }
  | { kind: "connected"; peerId: string };

type VideoState = "none" | "requesting" | "incoming" | "active";

const REQUEST_TIMEOUT_MS = 30_000;

export default function Home() {
  const [phase, setPhase] = useState<"gate" | "live">("gate");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [peers, setPeers] = useState<PeerDot[]>([]);
  const [gateCount, setGateCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [notice, setNotice] = useState<{ text: string; variant: ToastVariant } | null>(
    null,
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const [conn, _setConn] = useState<Conn>({ kind: "idle" });
  const connRef = useRef<Conn>(conn);
  const setConn = (c: Conn) => {
    connRef.current = c;
    _setConn(c);
  };

  const [video, _setVideo] = useState<VideoState>("none");
  const videoRef = useRef<VideoState>(video);
  const setVideo = (v: VideoState) => {
    videoRef.current = v;
    _setVideo(v);
  };

  const peerRef = useRef<PeerSession | null>(null);
  const msgId = useRef(0);
  const requestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Safety net: clear the typing indicator if a "typing-stop" never arrives.
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setPeerTypingSafe(on: boolean) {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setPeerTyping(on);
    if (on) {
      typingTimer.current = setTimeout(() => setPeerTyping(false), 5000);
    }
  }

  function showNotice(text: string, variant: ToastVariant = "info") {
    setNotice({ text, variant });
    window.setTimeout(() => setNotice(null), 3500);
  }

  function addMessage(mine: boolean, text: string) {
    setMessages((prev) => [...prev, { id: msgId.current++, mine, text }]);
  }

  function teardown(message?: string, variant: ToastVariant = "info") {
    if (requestTimer.current) clearTimeout(requestTimer.current);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    peerRef.current?.close();
    peerRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setVideo("none");
    setMessages([]);
    setPeerTyping(false);
    setConn({ kind: "idle" });
    if (message) showNotice(message, variant);
  }

  function startPeer(peerId: string, initiator: boolean) {
    const ps = new PeerSession(initiator, {
      onSignal: (type: DescType, payload: string) => {
        void sendSignal(sessionId, peerId, type, payload);
      },
      onChat: (text) => {
        setPeerTypingSafe(false);
        addMessage(false, text);
      },
      onControl: (ctrl) => handleControl(ctrl),
      onRemoteStream: (stream) => setRemoteStream(stream),
      onConnectionState: (state) => {
        if (state === "failed") {
          // Free both peers' busy flag — the connection is dead.
          if (
            connRef.current.kind === "connecting" ||
            connRef.current.kind === "connected"
          ) {
            void sendSignal(sessionId, peerId, "end");
          }
          teardown("Connection failed (network).", "danger");
        }
      },
      onChannelOpen: () => {
        setConn({ kind: "connected", peerId });
        showNotice("Connected", "success");
      },
    });
    peerRef.current = ps;
  }

  function handleControl(ctrl: PeerControl) {
    const ps = peerRef.current;
    switch (ctrl) {
      case "typing-start":
        setPeerTypingSafe(true);
        break;
      case "typing-stop":
        setPeerTypingSafe(false);
        break;
      case "video-request":
        if (videoRef.current === "none") setVideo("incoming");
        break;
      case "video-accept":
        if (videoRef.current === "requesting" && ps) {
          ps.startVideo()
            .then((stream) => {
              setLocalStream(stream);
              setVideo("active");
            })
            .catch(() => {
              setVideo("none");
              ps.sendControl("video-end");
              showNotice("Camera unavailable.", "danger");
            });
        }
        break;
      case "video-decline":
        if (videoRef.current === "requesting") {
          setVideo("none");
          showNotice("Video declined.");
        }
        break;
      case "video-end":
        ps?.stopVideo();
        setLocalStream(null);
        setRemoteStream(null);
        setVideo("none");
        break;
    }
  }

  function requestConnection(peerId: string) {
    if (connRef.current.kind !== "idle") {
      showNotice("Finish your current connection first.", "info");
      return;
    }
    if (peers.find((p) => p.id === peerId)?.busy) {
      showNotice("They're already connected.", "info");
      return;
    }
    setConn({ kind: "requesting", peerId });
    void sendSignal(sessionId, peerId, "request");
    requestTimer.current = setTimeout(() => {
      if (
        connRef.current.kind === "requesting" &&
        connRef.current.peerId === peerId
      ) {
        void sendSignal(sessionId, peerId, "end");
        teardown("No answer.");
      }
    }, REQUEST_TIMEOUT_MS);
  }

  function cancelRequest() {
    if (connRef.current.kind === "requesting") {
      void sendSignal(sessionId, connRef.current.peerId, "end");
    }
    teardown();
  }

  function acceptIncoming() {
    if (connRef.current.kind !== "incoming") return;
    const peerId = connRef.current.peerId;
    startPeer(peerId, false);
    void sendSignal(sessionId, peerId, "accept");
    setConn({ kind: "connecting", peerId });
  }

  function declineIncoming() {
    if (connRef.current.kind !== "incoming") return;
    void sendSignal(sessionId, connRef.current.peerId, "decline");
    setConn({ kind: "idle" });
  }

  function endConnection() {
    const c = connRef.current;
    if (c.kind === "connecting" || c.kind === "connected") {
      void sendSignal(sessionId, c.peerId, "end");
    }
    teardown();
  }

  function startVideoRequest() {
    if (videoRef.current !== "none" || !peerRef.current) return;
    setVideo("requesting");
    peerRef.current.sendControl("video-request");
  }

  function acceptVideo() {
    const ps = peerRef.current;
    if (!ps) return;
    ps.startVideo()
      .then((stream) => {
        setLocalStream(stream);
        ps.sendControl("video-accept");
        setVideo("active");
      })
      .catch(() => {
        ps.sendControl("video-decline");
        setVideo("none");
        showNotice("Camera unavailable.", "danger");
      });
  }

  function declineVideo() {
    peerRef.current?.sendControl("video-decline");
    setVideo("none");
  }

  function endVideo() {
    const ps = peerRef.current;
    ps?.stopVideo();
    ps?.sendControl("video-end");
    setLocalStream(null);
    setRemoteStream(null);
    setVideo("none");
  }

  function processSignal(sig: SignalMsg) {
    switch (sig.type) {
      case "request": {
        if (connRef.current.kind === "idle") {
          setConn({ kind: "incoming", peerId: sig.fromId });
        } else {
          void sendSignal(sessionId, sig.fromId, "decline");
        }
        break;
      }
      case "accept": {
        const c = connRef.current;
        if (c.kind === "requesting" && c.peerId === sig.fromId) {
          if (requestTimer.current) clearTimeout(requestTimer.current);
          startPeer(sig.fromId, true);
          setConn({ kind: "connecting", peerId: sig.fromId });
        }
        break;
      }
      case "decline": {
        const c = connRef.current;
        if (c.kind === "requesting" && c.peerId === sig.fromId) {
          if (requestTimer.current) clearTimeout(requestTimer.current);
          teardown("Request declined.");
        }
        break;
      }
      case "offer":
      case "answer":
      case "ice": {
        const c = connRef.current;
        const peerId =
          c.kind === "connecting" || c.kind === "connected" ? c.peerId : null;
        if (peerRef.current && peerId === sig.fromId) {
          void peerRef.current.handleSignal(
            sig.type as DescType,
            sig.payload ?? "",
          );
        }
        break;
      }
      case "end": {
        const c = connRef.current;
        if (
          (c.kind === "incoming" ||
            c.kind === "connecting" ||
            c.kind === "connected") &&
          c.peerId === sig.fromId
        ) {
          if (c.kind === "incoming") setConn({ kind: "idle" });
          else teardown("Stranger disconnected.");
        }
        break;
      }
    }
  }

  const processSignalRef = useRef(processSignal);
  useEffect(() => {
    processSignalRef.current = processSignal;
  });

  useEffect(() => {
    if (phase !== "live" || !sessionId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const data = await poll(sessionId);
        if (!active) return;
        setPeers(data.peers);
        for (const s of data.signals) processSignalRef.current(s);

        // If our connected/connecting peer has vanished from presence (they
        // hard-refreshed or closed without sending "end"), their leave deleted
        // their row but couldn't clear our busy flag — there's no server-side
        // pairing. Detect the absence and free ourselves.
        const c = connRef.current;
        if (
          (c.kind === "connecting" || c.kind === "connected") &&
          !data.peers.some((p) => p.id === c.peerId)
        ) {
          void sendSignal(sessionId, c.peerId, "end");
          teardown("Stranger disconnected.");
        }
      } catch {}
      if (active) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
    // teardown only touches stable setters/refs; don't restart polling on its
    // identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sessionId]);

  useEffect(() => {
    if (!sessionId || phase !== "live") return;
    const onLeave = () => leave(sessionId);
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [sessionId, phase]);

  // Live online count while on the gate. poll() only reads/heartbeats (no
  // upsert), so calling it here does NOT create a presence row — the user
  // doesn't appear on the map until they actually join.
  useEffect(() => {
    if (phase !== "gate") return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const data = await poll(sessionId);
        if (active) setGateCount(data.peers.length);
      } catch {}
      if (active) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [phase, sessionId]);

  async function handleReady(lat: number, lng: number, intro: string) {
    // Only go live once the join actually succeeds. If it throws, let it
    // propagate to EntryGate (which shows the error and stays on the gate) —
    // otherwise the user would appear "live" with no presence row: invisible
    // to everyone, with no indication anything went wrong.
    await join(sessionId, lat, lng, intro);
    setMyLocation({ lat, lng });
    setPhase("live");
  }

  if (phase === "gate") {
    return <EntryGate onReady={handleReady} onlineCount={gateCount} />;
  }

  // The intro of whoever is currently requesting a connection (if they set one)
  // — shown in the prompt so you get a sense of the stranger before accepting.
  const incomingIntro =
    conn.kind === "incoming"
      ? peers.find((p) => p.id === conn.peerId)?.intro ?? null
      : null;

  // The peer we're actively connected to (for the chat/video identity overlays).
  const activePeerId = conn.kind === "idle" ? null : conn.peerId;
  const activePeerIntro =
    peers.find((p) => p.id === activePeerId)?.intro ?? null;

  return (
    <main className="fixed inset-0 overflow-hidden">
      <WorldMap
        peers={peers}
        me={myLocation}
        meId={sessionId}
        onPeerClick={requestConnection}
        canConnect={conn.kind === "idle"}
      />

      <AnimatePresence>
        {notice && (
          <Toast key={notice.text} message={notice.text} variant={notice.variant} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {conn.kind === "requesting" && (
          <RequestingCard
            peerId={conn.peerId}
            intro={peers.find((p) => p.id === conn.peerId)?.intro ?? null}
            timeoutMs={REQUEST_TIMEOUT_MS}
            onCancel={cancelRequest}
          />
        )}
      </AnimatePresence>

      <ConnectionPrompt
        open={conn.kind === "incoming"}
        title="A stranger wants to connect"
        subtitle={incomingIntro ? `“${incomingIntro}”` : undefined}
        dotId={conn.kind === "incoming" ? conn.peerId : undefined}
        acceptLabel="Accept"
        declineLabel="Decline"
        onAccept={acceptIncoming}
        onDecline={declineIncoming}
      />

      <AnimatePresence>
        {(conn.kind === "connecting" || conn.kind === "connected") && (
          <ChatPanel
            messages={messages}
            connected={conn.kind === "connected"}
            videoBusy={video !== "none"}
            peerId={conn.peerId}
            peerIntro={peers.find((p) => p.id === conn.peerId)?.intro ?? null}
            peerTyping={peerTyping}
            onSend={(text) => {
              peerRef.current?.sendChat(text);
              addMessage(true, text);
            }}
            onTyping={(t) =>
              peerRef.current?.sendControl(t ? "typing-start" : "typing-stop")
            }
            onStartVideo={startVideoRequest}
            onEnd={endConnection}
          />
        )}
      </AnimatePresence>

      {video === "requesting" && (
        <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-surface/90 px-4 py-2 text-sm text-foreground shadow-lg backdrop-blur">
          Waiting for stranger to accept video…
        </div>
      )}

      <ConnectionPrompt
        open={video === "incoming"}
        title="Start video call?"
        subtitle="The stranger wants to turn on video."
        acceptLabel="Accept"
        declineLabel="Decline"
        onAccept={acceptVideo}
        onDecline={declineVideo}
      />

      <AnimatePresence>
        {video === "active" && (
          <VideoPanel
            localStream={localStream}
            remoteStream={remoteStream}
            peerId={activePeerId ?? ""}
            peerIntro={activePeerIntro}
            onEnd={endVideo}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
