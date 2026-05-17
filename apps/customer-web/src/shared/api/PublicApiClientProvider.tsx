import { type PropsWithChildren } from "react";

import { PublicApiClientContext } from "@/shared/api/publicApiContext";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

interface PublicApiClientProviderProps extends PropsWithChildren {
  client: PublicApiClient;
}

export function PublicApiClientProvider({ client, children }: PublicApiClientProviderProps) {
  return (
    <PublicApiClientContext.Provider value={client}>{children}</PublicApiClientContext.Provider>
  );
}
