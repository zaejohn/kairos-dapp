"use client";

import { useEffect } from "react";

export type ToastKind = "success" | "error" | "warning" | "info";

export type ToastNotice = {
  id: number;
  kind: ToastKind;
  message: string;
  detail?: string;
  persistent?: boolean;
  key?: string;
};

function ToastItem({
  notice,
  onDismiss,
}: {
  notice: ToastNotice;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    if (notice.persistent || notice.kind === "error" || notice.kind === "warning") return;
    const timer = window.setTimeout(() => onDismiss(notice.id), 7_000);
    return () => window.clearTimeout(timer);
  }, [notice.id, notice.kind, notice.persistent, onDismiss]);

  return (
    <div className={`toast toast-${notice.kind}`} role={notice.kind === "error" || notice.kind === "warning" ? "alert" : "status"}>
      <div className="toast-copy">
        <strong>{notice.kind}</strong>
        <span>{notice.message}</span>
        {notice.detail && <small>{notice.detail}</small>}
      </div>
      <button type="button" aria-label={`Dismiss ${notice.kind} notification`} onClick={() => onDismiss(notice.id)}>×</button>
    </div>
  );
}

export function ToastViewport({
  notices,
  onDismiss,
}: {
  notices: ToastNotice[];
  onDismiss: (id: number) => void;
}) {
  if (notices.length === 0) return null;
  return (
    <div className="toast-viewport" aria-label="Notifications">
      {notices.map((notice) => (
        <ToastItem key={notice.id} notice={notice} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
