import { useQuery } from "@tanstack/react-query";

import { type BusinessCustomerListQuery } from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const businessCustomersQueryKey = ["business", "customers"] as const;

export function useBusinessCustomersQuery(query: BusinessCustomerListQuery) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessCustomersQueryKey, "list", query],
    queryFn: () => apiClient.listBusinessCustomers(query),
  });
}

export function useBusinessCustomerDetailQuery(customerId: number | null) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessCustomersQueryKey, "detail", customerId],
    queryFn: () => apiClient.getBusinessCustomer(customerId ?? 0),
    enabled: customerId !== null,
  });
}

export function useBusinessCustomerReservationsQuery(customerId: number | null) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessCustomersQueryKey, "reservations", customerId],
    queryFn: () => apiClient.listBusinessCustomerReservations(customerId ?? 0),
    enabled: customerId !== null,
  });
}
