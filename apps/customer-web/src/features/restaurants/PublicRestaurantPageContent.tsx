import Image from "next/image";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { Alert, Button, StateBlock } from "@/components/ui";

import { type PublicRestaurantResponse } from "./publicRestaurantTypes";

interface PublicRestaurantPageContentProps {
  restaurant: PublicRestaurantResponse;
}

export function PublicRestaurantPageContent({ restaurant }: PublicRestaurantPageContentProps) {
  const address = formatAddress(restaurant);

  if (!isReservationPageAvailable(restaurant)) {
    return <UnavailableReservationPage restaurant={restaurant} />;
  }

  return (
    <ReservationPageShell
      description={restaurant.description ?? "소개 문구가 준비 중입니다."}
      eyebrow={restaurant.cuisineTypes.join(" · ") || "예약"}
      title={restaurant.name}
    >
      <div className="grid gap-4">
        <RestaurantCover restaurant={restaurant} />

        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">매장 정보</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="grid gap-1">
              <dt className="font-medium text-slate-500">주소</dt>
              <dd className="break-words text-slate-900">{address}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium text-slate-500">전화번호</dt>
              <dd className="text-slate-900">{restaurant.phone}</dd>
            </div>
          </dl>

          {restaurant.cuisineTypes.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {restaurant.cuisineTypes.map((cuisineType) => (
                <span
                  className="rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800"
                  key={cuisineType}
                >
                  {cuisineType}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">예약 상품</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                방문 날짜와 인원을 선택할 수 있는 상품을 준비 중입니다.
              </p>
            </div>
            <Button disabled size="sm" type="button">
              선택
            </Button>
          </div>
        </section>

        {restaurant.reservationPage.reservationAvailable ? null : (
          <Alert variant="warning">현재 이 매장은 온라인 예약을 받을 수 없습니다.</Alert>
        )}
      </div>
    </ReservationPageShell>
  );
}

function UnavailableReservationPage({ restaurant }: PublicRestaurantPageContentProps) {
  const reason = getUnavailableReason(restaurant);

  return (
    <ReservationPageShell
      description={`${restaurant.name} 예약 링크를 다시 확인해 주세요.`}
      eyebrow="예약 불가"
      title="예약 페이지를 이용할 수 없습니다."
    >
      <StateBlock title={reason.title} variant="empty">
        <p>{reason.description}</p>
        <p className="mt-2">문의가 필요하면 매장으로 연락해 주세요. {restaurant.phone}</p>
      </StateBlock>
    </ReservationPageShell>
  );
}

function RestaurantCover({ restaurant }: PublicRestaurantPageContentProps) {
  if (restaurant.coverImageUrl) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-slate-100 shadow-sm">
        <Image
          alt={`${restaurant.name} 대표 이미지`}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 720px) 100vw, 720px"
          src={restaurant.coverImageUrl}
        />
      </div>
    );
  }

  return (
    <StateBlock title="대표 이미지">
      <p>{restaurant.name}의 예약 페이지입니다.</p>
    </StateBlock>
  );
}

function formatAddress(restaurant: PublicRestaurantResponse) {
  return [restaurant.addressLine1, restaurant.addressLine2].filter(Boolean).join(" ");
}

function isReservationPageAvailable(restaurant: PublicRestaurantResponse) {
  return (
    restaurant.reservationPage.status === "PUBLIC" &&
    restaurant.reservationPage.reservationAvailable
  );
}

function getUnavailableReason(restaurant: PublicRestaurantResponse) {
  if (
    restaurant.reservationPage.status === "PRIVATE" ||
    restaurant.reservationPage.status === "DRAFT"
  ) {
    return {
      title: "아직 공개되지 않은 예약 페이지입니다.",
      description: "매장이 예약 페이지를 공개하면 이 링크로 다시 예약할 수 있습니다.",
    };
  }

  if (restaurant.reservationPage.status === "DISABLED") {
    return {
      title: "현재 운영이 중지된 예약 페이지입니다.",
      description: "매장 사정으로 온라인 예약 접수가 잠시 중단되었습니다.",
    };
  }

  return {
    title: "현재 온라인 예약을 받을 수 없습니다.",
    description: "매장 예약 가능 상태가 변경되었습니다.",
  };
}
