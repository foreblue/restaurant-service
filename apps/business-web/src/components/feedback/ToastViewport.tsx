import { X } from "lucide-react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { type ToastVariant, useToastStore } from "@/components/feedback/toastStore";

const variantClassName: Record<ToastVariant, string> = {
  info: "border-border bg-card text-foreground",
  success: "border-primary/30 bg-card text-primary",
  danger: "border-destructive/30 bg-card text-destructive",
};

export function ToastViewport() {
  const { toasts, dismissToast } = useToastStore();

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 grid w-[min(360px,calc(100vw-32px))] gap-2">
      {toasts.map((toast) => (
        <section
          className={cn("rounded-lg border p-4 shadow-lg", variantClassName[toast.variant])}
          key={toast.id}
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
              ) : null}
            </div>
            <Button
              aria-label="알림 닫기"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => dismissToast(toast.id)}
            >
              <X aria-hidden className="size-4" />
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
}
