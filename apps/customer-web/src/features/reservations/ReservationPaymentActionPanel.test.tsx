import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import { ReservationPaymentActionPanel } from "./ReservationPaymentActionPanel";
import { type PublicReservationResponse } from "./reservationCreateTypes";
import { type ReservationPaymentPolicyView } from "./reservationPaymentPolicy";
import { runReservationPaymentAction } from "./reservationPaymentSdk";

vi.mock("./reservationPaymentSdk", () => ({
  runReservationPaymentAction: vi.fn(() => Promise.resolve({ status: "redirecting" })),
}));

const reservation: PublicReservationResponse = {
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
};

const depositPolicy: ReservationPaymentPolicyView = {
  amountLabel: "₩10,000",
  description: "예약 후 예약금을 결제해야 예약이 유지됩니다.",
  label: "예약금",
  paymentMode: "DEPOSIT",
  nextStep: "payNow",
  nextStepLabel: "예약 후 예약금 결제",
  summary: "₩10,000 예약금 결제 필요",
};

const guaranteePolicy: ReservationPaymentPolicyView = {
  amountLabel: null,
  description: "예약 후 노쇼 방지를 위한 카드 보증 등록이 필요합니다.",
  label: "카드 보증",
  paymentMode: "CARD_GUARANTEE",
  nextStep: "cardGuarantee",
  nextStepLabel: "예약 후 카드 보증 등록",
  summary: "카드 보증 등록 필요",
};

function createMockClient(): PublicApiClient {
  return {
    baseUrl: "http://api.test",
    get: vi.fn(),
    post: vi.fn((path: string) => {
      if (path.endsWith("/payments")) {
        return Promise.resolve({
          paymentId: 1,
          status: "PENDING",
          amount: 10000,
          currency: "KRW",
          paymentAction: { type: "REDIRECT", url: "https://pg.example.test/payments/1" },
          expiresAt: "2026-05-18T00:00:00.000Z",
        });
      }

      if (path.endsWith("/guarantee")) {
        return Promise.resolve({
          paymentId: 2,
          status: "GUARANTEE_REGISTERED",
          guaranteeAction: null,
          expiresAt: null,
        });
      }

      if (path.endsWith("/cancel")) {
        return Promise.resolve({});
      }

      return Promise.reject(new Error(`Unhandled path: ${path}`));
    }),
    request: vi.fn(),
  };
}

describe("ReservationPaymentActionPanel", () => {
  beforeEach(() => {
    vi.mocked(runReservationPaymentAction).mockClear();
  });

  it("starts deposit payment and lazy-runs the payment action", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationPaymentActionPanel paymentPolicy={depositPolicy} reservation={reservation} />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole("button", { name: "결제 진행" }));

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        "/api/public/reservations/300/payments",
        expect.objectContaining({
          body: expect.objectContaining({
            paymentMode: "DEPOSIT",
            returnUrl: expect.stringContaining("/reservations/300?token=lookup-token"),
          }),
          lookupToken: "lookup-token",
        }),
      );
    });
    expect(runReservationPaymentAction).toHaveBeenCalledWith({
      type: "REDIRECT",
      url: "https://pg.example.test/payments/1",
    });
    expect(await screen.findByText("결제 창으로 이동 중입니다.")).toBeInTheDocument();
  });

  it("starts card guarantee and shows success when registration is complete", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationPaymentActionPanel paymentPolicy={guaranteePolicy} reservation={reservation} />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole("button", { name: "카드 보증 등록" }));

    expect(await screen.findByText("처리가 완료되었습니다.")).toBeInTheDocument();
    expect(client.post).toHaveBeenCalledWith(
      "/api/public/reservations/300/guarantee",
      expect.objectContaining({
        lookupToken: "lookup-token",
      }),
    );
  });

  it("offers retry and abandon actions when payment expires", async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockImplementation((path: string) => {
      if (path.endsWith("/payments")) {
        return Promise.resolve({
          paymentId: 1,
          status: "EXPIRED",
          amount: 10000,
          currency: "KRW",
          paymentAction: null,
          expiresAt: "2026-05-18T00:00:00.000Z",
        });
      }

      if (path.endsWith("/cancel")) {
        return Promise.resolve({});
      }

      return Promise.reject(new Error(`Unhandled path: ${path}`));
    });

    render(
      <AppProviders apiClient={client}>
        <ReservationPaymentActionPanel paymentPolicy={depositPolicy} reservation={reservation} />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole("button", { name: "결제 진행" }));

    expect(
      await screen.findByText("결제 가능 시간이 만료되었습니다. 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "예약 포기" }));

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        "/api/public/reservations/300/cancel",
        expect.objectContaining({
          body: { reason: "결제 단계에서 예약 포기" },
          lookupToken: "lookup-token",
        }),
      );
    });
    expect(await screen.findByText("예약을 포기했습니다.")).toBeInTheDocument();
  });
});
