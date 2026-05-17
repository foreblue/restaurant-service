import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonSize = "md" | "sm";
type ButtonVariant = "danger" | "ghost" | "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize | undefined;
  variant?: ButtonVariant | undefined;
}

const variantClasses: Record<ButtonVariant, string> = {
  danger: "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500",
  primary: "bg-teal-950 text-white hover:bg-teal-900 focus-visible:ring-teal-800",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 py-2 text-sm",
  sm: "min-h-9 px-3 py-1.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, size = "md", type = "button", variant = "primary", ...props },
  ref,
) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:hover:bg-slate-100",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  );
});
