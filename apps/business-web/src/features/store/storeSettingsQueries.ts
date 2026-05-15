import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type RestaurantSettingsUpdateRequest,
  type BusinessFilePurpose,
} from "@/shared/api/businessApiClient";
import { useBusinessApiClient } from "@/shared/api/useBusinessApiClient";

export const storeSettingsQueryKey = ["business", "store-settings"] as const;

export function useStoreSettingsQuery() {
  const apiClient = useBusinessApiClient();

  return useQuery({
    queryKey: storeSettingsQueryKey,
    queryFn: () => apiClient.getCurrentRestaurant(),
  });
}

export function useUpdateStoreSettingsMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      request,
    }: {
      restaurantId: number;
      request: RestaurantSettingsUpdateRequest;
    }) => apiClient.updateRestaurant(restaurantId, request),
    onSuccess: (restaurant) => {
      queryClient.setQueryData(storeSettingsQueryKey, restaurant);
    },
  });
}

export function useUploadStoreFileMutation() {
  const apiClient = useBusinessApiClient();

  return useMutation({
    mutationFn: ({ purpose, file }: { purpose: BusinessFilePurpose; file: File }) =>
      apiClient.uploadBusinessFile(purpose, file),
  });
}
