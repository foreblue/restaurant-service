import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import {
  type PublicReservationCancelRequest,
  type PublicReservationDetailResponse,
} from "./reservationDetailTypes";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export interface PublicReservationAccess {
  lookupToken?: string | null;
  memberId?: number | null;
}

export function reservationDetailQueryKey(reservationId: number, access: PublicReservationAccess) {
  return [
    "reservation-detail",
    reservationId,
    access.lookupToken ?? null,
    access.memberId ?? null,
  ] as const;
}

export function getPublicReservationDetail(
  reservationId: number,
  access: PublicReservationAccess,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicReservationDetailResponse>(`/api/public/reservations/${reservationId}`, {
    lookupToken: access.lookupToken ?? null,
    searchParams: {
      memberId: access.memberId ?? null,
    },
  });
}

export function cancelPublicReservation(
  reservationId: number,
  access: PublicReservationAccess,
  request: PublicReservationCancelRequest = {},
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.post<PublicReservationDetailResponse>(
    `/api/public/reservations/${reservationId}/cancel`,
    {
      body: request,
      lookupToken: access.lookupToken ?? null,
      searchParams: {
        memberId: access.memberId ?? null,
      },
    },
  );
}
