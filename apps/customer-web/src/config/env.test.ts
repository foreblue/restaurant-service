import { getCustomerWebEnv } from "./env";

describe("getCustomerWebEnv", () => {
  it("uses local defaults when public env values are missing", () => {
    expect(getCustomerWebEnv({})).toEqual({
      apiBaseUrl: "http://localhost:8080",
      appBaseUrl: "http://localhost:3000",
    });
  });

  it("rejects invalid URLs early", () => {
    expect(() => getCustomerWebEnv({ NEXT_PUBLIC_API_BASE_URL: "not-a-url" })).toThrow(
      "사용자 FE 환경 변수가 올바르지 않습니다.",
    );
  });
});
