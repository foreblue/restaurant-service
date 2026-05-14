import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "info" | "danger" | "success";

interface AlertProps {
  title?: string;
  children: ReactNode;
  variant?: AlertVariant;
}

const variantClassName: Record<AlertVariant, string> = {
  info: "border-border bg-muted text-foreground",
  danger: "border-destructive/30 bg-destructive/5 text-destructive",
  success: "border-primary/30 bg-primary/5 text-primary",
};

export function Alert({ title, children, variant = "info" }: AlertProps) {
  return (
    <div className={cn("rounded-md border px-3 py-2 text-sm", variantClassName[variant])}>
      {title ? <p className="font-medium">{title}</p> : null}
      <div className={cn(title && "mt-1", "text-sm")}>{children}</div>
    </div>
  );
}
