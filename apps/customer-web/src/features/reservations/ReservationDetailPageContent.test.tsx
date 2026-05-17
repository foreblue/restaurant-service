import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import { ReservationDetailPageContent } from "./ReservationDetailPageContent";
import { type PublicReservationDetailResponse } from "./reservationDetailTypes";

const pushMock = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");

  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
    }),
  };
});

const reservationDetail: PublicReservationDetailResponse = {
  id: 300,
  reservationNumber: "RSV-20260518-0001",
  status: "CONFIRMED",
  restaurantId: 1,
  restaurantName: "온기 다이닝",
  productId: 10,
  productName: "디너 코스",
  customerId: 11,
  visitDate: "2026-05-18",
  startTime: "18:00",
  endTime: "19:30",
  partySize: 2,
  customerName: "홍길동",
  customerPhoneLast4: "5678",
  customerRequest: "창가 좌석 요청",
  customerEmail: null,
  allergyNote: null,
  anniversaryType: null,
  anniversaryDate: null,
  requestTemplateValues: [],
  marketingOptIn: false,
  cancelable: true,
  cancelDeadline: "2026-05-18T09:00:00.000Z",
  cancelledAt: null,
  cancelReason: null,
  refund: null,
};

function createMockClient(
  detail: PublicReservationDetailResponse = reservationDetail,
): PublicApiClient {
  return {
    baseUrl: "http://api.test",
    get: vi.fn(() => Promise.resolve(detail)),
    post: vi.fn(() =>
      Promise.resolve({
        ...detail,
        status: "CANCELLED_BY_CUSTOMER",
        cancelable: false,
        cancelledAt: "2026-05-17T02:00:00.000Z",
        cancelReason: "일정 변경",
      } satisfies PublicReservationDetailResponse),
    ),
    request: vi.fn(),
  };
}

describe("ReservationDetailPageContent", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("shows reservation detail fields", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken="lookup-token" reservationId={300} />
      </AppProviders>,
    );

    expect(await screen.findByText(/RSV-20260518-0001/)).toBeInTheDocument();
    expect(screen.getByText("예약 확정")).toBeInTheDocument();
    expect(screen.getByText("온기 다이닝")).toBeInTheDocument();
    expect(screen.getByText("디너 코스")).toBeInTheDocument();
    expect(screen.getByText("2026-05-18 18:00-19:30")).toBeInTheDocument();
    expect(screen.getByText("창가 좌석 요청")).toBeInTheDocument();
  });

  it("cancels a cancelable reservation and refreshes the visible status", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken="lookup-token" reservationId={300} />
      </AppProviders>,
    );

    await screen.findByText("예약 확정");
    fireEvent.change(screen.getByLabelText("취소 사유"), {
      target: { value: "일정 변경" },
    });
    fireEvent.click(screen.getByRole("button", { name: "예약 취소" }));
    fireEvent.click(screen.getAllByRole("button", { name: "예약 취소" }).at(-1)!);

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        "/api/public/reservations/300/cancel",
        expect.objectContaining({
          body: { reason: "일정 변경" },
          lookupToken: "lookup-token",
        }),
      );
    });
    expect(await screen.findByText("고객 취소")).toBeInTheDocument();
    expect(screen.getByText("취소 완료")).toBeInTheDocument();
  });

  it("requires a lookup token before fetching reservation detail", () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken={null} reservationId={300} />
      </AppProviders>,
    );

    expect(screen.getByText("예약 조회 토큰이 필요합니다.")).toBeInTheDocument();
    expect(client.get).not.toHaveBeenCalled();
  });
});
