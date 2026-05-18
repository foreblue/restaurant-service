"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { customerWebEnv } from "@/config/env";
import { createCustomerQueryClient } from "@/shared/api/customerQueryClient";
import { PublicApiClientProvider } from "@/shared/api/PublicApiClientProvider";
import { createPublicApiClient, type PublicApiClient } from "@/shared/api/publicApiClient";
import { ClientErrorReporter } from "@/shared/observability/ClientErrorReporter";
import { reportClientError } from "@/shared/observability/customerErrorReporting";

interface AppProvidersProps extends PropsWithChildren {
  apiClient?: PublicApiClient;
}

export function AppProviders({ apiClient, children }: AppProvidersProps) {
  const [queryClient] = useState(() =>
    createCustomerQueryClient({
      onError: (error, context) => {
        void reportClientError(error, context);
      },
    }),
  );
  const [publicApiClient] = useState(
    () =>
      apiClient ??
      createPublicApiClient({
        baseUrl: resolveBrowserPublicApiBaseUrl(customerWebEnv.apiBaseUrl),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClientErrorReporter />
      <PublicApiClientProvider client={publicApiClient}>{children}</PublicApiClientProvider>
    </QueryClientProvider>
  );
}

export function resolveBrowserPublicApiBaseUrl(
  configuredBaseUrl: string,
  location: Pick<Location, "hostname" | "protocol"> | null = typeof window === "undefined"
    ? null
    : window.location,
) {
  if (!location) {
    return configuredBaseUrl;
  }

  const parsed = new URL(configuredBaseUrl);

  if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    return configuredBaseUrl;
  }

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return configuredBaseUrl;
  }

  parsed.hostname = location.hostname;
  parsed.protocol = location.protocol;

  return parsed.toString().replace(/\/+$/, "");
}
