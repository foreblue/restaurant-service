import { type PublicPaymentAction } from "./reservationPaymentTypes";

export async function runReservationPaymentAction(action: PublicPaymentAction) {
  const { runPaymentAction } = await import("./reservationPaymentActionRunner");

  return runPaymentAction(action);
}
