import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import { ReservationDetailPageContent } from "./ReservationDetailPageContent";
import { type PublicReservationDetailResponse } from "./reservationDetailTypes";
import {
  type PublicPaymentSummaryResponse,
  type PublicRefundPreviewResponse,
} from "./reservationPaymentTypes";

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
  memberId: 1,
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

const paymentSummary: PublicPaymentSummaryResponse = {
  reservationId: 300,
  paymentMode: "DEPOSIT",
  paymentStatus: "PAID",
  paymentRequired: false,
  amount: 10000,
  currency: "KRW",
  paymentDueAt: null,
  cancellationPolicySummary: "예약 생성 시점 취소 정책이 적용됩니다.",
};

const refundPreview: PublicRefundPreviewResponse = {
  reservationId: 300,
  paymentId: 700,
  paymentStatus: "PAID",
  refundRequired: true,
  refundableAmount: 8000,
  nonRefundableAmount: 2000,
  alreadyRefundedAmount: 0,
  paidAmount: 10000,
  currency: "KRW",
  policyRuleId: "rule_24h_80",
  reason: "CUSTOMER_CANCEL",
  message: "취소 정책 환불률 80%가 적용됩니다.",
};

function createMockClient(
  detail: PublicReservationDetailResponse = reservationDetail,
  options: {
    paymentSummary?: PublicPaymentSummaryResponse;
    refundPreview?: PublicRefundPreviewResponse;
  } = {},
): PublicApiClient {
  const summary = options.paymentSummary ?? paymentSummary;
  const preview = options.refundPreview ?? refundPreview;

  return {
    baseUrl: "http://api.test",
    get: vi.fn((path: string) => {
      if (path.endsWith("/payment-summary")) {
        return Promise.resolve(summary);
      }

      if (path.endsWith("/refund-preview")) {
        return Promise.resolve(preview);
      }

      return Promise.resolve(detail);
    }),
    post: vi.fn(() =>
      Promise.resolve({
        ...detail,
        status: "CANCELLED_BY_CUSTOMER",
        cancelable: false,
        cancelledAt: "2026-05-17T02:00:00.000Z",
        cancelReason: "일정 변경",
        refund: {
          refundId: 900,
          paymentId: 700,
          status: "SUCCEEDED",
          paymentStatus: "REFUNDED",
          refundRequired: true,
          refundAmount: preview.refundableAmount,
          nonRefundableAmount: preview.nonRefundableAmount,
          alreadyRefundedAmount: preview.refundableAmount,
          currency: preview.currency,
          policyRuleId: preview.policyRuleId,
          reason: "CUSTOMER_CANCEL",
          message: "환불이 완료되었습니다.",
        },
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
    expect(screen.getByText(/취소 가능 기한:/)).toBeInTheDocument();
    expect(screen.getByText("결제/환불 상태")).toBeInTheDocument();
    expect(await screen.findByText("결제 완료")).toBeInTheDocument();
    expect(await screen.findByText("취소 전 환불 예상")).toBeInTheDocument();
    expect(await screen.findByText("₩8,000")).toBeInTheDocument();
    expect(screen.getByText("예약 변경 안내")).toBeInTheDocument();
    expect(screen.getByText(/온라인 예약 변경은 지원하지 않습니다/)).toBeInTheDocument();
  });

  it("fetches reservation detail with a logged-in member id", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken={null} memberId={1} reservationId={300} />
      </AppProviders>,
    );

    expect(await screen.findByText(/RSV-20260518-0001/)).toBeInTheDocument();
    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith(
        "/api/public/reservations/300",
        expect.objectContaining({
          searchParams: { memberId: 1 },
        }),
      );
    });
  });

  it("shows optional crm fields on reservation detail", async () => {
    const client = createMockClient({
      ...reservationDetail,
      allergyNote: "견과류",
      anniversaryType: "BIRTHDAY",
      anniversaryDate: "05-17",
      requestTemplateValues: ["조용한 좌석 선호", "기념일 방문"],
    });

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken="lookup-token" reservationId={300} />
      </AppProviders>,
    );

    expect(await screen.findByText("견과류")).toBeInTheDocument();
    expect(screen.getByText("생일 · 05-17")).toBeInTheDocument();
    expect(screen.getByText("조용한 좌석 선호, 기념일 방문")).toBeInTheDocument();
  });

  it.each([
    [
      "PENDING",
      "예약 접수",
      "매장에서 예약을 확인 중입니다",
      "예약 접수 상태에서는 온라인 고객 취소를 진행할 수 없습니다.",
    ],
    ["MODIFIED", "예약 변경", "매장에서 변경한 방문 정보가 반영된 예약입니다", "예약 변경 안내"],
    [
      "CANCELLED_BY_CUSTOMER",
      "고객 취소",
      "고객 요청으로 취소가 완료된 예약입니다",
      "고객 요청으로 이미 취소된 예약입니다.",
    ],
    [
      "CANCELLED_BY_RESTAURANT",
      "매장 취소",
      "매장 사정으로 취소된 예약입니다",
      "매장에서 취소한 예약입니다.",
    ],
    [
      "COMPLETED",
      "방문 완료",
      "방문이 완료된 예약입니다",
      "방문이 완료된 예약은 취소할 수 없습니다.",
    ],
    [
      "NO_SHOW",
      "노쇼",
      "노쇼로 처리된 예약입니다",
      "노쇼 처리된 예약은 고객 취소로 변경할 수 없습니다.",
    ],
  ] as const)(
    "shows status-specific guidance for %s",
    async (status, label, statusDescription, cancellationMessage) => {
      const client = createMockClient({
        ...reservationDetail,
        status,
        cancelable: status === "MODIFIED",
      });

      render(
        <AppProviders apiClient={client}>
          <ReservationDetailPageContent lookupToken="lookup-token" reservationId={300} />
        </AppProviders>,
      );

      expect(await screen.findByText(label)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(statusDescription))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(cancellationMessage))).toBeInTheDocument();
    },
  );

  it("explains when the cancellation deadline has passed", async () => {
    const client = createMockClient({
      ...reservationDetail,
      cancelable: false,
      cancelDeadline: "2000-01-01T00:00:00.000Z",
    });

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken="lookup-token" reservationId={300} />
      </AppProviders>,
    );

    expect(
      await screen.findByText("취소 가능 기한이 지나 온라인 취소를 진행할 수 없습니다."),
    ).toBeInTheDocument();
  });

  it("cancels a cancelable reservation and refreshes the visible status", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken="lookup-token" reservationId={300} />
      </AppProviders>,
    );

    await screen.findByText("예약 확정");
    await screen.findByText("취소 전 환불 예상");
    fireEvent.change(screen.getByLabelText("취소 사유"), {
      target: { value: "일정 변경" },
    });
    fireEvent.click(screen.getByRole("button", { name: "예약 취소" }));
    fireEvent.click(screen.getAllByRole("button", { name: "예약 취소" }).at(-1)!);

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        "/api/public/reservations/300/cancel",
        expect.objectContaining({
          body: { confirmRefundAmount: 8000, reason: "일정 변경" },
          lookupToken: "lookup-token",
        }),
      );
    });
    expect(await screen.findByText("고객 취소")).toBeInTheDocument();
    expect(screen.getByText("취소 완료")).toBeInTheDocument();
    expect(await screen.findAllByText("환불 완료")).toHaveLength(2);
  });

  it("shows refund result details for a cancelled reservation", async () => {
    const client = createMockClient({
      ...reservationDetail,
      status: "CANCELLED_BY_CUSTOMER",
      cancelable: false,
      cancelledAt: "2026-05-17T02:00:00.000Z",
      refund: {
        refundId: 900,
        paymentId: 700,
        status: "PENDING",
        paymentStatus: "PAID",
        refundRequired: true,
        refundAmount: 8000,
        nonRefundableAmount: 2000,
        alreadyRefundedAmount: 0,
        currency: "KRW",
        policyRuleId: "rule_24h_80",
        reason: "CUSTOMER_CANCEL",
        message: "환불 처리가 진행 중입니다.",
      },
    });

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken="lookup-token" reservationId={300} />
      </AppProviders>,
    );

    expect(await screen.findAllByText("환불 처리 중")).toHaveLength(2);
    expect(screen.getByText("환불 처리가 진행 중입니다.")).toBeInTheDocument();
    expect(screen.getByText("₩8,000")).toBeInTheDocument();
  });

  it("requires login or a lookup token before fetching reservation detail", () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <ReservationDetailPageContent lookupToken={null} reservationId={300} />
      </AppProviders>,
    );

    expect(screen.getByText("예약 조회 로그인이 필요합니다.")).toBeInTheDocument();
    expect(client.get).not.toHaveBeenCalled();
  });
});
