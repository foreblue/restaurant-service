import { render, screen } from "@testing-library/react";

import { PublicRestaurantPageContent } from "./PublicRestaurantPageContent";
import { type PublicRestaurantResponse } from "./publicRestaurantTypes";

const restaurant: PublicRestaurantResponse = {
  id: 1,
  name: "청담 테스트 다이닝",
  slug: "cheongdam-test",
  description: "계절 재료로 준비하는 예약제 다이닝입니다.",
  phone: "02-1234-5678",
  addressLine1: "서울시 강남구 테스트로 1",
  addressLine2: "2층",
  postalCode: "06000",
  cuisineTypes: ["한식", "코스"],
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

describe("PublicRestaurantPageContent", () => {
  it("renders public restaurant information without map or search entry points", () => {
    render(<PublicRestaurantPageContent restaurant={restaurant} />);

    expect(screen.getByRole("heading", { name: "청담 테스트 다이닝" })).toBeInTheDocument();
    expect(screen.getByText("계절 재료로 준비하는 예약제 다이닝입니다.")).toBeInTheDocument();
    expect(screen.getByText("서울시 강남구 테스트로 1 2층")).toBeInTheDocument();
    expect(screen.getByText("02-1234-5678")).toBeInTheDocument();
    expect(screen.getByText("한식")).toBeInTheDocument();
    expect(screen.getByText("코스")).toBeInTheDocument();
    expect(screen.getByText("예약 상품")).toBeInTheDocument();
    expect(screen.queryByText("지도")).not.toBeInTheDocument();
    expect(screen.queryByText("검색")).not.toBeInTheDocument();
  });

  it("uses a stable cover placeholder when no public image url is available", () => {
    render(<PublicRestaurantPageContent restaurant={{ ...restaurant, coverImageUrl: null }} />);

    expect(screen.getByText("대표 이미지")).toBeInTheDocument();
  });
});
