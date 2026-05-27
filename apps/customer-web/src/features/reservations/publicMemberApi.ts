import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import { type PublicMember, type PublicMemberListResponse } from "./publicMemberTypes";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function getPublicMembers(client: PublicApiClient = defaultPublicApiClient) {
  return client.get<PublicMemberListResponse>("/api/public/members");
}

export function getPublicMemberById(
  memberId: number,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicMember>(`/api/public/members/${encodeURIComponent(memberId)}`);
}
