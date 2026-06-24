"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Panel from "./ui/Panel";
import { hueCss } from "@/lib/hue";

export interface ChatMessage {
  id: number;
  mine: boolean;
  text: string;
}

const TYPING_IDLE_MS = 2000;

export default function ChatPanel({
  messages,
  connected,
  videoBusy,
  peerId,
  peerIntro,
  peerTyping,
  onSend,
  onTyping,
  onStartVideo,
  onEnd,
}: {
  messages: ChatMessage[];
  connected: boolean;
  videoBusy: boolean;
  peerId: string;
  peerIntro: string | null;
  peerTyping: boolean;
  onSend: (text: string) => void;
  onTyping: (typing: boolean) => void;
  onStartVideo: () => void;
  onEnd: () => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Emit typing transitions only (not per keystroke). typingRef mirrors what we
  // last told the peer; idleTimer fires the "stopped" signal after a pause.
  const typingRef = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  function setTyping(on: boolean) {
    if (typingRef.current === on) return;
    typingRef.current = on;
    onTyping(on);
  }

  function changeDraft(value: string) {
    setDraft(value);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (value.trim()) {
      setTyping(true);
      idleTimer.current = setTimeout(() => setTyping(false), TYPING_IDLE_MS);
    } else {
      setTyping(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setTyping(false);
    onSend(text);
    setDraft("");
  }

  // Tell the peer we stopped if the panel unmounts mid-type.
  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  return (
    <Panel side="right" className="w-full max-w-md">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="h-3 w-3 shrink-0 rounded-full shadow"
            style={{ background: hueCss(peerId) }}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {peerIntro?.trim() ? peerIntro : "Stranger"}
            </p>
            <p className="text-xs text-muted">
              {connected ? "Connected" : "Connecting…"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onStartVideo}
            disabled={!connected || videoBusy}
            className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-surface-2 disabled:opacity-40"
          >
            Video
          </button>
          <button
            onClick={onEnd}
            className="rounded-full bg-danger px-3 py-1.5 text-sm font-medium text-danger-foreground hover:opacity-90"
          >
            End
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-1 overflow-y-auto p-4">
        {messages.length === 0 && !peerTyping && (
          <p className="mt-8 text-center text-sm text-muted">
            Say hello. Messages are peer-to-peer and never stored.
          </p>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const firstOfGroup = !prev || prev.mine !== m.mine;
          const lastOfGroup = !next || next.mine !== m.mine;
          return (
            <div
              key={m.id}
              className={`flex ${m.mine ? "justify-end" : "justify-start"} ${
                firstOfGroup ? "mt-3 first:mt-0" : ""
              }`}
            >
              <motion.span
                initial={
                  reduce ? false : { opacity: 0, y: 6, x: m.mine ? 8 : -8 }
                }
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`max-w-[80%] px-3 py-2 text-sm ${
                  m.mine
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-2 text-foreground"
                } ${bubbleRadius(m.mine, firstOfGroup, lastOfGroup)}`}
              >
                {m.text}
              </motion.span>
            </div>
          );
        })}

        {peerTyping && (
          <div className="flex justify-start pt-2">
            <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2.5">
              {reduce ? (
                <span className="text-xs text-muted">typing…</span>
              ) : (
                [0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-muted"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: d * 0.15,
                    }}
                  />
                ))
              )}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
        <input
          value={draft}
          onChange={(e) => changeDraft(e.target.value)}
          placeholder={connected ? "Type a message…" : "Connecting…"}
          disabled={!connected}
          className="flex-1 rounded-full bg-surface-2 px-4 py-2 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || !draft.trim()}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </Panel>
  );
}

// Round the outer corners of a sender's group, flatten the side that touches
// the next bubble in the same group — gives each group a single "tail".
function bubbleRadius(mine: boolean, first: boolean, last: boolean): string {
  if (first && last) return "rounded-2xl";
  if (mine) {
    if (first) return "rounded-2xl rounded-br-md";
    if (last) return "rounded-2xl rounded-tr-md";
    return "rounded-2xl rounded-r-md";
  }
  if (first) return "rounded-2xl rounded-bl-md";
  if (last) return "rounded-2xl rounded-tl-md";
  return "rounded-2xl rounded-l-md";
}
