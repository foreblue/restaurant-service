import { ReservationPageShell } from "@/components/layout/ReservationPageShell";

const readinessItems = [
  "Next.js App Router",
  "TypeScript strict mode",
  "Tailwind CSS",
  "Vitest + Testing Library",
];

export function HomePageContent() {
  return (
    <ReservationPageShell
      description="공유받은 예약 링크로 이동해 주세요."
      eyebrow="모바일 우선"
      title="식당 예약"
    >
      <div className="rounded-lg border bg-[var(--surface)] p-5 shadow-sm">
        <div className="grid gap-2">
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
    </ReservationPageShell>
  );
}
