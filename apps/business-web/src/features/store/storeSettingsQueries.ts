import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type BusinessHoursSaveRequest,
  type HolidayRulesSaveRequest,
  type ReservationPageSaveRequest,
  type RestaurantSettingsResponse,
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

export function useSaveBusinessHoursMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      request,
    }: {
      restaurantId: number;
      request: BusinessHoursSaveRequest;
    }) => apiClient.saveBusinessHours(restaurantId, request),
    onSuccess: (businessHours) => {
      queryClient.setQueryData<RestaurantSettingsResponse>(storeSettingsQueryKey, (current) =>
        current ? { ...current, businessHours } : current,
      );
    },
  });
}

export function useSaveHolidayRulesMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      request,
    }: {
      restaurantId: number;
      request: HolidayRulesSaveRequest;
    }) => apiClient.saveHolidayRules(restaurantId, request),
    onSuccess: (holidayRules) => {
      queryClient.setQueryData<RestaurantSettingsResponse>(storeSettingsQueryKey, (current) =>
        current ? { ...current, holidayRules } : current,
      );
    },
  });
}

export function useUpdateReservationPageMutation() {
  const apiClient = useBusinessApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      request,
    }: {
      restaurantId: number;
      request: ReservationPageSaveRequest;
    }) => apiClient.updateReservationPage(restaurantId, request),
    onSuccess: (reservationPage) => {
      queryClient.setQueryData<RestaurantSettingsResponse>(storeSettingsQueryKey, (current) =>
        current ? { ...current, reservationPage, slug: reservationPage.slug } : current,
      );
    },
  });
}
