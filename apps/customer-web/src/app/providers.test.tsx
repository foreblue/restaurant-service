import { render, screen } from "@testing-library/react";

import { usePublicApiClient } from "@/shared/api/usePublicApiClient";

import { AppProviders, resolveBrowserPublicApiBaseUrl } from "./providers";

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

  it("rewrites a local API base URL for LAN browser access", () => {
    expect(
      resolveBrowserPublicApiBaseUrl("http://localhost:8080", {
        hostname: "192.168.45.93",
        protocol: "http:",
      }),
    ).toBe("http://192.168.45.93:8080");
  });
});
