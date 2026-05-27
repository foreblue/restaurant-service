import { type PublicReservationStatus } from "./reservationCreateTypes";
import { type ReservationPaymentMode } from "./reservationPaymentPolicy";
import { type PublicPaymentStatus } from "./reservationPaymentTypes";

export interface PublicMemberReservationListResponse {
  reservations: PublicMemberReservationItem[];
}

export interface PublicMemberReservationItem {
  id: number;
  reservationNumber: string;
  status: PublicReservationStatus;
  restaurantId: number;
  restaurantName: string | null;
  productId: number;
  productName: string;
  memberId: number;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  paymentRequired: boolean;
  paymentMode: ReservationPaymentMode;
  paymentStatus: PublicPaymentStatus;
  cancelable: boolean;
}
