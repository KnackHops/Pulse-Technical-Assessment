"use client";

import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { hueCss } from "@/lib/hue";

// Reusable centered prompt for "someone wants to connect" and
// "someone wants to start video". Rendered always-mounted and driven by `open`
// so the close animation can play. `dotId` (the peer's id) draws their map hue
// dot above the title so the prompt is tied to the on-map stranger.
export default function ConnectionPrompt({
  open,
  title,
  subtitle,
  dotId,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  dotId?: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Modal open={open} onClose={onDecline}>
      {dotId && (
        <span
          aria-hidden
          className="mx-auto mb-3 block h-4 w-4 rounded-full shadow"
          style={{ background: hueCss(dotId) }}
        />
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5 flex gap-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onDecline}>
          {declineLabel}
        </Button>
        <Button variant="accent" size="sm" className="flex-1" onClick={onAccept}>
          {acceptLabel}
        </Button>
      </div>
    </Modal>
  );
}
