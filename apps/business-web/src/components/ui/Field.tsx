import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}

export function Field({ id, label, description, error, children, className }: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {description ? (
        <p className="text-xs text-muted-foreground" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
