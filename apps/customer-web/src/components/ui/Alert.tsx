import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "error" | "info" | "success" | "warning";

const variantClasses: Record<AlertVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-sky-200 bg-sky-50 text-sky-950",
  success: "border-teal-200 bg-teal-50 text-teal-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
};

interface AlertProps {
  children: ReactNode;
  title?: string | undefined;
  variant?: AlertVariant | undefined;
}

export function Alert({ children, title, variant = "info" }: AlertProps) {
  return (
    <div
      className={cn("rounded-lg border p-4 text-sm leading-6", variantClasses[variant])}
      role="status"
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
