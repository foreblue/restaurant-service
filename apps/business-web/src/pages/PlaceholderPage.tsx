interface PlaceholderPageProps {
  title: string;
  status: string;
}

export function PlaceholderPage({ title, status }: PlaceholderPageProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{status}</p>
    </section>
  );
}
