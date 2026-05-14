import { QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { BusinessApiClientProvider } from "@/shared/api/BusinessApiClientProvider";
import { type BusinessApiClient, createBusinessQueryClient } from "@/shared/api/businessApiClient";

interface AppProvidersProps extends PropsWithChildren {
  apiClient: BusinessApiClient;
}

export function AppProviders({ apiClient, children }: AppProvidersProps) {
  const [queryClient] = useState(() => createBusinessQueryClient());

  return (
    <BusinessApiClientProvider client={apiClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BusinessApiClientProvider>
  );
}
