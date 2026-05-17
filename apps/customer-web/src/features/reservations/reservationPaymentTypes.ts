import { type ReservationPaymentMode } from "./reservationPaymentPolicy";

export type PublicPaymentStatus =
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED"
  | "GUARANTEE_CHARGE_FAILED"
  | "GUARANTEE_CHARGE_PENDING"
  | "GUARANTEE_CHARGED"
  | "GUARANTEE_REGISTERED"
  | "NOT_REQUIRED"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "PAY_ON_SITE"
  | "PENDING"
  | "REFUND_FAILED"
  | "REFUNDED"
  | "REQUIRES_PAYMENT";

export interface PublicPaymentAction {
  type: string;
  url: string;
}

export interface PublicPaymentStartResponse {
  paymentId: number;
  status: PublicPaymentStatus;
  amount: number;
  currency: string;
  paymentAction: PublicPaymentAction | null;
  expiresAt: string | null;
}

export interface PublicGuaranteeStartResponse {
  paymentId: number;
  status: PublicPaymentStatus;
  guaranteeAction: PublicPaymentAction | null;
  expiresAt: string | null;
}

export interface PublicPaymentStartRequest {
  paymentMode: ReservationPaymentMode;
  returnUrl: string;
  idempotencyKey: string;
}

export interface PublicGuaranteeStartRequest {
  returnUrl: string;
  idempotencyKey: string;
}
