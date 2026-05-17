import { PublicApiError } from "@/shared/api/apiError";

import { buildCustomerErrorReport, reportClientError } from "./customerErrorReporting";

describe("buildCustomerErrorReport", () => {
  it("includes API trace fields for backend errors", () => {
    const payload = buildCustomerErrorReport(
      new PublicApiError({
        code: "RESERVATION_CONFLICT",
        message: "conflict",
        status: 409,
        traceId: "trace-409",
      }),
      { source: "query", queryKey: ["availability"] },
      {
        now: () => new Date("2026-05-17T03:00:00.000Z"),
        release: "test-release",
        url: "https://customer.example.com/r/demo",
        userAgent: "vitest",
      },
    );

    expect(payload).toMatchObject({
      code: "RESERVATION_CONFLICT",
      context: { source: "query", queryKey: ["availability"] },
      message: "conflict",
      occurredAt: "2026-05-17T03:00:00.000Z",
      release: "test-release",
      status: 409,
      traceId: "trace-409",
      url: "https://customer.example.com/r/demo",
      userAgent: "vitest",
    });
  });
});

describe("reportClientError", () => {
  it("skips reporting when no endpoint is configured", async () => {
    await expect(
      reportClientError(new Error("boom"), { source: "window.error" }, { endpoint: null }),
    ).resolves.toBe(false);
  });

  it("posts the normalized payload to the configured endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));

    await expect(
      reportClientError(
        new Error("boom"),
        { source: "window.error" },
        {
          endpoint: "https://events.example.com/customer",
          fetcher,
          now: () => new Date("2026-05-17T03:00:00.000Z"),
          release: "test-release",
          url: "https://customer.example.com/r/demo",
          userAgent: "vitest",
        },
      ),
    ).resolves.toBe(true);

    expect(fetcher).toHaveBeenCalledWith(
      "https://events.example.com/customer",
      expect.objectContaining({
        body: expect.stringContaining('"message":"boom"'),
        keepalive: true,
        method: "POST",
      }),
    );
  });
});
