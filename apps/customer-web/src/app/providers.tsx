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
    () => apiClient ?? createPublicApiClient({ baseUrl: customerWebEnv.apiBaseUrl }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClientErrorReporter />
      <PublicApiClientProvider client={publicApiClient}>{children}</PublicApiClientProvider>
    </QueryClientProvider>
  );
}
