import Link from "next/link";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { StateBlock } from "@/components/ui";
import { PublicRestaurantList } from "@/features/restaurants/PublicRestaurantList";
import { type PublicRestaurantListItem } from "@/features/restaurants/publicRestaurantTypes";

import { CustomerMemberSessionStatus } from "./CustomerMemberSessionStatus";

interface ReservationEntryPageContentProps {
  restaurantListError?: boolean | undefined;
  restaurants?: PublicRestaurantListItem[] | undefined;
}

export function ReservationEntryPageContent({
  restaurantListError = false,
  restaurants = [],
}: ReservationEntryPageContentProps) {
  return (
    <ReservationPageShell
      description="테스트 매장 전체 목록에서 원하는 매장을 선택해 예약을 시작합니다."
      eyebrow="예약 신청"
      title="전체 매장"
    >
      <div className="grid gap-4">
        <PublicRestaurantList
          loadFailed={restaurantListError}
          restaurants={restaurants}
          sessionRedirectTo="/reserve"
        />

        <CustomerMemberSessionStatus redirectTo="/reserve" variant="entry" />

        <StateBlock title="예약번호가 이미 있나요?">
          <p>예약 조회에서 예약번호와 휴대폰 번호로 기존 예약을 확인할 수 있습니다.</p>
          <Link
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            href="/reservations"
          >
            예약 조회
          </Link>
        </StateBlock>
      </div>
    </ReservationPageShell>
  );
}
