import { createPublicApiClient } from "@/shared/api/publicApiClient";

import { getPublicMemberReservations } from "./memberReservationApi";

describe("memberReservationApi", () => {
  it("gets reservations for a member", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ reservations: [] }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getPublicMemberReservations(1, client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/members/1/reservations",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });
});
