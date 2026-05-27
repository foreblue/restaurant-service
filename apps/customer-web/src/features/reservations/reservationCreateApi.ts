import { customerWebEnv } from "@/config/env";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";

import {
  type PublicReservationCreateRequest,
  type PublicReservationResponse,
} from "./reservationCreateTypes";
import { type ReservationCustomerFormValues } from "./reservationCustomerSchema";
import { type AvailableTimeSlot, type PublicReservationProduct } from "./reservationOptionsTypes";

const defaultPublicApiClient = createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl });

export function createPublicReservation(
  request: PublicReservationCreateRequest,
  idempotencyKey: string,
  client: PublicApiClient = defaultPublicApiClient,
) {
  return client.post<PublicReservationResponse>("/api/public/reservations", {
    body: request,
    idempotencyKey,
  });
}

export function buildReservationCreateRequest({
  customerInfo,
  idempotencyKey,
  partySize,
  product,
  restaurantId,
  selectedDate,
  selectedTimeSlot,
}: {
  customerInfo: ReservationCustomerFormValues;
  idempotencyKey: string;
  partySize: number;
  product: PublicReservationProduct;
  restaurantId: number;
  selectedDate: string;
  selectedTimeSlot: AvailableTimeSlot;
}): PublicReservationCreateRequest {
  return {
    restaurantId,
    productId: product.id,
    visitDate: selectedDate,
    startTime: selectedTimeSlot.startTime,
    partySize,
    memberId: customerInfo.memberId,
    customerRequest: customerInfo.requestNotes,
    allergyNote: customerInfo.allergyNote,
    anniversaryType: customerInfo.anniversaryType,
    anniversaryDate: customerInfo.anniversaryDate,
    requestTemplateValues: customerInfo.requestTemplateValues,
    marketingOptIn: customerInfo.marketingConsent,
    idempotencyKey,
  };
}
