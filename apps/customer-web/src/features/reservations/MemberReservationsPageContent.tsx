"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { ReservationPageShell } from "@/components/layout/ReservationPageShell";
import { Button, StateBlock } from "@/components/ui";
import { PublicApiError, toCustomerApiErrorMessage } from "@/shared/api/apiError";
import { usePublicApiClient } from "@/shared/api/usePublicApiClient";

import { getPublicMemberReservations, memberReservationsQueryKey } from "./memberReservationApi";
import { type PublicMemberReservationItem } from "./memberReservationTypes";
import { getReservationStatusView } from "./reservationDisplay";
import { type ReservationPaymentMode } from "./reservationPaymentPolicy";
import { type PublicPaymentStatus } from "./reservationPaymentTypes";
import { useCustomerMemberSession } from "./useCustomerMemberSession";

export function MemberReservationsPageContent() {
  return (
    <ReservationPageShell
      description="로그인한 회원의 예약 내역을 확인하고 필요한 다음 행동을 이어갈 수 있습니다."
      eyebrow="내 예약"
      title="내 예약"
    >
      <MemberReservationsPanel />
    </ReservationPageShell>
  );
}

function MemberReservationsPanel() {
  const apiClient = usePublicApiClient();
  const router = useRouter();
  const { clearSession, loading, member, memberError } = useCustomerMemberSession();
  const reservationsQuery = useQuery({
    enabled: Boolean(member),
    queryFn: () => getPublicMemberReservations(member?.id ?? 0, apiClient),
    queryKey: memberReservationsQueryKey(member?.id ?? null),
    retry: false,
  });

  if (loading) {
    return <StateBlock title="로그인 정보를 확인하는 중입니다." variant="loading" />;
  }

  if (!member) {
    return (
      <StateBlock
        action={{
          label: "사용자 로그인",
          onClick: () => router.push("/login?redirect=/reservations"),
        }}
        title="사용자 로그인 후 내 예약을 볼 수 있습니다."
      >
        <p>{memberLoginMessage(memberError)}</p>
      </StateBlock>
    );
  }

  if (reservationsQuery.isLoading) {
    return <StateBlock title="예약 내역을 불러오는 중입니다." variant="loading" />;
  }

  if (reservationsQuery.isError) {
    return (
      <StateBlock
        action={{ label: "다시 조회", onClick: () => void reservationsQuery.refetch() }}
        title="예약 내역을 불러오지 못했습니다."
        variant="error"
      >
        <p>{toCustomerApiErrorMessage(reservationsQuery.error)}</p>
      </StateBlock>
    );
  }

  const reservations = reservationsQuery.data?.reservations ?? [];

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{member.name}님의 예약</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            회원 #{member.id} · 연락처 끝자리 {member.phoneLast4}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-800 focus-visible:ring-offset-2"
            href="/reserve"
          >
            예약 가능한 매장 보기
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            href="/login?redirect=/reservations"
            onClick={clearSession}
          >
            계정 전환
          </Link>
          <Button type="button" variant="secondary" onClick={clearSession}>
            로그아웃
          </Button>
        </div>
      </section>

      {reservations.length === 0 ? (
        <StateBlock title="아직 예약 내역이 없습니다.">
          <p>예약 가능한 매장을 선택해 첫 예약을 진행해 보세요.</p>
          <Link
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            href="/reserve"
          >
            예약 가능한 매장 보기
          </Link>
        </StateBlock>
      ) : (
        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <header className="border-b px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">예약 내역</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              최신 방문 일정 순으로 {reservations.length}건을 표시합니다.
            </p>
          </header>
          <div className="divide-y">
            {reservations.map((reservation) => (
              <ReservationListCard
                key={reservation.id}
                memberId={member.id}
                reservation={reservation}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReservationListCard({
  memberId,
  reservation,
}: {
  memberId: number;
  reservation: PublicMemberReservationItem;
}) {
  const statusView = getReservationStatusView(reservation.status);

  return (
    <Link
      className="grid gap-3 bg-white px-4 py-4 transition hover:bg-[#fbfffd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#03c75a]"
      href={`/reservations/${reservation.id}?memberId=${memberId}`}
      prefetch={false}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-base font-bold text-slate-950">
            {reservation.restaurantName ?? "매장"}
          </span>
          <span className="mt-1 block break-words text-sm leading-6 text-slate-600">
            {reservation.productName}
          </span>
        </span>
        <span className={statusBadgeClass(statusView.variant)}>{statusView.label}</span>
      </span>

      <span className="grid gap-1 text-sm leading-6 text-slate-700">
        <span className="font-semibold text-slate-950">
          {reservation.visitDate} · {reservation.startTime}
        </span>
        <span>
          {reservation.partySize}명 · 예약번호 {reservation.reservationNumber}
        </span>
      </span>

      <span className="flex flex-wrap gap-1.5 text-xs font-semibold">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
          {paymentModeLabel(reservation.paymentMode)}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
          {paymentStatusLabel(reservation.paymentStatus)}
        </span>
        {reservation.cancelable ? (
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">취소 가능</span>
        ) : null}
      </span>
    </Link>
  );
}

function memberLoginMessage(error: unknown) {
  if (error instanceof PublicApiError && error.status === 404) {
    return "저장된 회원 정보가 만료되어 다시 로그인이 필요합니다.";
  }

  return "회원 ID만 입력하면 예약 내역을 바로 확인할 수 있습니다.";
}

function statusBadgeClass(variant: ReturnType<typeof getReservationStatusView>["variant"]) {
  const base = "shrink-0 rounded-md px-2 py-1 text-xs font-bold";

  if (variant === "success") {
    return `${base} bg-emerald-50 text-emerald-700`;
  }

  if (variant === "warning") {
    return `${base} bg-amber-50 text-amber-700`;
  }

  if (variant === "error") {
    return `${base} bg-red-50 text-red-700`;
  }

  return `${base} bg-slate-100 text-slate-700`;
}

function paymentModeLabel(mode: ReservationPaymentMode) {
  const labels: Record<ReservationPaymentMode, string> = {
    CARD_GUARANTEE: "카드 보증",
    DEPOSIT: "예약금",
    FREE: "결제 없음",
    PAY_ON_SITE: "현장 결제",
    PREPAID: "사전 결제",
  };

  return labels[mode] ?? mode;
}

function paymentStatusLabel(status: PublicPaymentStatus) {
  const labels: Partial<Record<PublicPaymentStatus, string>> = {
    GUARANTEE_REGISTERED: "보증 등록",
    NOT_REQUIRED: "결제 불필요",
    PAID: "결제 완료",
    PAY_ON_SITE: "현장 결제",
    PENDING: "결제 대기",
    REQUIRES_PAYMENT: "결제 필요",
  };

  return labels[status] ?? status;
}
