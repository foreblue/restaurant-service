import { useQuery } from "@tanstack/react-query";

import {
  type BusinessReservationCalendarQuery,
  type BusinessReservationListQuery,
} from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const businessReservationsQueryKey = ["business", "reservations"] as const;

export function useBusinessReservationsQuery(query: BusinessReservationListQuery) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessReservationsQueryKey, "list", query],
    queryFn: () => apiClient.listBusinessReservations(query),
  });
}

export function useBusinessReservationCalendarQuery(query: BusinessReservationCalendarQuery) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessReservationsQueryKey, "calendar", query],
    queryFn: () => apiClient.listBusinessReservationCalendar(query),
  });
}

export function useBusinessReservationDetailQuery(reservationId: number | null) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessReservationsQueryKey, "detail", reservationId],
    queryFn: () => apiClient.getBusinessReservationDetail(reservationId ?? 0),
    enabled: reservationId !== null,
  });
}
