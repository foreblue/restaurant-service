"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { Alert, Button, StateBlock, Textarea } from "@/components/ui";
import { PublicApiError, toCustomerApiErrorMessage } from "@/shared/api/apiError";
import { usePublicApiClient } from "@/shared/api/usePublicApiClient";

import {
  cancelPublicReservation,
  getPublicReservationDetail,
  reservationDetailQueryKey,
} from "./reservationDetailApi";
import {
  type PublicReservationCancelRequest,
  type PublicReservationDetailResponse,
} from "./reservationDetailTypes";
import {
  getReservationStatusView,
  isActiveReservationStatus,
  isCancelledReservationStatus,
} from "./reservationDisplay";
import {
  getReservationPaymentSummary,
  getReservationRefundPreview,
  reservationPaymentSummaryQueryKey,
  reservationRefundPreviewQueryKey,
} from "./reservationPaymentApi";
import {
  type PublicPaymentStatus,
  type PublicPaymentSummaryResponse,
  type PublicRefundOperationResponse,
  type PublicRefundPreviewResponse,
  type PublicRefundStatus,
} from "./reservationPaymentTypes";

interface ReservationDetailPageContentProps {
  lookupToken: string | null;
  reservationId: number;
}

export function ReservationDetailPageContent({
  lookupToken,
  reservationId,
}: ReservationDetailPageContentProps) {
  return (
    <ReservationPageShell
      description="예약번호와 방문 정보를 확인하고, 취소 가능한 예약은 이 화면에서 취소할 수 있습니다."
      eyebrow="예약 확인"
      title="예약 상세"
    >
      <ReservationDetailPanel lookupToken={lookupToken} reservationId={reservationId} />
    </ReservationPageShell>
  );
}

function ReservationDetailPanel({ lookupToken, reservationId }: ReservationDetailPageContentProps) {
  const apiClient = usePublicApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const detailQuery = useQuery({
    enabled: Boolean(lookupToken),
    queryFn: () => getPublicReservationDetail(reservationId, lookupToken ?? "", apiClient),
    queryKey: reservationDetailQueryKey(reservationId, lookupToken),
  });
  const reservation = detailQuery.data;
  const refundPreviewEnabled = Boolean(
    lookupToken && reservation && shouldLoadRefundPreview(reservation),
  );
  const paymentSummaryQuery = useQuery({
    enabled: Boolean(lookupToken) && detailQuery.isSuccess,
    queryFn: () => getReservationPaymentSummary(reservationId, lookupToken ?? "", apiClient),
    queryKey: reservationPaymentSummaryQueryKey(reservationId, lookupToken),
  });
  const refundPreviewQuery = useQuery({
    enabled: refundPreviewEnabled,
    queryFn: () => getReservationRefundPreview(reservationId, lookupToken ?? "", apiClient),
    queryKey: reservationRefundPreviewQueryKey(reservationId, lookupToken),
  });

  const cancelMutation = useMutation({
    mutationFn: () => {
      const request: PublicReservationCancelRequest = { reason: cancelReason.trim() || null };
      if (refundPreviewQuery.data) {
        request.confirmRefundAmount = refundPreviewQuery.data.refundableAmount;
      }

      return cancelPublicReservation(reservationId, lookupToken ?? "", request, apiClient);
    },
    onSuccess: (reservation) => {
      queryClient.setQueryData(reservationDetailQueryKey(reservationId, lookupToken), reservation);
      void queryClient.invalidateQueries({
        queryKey: reservationPaymentSummaryQueryKey(reservationId, lookupToken),
      });
      queryClient.removeQueries({
        exact: true,
        queryKey: reservationRefundPreviewQueryKey(reservationId, lookupToken),
      });
      setCancelDialogOpen(false);
    },
  });

  if (!lookupToken) {
    return (
      <StateBlock
        action={{ label: "예약 조회", onClick: () => router.push("/reservations") }}
        title="예약 조회 토큰이 필요합니다."
        variant="error"
      >
        <p>예약 완료 화면이나 알림 메시지에 포함된 조회 링크로 다시 접근해 주세요.</p>
      </StateBlock>
    );
  }

  if (detailQuery.isLoading) {
    return <StateBlock title="예약 정보를 불러오는 중입니다." variant="loading" />;
  }

  if (detailQuery.isError) {
    const needsAuthentication =
      detailQuery.error instanceof PublicApiError &&
      (detailQuery.error.status === 401 || detailQuery.error.status === 403);

    return (
      <StateBlock
        action={{
          label: needsAuthentication ? "예약 조회" : "다시 조회",
          onClick: () =>
            needsAuthentication ? router.push("/reservations") : void detailQuery.refetch(),
        }}
        title="예약 정보를 불러오지 못했습니다."
        variant="error"
      >
        <p>{toCustomerApiErrorMessage(detailQuery.error)}</p>
      </StateBlock>
    );
  }

  if (!detailQuery.data) {
    return (
      <StateBlock title="예약 정보가 없습니다." variant="empty">
        <p>잠시 후 다시 조회해 주세요.</p>
      </StateBlock>
    );
  }

  return (
    <div className="grid gap-4">
      <ReservationDetailCard reservation={detailQuery.data} />
      <ReservationPaymentRefundPanel
        paymentSummary={paymentSummaryQuery.data}
        paymentSummaryError={paymentSummaryQuery.error}
        paymentSummaryLoading={paymentSummaryQuery.isLoading}
        refundOperation={detailQuery.data.refund}
        refundPreview={refundPreviewQuery.data}
        refundPreviewError={refundPreviewQuery.error}
        refundPreviewLoading={refundPreviewQuery.isLoading}
        showRefundPreview={refundPreviewEnabled}
      />

      <CancelReservationPanel
        cancelError={cancelMutation.error}
        cancelReason={cancelReason}
        cancelling={cancelMutation.isPending}
        dialogOpen={cancelDialogOpen}
        refundPreview={refundPreviewQuery.data}
        refundPreviewLoading={refundPreviewQuery.isLoading}
        reservation={detailQuery.data}
        showRefundPreview={refundPreviewEnabled}
        onCancelDialogChange={setCancelDialogOpen}
        onCancelReasonChange={setCancelReason}
        onConfirmCancel={() => cancelMutation.mutate()}
      />
    </div>
  );
}

