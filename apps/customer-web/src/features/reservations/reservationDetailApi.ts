import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import {
  type PublicReservationCancelRequest,
  type PublicReservationDetailResponse,
} from "./reservationDetailTypes";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function reservationDetailQueryKey(reservationId: number, lookupToken: string | null) {
  return ["reservation-detail", reservationId, lookupToken] as const;
}

export function getPublicReservationDetail(
  reservationId: number,
  lookupToken: string,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicReservationDetailResponse>(`/api/public/reservations/${reservationId}`, {
    lookupToken,
  });
}

export function cancelPublicReservation(
  reservationId: number,
  lookupToken: string,
  request: PublicReservationCancelRequest = {},
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.post<PublicReservationDetailResponse>(
    `/api/public/reservations/${reservationId}/cancel`,
    {
      body: request,
      lookupToken,
    },
  );
}
