import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { businessReservationsQueryKey } from "@/features/reservations/reservationOperationsQueries";
import {
  type BusinessCustomerAnonymizeRequest,
  type BusinessCustomerFlagsSaveRequest,
  type BusinessCustomerListQuery,
  type BusinessCustomerMergeRequest,
  type BusinessCustomerNoteSaveRequest,
} from "@/shared/api/businessApiClient";
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

export function useBusinessCustomerDuplicateCandidatesQuery() {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessCustomersQueryKey, "duplicates"],
    queryFn: () => apiClient.listBusinessCustomerDuplicateCandidates(),
  });
}

export function useCreateBusinessCustomerNoteMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      request,
    }: {
      customerId: number;
      request: BusinessCustomerNoteSaveRequest;
    }) => apiClient.createBusinessCustomerNote(customerId, request),
    onSuccess: () => invalidateCustomerCrmQueries(queryClient),
  });
}

export function useUpdateBusinessCustomerNoteMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      request,
    }: {
      noteId: number;
      request: BusinessCustomerNoteSaveRequest;
    }) => apiClient.updateBusinessCustomerNote(noteId, request),
    onSuccess: () => invalidateCustomerCrmQueries(queryClient),
  });
}

export function useDeleteBusinessCustomerNoteMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: number) => apiClient.deleteBusinessCustomerNote(noteId),
    onSuccess: () => invalidateCustomerCrmQueries(queryClient),
  });
}

export function useUpdateBusinessCustomerFlagsMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      request,
    }: {
      customerId: number;
      request: BusinessCustomerFlagsSaveRequest;
    }) => apiClient.updateBusinessCustomerFlags(customerId, request),
    onSuccess: () => {
      invalidateCustomerCrmQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: businessReservationsQueryKey });
    },
  });
}

export function useRequestBusinessCustomerAnonymizeMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      request,
    }: {
      customerId: number;
      request: BusinessCustomerAnonymizeRequest;
    }) => apiClient.requestBusinessCustomerAnonymize(customerId, request),
    onSuccess: () => invalidateCustomerCrmQueries(queryClient),
  });
}

export function useMergeBusinessCustomersMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BusinessCustomerMergeRequest) =>
      apiClient.mergeBusinessCustomers(request),
    onSuccess: () => {
      invalidateCustomerCrmQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: businessReservationsQueryKey });
    },
  });
}

function invalidateCustomerCrmQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: businessCustomersQueryKey });
}
