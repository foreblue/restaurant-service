import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  description?: string | undefined;
  error?: string | undefined;
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, description, error, id, label, ...props },
  ref,
) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="grid gap-1">
      <label className="flex items-start gap-3 text-sm text-slate-800" htmlFor={id}>
        <input
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            "mt-0.5 size-5 rounded border-slate-300 text-teal-700 focus:ring-2 focus:ring-teal-600",
            className,
          )}
          id={id}
          ref={ref}
          type="checkbox"
          {...props}
        />
        <span>{label}</span>
      </label>
      {description ? (
        <p className="pl-8 text-xs leading-5 text-slate-500" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="pl-8 text-xs leading-5 text-red-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
