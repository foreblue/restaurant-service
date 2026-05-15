import {
  type RestaurantSettingsResponse,
  type RestaurantSettingsUpdateRequest,
} from "@/shared/api/businessApiClient";

import { type StoreSettingsFormValues } from "@/features/store/storeSettingsSchema";

export const emptyStoreSettingsValues: StoreSettingsFormValues = {
  name: "",
  description: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  cuisineTypesCsv: "",
  coverImageFileId: null,
  coverImageFilename: "",
};

export function toStoreSettingsFormValues(
  restaurant: RestaurantSettingsResponse | null,
): StoreSettingsFormValues {
  if (!restaurant) {
    return emptyStoreSettingsValues;
  }

  return {
    name: restaurant.name ?? "",
    description: restaurant.description ?? "",
    phone: restaurant.phone ?? "",
    addressLine1: restaurant.addressLine1 ?? "",
    addressLine2: restaurant.addressLine2 ?? "",
    postalCode: restaurant.postalCode ?? "",
    cuisineTypesCsv: restaurant.cuisineTypes.join(", "),
    coverImageFileId: restaurant.coverImageFileId,
    coverImageFilename: restaurant.coverImageFileId ? `파일 ID ${restaurant.coverImageFileId}` : "",
  };
}

export function toStoreSettingsUpdateRequest(
  values: StoreSettingsFormValues,
): RestaurantSettingsUpdateRequest {
  return {
    name: blankToNull(values.name),
    description: blankToNull(values.description),
    phone: blankToNull(values.phone),
    addressLine1: blankToNull(values.addressLine1),
    addressLine2: blankToNull(values.addressLine2),
    postalCode: blankToNull(values.postalCode),
    cuisineTypes: (values.cuisineTypesCsv ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    coverImageFileId: values.coverImageFileId ?? null,
  };
}

function blankToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
