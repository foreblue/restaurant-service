import { createPublicApiClient } from "@/shared/api/publicApiClient";

import {
  createReservationPaymentReturnUrl,
  startReservationGuarantee,
  startReservationPayment,
} from "./reservationPaymentApi";

describe("reservationPaymentApi", () => {
  it("starts a payment with lookup token and idempotency key", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ paymentId: 1, status: "PENDING" }), {
        headers: { "content-type": "application/json" },
        status: 201,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await startReservationPayment(
      300,
      "lookup-token",
      {
        idempotencyKey: "payment-key",
        paymentMode: "DEPOSIT",
        returnUrl: "https://app.test/reservations/300?token=lookup-token",
      },
      client,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/reservations/300/payments",
      expect.objectContaining({
        body: expect.stringContaining('"paymentMode":"DEPOSIT"'),
        headers: expect.objectContaining({
          "idempotency-key": "payment-key",
          "x-reservation-lookup-token": "lookup-token",
        }),
        method: "POST",
      }),
    );
  });

  it("starts a card guarantee registration", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ paymentId: 2, status: "PENDING" }), {
        headers: { "content-type": "application/json" },
        status: 201,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await startReservationGuarantee(
      300,
      "lookup-token",
      {
        idempotencyKey: "guarantee-key",
        returnUrl: "https://app.test/reservations/300?token=lookup-token",
      },
      client,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/reservations/300/guarantee",
      expect.objectContaining({
        headers: expect.objectContaining({
          "idempotency-key": "guarantee-key",
          "x-reservation-lookup-token": "lookup-token",
        }),
        method: "POST",
      }),
    );
  });

  it("creates a reservation detail return URL with lookup token", () => {
    expect(
      createReservationPaymentReturnUrl({
        lookupToken: "lookup-token",
        origin: "https://app.test",
        reservationId: 300,
      }),
    ).toBe("https://app.test/reservations/300?token=lookup-token");
  });
});
