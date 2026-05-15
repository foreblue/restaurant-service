import {
  type RestaurantApplicationResponse,
  type RestaurantApplicationSaveRequest,
} from "@/shared/api/businessApiClient";

import { type RestaurantApplicationFormValues } from "@/features/onboarding/restaurantApplicationSchema";

export const emptyRestaurantApplicationValues: RestaurantApplicationFormValues = {
  restaurantName: "",
  restaurantDescription: "",
  restaurantPhone: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  cuisineTypesCsv: "",
  coverImageFileId: null,
  coverImageFilename: "",
  businessRegistrationNo: "",
  businessName: "",
  representativeName: "",
  businessAddress: "",
  businessLicenseFileId: null,
  businessLicenseFilename: "",
  managerName: "",
  managerPhone: "",
  managerEmail: "",
};

export function toFormValues(
  application: RestaurantApplicationResponse | null,
): RestaurantApplicationFormValues {
  if (!application) {
    return emptyRestaurantApplicationValues;
  }

  return {
    restaurantName: application.restaurant.name ?? "",
    restaurantDescription: application.restaurant.description ?? "",
    restaurantPhone: application.restaurant.phone ?? "",
    addressLine1: application.restaurant.addressLine1 ?? "",
    addressLine2: application.restaurant.addressLine2 ?? "",
    postalCode: application.restaurant.postalCode ?? "",
    cuisineTypesCsv: application.restaurant.cuisineTypes.join(", "),
    coverImageFileId: application.restaurant.coverImageFileId,
    coverImageFilename: fileLabel(application.restaurant.coverImageFileId),
    businessRegistrationNo: application.businessRegistrationNo ?? "",
    businessName: application.businessName ?? "",
    representativeName: application.representativeName ?? "",
    businessAddress: application.businessAddress ?? "",
    businessLicenseFileId: application.businessLicenseFileId,
    businessLicenseFilename: fileLabel(application.businessLicenseFileId),
    managerName: application.managerName ?? "",
    managerPhone: application.managerPhone ?? "",
    managerEmail: application.managerEmail ?? "",
  };
}

interface SaveRequestOptions {
  contactVerified?: boolean;
}

export function toSaveRequest(
  values: RestaurantApplicationFormValues,
  options: SaveRequestOptions = {},
): RestaurantApplicationSaveRequest {
  return {
    restaurantName: blankToNull(values.restaurantName),
    restaurantDescription: blankToNull(values.restaurantDescription),
    restaurantPhone: blankToNull(values.restaurantPhone),
    addressLine1: blankToNull(values.addressLine1),
    addressLine2: blankToNull(values.addressLine2),
    postalCode: blankToNull(values.postalCode),
    cuisineTypes: (values.cuisineTypesCsv ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    coverImageFileId: values.coverImageFileId ?? null,
    businessRegistrationNo: blankToNull(values.businessRegistrationNo),
    businessName: blankToNull(values.businessName),
    representativeName: blankToNull(values.representativeName),
    businessAddress: blankToNull(values.businessAddress),
    businessLicenseFileId: values.businessLicenseFileId ?? null,
    managerName: blankToNull(values.managerName),
    managerPhone: blankToNull(values.managerPhone),
    managerEmail: blankToNull(values.managerEmail),
    ...(options.contactVerified !== undefined ? { contactVerified: options.contactVerified } : {}),
  };
}

function blankToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function fileLabel(fileId: number | null) {
  return fileId ? `파일 ID ${fileId}` : "";
}
