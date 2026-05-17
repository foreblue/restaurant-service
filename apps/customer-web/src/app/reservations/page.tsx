import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { ReservationLookupPageContent } from "@/features/reservations/ReservationLookupPageContent";

interface ReservationLookupPageProps {
  searchParams: Promise<{
    id?: string | string[] | undefined;
    lookupToken?: string | string[] | undefined;
    reservationId?: string | string[] | undefined;
    token?: string | string[] | undefined;
  }>;
}

export const metadata: Metadata = {
  title: "예약 조회",
  description: "예약번호와 휴대폰 번호로 예약을 조회합니다.",
};

export default async function ReservationLookupPage({ searchParams }: ReservationLookupPageProps) {
  const search = await searchParams;
  const reservationId = firstQueryValue(search.reservationId) ?? firstQueryValue(search.id);
  const lookupToken = firstQueryValue(search.token) ?? firstQueryValue(search.lookupToken);

  if (isPositiveInteger(reservationId) && lookupToken) {
    redirect(`/reservations/${reservationId}?token=${encodeURIComponent(lookupToken)}`);
  }

  return <ReservationLookupPageContent />;
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
