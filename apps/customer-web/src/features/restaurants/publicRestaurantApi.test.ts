import { createPublicApiClient } from "@/shared/api/publicApiClient";

import { getPublicRestaurantById, getPublicRestaurantBySlug } from "./publicRestaurantApi";

describe("publicRestaurantApi", () => {
  it("requests a public restaurant by slug", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({
      baseUrl: "http://api.test",
      fetcher,
    });

    await getPublicRestaurantBySlug("cheongdam test", client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/restaurants/cheongdam%20test",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requests a public restaurant by id", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getPublicRestaurantById("15", client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/restaurants/15/reservation-page",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
