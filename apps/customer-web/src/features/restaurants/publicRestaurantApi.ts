import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import { type PublicRestaurantResponse } from "./publicRestaurantTypes";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function getPublicRestaurantBySlug(
  slug: string,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicRestaurantResponse>(
    `/api/public/restaurants/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    },
  );
}

export function getPublicRestaurantById(
  restaurantId: string,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicRestaurantResponse>(
    `/api/public/restaurants/${encodeURIComponent(restaurantId)}/reservation-page`,
    {
      cache: "no-store",
    },
  );
}
