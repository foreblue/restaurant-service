import { useMutation, useQuery } from "@tanstack/react-query";

import {
  type BusinessAnalyticsExportRequest,
  type BusinessAnalyticsPeriodQuery,
  type BusinessAnalyticsTimeSlotQuery,
} from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const businessAnalyticsQueryKey = ["business", "analytics"] as const;

export function useBusinessAnalyticsSummaryQuery(
  restaurantId: number | null,
  query: BusinessAnalyticsPeriodQuery,
) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessAnalyticsQueryKey, "summary", restaurantId, query],
    queryFn: () => apiClient.getBusinessAnalyticsSummary(restaurantId ?? 0, query),
    enabled: restaurantId !== null,
  });
}

export function useBusinessAnalyticsTimeSlotsQuery(
  restaurantId: number | null,
  query: BusinessAnalyticsTimeSlotQuery,
) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessAnalyticsQueryKey, "time-slots", restaurantId, query],
    queryFn: () => apiClient.getBusinessAnalyticsTimeSlots(restaurantId ?? 0, query),
    enabled: restaurantId !== null,
  });
}

export function useBusinessAnalyticsProductsQuery(
  restaurantId: number | null,
  query: BusinessAnalyticsPeriodQuery,
) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessAnalyticsQueryKey, "products", restaurantId, query],
    queryFn: () => apiClient.getBusinessAnalyticsProducts(restaurantId ?? 0, query),
    enabled: restaurantId !== null,
  });
}

export function useRequestBusinessAnalyticsExportMutation() {
  const apiClient = useBusinessApiClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      request,
    }: {
      restaurantId: number;
      request: BusinessAnalyticsExportRequest;
    }) => apiClient.requestBusinessAnalyticsExport(restaurantId, request),
  });
}
