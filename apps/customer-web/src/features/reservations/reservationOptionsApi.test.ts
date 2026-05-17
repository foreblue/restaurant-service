import { createPublicApiClient } from "@/shared/api/publicApiClient";

import {
  getAvailabilityDates,
  getAvailabilityTimes,
  getPublicReservationProducts,
} from "./reservationOptionsApi";

describe("reservationOptionsApi", () => {
  it("requests public reservation products", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ products: [] }));
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getPublicReservationProducts(15, client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/restaurants/15/reservation-products",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requests available dates with product and party size", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ dates: [] }));
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getAvailabilityDates({ partySize: 2, productId: 10, restaurantId: 15 }, client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/restaurants/15/availability/dates?productId=10&partySize=2",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requests available times with selected date", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ times: [] }));
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getAvailabilityTimes(
      { date: "2026-05-18", partySize: 2, productId: 10, restaurantId: 15 },
      client,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/restaurants/15/availability/times?productId=10&date=2026-05-18&partySize=2",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
