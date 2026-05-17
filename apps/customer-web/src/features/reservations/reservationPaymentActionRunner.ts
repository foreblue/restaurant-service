import { type PublicPaymentAction } from "./reservationPaymentTypes";

export interface PaymentActionRunResult {
  status: "redirecting";
}

export async function runPaymentAction(
  action: PublicPaymentAction,
): Promise<PaymentActionRunResult> {
  if (action.type !== "REDIRECT") {
    throw new Error("지원하지 않는 결제 액션입니다.");
  }

  window.location.assign(action.url);

  return { status: "redirecting" };
}
