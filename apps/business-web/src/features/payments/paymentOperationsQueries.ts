import { useQuery } from "@tanstack/react-query";

import {
  type BusinessPaymentListQuery,
  type BusinessRefundListQuery,
} from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const businessPaymentsQueryKey = ["business", "payments"] as const;
export const businessRefundsQueryKey = ["business", "refunds"] as const;

export function useBusinessPaymentsQuery(query: BusinessPaymentListQuery, enabled = true) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessPaymentsQueryKey, query],
    queryFn: () => apiClient.listBusinessPayments(query),
    enabled,
  });
}

export function useBusinessRefundsQuery(query: BusinessRefundListQuery, enabled = true) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessRefundsQueryKey, query],
    queryFn: () => apiClient.listBusinessRefunds(query),
    enabled,
  });
}
