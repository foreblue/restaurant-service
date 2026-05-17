"use client";

import { type ReactNode, useId } from "react";

import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  cancelLabel?: string | undefined;
  children?: ReactNode | undefined;
  confirmDisabled?: boolean | undefined;
  confirmLabel?: string | undefined;
  destructive?: boolean | undefined;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}

export function ConfirmDialog({
  cancelLabel = "닫기",
  children,
  confirmDisabled = false,
  confirmLabel = "확인",
  destructive = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  const titleId = useId();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-4 py-5 sm:items-center">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-[420px] rounded-lg border bg-white p-5 shadow-xl"
        role="dialog"
      >
        <h2 className="text-lg font-semibold text-slate-950" id={titleId}>
          {title}
        </h2>
        {children ? <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div> : null}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            disabled={confirmDisabled}
            type="button"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
