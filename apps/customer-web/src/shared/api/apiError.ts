export interface ApiErrorResponse {
  code: string;
  message: string;
  traceId: string;
}

export interface PublicApiErrorInit {
  status: number;
  code: string;
  message: string;
  traceId?: string | null;
}

export class PublicApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly traceId: string | null;

  constructor({ status, code, message, traceId = null }: PublicApiErrorInit) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
    this.code = code;
    this.traceId = traceId;
  }
}

export function isPublicApiError(error: unknown): error is PublicApiError {
  return error instanceof PublicApiError;
}

export function toCustomerApiErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }

  if (!isPublicApiError(error)) {
    return "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }

  const withTraceId = (message: string) => appendTraceId(message, error.traceId);

  if (error.code === "VALIDATION_ERROR" || error.status === 400) {
    return withTraceId("입력한 예약 정보를 다시 확인해 주세요.");
  }

  if (error.status === 401 || error.status === 403) {
    return withTraceId("예약 조회 인증이 만료되었습니다. 다시 인증해 주세요.");
  }

  if (error.status === 404) {
    return withTraceId("예약 정보를 찾을 수 없습니다.");
  }

  if (error.status === 409) {
    return withTraceId("예약 상태가 변경되었습니다. 최신 정보를 다시 확인해 주세요.");
  }

  return withTraceId("요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
}

function appendTraceId(message: string, traceId: string | null) {
  if (!traceId) {
    return message;
  }

  return `${message} 추적 ID: ${traceId}`;
}
