import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { ReservationDetailPageContent } from "@/features/reservations/ReservationDetailPageContent";

interface ReservationDetailPageProps {
  params: Promise<{
    reservationId: string;
  }>;
  searchParams: Promise<{
    lookupToken?: string | string[] | undefined;
    token?: string | string[] | undefined;
  }>;
}

export const metadata: Metadata = {
  title: "예약 상세",
  description: "예약 상세를 확인하고 취소 가능한 예약을 취소합니다.",
};

export default async function ReservationDetailPage({
  params,
  searchParams,
}: ReservationDetailPageProps) {
  const { reservationId } = await params;
  const search = await searchParams;
  const parsedReservationId = Number(reservationId);

  if (!Number.isSafeInteger(parsedReservationId) || parsedReservationId < 1) {
    notFound();
  }

  return (
    <ReservationDetailPageContent
      lookupToken={firstQueryValue(search.token) ?? firstQueryValue(search.lookupToken)}
      reservationId={parsedReservationId}
    />
  );
}

function firstQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return value?.trim() || null;
}
