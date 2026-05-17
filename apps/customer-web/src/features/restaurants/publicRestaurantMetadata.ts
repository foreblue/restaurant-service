import { type Metadata } from "next";

import { customerWebEnv } from "@/config/env";

import { type PublicRestaurantResponse } from "./publicRestaurantTypes";

export function createPublicRestaurantMetadata(restaurant: PublicRestaurantResponse): Metadata {
  const title = `${restaurant.name} 예약`;
  const description = createDescription(restaurant);
  const canonicalUrl = createAbsoluteUrl(restaurant.reservationPage.publicUrl);
  const ogImageUrl = createOgImageUrl(restaurant, description);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "식당 예약",
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: restaurant.coverImageUrl ?? ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${restaurant.name} 예약 페이지`,
        },
      ],
    },
  };
}

export function createUnavailableRestaurantMetadata(): Metadata {
  return {
    title: "예약 페이지를 이용할 수 없습니다.",
    description: "링크가 변경되었거나 아직 공개되지 않은 예약 페이지입니다.",
  };
}

function createDescription(restaurant: PublicRestaurantResponse) {
  return (
    restaurant.description?.slice(0, 160) ??
    `${restaurant.name}의 공개 예약 페이지입니다. 공유받은 링크로 예약을 진행합니다.`
  );
}

function createAbsoluteUrl(path: string) {
  return new URL(path, `${customerWebEnv.appBaseUrl}/`).toString();
}

function createOgImageUrl(restaurant: PublicRestaurantResponse, description: string) {
  const url = new URL("/api/og/restaurant", `${customerWebEnv.appBaseUrl}/`);
  url.searchParams.set("name", restaurant.name);
  url.searchParams.set("description", description);

  return url.toString();
}
