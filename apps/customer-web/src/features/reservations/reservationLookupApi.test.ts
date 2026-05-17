import { createPublicApiClient } from "@/shared/api/publicApiClient";

import { issueReservationLookupToken } from "./reservationLookupApi";

describe("reservationLookupApi", () => {
  it("posts reservation number and phone number to issue a lookup token", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ reservationId: 300, lookupToken: "lookup-token" }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await issueReservationLookupToken(
      {
        phoneNumber: "01012345678",
        reservationNumber: "RSV-20260518-0001",
      },
      client,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/reservation-lookup-tokens",
      expect.objectContaining({
        body: JSON.stringify({
          phoneNumber: "01012345678",
          reservationNumber: "RSV-20260518-0001",
        }),
        headers: expect.objectContaining({
          "content-type": "application/json",
        }),
        method: "POST",
      }),
    );
  });
});