function ReservationPaymentRefundPanel({
  paymentSummary,
  paymentSummaryError,
  paymentSummaryLoading,
  refundOperation,
  refundPreview,
  refundPreviewError,
  refundPreviewLoading,
  showRefundPreview,
}: {
  paymentSummary: PublicPaymentSummaryResponse | undefined;
  paymentSummaryError: unknown;
  paymentSummaryLoading: boolean;
  refundOperation: PublicRefundOperationResponse | null;
  refundPreview: PublicRefundPreviewResponse | undefined;
  refundPreviewError: unknown;
  refundPreviewLoading: boolean;
  showRefundPreview: boolean;
}) {
  return (
    <section className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">결제/환불 상태</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          예약에 적용된 결제 방식과 취소 시 환불 기준을 확인할 수 있습니다.
        </p>
      </div>

      <PaymentSummaryBlock
        error={paymentSummaryError}
        isLoading={paymentSummaryLoading}
        summary={paymentSummary}
      />

      {refundOperation ? <RefundOperationBlock refund={refundOperation} /> : null}

      {!refundOperation && showRefundPreview ? (
        <RefundPreviewBlock
          error={refundPreviewError}
          isLoading={refundPreviewLoading}
          preview={refundPreview}
          title="취소 전 환불 예상"
        />
      ) : null}
    </section>
  );
}

