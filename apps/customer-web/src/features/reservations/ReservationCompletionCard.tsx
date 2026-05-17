import Link from "next/link";

import { Alert } from "@/components/ui";

import { type PublicReservationResponse } from "./reservationCreateTypes";
import { formatReservationStatus } from "./reservationDisplay";
import { type ReservationPaymentPolicyView } from "./reservationPaymentPolicy";

interface ReservationCompletionCardProps {
  paymentPolicy?: ReservationPaymentPolicyView | undefined;
  reservation: PublicReservationResponse;
}

export function ReservationCompletionCard({
  paymentPolicy,
  reservation,
}: ReservationCompletionCardProps) {
  return (
    <section className="rounded-lg border border-teal-200 bg-white p-4 shadow-sm">
      <Alert title="예약이 완료되었습니다." variant="success">
        {paymentPolicy && paymentPolicy.nextStep !== "reserveOnly"
          ? `${paymentPolicy.nextStepLabel} 단계가 이어집니다.`
          : "예약번호와 방문 정보를 확인해 주세요."}
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

      {paymentPolicy ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-950">다음 단계</p>
          <p>{paymentPolicy.nextStepLabel}</p>
        </div>
      ) : null}

      <Link
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        href={`/reservations/${reservation.id}?token=${encodeURIComponent(reservation.lookupToken)}`}
      >
        예약 상세 확인
      </Link>
    </section>
  );
}
