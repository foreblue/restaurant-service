import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";
import { type RestaurantApplicationSaveRequest } from "@/shared/api/businessApiClient";

export const restaurantApplicationQueryKey = ["business", "restaurant-application"] as const;

export function useRestaurantApplicationQuery() {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: restaurantApplicationQueryKey,
    queryFn: () => apiClient.getCurrentRestaurantApplication(),
  });
}

export function useCreateRestaurantApplicationMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RestaurantApplicationSaveRequest) =>
      apiClient.createRestaurantApplication(request),
    onSuccess: (application) => {
      queryClient.setQueryData(restaurantApplicationQueryKey, application);
    },
  });
}

export function useUpdateRestaurantApplicationMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      request,
    }: {
      applicationId: number;
      request: RestaurantApplicationSaveRequest;
    }) => apiClient.updateRestaurantApplication(applicationId, request),
    onSuccess: (application) => {
      queryClient.setQueryData(restaurantApplicationQueryKey, application);
    },
  });
}
