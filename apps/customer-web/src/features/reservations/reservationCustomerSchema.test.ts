import { reservationCustomerSchema } from "./reservationCustomerSchema";

describe("reservationCustomerSchema", () => {
  it("normalizes optional and formatted customer fields", () => {
    expect(
      reservationCustomerSchema.parse({
        customerName: " 홍길동 ",
        email: "",
        marketingConsent: false,
        phoneNumber: "010-1234-5678",
        privacyConsent: true,
        requestNotes: "",
      }),
    ).toEqual({
      customerName: "홍길동",
      email: null,
      marketingConsent: false,
      phoneNumber: "01012345678",
      privacyConsent: true,
      requestNotes: null,
    });
  });
});
