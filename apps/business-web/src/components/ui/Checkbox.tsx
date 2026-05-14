import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, id, ...props },
  ref,
) {
  return (
    <label className="flex min-h-10 items-center gap-3 text-sm font-medium" htmlFor={id}>
      <input
        className={cn(
          "size-4 rounded border-input text-primary outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        id={id}
        ref={ref}
        type="checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
});
