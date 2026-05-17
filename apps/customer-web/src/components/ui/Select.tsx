import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean | undefined;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid = false, ...props },
  ref,
) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-11 w-full rounded-md border bg-white px-3 py-2 text-base text-slate-950 shadow-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-100",
        invalid && "border-red-400 focus:border-red-600 focus:ring-red-600/20",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
