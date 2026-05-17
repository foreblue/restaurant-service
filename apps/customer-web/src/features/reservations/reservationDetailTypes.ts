import { type PublicReservationStatus } from "./reservationCreateTypes";
import { type PublicRefundOperationResponse } from "./reservationPaymentTypes";

export interface PublicReservationCancelRequest {
  reason?: string | null;
  confirmRefundAmount?: number | null;
}

export interface PublicReservationDetailResponse {
  id: number;
  reservationNumber: string;
  status: PublicReservationStatus;
  restaurantId: number;
  restaurantName: string | null;
  productId: number;
  productName: string;
  customerId: number;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerName: string;
  customerPhoneLast4: string;
  customerRequest: string | null;
  customerEmail: string | null;
  allergyNote: string | null;
  anniversaryType: string | null;
  anniversaryDate: string | null;
  requestTemplateValues: string[];
  marketingOptIn: boolean;
  cancelable: boolean;
  cancelDeadline: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  refund: PublicRefundOperationResponse | null;
}
