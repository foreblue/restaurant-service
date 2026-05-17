import { getCustomerWebEnv } from "./env";

describe("getCustomerWebEnv", () => {
  it("uses local defaults when public env values are missing", () => {
    expect(getCustomerWebEnv({})).toEqual({
      apiBaseUrl: "http://localhost:8080",
      appBaseUrl: "http://localhost:3000",
      errorReportingEndpoint: null,
      release: "local",
    });
  });

  it("normalizes observability env values", () => {
    expect(
      getCustomerWebEnv({
        NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT: "https://events.example.com/customer/",
        NEXT_PUBLIC_RELEASE: "customer-web@2026.05.17",
      }),
    ).toMatchObject({
      errorReportingEndpoint: "https://events.example.com/customer",
      release: "customer-web@2026.05.17",
    });
  });

  it("rejects invalid URLs early", () => {
    expect(() => getCustomerWebEnv({ NEXT_PUBLIC_API_BASE_URL: "not-a-url" })).toThrow(
      "사용자 FE 환경 변수가 올바르지 않습니다.",
    );
  });
});
