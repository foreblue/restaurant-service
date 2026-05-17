import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
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
              startTime: "20:00",
              endTime: "21:30",
              remainingCapacity: 0,
              available: false,
            },
          ],
        });
      }

      return Promise.reject(new Error(`Unhandled path: ${path}`));
    }),
    post: vi.fn(),
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

    fireEvent.click(availableDate);

    const availableTime = await screen.findByRole("button", { name: /18:00/ });
    expect(screen.getByRole("button", { name: /20:00/ })).toBeDisabled();

    fireEvent.click(availableTime);

    expect(screen.getByText("디너 코스 · 2명 · 2026-05-18 · 18:00")).toBeInTheDocument();
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
});
