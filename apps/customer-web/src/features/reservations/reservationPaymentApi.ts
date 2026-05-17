import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import {
  type PublicGuaranteeStartRequest,
  type PublicGuaranteeStartResponse,
  type PublicPaymentStartRequest,
  type PublicPaymentStartResponse,
} from "./reservationPaymentTypes";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

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
