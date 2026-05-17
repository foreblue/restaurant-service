import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { PublicApiError } from "@/shared/api/apiError";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import { ReservationSelectionPanel } from "./ReservationSelectionPanel";
import { type PublicReservationProduct } from "./reservationOptionsTypes";

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
    paymentPolicyType: "FREE",
    paymentAmount: null,
    seatTypes: [
      { code: "ROOM", label: "룸" },
      { code: "HALL", label: "홀" },
    ],
  },
  {
    id: 20,
    name: "런치 코스",
    description: null,
    displayPrice: 50000,
    minPartySize: 1,
    maxPartySize: 2,
    availableDays: ["MONDAY"],
    availableStartTime: "12:00",
    availableEndTime: "14:00",
    requiresPayment: true,
    depositAmount: 10000,
    paymentPolicyType: "DEPOSIT",
    paymentAmount: 10000,
    seatTypes: [{ code: "COUNTER", label: "카운터" }],
  },
];

function createMockClient(): PublicApiClient {
  return {
    baseUrl: "http://api.test",
    get: vi.fn((path: string) => {
      if (path.includes("/availability/dates")) {
        return Promise.resolve({
          restaurantId: 1,
          productId: 10,
          from: "2026-05-17",
          to: "2026-06-16",
          dates: [
            { date: "2026-05-18", available: true },
            { date: "2026-05-19", available: false },
          ],
        });
      }

      if (path.includes("/availability/times")) {
        return Promise.resolve({
          restaurantId: 1,
          productId: 10,
          date: "2026-05-18",
          times: [
            {
              timeSlotId: "slot-1",
              startTime: "18:00",
              endTime: "19:30",
              remainingCapacity: 4,
              available: true,
            },
            {
              timeSlotId: "slot-2",
              startTime: "19:00",
              endTime: "20:30",
              remainingCapacity: 2,
              available: true,
            },
            {
              timeSlotId: "slot-3",
              startTime: "20:00",
              endTime: "21:30",
              remainingCapacity: 0,
              available: false,
              unavailableReason: "BLOCKED",
            },
          ],
        });
      }

      return Promise.reject(new Error(`Unhandled path: ${path}`));
    }),
    post: vi.fn(() =>
      Promise.resolve({
        id: 300,
        reservationNumber: "RSV-20260518-0001",
        status: "CONFIRMED",
        restaurantId: 1,
        productId: 10,
        customerId: 11,
        visitDate: "2026-05-18",
        startTime: "18:00",
        endTime: "19:30",
        partySize: 2,
        customerName: "홍길동",
        customerPhoneLast4: "5678",
        customerEmail: null,
        allergyNote: null,
        anniversaryType: null,
        anniversaryDate: null,
        requestTemplateValues: [],
        marketingOptIn: false,
        lookupToken: "lookup-token",
        lookupTokenExpiresAt: "2026-05-18T00:00:00.000Z",
      }),
    ),
    request: vi.fn(),
  };
}

describe("ReservationSelectionPanel", () => {
  it("lets customers select only available product, date, party size, and time options", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationSelectionPanel products={products} restaurantId={1} />
      </AppProviders>,
    );

    expect(screen.getByRole("button", { name: /디너 코스/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("인원")).toHaveValue("2");

    const availableDate = await screen.findByRole("button", { name: /2026-05-18/ });
    const unavailableDate = screen.getByRole("button", { name: /2026-05-19/ });
    expect(unavailableDate).toBeDisabled();
    expect(screen.getByText("룸")).toBeInTheDocument();
    expect(screen.getByText("홀")).toBeInTheDocument();

    fireEvent.click(availableDate);

    const availableTime = await screen.findByRole("button", { name: /18:00/ });
    expect(screen.getByRole("button", { name: /20:00/ })).toBeDisabled();
    expect(screen.getByText("잔여 4명")).toBeInTheDocument();
    expect(screen.getByText("임시 마감")).toBeInTheDocument();

    fireEvent.click(availableTime);

    expect(screen.getByText("디너 코스 · 2명 · 2026-05-18 · 18:00")).toBeInTheDocument();
    expect(screen.getByText("룸, 홀")).toBeInTheDocument();
  });

  it("shows payment policy summary and branches the submit copy", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationSelectionPanel products={products} restaurantId={1} />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole("button", { name: /런치 코스/ }));
    fireEvent.click(await screen.findByRole("button", { name: /2026-05-18/ }));
    fireEvent.click(await screen.findByRole("button", { name: /18:00/ }));

    expect(screen.getByText("예약금")).toBeInTheDocument();
    expect(screen.getByText("₩10,000")).toBeInTheDocument();
    expect(screen.getAllByText("카운터").length).toBeGreaterThan(0);
    expect(screen.getByText("예약 후 예약금 결제")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예약 후 결제 진행" })).toBeInTheDocument();
  });

  it("resets lower selections when the selected product changes", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationSelectionPanel products={products} restaurantId={1} />
      </AppProviders>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /2026-05-18/ }));
    fireEvent.click(await screen.findByRole("button", { name: /18:00/ }));
    expect(screen.getByText(/디너 코스 · 2명/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /런치 코스/ }));

    await waitFor(() => {
      expect(screen.queryByText(/디너 코스 · 2명 · 2026-05-18 · 18:00/)).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("인원")).toHaveValue("1");
  });

  it("shows an empty state when no products are available", () => {
    render(
      <AppProviders apiClient={createMockClient()}>
        <ReservationSelectionPanel products={[]} restaurantId={1} />
      </AppProviders>,
    );

    expect(screen.getByText("예약 가능한 상품이 없습니다.")).toBeInTheDocument();
  });

  it("creates a reservation and shows the completion result", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationSelectionPanel products={products} restaurantId={1} />
      </AppProviders>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /2026-05-18/ }));
    fireEvent.click(await screen.findByRole("button", { name: /18:00/ }));
    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByLabelText(/휴대폰 번호/), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByLabelText("개인정보 수집에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "예약 완료" }));

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        "/api/public/reservations",
        expect.objectContaining({
          body: expect.objectContaining({
            customerName: "홍길동",
            customerPhone: "01012345678",
            partySize: 2,
            productId: 10,
            restaurantId: 1,
            startTime: "18:00",
            visitDate: "2026-05-18",
          }),
          idempotencyKey: expect.any(String),
        }),
      );
    });
    expect(await screen.findByText("예약이 완료되었습니다.")).toBeInTheDocument();
    expect(screen.getByText("RSV-20260518-0001")).toBeInTheDocument();
  });

  it("offers availability refresh when reservation creation conflicts", async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(
      new PublicApiError({
        code: "CONFLICT",
        message: "요청 상태가 충돌합니다.",
        status: 409,
        traceId: "trace-conflict",
      }),
    );

    render(
      <AppProviders apiClient={client}>
        <ReservationSelectionPanel products={products} restaurantId={1} />
      </AppProviders>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /2026-05-18/ }));
    fireEvent.click(await screen.findByRole("button", { name: /18:00/ }));
    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByLabelText(/휴대폰 번호/), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByLabelText("개인정보 수집에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "예약 완료" }));

    expect(
      await screen.findByText(
        "예약 상태가 변경되었습니다. 최신 정보를 다시 확인해 주세요. 추적 ID: trace-conflict",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("다른 가능 시간")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /19:00/ }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "가능 시간 다시 조회" }));

    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith(
        "/api/public/restaurants/1/availability/dates",
        expect.any(Object),
      );
    });
  });
});
