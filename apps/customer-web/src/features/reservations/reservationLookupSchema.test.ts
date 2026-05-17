import { reservationLookupSchema } from "./reservationLookupSchema";

describe("reservationLookupSchema", () => {
  it("normalizes reservation lookup form values", () => {
    expect(
      reservationLookupSchema.parse({
        phoneNumber: "010-1234-5678",
        reservationNumber: " RSV-20260518-0001 ",
      }),
    ).toEqual({
      phoneNumber: "01012345678",
      reservationNumber: "RSV-20260518-0001",
    });
  });

  it("rejects invalid phone numbers", () => {
    expect(() =>
      reservationLookupSchema.parse({
        phoneNumber: "1234",
        reservationNumber: "RSV-20260518-0001",
      }),
    ).toThrow();
  });
});
