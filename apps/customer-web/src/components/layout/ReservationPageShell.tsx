import { type ReactNode } from "react";

interface ReservationPageShellProps {
  children: ReactNode;
  description?: string | undefined;
  eyebrow?: string | undefined;
  footer?: ReactNode | undefined;
  title: string;
}

export function ReservationPageShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: ReservationPageShellProps) {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col px-5 py-8">
        <header className="pt-8">
          {eyebrow ? <p className="text-sm font-semibold text-teal-700">{eyebrow}</p> : null}
          <h1 className="mt-3 text-4xl font-bold text-slate-950">{title}</h1>
          {description ? (
            <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
          ) : null}
        </header>
        <div className="mt-6 flex-1">{children}</div>
        {footer ? <footer className="mt-6 pb-4">{footer}</footer> : null}
      </section>
    </main>
  );
}
