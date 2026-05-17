import { type ApiErrorResponse, PublicApiError } from "./apiError";

type SearchValue = boolean | number | string | null | undefined;

interface RequestHeaderOptions {
  body: PublicApiRequestOptions["body"];
  headers: PublicApiRequestOptions["headers"];
  idempotencyKey: PublicApiRequestOptions["idempotencyKey"];
  lookupToken: PublicApiRequestOptions["lookupToken"];
}

export interface PublicApiRequestOptions extends Omit<RequestInit, "body" | "headers" | "method"> {
  body?: BodyInit | Record<string, unknown> | null;
  headers?: HeadersInit;
  idempotencyKey?: string | null;
  lookupToken?: string | null;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  searchParams?: Record<string, SearchValue | SearchValue[]>;
}

export interface PublicApiClient {
  readonly baseUrl: string;
  request<TResponse>(path: string, options?: PublicApiRequestOptions): Promise<TResponse>;
  get<TResponse>(path: string, options?: PublicApiRequestOptions): Promise<TResponse>;
  post<TResponse>(path: string, options?: PublicApiRequestOptions): Promise<TResponse>;
}

interface PublicApiClientConfig {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export function createPublicApiClient({
  baseUrl,
  fetcher = fetch,
}: PublicApiClientConfig): PublicApiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  async function request<TResponse>(path: string, options: PublicApiRequestOptions = {}) {
    const { body, headers, idempotencyKey, lookupToken, method, searchParams, ...requestInit } =
      options;
    const serializedBody = serializeRequestBody(body);
    const init: RequestInit = {
      ...requestInit,
      headers: createRequestHeaders({ body, headers, idempotencyKey, lookupToken }),
      method: method ?? "GET",
    };

    if (serializedBody !== undefined) {
      init.body = serializedBody;
    }

    const response = await fetcher(createRequestUrl(normalizedBaseUrl, path, searchParams), init);

    if (!response.ok) {
      throw await createApiError(response);
    }

    return parseResponseBody<TResponse>(response);
  }

  return {
    baseUrl: normalizedBaseUrl,
    request,
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, options) => request(path, { ...options, method: "POST" }),
  };
}

function createRequestUrl(
  baseUrl: string,
  path: string,
  searchParams?: PublicApiRequestOptions["searchParams"],
) {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      const values = Array.isArray(value) ? value : [value];

      for (const item of values) {
        if (item !== null && item !== undefined) {
          url.searchParams.append(key, String(item));
        }
      }
    }
  }

  return url.toString();
}

function createRequestHeaders(options: RequestHeaderOptions) {
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");

  if (options.lookupToken) {
    headers.set("x-reservation-lookup-token", options.lookupToken);
  }

  if (options.idempotencyKey) {
    headers.set("idempotency-key", options.idempotencyKey);
  }

  if (options.body && isJsonRequestBody(options.body) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return Object.fromEntries(headers.entries());
}

function serializeRequestBody(body: PublicApiRequestOptions["body"]) {
  if (!body) {
    return undefined;
  }

  if (isJsonRequestBody(body)) {
    return JSON.stringify(body);
  }

  return body;
}

function isJsonRequestBody(body: PublicApiRequestOptions["body"]): body is Record<string, unknown> {
  return typeof body === "object" && !(body instanceof Blob) && !(body instanceof FormData);
}

async function createApiError(response: Response) {
  const payload = await parseResponseBody<ApiErrorResponse | null>(response);

  return new PublicApiError({
    status: response.status,
    code: payload?.code ?? `HTTP_${response.status}`,
    message: payload?.message ?? response.statusText,
    traceId: payload?.traceId ?? response.headers.get("x-trace-id"),
  });
}

async function parseResponseBody<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();

  if (!text) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return text as TResponse;
  }

  return JSON.parse(text) as TResponse;
}
