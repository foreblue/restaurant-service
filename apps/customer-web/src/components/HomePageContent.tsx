const readinessItems = [
  "Next.js App Router",
  "TypeScript strict mode",
  "Tailwind CSS",
  "Vitest + Testing Library",
];

export function HomePageContent() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col justify-center px-5 py-8">
        <div className="rounded-lg border bg-[var(--surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-teal-700">모바일 우선</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-950">식당 예약</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            공유받은 예약 링크로 이동해 주세요.
          </p>
          <div className="mt-6 grid gap-2">
            {readinessItems.map((item) => (
              <div
                className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm"
                key={item}
              >
                <span className="font-medium text-slate-800">{item}</span>
                <span className="text-teal-700">준비됨</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
