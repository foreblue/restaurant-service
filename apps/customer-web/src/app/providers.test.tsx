import { render, screen } from "@testing-library/react";

import { usePublicApiClient } from "@/shared/api/usePublicApiClient";

import { AppProviders } from "./providers";

function ApiClientProbe() {
  const client = usePublicApiClient();

  return <span>{client.baseUrl}</span>;
}

describe("AppProviders", () => {
  it("provides the public API client", () => {
    render(
      <AppProviders>
        <ApiClientProbe />
      </AppProviders>,
    );

    expect(screen.getByText("http://localhost:8080")).toBeInTheDocument();
  });
});
