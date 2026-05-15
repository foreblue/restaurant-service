import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ReservationProductResponse,
  type ReservationProductSaveRequest,
} from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const reservationProductsQueryKey = ["business", "reservation-products"] as const;

export function useReservationProductsQuery() {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: reservationProductsQueryKey,
    queryFn: () => apiClient.listReservationProducts(),
  });
}

export function useCreateReservationProductMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ReservationProductSaveRequest) =>
      apiClient.createReservationProduct(request),
    onSuccess: (product) => {
      queryClient.setQueryData<ReservationProductResponse[]>(
        reservationProductsQueryKey,
        (current) => sortReservationProducts([...(current ?? []), product]),
      );
    },
  });
}

export function useUpdateReservationProductMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      request,
    }: {
      productId: number;
      request: ReservationProductSaveRequest;
    }) => apiClient.updateReservationProduct(productId, request),
    onSuccess: (product) => {
      queryClient.setQueryData<ReservationProductResponse[]>(
        reservationProductsQueryKey,
        (current) =>
          sortReservationProducts(
            (current ?? []).map((item) => (item.id === product.id ? product : item)),
          ),
      );
    },
  });
}

export function useDeleteReservationProductMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => apiClient.deleteReservationProduct(productId),
    onSuccess: (_result, productId) => {
      queryClient.setQueryData<ReservationProductResponse[]>(
        reservationProductsQueryKey,
        (current) => (current ?? []).filter((product) => product.id !== productId),
      );
    },
  });
}

function sortReservationProducts(products: ReservationProductResponse[]) {
  return [...products].sort((a, b) => {
    const createdAtDiff = timestamp(b.createdAt) - timestamp(a.createdAt);

    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return b.id - a.id;
  });
}

function timestamp(value: string | null) {
  return value ? Date.parse(value) || 0 : 0;
}
