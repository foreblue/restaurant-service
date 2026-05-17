import {
  getReservationPaymentPolicyView,
  getReservationSubmitLabel,
} from "./reservationPaymentPolicy";
import { type PublicReservationProduct } from "./reservationOptionsTypes";

const baseProduct: PublicReservationProduct = {
  id: 10,
  name: "디너 코스",
  description: null,
  displayPrice: 80000,
  minPartySize: 2,
  maxPartySize: 4,
  availableDays: ["FRIDAY"],
  availableStartTime: "18:00",
  availableEndTime: "21:00",
  requiresPayment: false,
  depositAmount: 0,
  paymentPolicyType: "FREE",
  paymentAmount: null,
};

describe("reservationPaymentPolicy", () => {
  it.each([
    ["FREE", null, "무료 예약", "온라인 결제 없음", "예약 완료"],
    ["PAY_ON_SITE", null, "현장 결제", "현장 결제", "예약 완료"],
    ["NONE", null, "현장 결제", "현장 결제", "예약 완료"],
    ["DEPOSIT", 10000, "예약금", "₩10,000 예약금 결제 필요", "예약 후 결제 진행"],
    ["PREPAID", 80000, "선결제", "₩80,000 선결제 필요", "예약 후 결제 진행"],
    ["CARD_GUARANTEE", null, "카드 보증", "카드 보증 등록 필요", "예약 후 보증 등록"],
  ] as const)(
    "maps %s to customer-facing payment copy",
    (paymentPolicyType, paymentAmount, label, summary, submitLabel) => {
      const view = getReservationPaymentPolicyView({
        ...baseProduct,
        paymentAmount,
        paymentPolicyType,
        requiresPayment: paymentPolicyType !== "FREE" && paymentPolicyType !== "PAY_ON_SITE",
      });

      expect(view.label).toBe(label);
      expect(view.summary).toBe(summary);
      expect(getReservationSubmitLabel(view)).toBe(submitLabel);
    },
  );

  it("maps a zero-priced unconfigured product to free reservation copy", () => {
    const view = getReservationPaymentPolicyView({
      ...baseProduct,
      displayPrice: 0,
      paymentPolicyType: "NONE",
    });

    expect(view.label).toBe("무료 예약");
    expect(view.summary).toBe("온라인 결제 없음");
  });
});
