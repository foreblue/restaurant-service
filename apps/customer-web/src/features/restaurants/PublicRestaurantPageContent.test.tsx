import { render, screen } from "@testing-library/react";

import { AppProviders } from "@/app/providers";

import { PublicRestaurantPageContent } from "./PublicRestaurantPageContent";
import { type PublicRestaurantResponse } from "./publicRestaurantTypes";
import { type PublicReservationProduct } from "../reservations/reservationOptionsTypes";

const apiClient = {
  baseUrl: "http://api.test",
  get: vi.fn(),
  post: vi.fn(),
  request: vi.fn(),
};

const products: PublicReservationProduct[] = [
  {
    id: 10,
    name: "디너 코스",
    description: "계절 메뉴 코스",
    displayPrice: 80000,
    minPartySize: 2,
    maxPartySize: 4,
    availableDays: ["FRIDAY", "SATURDAY"],
    availableStartTime: "18:00",
    availableEndTime: "21:00",
    requiresPayment: false,
    depositAmount: 0,
  },
];

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
  beforeEach(() => {
    apiClient.get.mockImplementation((path: string) => {
      if (path.includes("/availability/dates")) {
        return Promise.resolve({
          restaurantId: 1,
          productId: 10,
          from: "2026-05-17",
          to: "2026-06-16",
          dates: [],
        });
      }

      if (path.includes("/availability/times")) {
        return Promise.resolve({
          restaurantId: 1,
          productId: 10,
          date: "2026-05-17",
          times: [],
        });
      }

      return Promise.reject(new Error(`Unhandled path: ${path}`));
    });
  });

  it("renders public restaurant information without map or search entry points", () => {
    render(
      <AppProviders apiClient={apiClient}>
        <PublicRestaurantPageContent products={products} restaurant={restaurant} />
      </AppProviders>,
    );

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
    render(
      <AppProviders apiClient={apiClient}>
        <PublicRestaurantPageContent
          products={products}
          restaurant={{ ...restaurant, coverImageUrl: null }}
        />
      </AppProviders>,
    );

    expect(screen.getByText("대표 이미지")).toBeInTheDocument();
  });

  it("shows an unavailable state for non-public reservation pages", () => {
    render(
      <AppProviders apiClient={apiClient}>
        <PublicRestaurantPageContent
          products={products}
          restaurant={{
            ...restaurant,
            reservationPage: {
              ...restaurant.reservationPage,
              reservationAvailable: false,
              status: "PRIVATE",
            },
          }}
        />
      </AppProviders>,
    );

    expect(
      screen.getByRole("heading", { name: "예약 페이지를 이용할 수 없습니다." }),
    ).toBeInTheDocument();
    expect(screen.getByText("아직 공개되지 않은 예약 페이지입니다.")).toBeInTheDocument();
    expect(screen.queryByText("예약 상품")).not.toBeInTheDocument();
  });

  it("keeps long restaurant names and addresses inside the mobile layout", () => {
    render(
      <AppProviders apiClient={apiClient}>
        <PublicRestaurantPageContent
          products={products}
          restaurant={{
            ...restaurant,
            addressLine1: "서울시 강남구 매우긴주소로".repeat(8),
            name: "아주 긴 매장명을 가진 예약제 레스토랑".repeat(6),
          }}
        />
      </AppProviders>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("break-words");
    expect(screen.getByText(/서울시 강남구 매우긴주소로/)).toHaveClass("break-words");
  });
});
