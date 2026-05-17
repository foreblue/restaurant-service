import { Alert } from "@/components/ui";

import { type PublicReservationResponse } from "./reservationCreateTypes";

interface ReservationCompletionCardProps {
  reservation: PublicReservationResponse;
}

export function ReservationCompletionCard({ reservation }: ReservationCompletionCardProps) {
  return (
    <section className="rounded-lg border border-teal-200 bg-white p-4 shadow-sm">
      <Alert title="예약이 완료되었습니다." variant="success">
        예약번호와 방문 정보를 확인해 주세요.
      </Alert>

      <dl className="mt-4 grid gap-3 text-sm">
        <div className="grid gap-1">
          <dt className="font-medium text-slate-500">예약번호</dt>
          <dd className="break-words text-base font-semibold text-slate-950">
            {reservation.reservationNumber}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-medium text-slate-500">예약 상태</dt>
          <dd className="font-semibold text-teal-800">
            {formatReservationStatus(reservation.status)}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-medium text-slate-500">방문 정보</dt>
          <dd className="text-slate-950">
            {reservation.visitDate} {reservation.startTime} · {reservation.partySize}명
          </dd>
        </div>
      </dl>
    </section>
  );
}

function formatReservationStatus(status: PublicReservationResponse["status"]) {
  const labels: Record<PublicReservationResponse["status"], string> = {
    CANCELLED_BY_CUSTOMER: "고객 취소",
    CANCELLED_BY_RESTAURANT: "매장 취소",
    COMPLETED: "방문 완료",
    CONFIRMED: "예약 확정",
    MODIFIED: "예약 변경",
    NO_SHOW: "노쇼",
    PENDING: "예약 접수",
  };

  return labels[status] ?? status;
}
