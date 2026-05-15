import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ReservationProductCancellationPolicyRequest,
  type ReservationProductPaymentPolicyRequest,
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

export function useUpdateReservationProductPaymentPolicyMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      request,
    }: {
      productId: number;
      request: ReservationProductPaymentPolicyRequest;
    }) => apiClient.updateReservationProductPaymentPolicy(productId, request),
    onSuccess: (policy) => {
      queryClient.setQueryData<ReservationProductResponse[]>(
        reservationProductsQueryKey,
        (current) =>
          (current ?? []).map((product) =>
            product.id === policy.productId
              ? {
                  ...product,
                  paymentPolicyType: policy.paymentMode,
                  paymentAmount: policy.paymentAmount,
                  updatedAt: policy.updatedAt,
                }
              : product,
          ),
      );
    },
  });
}

export function useSaveReservationProductCancellationPolicyMutation() {
  const apiClient = useBusinessApiClient();

  return useMutation({
    mutationFn: ({
      productId,
      request,
    }: {
      productId: number;
      request: ReservationProductCancellationPolicyRequest;
    }) => apiClient.saveReservationProductCancellationPolicy(productId, request),
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
