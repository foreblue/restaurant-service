import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import { type ReservationLookupFormValues } from "./reservationLookupSchema";

export interface ReservationLookupTokenResponse {
  reservationId: number;
  lookupToken: string;
  expiresAt: string;
}

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function issueReservationLookupToken(
  request: ReservationLookupFormValues,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.post<ReservationLookupTokenResponse>("/api/public/reservation-lookup-tokens", {
    body: request,
  });
}
