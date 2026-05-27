import { createPublicApiClient } from "@/shared/api/publicApiClient";

import { cancelPublicReservation, getPublicReservationDetail } from "./reservationDetailApi";

describe("reservationDetailApi", () => {
  it("gets reservation detail with a lookup token", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 300 }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getPublicReservationDetail(300, { lookupToken: "lookup-token" }, client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/reservations/300",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-reservation-lookup-token": "lookup-token",
        }),
        method: "GET",
      }),
    );
  });

  it("posts a cancellation request with reason and lookup token", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 300, status: "CANCELLED_BY_CUSTOMER" }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await cancelPublicReservation(
      300,
      { lookupToken: "lookup-token" },
      { reason: "일정 변경" },
      client,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/reservations/300/cancel",
      expect.objectContaining({
        body: JSON.stringify({ reason: "일정 변경" }),
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-reservation-lookup-token": "lookup-token",
        }),
        method: "POST",
      }),
    );
  });

  it("gets reservation detail with a member id", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 300 }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getPublicReservationDetail(300, { memberId: 1 }, client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/reservations/300?memberId=1",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });
});
