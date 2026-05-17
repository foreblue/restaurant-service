export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col gap-4 px-5 py-10">
      <div className="h-8 w-40 animate-pulse rounded-md bg-slate-200" />
      <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-24 animate-pulse rounded-lg bg-slate-200" />
    </main>
  );
}
