export interface PublicReservationProductListResponse {
  products: PublicReservationProduct[];
}

export type ReservationProductPaymentPolicyType =
  | "NONE"
  | "FREE"
  | "PAY_ON_SITE"
  | "DEPOSIT"
  | "PREPAID"
  | "CARD_GUARANTEE";

export interface PublicReservationProduct {
  id: number;
  name: string;
  description: string | null;
  displayPrice: number;
  minPartySize: number;
  maxPartySize: number;
  availableDays: string[];
  availableStartTime: string | null;
  availableEndTime: string | null;
  requiresPayment: boolean;
  depositAmount: number;
  paymentPolicyType?: ReservationProductPaymentPolicyType;
  paymentAmount?: number | null;
}

export interface AvailabilityDatesResponse {
  restaurantId: number;
  productId: number;
  from: string;
  to: string;
  dates: AvailableDate[];
}

export interface AvailableDate {
  date: string;
  available: boolean;
}

export interface AvailabilityTimesResponse {
  restaurantId: number;
  productId: number;
  date: string;
  times: AvailableTimeSlot[];
}

export interface AvailableTimeSlot {
  timeSlotId: string;
  startTime: string;
  endTime: string;
  remainingCapacity: number;
  available: boolean;
}
