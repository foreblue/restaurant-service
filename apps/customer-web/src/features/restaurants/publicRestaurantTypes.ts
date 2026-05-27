export type ReservationPageStatus = "DISABLED" | "DRAFT" | "PRIVATE" | "PUBLIC";

export interface BusinessHourResponse {
  id: number;
  dayOfWeek: string;
  sequence: number;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
}

export interface HolidayRuleResponse {
  id: number;
  type: string;
  dayOfWeek: string | null;
  dayOfMonth: number | null;
  weekOfMonth: number | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface PublicReservationPageResponse {
  status: ReservationPageStatus;
  publishedAt: string | null;
  publicUrl: string;
  reservationAvailable: boolean;
}

export interface PublicRestaurantResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string | null;
  cuisineTypes: string[];
  coverImageFileId: number | null;
  coverImageUrl?: string | null;
  timezone: string;
  businessHours: BusinessHourResponse[];
  holidayRules: HolidayRuleResponse[];
  reservationPage: PublicReservationPageResponse;
}

export interface PublicRestaurantListResponse {
  restaurants: PublicRestaurantListItem[];
}

export interface PublicRestaurantListItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  cuisineTypes: string[];
  coverImageFileId: number | null;
  coverImageUrl?: string | null;
  publicUrl: string;
  reservationProductCount: number;
  publishedAt: string | null;
}
