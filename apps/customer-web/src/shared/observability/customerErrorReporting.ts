import { customerWebEnv } from "@/config/env";
import { isPublicApiError } from "@/shared/api/apiError";

export interface CustomerErrorReportContext {
  queryKey?: unknown;
  source: string;
  [key: string]: unknown;
}

export interface CustomerErrorReportPayload {
  code?: string;
  context: CustomerErrorReportContext;
  message: string;
  name: string;
  occurredAt: string;
  release: string;
  stack?: string;
  status?: number;
  traceId?: string;
  url: string;
  userAgent: string;
}

interface ReportClientErrorOptions {
  beacon?: Pick<Navigator, "sendBeacon"> | null;
  endpoint?: string | null;
  fetcher?: typeof fetch;
  now?: () => Date;
  release?: string;
  url?: string;
  userAgent?: string;
}

export async function reportClientError(
  error: unknown,
  context: CustomerErrorReportContext,
  options: ReportClientErrorOptions = {},
) {
  const endpoint = options.endpoint ?? customerWebEnv.errorReportingEndpoint;

  if (!endpoint) {
    return false;
  }

  const payload = buildCustomerErrorReport(error, context, options);
  const body = JSON.stringify(payload);
  const beacon = options.beacon ?? browserBeacon();

  if (beacon?.sendBeacon?.(endpoint, new Blob([body], { type: "application/json" }))) {
    return true;
  }

  const fetcher = options.fetcher ?? fetch;
  await fetcher(endpoint, {
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
  });

  return true;
}

export function buildCustomerErrorReport(
  error: unknown,
  context: CustomerErrorReportContext,
  options: ReportClientErrorOptions = {},
): CustomerErrorReportPayload {
  const normalized = normalizeError(error);

  return {
    ...normalized,
    ...apiErrorFields(error),
    context,
    occurredAt: (options.now?.() ?? new Date()).toISOString(),
    release: options.release ?? customerWebEnv.release,
    url: options.url ?? browserUrl(),
    userAgent: options.userAgent ?? browserUserAgent(),
  };
}

function apiErrorFields(error: unknown) {
  if (!isPublicApiError(error)) {
    return {};
  }

  return {
    code: error.code,
    status: error.status,
    ...(error.traceId ? { traceId: error.traceId } : {}),
  };
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown client error",
    name: "UnknownError",
  };
}

function browserBeacon() {
  if (typeof navigator === "undefined") {
    return null;
  }

  return navigator;
}

function browserUrl() {
  if (typeof window === "undefined") {
    return "server";
  }

  return window.location.href;
}

function browserUserAgent() {
  if (typeof navigator === "undefined") {
    return "server";
  }

  return navigator.userAgent;
}
