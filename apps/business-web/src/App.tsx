import { useState } from "react";
import { RouterProvider } from "react-router-dom";

import { createBusinessRouter } from "@/app/router";
import { AppProviders } from "@/app/providers";
import { type BusinessApiClient, createBusinessApiClient } from "@/shared/api/businessApiClient";

interface AppProps {
  apiClient?: BusinessApiClient;
}

function App({ apiClient }: AppProps) {
  const [client] = useState(() => apiClient ?? createBusinessApiClient());
  const [router] = useState(() => createBusinessRouter());

  return (
    <AppProviders apiClient={client}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
