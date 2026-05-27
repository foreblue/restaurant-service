import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import {
  type PublicGuaranteeStartRequest,
  type PublicGuaranteeStartResponse,
  type PublicPaymentSummaryResponse,
  type PublicPaymentStartRequest,
  type PublicPaymentStartResponse,
  type PublicRefundPreviewResponse,
} from "./reservationPaymentTypes";
import { type PublicReservationAccess } from "./reservationDetailApi";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function reservationPaymentSummaryQueryKey(
  reservationId: number,
  access: PublicReservationAccess,
) {
  return [
    "reservation-payment-summary",
    reservationId,
    access.lookupToken ?? null,
    access.memberId ?? null,
  ] as const;
}

export function reservationRefundPreviewQueryKey(
  reservationId: number,
  access: PublicReservationAccess,
) {
  return [
    "reservation-refund-preview",
    reservationId,
    access.lookupToken ?? null,
    access.memberId ?? null,
  ] as const;
}

export function getReservationPaymentSummary(
  reservationId: number,
  access: PublicReservationAccess,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicPaymentSummaryResponse>(
    `/api/public/reservations/${reservationId}/payment-summary`,
    {
      lookupToken: access.lookupToken ?? null,
      searchParams: {
        memberId: access.memberId ?? null,
      },
    },
  );
}

export function getReservationRefundPreview(
  reservationId: number,
  access: PublicReservationAccess,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicRefundPreviewResponse>(
    `/api/public/reservations/${reservationId}/refund-preview`,
    {
      lookupToken: access.lookupToken ?? null,
      searchParams: {
        memberId: access.memberId ?? null,
      },
    },
  );
}

export function startReservationPayment(
  reservationId: number,
  lookupToken: string,
  request: PublicPaymentStartRequest,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.post<PublicPaymentStartResponse>(
    `/api/public/reservations/${reservationId}/payments`,
    {
      body: request,
      idempotencyKey: request.idempotencyKey,
      lookupToken,
    },
  );
}

export function startReservationGuarantee(
  reservationId: number,
  lookupToken: string,
  request: PublicGuaranteeStartRequest,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.post<PublicGuaranteeStartResponse>(
    `/api/public/reservations/${reservationId}/guarantee`,
    {
      body: request,
      idempotencyKey: request.idempotencyKey,
      lookupToken,
    },
  );
}

export function createReservationPaymentReturnUrl({
  lookupToken,
  origin,
  reservationId,
}: {
  lookupToken: string;
  origin: string;
  reservationId: number;
}) {
  const returnUrl = new URL(`/reservations/${reservationId}`, origin);
  returnUrl.searchParams.set("token", lookupToken);

  return returnUrl.toString();
}
