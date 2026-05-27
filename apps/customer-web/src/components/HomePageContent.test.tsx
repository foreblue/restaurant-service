import { render, screen } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { clearStoredCustomerMemberId } from "@/features/reservations/customerMemberSession";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import { HomePageContent } from "./HomePageContent";

function createMockClient(): PublicApiClient {
  return {
    baseUrl: "http://api.test",
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
  };
}

describe("HomePageContent", () => {
  beforeEach(() => {
    clearStoredCustomerMemberId();
  });

  it("renders the customer reservation shell", () => {
    render(
      <AppProviders apiClient={createMockClient()}>
        <HomePageContent
          restaurants={[
            {
              id: 101,
              name: "청담 테스트 다이닝",
              slug: "cheongdam-main",
              description: "테스트 예약 매장",
              phone: "02-555-1212",
              addressLine1: "서울시 강남구 테스트로 17",
              addressLine2: "2층",
              cuisineTypes: ["코스", "다이닝"],
              coverImageFileId: null,
              coverImageUrl: null,
              publicUrl: "/r/cheongdam-main",
              reservationProductCount: 2,
              publishedAt: "2026-05-01T00:00:00.000Z",
            },
          ]}
        />
      </AppProviders>,
    );

    expect(screen.getByRole("heading", { name: "식당 예약" })).toBeInTheDocument();
    expect(screen.getByText(/예약번호로 기존 예약을 확인/)).toBeInTheDocument();
    expect(screen.getByText("고객 예약")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "전체 매장" })).toBeInTheDocument();
    expect(screen.getByText("테스트 데이터 전체 노출 · 1개")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /청담 테스트 다이닝/ })).toHaveAttribute(
      "href",
      "/r/cheongdam-main",
    );
    expect(screen.queryByLabelText("예약 링크 또는 코드")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "예약 조회" })[0]).toHaveAttribute(
      "href",
      "/reservations",
    );
  });
});
