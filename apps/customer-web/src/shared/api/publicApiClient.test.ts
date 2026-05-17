import { PublicApiError } from "./apiError";
import { createPublicApiClient } from "./publicApiClient";

describe("createPublicApiClient", () => {
  it("sends JSON requests with lookup token and idempotency headers", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await client.post("/api/public/reservations", {
      body: { name: "예약자" },
      idempotencyKey: "request-1",
      lookupToken: "lookup-token",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/reservations",
      expect.objectContaining({
        body: JSON.stringify({ name: "예약자" }),
        headers: expect.objectContaining({
          "content-type": "application/json",
          "idempotency-key": "request-1",
          "x-reservation-lookup-token": "lookup-token",
        }),
        method: "POST",
      }),
    );
  });

  it("throws typed API errors with backend trace id", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "NOT_FOUND",
          message: "요청한 리소스를 찾을 수 없습니다.",
          traceId: "trace-404",
        }),
        {
          headers: { "content-type": "application/json" },
          status: 404,
        },
      ),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await expect(client.get("/api/public/reservations/1")).rejects.toMatchObject<
      Partial<PublicApiError>
    >({
      code: "NOT_FOUND",
      status: 404,
      traceId: "trace-404",
    });
  });
});
