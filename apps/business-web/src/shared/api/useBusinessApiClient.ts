import { useContext } from "react";

import { BusinessApiClientContext } from "@/shared/api/businessApiContext";

export function useBusinessApiClient() {
  const client = useContext(BusinessApiClientContext);

  if (!client) {
    throw new Error("BusinessApiClientProvider is missing");
  }

  return client;
}
