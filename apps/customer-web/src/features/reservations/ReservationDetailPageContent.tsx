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
import { type PublicReservationDetailResponse } from "./reservationDetailTypes";
import {
  getReservationStatusView,
  isActiveReservationStatus,
  isCancelledReservationStatus,
} from "./reservationDisplay";

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

  const cancelMutation = useMutation({
    mutationFn: () =>
      cancelPublicReservation(
        reservationId,
        lookupToken ?? "",
        { reason: cancelReason.trim() || null },
        apiClient,
      ),
    onSuccess: (reservation) => {
      queryClient.setQueryData(reservationDetailQueryKey(reservationId, lookupToken), reservation);
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

      <CancelReservationPanel
        cancelError={cancelMutation.error}
        cancelReason={cancelReason}
        cancelling={cancelMutation.isPending}
        dialogOpen={cancelDialogOpen}
        reservation={detailQuery.data}
        onCancelDialogChange={setCancelDialogOpen}
        onCancelReasonChange={setCancelReason}
        onConfirmCancel={() => cancelMutation.mutate()}
      />
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
  reservation,
}: {
  cancelError: unknown;
  cancelReason: string;
  cancelling: boolean;
  dialogOpen: boolean;
  onCancelDialogChange: (open: boolean) => void;
  onCancelReasonChange: (reason: string) => void;
  onConfirmCancel: () => void;
  reservation: PublicReservationDetailResponse;
}) {
  const cancellationRestriction = getCancellationRestriction(reservation);

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
        disabled={cancelling}
        type="button"
        variant="danger"
        onClick={() => onCancelDialogChange(true)}
      >
        예약 취소
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="break-words font-semibold text-slate-950">{value}</dd>
    </div>
  );
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
