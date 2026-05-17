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

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function reservationPaymentSummaryQueryKey(
  reservationId: number,
  lookupToken: string | null,
) {
  return ["reservation-payment-summary", reservationId, lookupToken] as const;
}

export function reservationRefundPreviewQueryKey(
  reservationId: number,
  lookupToken: string | null,
) {
  return ["reservation-refund-preview", reservationId, lookupToken] as const;
}

export function getReservationPaymentSummary(
  reservationId: number,
  lookupToken: string,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicPaymentSummaryResponse>(
    `/api/public/reservations/${reservationId}/payment-summary`,
    {
      lookupToken,
    },
  );
}

export function getReservationRefundPreview(
  reservationId: number,
  lookupToken: string,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicRefundPreviewResponse>(
    `/api/public/reservations/${reservationId}/refund-preview`,
    {
      lookupToken,
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
