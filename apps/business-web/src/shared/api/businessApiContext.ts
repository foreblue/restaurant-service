import { createContext } from "react";

import { type BusinessApiClient } from "@/shared/api/businessApiClient";

export const BusinessApiClientContext = createContext<BusinessApiClient | null>(null);
