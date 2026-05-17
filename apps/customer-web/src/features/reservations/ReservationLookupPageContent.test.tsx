import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { PublicApiError } from "@/shared/api/apiError";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import { ReservationLookupPageContent } from "./ReservationLookupPageContent";

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

function createMockClient(): PublicApiClient {
  return {
    baseUrl: "http://api.test",
    get: vi.fn(),
    post: vi.fn(() =>
      Promise.resolve({
        reservationId: 300,
        lookupToken: "lookup-token",
        expiresAt: "2026-05-18T00:00:00.000Z",
      }),
    ),
    request: vi.fn(),
  };
}

describe("ReservationLookupPageContent", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("issues a lookup token and moves to reservation detail", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationLookupPageContent />
      </AppProviders>,
    );

    fireEvent.change(screen.getByLabelText(/예약번호/), {
      target: { value: "RSV-20260518-0001" },
    });
    fireEvent.change(screen.getByLabelText(/휴대폰 번호/), {
      target: { value: "010-1234-5678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "예약 조회" }));

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        "/api/public/reservation-lookup-tokens",
        expect.objectContaining({
          body: {
            phoneNumber: "01012345678",
            reservationNumber: "RSV-20260518-0001",
          },
        }),
      );
    });
    expect(pushMock).toHaveBeenCalledWith("/reservations/300?token=lookup-token");
  });

  it("shows a clear authentication failure message", async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(
      new PublicApiError({
        code: "ACCESS_DENIED",
        message: "예약자 전화번호가 일치하지 않습니다.",
        status: 403,
        traceId: "lookup-trace",
      }),
    );

    render(
      <AppProviders apiClient={client}>
        <ReservationLookupPageContent />
      </AppProviders>,
    );

    fireEvent.change(screen.getByLabelText(/예약번호/), {
      target: { value: "RSV-20260518-0001" },
    });
    fireEvent.change(screen.getByLabelText(/휴대폰 번호/), {
      target: { value: "010-9999-0000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "예약 조회" }));

    expect(
      await screen.findByText("예약번호와 휴대폰 번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
