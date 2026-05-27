import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { MemberReservationsPageContent } from "@/features/reservations/MemberReservationsPageContent";

interface ReservationLookupPageProps {
  searchParams: Promise<{
    id?: string | string[] | undefined;
    lookupToken?: string | string[] | undefined;
    reservationId?: string | string[] | undefined;
    token?: string | string[] | undefined;
  }>;
}

export const metadata: Metadata = {
  title: "내 예약",
  description: "로그인한 회원의 예약 내역을 조회합니다.",
};

export default async function ReservationLookupPage({ searchParams }: ReservationLookupPageProps) {
  const search = await searchParams;
  const reservationId = firstQueryValue(search.reservationId) ?? firstQueryValue(search.id);
  const lookupToken = firstQueryValue(search.token) ?? firstQueryValue(search.lookupToken);

  if (isPositiveInteger(reservationId) && lookupToken) {
    redirect(`/reservations/${reservationId}?token=${encodeURIComponent(lookupToken)}`);
  }

  return <MemberReservationsPageContent />;
}

function firstQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return value?.trim() || null;
}

function isPositiveInteger(value: string | null) {
  if (!value) {
    return false;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0;
}
