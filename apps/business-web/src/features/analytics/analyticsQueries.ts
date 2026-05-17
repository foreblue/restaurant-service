import { useQuery } from "@tanstack/react-query";

import { type BusinessAnalyticsPeriodQuery } from "@/shared/api/businessApiClient";
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
