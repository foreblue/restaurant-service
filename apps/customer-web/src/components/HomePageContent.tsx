import Link from "next/link";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { CustomerMemberSessionStatus } from "@/features/reservations/CustomerMemberSessionStatus";
import { PublicRestaurantList } from "@/features/restaurants/PublicRestaurantList";
import { type PublicRestaurantListItem } from "@/features/restaurants/publicRestaurantTypes";

interface HomePageContentProps {
  restaurantListError?: boolean | undefined;
  restaurants?: PublicRestaurantListItem[] | undefined;
}

export function HomePageContent({
  restaurantListError = false,
  restaurants = [],
}: HomePageContentProps) {
  return (
    <ReservationPageShell
      description="전체 매장 목록에서 원하는 매장을 선택하거나 예약번호로 기존 예약을 확인할 수 있습니다."
      eyebrow="고객 예약"
      title="식당 예약"
    >
      <div className="grid gap-4">
        <PublicRestaurantList
          loadFailed={restaurantListError}
          restaurants={restaurants}
          sessionRedirectTo="/"
        />

        <CustomerMemberSessionStatus redirectTo="/" variant="card" />

        <section className="grid gap-3 rounded-lg border bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">예약 확인</h2>
          <p className="text-sm leading-6 text-slate-600">
            예약 완료 후 받은 예약번호와 휴대폰 번호로 상세 정보를 다시 조회합니다.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-teal-700 bg-white px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            href="/reservations"
          >
            예약 조회
          </Link>
        </section>
      </div>
    </ReservationPageShell>
  );
}
