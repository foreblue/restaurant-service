import Image from "next/image";
import Link from "next/link";

import { Alert, StateBlock } from "@/components/ui";
import { CustomerMemberSessionStatus } from "@/features/reservations/CustomerMemberSessionStatus";
import { cn } from "@/lib/utils";

import { type PublicRestaurantListItem } from "./publicRestaurantTypes";

interface PublicRestaurantListProps {
  loadFailed?: boolean | undefined;
  restaurants: PublicRestaurantListItem[];
  sessionRedirectTo?: string | undefined;
}

export function PublicRestaurantList({
  loadFailed = false,
  restaurants,
  sessionRedirectTo = "/reserve",
}: PublicRestaurantListProps) {
  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">전체 매장</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            테스트 데이터 전체 노출 · {restaurants.length}개
          </p>
        </div>
        <CustomerMemberSessionStatus redirectTo={sessionRedirectTo} variant="header" />
      </header>

      {loadFailed ? (
        <div className="p-4">
          <Alert title="매장 목록을 불러오지 못했습니다." variant="warning">
            잠시 후 다시 시도하거나 예약 조회에서 기존 예약을 확인해 주세요.
          </Alert>
        </div>
      ) : null}

      {restaurants.length > 0 ? (
        <div className="divide-y">
          {restaurants.map((restaurant, index) => (
            <RestaurantListItemCard index={index} key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : loadFailed ? null : (
        <div className="p-4">
          <StateBlock title="표시할 매장이 없습니다.">
            <p>테스트 매장 데이터가 등록되면 이 화면에 전체 목록이 표시됩니다.</p>
          </StateBlock>
        </div>
      )}
    </section>
  );
}

function RestaurantListItemCard({
  index,
  restaurant,
}: {
  index: number;
  restaurant: PublicRestaurantListItem;
}) {
  const address = formatAddress(restaurant);
  const metrics = createPlaceMetrics(restaurant.id);
  const category = restaurant.cuisineTypes[0] ?? "음식점";

  return (
    <Link
      className="grid grid-cols-[92px_1fr] gap-3 bg-white px-4 py-4 transition hover:bg-[#fbfffd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#03c75a]"
      href={restaurant.publicUrl}
      prefetch={false}
    >
      <RestaurantThumbnail index={index} restaurant={restaurant} />

      <span className="grid min-w-0 content-start gap-1.5">
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-[17px] font-bold leading-tight text-slate-950">
            {restaurant.name}
          </span>
          <span className="shrink-0 text-xs font-medium text-slate-500">{category}</span>
        </span>

        <span className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs leading-5 text-slate-600">
          <span className="font-bold text-amber-500">★ {metrics.rating}</span>
          <span>방문자리뷰 {metrics.visitReviewCount.toLocaleString("ko-KR")}</span>
          <span>블로그리뷰 {metrics.blogReviewCount.toLocaleString("ko-KR")}</span>
        </span>

        {restaurant.description ? (
          <span className="line-clamp-2 break-words text-[13px] leading-5 text-slate-600">
            {restaurant.description}
          </span>
        ) : null}

        <span className="break-words text-xs leading-5 text-slate-500">
          {address} · {businessStatusLabel(restaurant)}
        </span>

        <span className="mt-1 flex flex-wrap gap-1.5">
          <span className="inline-flex min-h-8 items-center justify-center rounded-md bg-[#03c75a] px-3 text-xs font-bold text-white">
            예약
          </span>
          <span className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            저장
          </span>
          <span className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            공유
          </span>
          {restaurant.reservationProductCount > 0 ? (
            <span className="inline-flex min-h-8 items-center justify-center rounded-md bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700">
              예약상품 {restaurant.reservationProductCount}개
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}

function RestaurantThumbnail({
  index,
  restaurant,
}: {
  index: number;
  restaurant: PublicRestaurantListItem;
}) {
  if (restaurant.coverImageUrl) {
    return (
      <span className="relative block aspect-square overflow-hidden rounded-lg border bg-slate-100">
        <Image
          alt={`${restaurant.name} 대표 이미지`}
          className="object-cover"
          fill
          sizes="92px"
          src={restaurant.coverImageUrl}
        />
        <PhotoCount index={index} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border text-2xl font-black text-white",
        fallbackThumbnailClass(index),
      )}
    >
      {restaurant.name.trim().charAt(0)}
      <PhotoCount index={index} />
    </span>
  );
}

function PhotoCount({ index }: { index: number }) {
  return (
    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {12 + index * 4}
    </span>
  );
}

function fallbackThumbnailClass(index: number) {
  const classes = [
    "bg-gradient-to-br from-emerald-900 via-amber-600 to-orange-100",
    "bg-gradient-to-br from-sky-900 via-cyan-500 to-orange-100",
    "bg-gradient-to-br from-stone-800 via-orange-400 to-yellow-100",
    "bg-gradient-to-br from-green-900 via-lime-500 to-yellow-100",
  ];

  return classes[index % classes.length];
}

function createPlaceMetrics(restaurantId: number) {
  return {
    blogReviewCount: 80 + restaurantId * 7,
    rating: (4.2 + (restaurantId % 7) / 10).toFixed(2),
    visitReviewCount: 420 + restaurantId * 23,
  };
}

function businessStatusLabel(restaurant: PublicRestaurantListItem) {
  if (restaurant.reservationProductCount > 0) {
    return "예약 가능";
  }

  return "예약 준비 중";
}

function formatAddress(
  restaurant: Pick<PublicRestaurantListItem, "addressLine1" | "addressLine2">,
) {
  return [restaurant.addressLine1, restaurant.addressLine2].filter(Boolean).join(" ");
}
