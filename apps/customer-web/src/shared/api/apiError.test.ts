import { PublicApiError, toCustomerApiErrorMessage } from "./apiError";

describe("toCustomerApiErrorMessage", () => {
  it("maps backend validation errors to customer-facing copy", () => {
    const error = new PublicApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "요청 값이 유효하지 않습니다.",
      traceId: "trace-1",
    });

    expect(toCustomerApiErrorMessage(error)).toBe(
      "입력한 예약 정보를 다시 확인해 주세요. 추적 ID: trace-1",
    );
  });

  it("keeps a recovery path for network failures", () => {
    expect(toCustomerApiErrorMessage(new TypeError("fetch failed"))).toBe(
      "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
    );
  });
});