function PaymentSummaryBlock({
  error,
  isLoading,
  summary,
}: {
  error: unknown;
  isLoading: boolean;
  summary: PublicPaymentSummaryResponse | undefined;
}) {
  if (isLoading) {
    return (
      <Alert title="결제 상태를 불러오는 중입니다." variant="info">
        잠시 후 결제 방식과 상태가 표시됩니다.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert title="결제 상태를 불러오지 못했습니다." variant="error">
        {toCustomerApiErrorMessage(error)}
      </Alert>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <Alert
        title={paymentStatusLabel(summary.paymentStatus)}
        variant={paymentStatusVariant(summary.paymentStatus)}
      >
        {paymentStatusDescription(summary)}
      </Alert>
      <dl className="grid gap-3 text-sm">
        <DetailRow label="결제 방식" value={paymentModeLabel(summary.paymentMode)} />
        <DetailRow label="결제 금액" value={formatMoney(summary.amount, summary.currency)} />
        <DetailRow
          label="결제 필요 여부"
          value={summary.paymentRequired ? "결제 또는 보증 등록 필요" : "추가 결제 필요 없음"}
        />
        {summary.paymentDueAt ? (
          <DetailRow label="결제 마감" value={formatDateTime(summary.paymentDueAt)} />
        ) : null}
        {summary.cancellationPolicySummary ? (
          <DetailRow label="취소 정책" value={summary.cancellationPolicySummary} />
        ) : null}
      </dl>
    </div>
  );
}

function RefundOperationBlock({ refund }: { refund: PublicRefundOperationResponse }) {
  return (
    <div className="grid gap-3">
      <Alert title={refundOperationTitle(refund)} variant={refundOperationVariant(refund)}>
        {refund.message}
        {refund.failureMessage ? <p className="mt-1">실패 사유: {refund.failureMessage}</p> : null}
      </Alert>
      <dl className="grid gap-3 text-sm">
        <DetailRow label="환불 상태" value={refundStatusLabel(refund.status)} />
        <DetailRow label="환불 금액" value={formatMoney(refund.refundAmount, refund.currency)} />
        <DetailRow
          label="환불 제외"
          value={formatMoney(refund.nonRefundableAmount, refund.currency)}
        />
        <DetailRow
          label="기환불 금액"
          value={formatMoney(refund.alreadyRefundedAmount, refund.currency)}
        />
      </dl>
    </div>
  );
}

function RefundPreviewBlock({
  error,
  isLoading,
  preview,
  title,
}: {
  error: unknown;
  isLoading: boolean;
  preview: PublicRefundPreviewResponse | undefined;
  title: string;
}) {
  if (isLoading) {
    return (
      <Alert title="환불 예상 정보를 확인 중입니다." variant="info">
        최신 취소 정책을 기준으로 예상 금액을 계산하고 있습니다.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert title="환불 예상 정보를 불러오지 못했습니다." variant="warning">
        {toCustomerApiErrorMessage(error)}
      </Alert>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <Alert
        title={preview.refundRequired ? title : "환불 예정 없음"}
        variant={preview.refundRequired ? "info" : "warning"}
      >
        {preview.message}
      </Alert>
      <dl className="grid gap-3 text-sm">
        <DetailRow label="결제 금액" value={formatMoney(preview.paidAmount, preview.currency)} />
        <DetailRow
          label="예상 환불"
          value={formatMoney(preview.refundableAmount, preview.currency)}
        />
        <DetailRow
          label="환불 제외"
          value={formatMoney(preview.nonRefundableAmount, preview.currency)}
        />
        <DetailRow
          label="기환불 금액"
          value={formatMoney(preview.alreadyRefundedAmount, preview.currency)}
        />
      </dl>
    </div>
  );
}

function ReservationDetailCard({ reservation }: { reservation: PublicReservationDetailResponse }) {
  const statusView = getReservationStatusView(reservation.status);

  return (
    <section className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
      <Alert title={statusView.label} variant={statusView.variant}>
        <p>{statusView.description}</p>
        <p className="mt-1">예약번호 {reservation.reservationNumber}</p>
      </Alert>

      <dl className="grid gap-3 text-sm">
        <DetailRow label="매장" value={reservation.restaurantName ?? "매장명 미정"} />
        <DetailRow label="상품" value={reservation.productName} />
        <DetailRow
          label="방문 일시"
          value={`${reservation.visitDate} ${reservation.startTime}-${reservation.endTime}`}
        />
        <DetailRow label="인원" value={`${reservation.partySize}명`} />
        <DetailRow label="예약자" value={reservation.customerName} />
        <DetailRow label="연락처" value={`끝자리 ${reservation.customerPhoneLast4}`} />
        <DetailRow label="요청사항" value={reservation.customerRequest ?? "등록된 요청사항 없음"} />
        <DetailRow label="취소 가능 기한" value={formatDateTime(reservation.cancelDeadline)} />
        {reservation.cancelledAt ? (
          <DetailRow label="취소 완료 시각" value={formatDateTime(reservation.cancelledAt)} />
        ) : null}
        {reservation.cancelReason ? (
          <DetailRow label="취소 사유" value={reservation.cancelReason} />
        ) : null}
      </dl>
    </section>
  );
}

function CancelReservationPanel({
  cancelError,
  cancelReason,
  cancelling,
  dialogOpen,
  onCancelDialogChange,
  onCancelReasonChange,
  onConfirmCancel,
  refundPreview,
  refundPreviewLoading,
  reservation,
  showRefundPreview,
}: {
  cancelError: unknown;
  cancelReason: string;
  cancelling: boolean;
  dialogOpen: boolean;
  onCancelDialogChange: (open: boolean) => void;
  onCancelReasonChange: (reason: string) => void;
  onConfirmCancel: () => void;
  refundPreview: PublicRefundPreviewResponse | undefined;
  refundPreviewLoading: boolean;
  reservation: PublicReservationDetailResponse;
  showRefundPreview: boolean;
}) {
  const cancellationRestriction = getCancellationRestriction(reservation);
  const cancelDisabled = cancelling || (showRefundPreview && refundPreviewLoading);

  if (cancellationRestriction) {
    return (
      <section className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm">
        <Alert title={cancellationRestriction.title} variant="warning">
          {cancellationRestriction.description}
        </Alert>
        <CancellationPolicyNote reservation={reservation} />
        <ReservationChangeNotice reservation={reservation} />
      </section>
    );
  }

  return (
    <section className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">예약 취소</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          취소 사유는 선택 입력입니다. 취소 후 상태는 즉시 갱신됩니다.
        </p>
      </div>

      <CancellationPolicyNote reservation={reservation} />
      <ReservationChangeNotice reservation={reservation} />

      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        취소 사유
        <Textarea
          maxLength={255}
          placeholder="예: 일정 변경"
          value={cancelReason}
          onChange={(event) => onCancelReasonChange(event.target.value)}
        />
      </label>

      {cancelError ? (
        <Alert title="예약을 취소하지 못했습니다." variant="error">
          {toCustomerApiErrorMessage(cancelError)}
        </Alert>
      ) : null}

      <Button
        className="w-full"
        disabled={cancelDisabled}
        type="button"
        variant="danger"
        onClick={() => onCancelDialogChange(true)}
      >
        {refundPreviewLoading ? "환불 예상 확인 중" : "예약 취소"}
      </Button>

      <ConfirmDialog
        cancelLabel="계속 유지"
        confirmDisabled={cancelling}
        confirmLabel={cancelling ? "취소 처리 중" : "예약 취소"}
        destructive
        open={dialogOpen}
        title="예약을 취소할까요?"
        onCancel={() => onCancelDialogChange(false)}
        onConfirm={onConfirmCancel}
      >
        <p>취소가 완료되면 예약 상태가 고객 취소로 변경됩니다.</p>
        {refundPreview ? (
          <p className="mt-2">
            예상 환불 금액은 {formatMoney(refundPreview.refundableAmount, refundPreview.currency)}
            입니다.
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}

function CancellationPolicyNote({ reservation }: { reservation: PublicReservationDetailResponse }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
      취소 가능 기한: {formatDateTime(reservation.cancelDeadline)}
    </div>
  );
}

function ReservationChangeNotice({
  reservation,
}: {
  reservation: PublicReservationDetailResponse;
}) {
  if (!isActiveReservationStatus(reservation.status)) {
    return null;
  }

  return (
    <Alert title="예약 변경 안내" variant="info">
      온라인 예약 변경은 지원하지 않습니다. 일정이나 인원 변경이 필요하면 예약을 취소한 뒤 다시
      예약해 주세요.
    </Alert>
  );
}

function getCancellationRestriction(reservation: PublicReservationDetailResponse) {
  if (isCancelledReservationStatus(reservation.status)) {
    return {
      description:
        reservation.status === "CANCELLED_BY_CUSTOMER"
          ? "고객 요청으로 이미 취소된 예약입니다."
          : "매장에서 취소한 예약입니다. 필요한 경우 매장에 문의해 주세요.",
      title: "취소 완료",
    };
  }

  if (reservation.status === "PENDING") {
    return {
      description: "예약 접수 상태에서는 온라인 고객 취소를 진행할 수 없습니다.",
      title: "취소 불가",
    };
  }

  if (reservation.status === "COMPLETED") {
    return {
      description: "방문이 완료된 예약은 취소할 수 없습니다.",
      title: "취소 불가",
    };
  }

  if (reservation.status === "NO_SHOW") {
    return {
      description: "노쇼 처리된 예약은 고객 취소로 변경할 수 없습니다.",
      title: "취소 불가",
    };
  }

  if (reservation.cancelable) {
    return null;
  }

  if (isActiveReservationStatus(reservation.status) && isPastDateTime(reservation.cancelDeadline)) {
    return {
      description: "취소 가능 기한이 지나 온라인 취소를 진행할 수 없습니다.",
      title: "취소 불가",
    };
  }

  return {
    description: "현재 예약 상태에서는 온라인 고객 취소를 진행할 수 없습니다.",
    title: "취소 불가",
  };
}

function shouldLoadRefundPreview(reservation: PublicReservationDetailResponse) {
  return reservation.cancelable && isActiveReservationStatus(reservation.status);
}

function paymentModeLabel(mode: PublicPaymentSummaryResponse["paymentMode"]) {
  const labels: Record<PublicPaymentSummaryResponse["paymentMode"], string> = {
    CARD_GUARANTEE: "카드 보증",
    DEPOSIT: "예약금",
    FREE: "무료 예약",
    PAY_ON_SITE: "현장 결제",
    PREPAID: "선결제",
  };

  return labels[mode] ?? mode;
}

function paymentStatusLabel(status: PublicPaymentStatus) {
  const labels: Record<PublicPaymentStatus, string> = {
    CANCELLED: "결제 취소",
    EXPIRED: "결제 만료",
    FAILED: "결제 실패",
    GUARANTEE_CHARGE_FAILED: "보증 청구 실패",
    GUARANTEE_CHARGE_PENDING: "보증 청구 중",
    GUARANTEE_CHARGED: "보증 청구 완료",
    GUARANTEE_REGISTERED: "카드 보증 등록",
    NOT_REQUIRED: "결제 없음",
    PAID: "결제 완료",
    PARTIALLY_REFUNDED: "부분 환불",
    PAY_ON_SITE: "현장 결제",
    PENDING: "결제 진행 중",
    REFUND_FAILED: "환불 실패",
    REFUNDED: "환불 완료",
    REQUIRES_PAYMENT: "결제 필요",
  };

  return labels[status] ?? status;
}

function paymentStatusVariant(status: PublicPaymentStatus) {
  if (status === "FAILED" || status === "REFUND_FAILED" || status === "GUARANTEE_CHARGE_FAILED") {
    return "error";
  }

  if (status === "CANCELLED" || status === "EXPIRED" || status === "PARTIALLY_REFUNDED") {
    return "warning";
  }

  if (
    status === "PAID" ||
    status === "PAY_ON_SITE" ||
    status === "NOT_REQUIRED" ||
    status === "REFUNDED" ||
    status === "GUARANTEE_REGISTERED" ||
    status === "GUARANTEE_CHARGED"
  ) {
    return "success";
  }

  return "info";
}

function paymentStatusDescription(summary: PublicPaymentSummaryResponse) {
  switch (summary.paymentStatus) {
    case "REQUIRES_PAYMENT":
      return "예약 유지를 위해 결제 또는 보증 등록이 필요합니다.";
    case "PENDING":
      return "결제 승인을 기다리고 있습니다. 결제 창에서 진행 상태를 확인해 주세요.";
    case "PAID":
      return "온라인 결제가 완료된 예약입니다.";
    case "PAY_ON_SITE":
      return "방문 당일 매장에서 결제하는 예약입니다.";
    case "NOT_REQUIRED":
      return "온라인 결제가 필요하지 않은 예약입니다.";
    case "GUARANTEE_REGISTERED":
      return "카드 보증 등록이 완료된 예약입니다.";
    case "PARTIALLY_REFUNDED":
      return "결제 금액 중 일부가 환불 처리되었습니다.";
    case "REFUNDED":
      return "환불이 완료된 결제 건입니다.";
    case "REFUND_FAILED":
      return "환불 처리에 실패했습니다. 매장 또는 고객센터에 문의해 주세요.";
    case "EXPIRED":
      return "결제 가능 시간이 만료되었습니다.";
    case "CANCELLED":
      return "결제가 취소되었습니다.";
    case "FAILED":
      return "결제 처리에 실패했습니다.";
    case "GUARANTEE_CHARGE_PENDING":
      return "카드 보증 청구 처리가 진행 중입니다.";
    case "GUARANTEE_CHARGED":
      return "카드 보증 청구가 완료되었습니다.";
    case "GUARANTEE_CHARGE_FAILED":
      return "카드 보증 청구에 실패했습니다.";
    default:
      return "예약의 결제 상태를 확인해 주세요.";
  }
}

function refundStatusLabel(status: PublicRefundStatus | null) {
  if (!status) {
    return "환불 요청 없음";
  }

  const labels: Record<PublicRefundStatus, string> = {
    CANCELLED: "환불 취소",
    FAILED: "환불 실패",
    PENDING: "환불 처리 중",
    REQUESTED: "환불 요청",
    SUCCEEDED: "환불 완료",
  };

  return labels[status] ?? status;
}

function refundOperationTitle(refund: PublicRefundOperationResponse) {
  if (!refund.refundRequired) {
    return "환불 예정 없음";
  }

  if (refund.status === "SUCCEEDED") {
    return "환불 완료";
  }

  if (refund.status === "FAILED") {
    return "환불 실패";
  }

  return "환불 처리 중";
}

function refundOperationVariant(refund: PublicRefundOperationResponse) {
  if (refund.status === "FAILED") {
    return "error";
  }

  if (refund.status === "SUCCEEDED" || !refund.refundRequired) {
    return "success";
  }

  return "info";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="break-words font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("ko-KR", {
      currency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("ko-KR")} ${currency}`;
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isPastDateTime(value: string) {
  const date = new Date(value);

  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}
