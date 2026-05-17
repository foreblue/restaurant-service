import {
  createPublicRestaurantMetadata,
  createUnavailableRestaurantMetadata,
} from "./publicRestaurantMetadata";
import { type PublicRestaurantResponse } from "./publicRestaurantTypes";

const restaurant: PublicRestaurantResponse = {
  id: 1,
  name: "청담 테스트 다이닝",
  slug: "cheongdam-test",
  description: "계절 재료로 준비하는 예약제 다이닝입니다.",
  phone: "02-1234-5678",
  addressLine1: "서울시 강남구 테스트로 1",
  addressLine2: null,
  postalCode: null,
  cuisineTypes: ["한식"],
  coverImageFileId: null,
  timezone: "Asia/Seoul",
  businessHours: [],
  holidayRules: [],
  reservationPage: {
    status: "PUBLIC",
    publishedAt: "2026-05-15T00:00:00.000Z",
    publicUrl: "/r/cheongdam-test",
    reservationAvailable: true,
  },
};

describe("publicRestaurantMetadata", () => {
  it("creates share metadata with canonical URL and OG image", () => {
    const metadata = createPublicRestaurantMetadata(restaurant);

    expect(metadata.title).toBe("청담 테스트 다이닝 예약");
    expect(metadata.description).toBe("계절 재료로 준비하는 예약제 다이닝입니다.");
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/r/cheongdam-test");
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alt: "청담 테스트 다이닝 예약 페이지",
          height: 630,
          width: 1200,
        }),
      ]),
    );
  });

  it("creates unavailable metadata for private or missing pages", () => {
    expect(createUnavailableRestaurantMetadata()).toMatchObject({
      description: "링크가 변경되었거나 아직 공개되지 않은 예약 페이지입니다.",
      title: "예약 페이지를 이용할 수 없습니다.",
    });
  });
});
