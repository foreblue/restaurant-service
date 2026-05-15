import { UtensilsCrossed } from "lucide-react";
import { type ReactNode } from "react";

export function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-[420px] rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <UtensilsCrossed aria-hidden className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
