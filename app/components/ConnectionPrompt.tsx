"use client";

import Modal from "./ui/Modal";
import Button from "./ui/Button";

// Reusable centered prompt for "someone wants to connect" and
// "someone wants to start video". Rendered always-mounted and driven by `open`
// so the close animation can play.
export default function ConnectionPrompt({
  open,
  title,
  subtitle,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Modal open={open} onClose={onDecline}>
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
