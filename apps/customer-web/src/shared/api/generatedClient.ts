import { type PublicApiRequestOptions } from "@/shared/api/publicApiClient";

export interface GeneratedPublicApiClient {
  request<TResponse>(path: string, options?: PublicApiRequestOptions): Promise<TResponse>;
}

export interface GeneratedPublicApiClientConfig {
  baseUrl: string;
  fetcher: typeof fetch;
}

export type GeneratedPublicApiClientFactory = (
  config: GeneratedPublicApiClientConfig,
) => GeneratedPublicApiClient;
