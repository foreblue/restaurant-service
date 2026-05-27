import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import { type PublicMemberReservationListResponse } from "./memberReservationTypes";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function memberReservationsQueryKey(memberId: number | null) {
  return ["member-reservations", memberId] as const;
}

export function getPublicMemberReservations(
  memberId: number,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicMemberReservationListResponse>(
    `/api/public/members/${encodeURIComponent(memberId)}/reservations`,
    {
      cache: "no-store",
    },
  );
}
