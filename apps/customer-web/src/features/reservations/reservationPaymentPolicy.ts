import { type PublicReservationProduct } from "./reservationOptionsTypes";

export type ReservationPaymentStep = "cardGuarantee" | "payNow" | "reserveOnly";
export type ReservationPaymentMode =
  | "CARD_GUARANTEE"
  | "DEPOSIT"
  | "FREE"
  | "PAY_ON_SITE"
  | "PREPAID";

export interface ReservationPaymentPolicyView {
  amountLabel: string | null;
  description: string;
  label: string;
  paymentMode: ReservationPaymentMode;
  nextStep: ReservationPaymentStep;
  nextStepLabel: string;
  summary: string;
}

export function getReservationPaymentPolicyView(
  product: PublicReservationProduct,
): ReservationPaymentPolicyView {
  const policyType = product.paymentPolicyType ?? legacyPaymentPolicyType(product);
  const amount = product.paymentAmount ?? product.depositAmount;

  switch (policyType) {
    case "DEPOSIT":
      return {
        amountLabel: formatCurrency(amount),
        description: "예약 후 예약금을 결제해야 예약이 유지됩니다.",
        label: "예약금",
        paymentMode: "DEPOSIT",
        nextStep: "payNow",
        nextStepLabel: "예약 후 예약금 결제",
        summary: `${formatCurrency(amount)} 예약금 결제 필요`,
      };
    case "PREPAID":
      return {
        amountLabel: formatCurrency(amount || product.displayPrice),
        description: "예약 후 식사 금액을 선결제하는 상품입니다.",
        label: "선결제",
        paymentMode: "PREPAID",
        nextStep: "payNow",
        nextStepLabel: "예약 후 선결제",
        summary: `${formatCurrency(amount || product.displayPrice)} 선결제 필요`,
      };
    case "CARD_GUARANTEE":
      return {
        amountLabel: null,
        description: "예약 후 노쇼 방지를 위한 카드 보증 등록이 필요합니다.",
        label: "카드 보증",
        paymentMode: "CARD_GUARANTEE",
        nextStep: "cardGuarantee",
        nextStepLabel: "예약 후 카드 보증 등록",
        summary: "카드 보증 등록 필요",
      };
    case "PAY_ON_SITE":
      return onsitePaymentView();
    case "FREE":
      return freeReservationView();
    case "NONE":
    default:
      return product.displayPrice > 0 ? onsitePaymentView() : freeReservationView();
  }
}

export function getReservationSubmitLabel(policy: ReservationPaymentPolicyView) {
  if (policy.nextStep === "cardGuarantee") {
    return "예약 후 보증 등록";
  }

  if (policy.nextStep === "payNow") {
    return "예약 후 결제 진행";
  }

  return "예약 완료";
}

function legacyPaymentPolicyType(product: PublicReservationProduct) {
  if (!product.requiresPayment) {
    return product.displayPrice > 0 ? "PAY_ON_SITE" : "FREE";
  }

  return product.depositAmount > 0 ? "DEPOSIT" : "CARD_GUARANTEE";
}

function onsitePaymentView(): ReservationPaymentPolicyView {
  return {
    amountLabel: null,
    description: "방문 당일 매장에서 결제합니다.",
    label: "현장 결제",
    paymentMode: "PAY_ON_SITE",
    nextStep: "reserveOnly",
    nextStepLabel: "예약 접수 후 방문 결제",
    summary: "현장 결제",
  };
}

function freeReservationView(): ReservationPaymentPolicyView {
  return {
    amountLabel: null,
    description: "온라인 결제 없이 예약을 접수합니다.",
    label: "무료 예약",
    paymentMode: "FREE",
    nextStep: "reserveOnly",
    nextStepLabel: "예약 접수",
    summary: "온라인 결제 없음",
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    currency: "KRW",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}
