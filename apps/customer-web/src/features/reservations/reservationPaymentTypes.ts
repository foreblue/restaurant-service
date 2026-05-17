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

export type PublicRefundStatus = "CANCELLED" | "FAILED" | "PENDING" | "REQUESTED" | "SUCCEEDED";

export type PublicRefundReason =
  | "ADMIN_ADJUSTMENT"
  | "CUSTOMER_CANCEL"
  | "NO_SHOW_ADJUSTMENT"
  | "RESTAURANT_CANCEL";

export interface PublicPaymentSummaryResponse {
  reservationId: number;
  paymentMode: ReservationPaymentMode;
  paymentStatus: PublicPaymentStatus;
  paymentRequired: boolean;
  amount: number;
  currency: string;
  paymentDueAt: string | null;
  cancellationPolicySummary: string | null;
}

export interface PublicRefundPreviewResponse {
  reservationId: number;
  paymentId: number | null;
  paymentStatus: PublicPaymentStatus;
  refundRequired: boolean;
  refundableAmount: number;
  nonRefundableAmount: number;
  alreadyRefundedAmount: number;
  paidAmount: number;
  currency: string;
  policyRuleId: string | null;
  reason: PublicRefundReason;
  message: string;
}

export interface PublicRefundOperationResponse {
  refundId: number | null;
  paymentId: number | null;
  status: PublicRefundStatus | null;
  paymentStatus: PublicPaymentStatus;
  refundRequired: boolean;
  refundAmount: number;
  nonRefundableAmount: number;
  alreadyRefundedAmount: number;
  currency: string;
  policyRuleId: string | null;
  reason: PublicRefundReason;
  message: string;
  failureCode?: string | null;
  failureMessage?: string | null;
  manualResolved?: boolean;
}
