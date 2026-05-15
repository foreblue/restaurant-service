import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type BusinessAuditLogListQuery,
  type BusinessManualReservationCreateRequest,
  type BusinessReservationOperationNoteRequest,
  type BusinessReservationCancelRequest,
  type BusinessReservationCalendarQuery,
  type BusinessReservationListQuery,
  type BusinessReservationDetailResponse,
  type BusinessReservationNoShowRequest,
  type BusinessReservationUpdateRequest,
} from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const businessReservationsQueryKey = ["business", "reservations"] as const;
export const businessAuditLogsQueryKey = ["business", "audit-logs"] as const;
export const businessReservationRefundPreviewQueryKey = [
  "business",
  "reservation-refund-preview",
] as const;

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

export function useBusinessReservationRefundPreviewQuery(
  reservationId: number | null,
  enabled = true,
) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessReservationRefundPreviewQueryKey, reservationId],
    queryFn: () => apiClient.getBusinessReservationRefundPreview(reservationId ?? 0),
    enabled: enabled && reservationId !== null,
  });
}

export function useBusinessAuditLogsQuery(query: BusinessAuditLogListQuery, enabled = true) {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: [...businessAuditLogsQueryKey, query],
    queryFn: () => apiClient.listBusinessAuditLogs(query),
    enabled,
  });
}

export function useCreateManualBusinessReservationMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BusinessManualReservationCreateRequest) =>
      apiClient.createManualBusinessReservation(request),
    onSuccess: (reservation) => applyReservationMutationSuccess(queryClient, reservation),
  });
}

export function useUpdateBusinessReservationMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      request,
    }: {
      reservationId: number;
      request: BusinessReservationUpdateRequest;
    }) => apiClient.updateBusinessReservation(reservationId, request),
    onSuccess: (reservation) => applyReservationMutationSuccess(queryClient, reservation),
  });
}

export function useCancelBusinessReservationMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      request,
    }: {
      reservationId: number;
      request: BusinessReservationCancelRequest;
    }) => apiClient.cancelBusinessReservation(reservationId, request),
    onSuccess: (reservation) => applyReservationMutationSuccess(queryClient, reservation),
  });
}

export function useCompleteBusinessReservationMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: number) => apiClient.completeBusinessReservation(reservationId),
    onSuccess: (reservation) => applyReservationMutationSuccess(queryClient, reservation),
  });
}

export function useMarkBusinessReservationNoShowMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      request,
    }: {
      reservationId: number;
      request: BusinessReservationNoShowRequest;
    }) => apiClient.markBusinessReservationNoShow(reservationId, request),
    onSuccess: (reservation) => applyReservationMutationSuccess(queryClient, reservation),
  });
}

export function useUpdateBusinessReservationOperationNoteMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      request,
    }: {
      reservationId: number;
      request: BusinessReservationOperationNoteRequest;
    }) => apiClient.updateBusinessReservationOperationNote(reservationId, request),
    onSuccess: (reservation) => {
      applyReservationMutationSuccess(queryClient, reservation);
      queryClient.invalidateQueries({ queryKey: businessAuditLogsQueryKey });
    },
  });
}

function applyReservationMutationSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  reservation: BusinessReservationDetailResponse,
) {
  queryClient.invalidateQueries({ queryKey: businessReservationsQueryKey });
  queryClient.setQueryData<BusinessReservationDetailResponse>(
    [...businessReservationsQueryKey, "detail", reservation.id],
    reservation,
  );
}
