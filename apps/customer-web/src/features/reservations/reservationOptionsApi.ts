import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import {
  type AvailabilityDatesResponse,
  type AvailabilityTimesResponse,
  type PublicReservationProductListResponse,
} from "./reservationOptionsTypes";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function getPublicReservationProducts(
  restaurantId: number,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<PublicReservationProductListResponse>(
    `/api/public/restaurants/${restaurantId}/reservation-products`,
    {
      cache: "no-store",
    },
  );
}

export function getAvailabilityDates(
  params: {
    partySize: number;
    productId: number;
    restaurantId: number;
  },
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<AvailabilityDatesResponse>(
    `/api/public/restaurants/${params.restaurantId}/availability/dates`,
    {
      cache: "no-store",
      searchParams: {
        productId: params.productId,
        partySize: params.partySize,
      },
    },
  );
}

export function getAvailabilityTimes(
  params: {
    date: string;
    partySize: number;
    productId: number;
    restaurantId: number;
  },
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.get<AvailabilityTimesResponse>(
    `/api/public/restaurants/${params.restaurantId}/availability/times`,
    {
      cache: "no-store",
      searchParams: {
        productId: params.productId,
        date: params.date,
        partySize: params.partySize,
      },
    },
  );
}
