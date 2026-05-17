import { createContext } from "react";

import { type PublicApiClient } from "@/shared/api/publicApiClient";

export const PublicApiClientContext = createContext<PublicApiClient | null>(null);
