"use client";

import { useContext } from "react";

import { PublicApiClientContext } from "@/shared/api/publicApiContext";

export function usePublicApiClient() {
  const client = useContext(PublicApiClientContext);

  if (!client) {
    throw new Error("PublicApiClientProvider is missing");
  }

  return client;
}
