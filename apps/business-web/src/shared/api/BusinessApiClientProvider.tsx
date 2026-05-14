import { type PropsWithChildren } from "react";

import { type BusinessApiClient } from "@/shared/api/businessApiClient";
import { BusinessApiClientContext } from "@/shared/api/businessApiContext";

interface BusinessApiClientProviderProps extends PropsWithChildren {
  client: BusinessApiClient;
}

export function BusinessApiClientProvider({ client, children }: BusinessApiClientProviderProps) {
  return (
    <BusinessApiClientContext.Provider value={client}>{children}</BusinessApiClientContext.Provider>
  );
}
