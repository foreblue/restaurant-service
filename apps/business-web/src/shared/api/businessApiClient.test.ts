import { describe, expect, it } from "vitest";

import { resolveBusinessApiBaseUrl } from "./businessApiClient";

describe("resolveBusinessApiBaseUrl", () => {
  it("keeps localhost API base URL when the app is opened on localhost", () => {
    expect(
      resolveBusinessApiBaseUrl("http://localhost:8080", {
        hostname: "localhost",
        protocol: "http:",
      }),
    ).toBe("http://localhost:8080");
  });

  it("rewrites localhost API base URL to the LAN hostname when opened over the network", () => {
    expect(
      resolveBusinessApiBaseUrl("http://localhost:8080", {
        hostname: "192.168.45.93",
        protocol: "http:",
      }),
    ).toBe("http://192.168.45.93:8080");
  });

  it("uses the current browser hostname when API base URL is auto", () => {
    expect(
      resolveBusinessApiBaseUrl("auto", {
        hostname: "192.168.45.93",
        protocol: "http:",
      }),
    ).toBe("http://192.168.45.93:8080");
  });

  it("preserves explicitly configured non-loopback API base URLs", () => {
    expect(
      resolveBusinessApiBaseUrl("https://api.example.com", {
        hostname: "192.168.45.93",
        protocol: "http:",
      }),
    ).toBe("https://api.example.com");
  });
});
