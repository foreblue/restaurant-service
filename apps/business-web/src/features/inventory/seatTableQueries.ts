import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type BusinessTableSaveRequest,
  type ReservationProductSeatRulesRequest,
} from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const businessTablesQueryKey = ["business", "tables"] as const;

export function useBusinessTablesQuery() {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: businessTablesQueryKey,
    queryFn: () => apiClient.listBusinessTables(),
  });
}

export function useCreateBusinessTableMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BusinessTableSaveRequest) => apiClient.createBusinessTable(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: businessTablesQueryKey }),
  });
}

export function useUpdateBusinessTableMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, request }: { tableId: number; request: BusinessTableSaveRequest }) =>
      apiClient.updateBusinessTable(tableId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: businessTablesQueryKey }),
  });
}

export function useSaveReservationProductSeatRulesMutation() {
  const apiClient = useBusinessApiClient();

  return useMutation({
    mutationFn: ({
      productId,
      request,
    }: {
      productId: number;
      request: ReservationProductSeatRulesRequest;
    }) => apiClient.saveReservationProductSeatRules(productId, request),
  });
}
