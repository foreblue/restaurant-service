import Link from "next/link";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";

export function HomePageContent() {
  return (
    <ReservationPageShell
      description="공유받은 매장 예약 링크에서 새 예약을 진행하거나 예약번호로 기존 예약을 확인할 수 있습니다."
      eyebrow="고객 예약"
      title="식당 예약"
    >
      <section className="grid gap-3 rounded-lg border bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">예약 확인</h2>
        <p className="text-sm leading-6 text-slate-600">
          예약 완료 후 받은 예약번호와 휴대폰 번호로 상세 정보를 다시 조회합니다.
        </p>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          href="/reservations"
        >
          예약 조회
        </Link>
      </section>
    </ReservationPageShell>
  );
}
