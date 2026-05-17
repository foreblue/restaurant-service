import { type ReactNode } from "react";

import { Button } from "@/components/ui/Button";

interface StateBlockProps {
  action?:
    | {
        label: string;
        onClick: () => void;
      }
    | undefined;
  children?: ReactNode | undefined;
  title: string;
  variant?: "empty" | "error" | "loading" | undefined;
}

export function StateBlock({ action, children, title, variant = "empty" }: StateBlockProps) {
  return (
    <section className="rounded-lg border bg-white p-5 text-center shadow-sm">
      {variant === "loading" ? (
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
      ) : null}
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {children ? <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div> : null}
      {action ? (
        <Button
          className="mt-5"
          type="button"
          variant={variant === "error" ? "secondary" : "primary"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </section>
  );
}
