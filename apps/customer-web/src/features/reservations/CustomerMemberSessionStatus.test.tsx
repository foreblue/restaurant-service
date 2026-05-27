import { fireEvent, render, screen } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import {
  clearStoredCustomerMemberId,
  readStoredCustomerMemberId,
  storeCustomerMemberId,
} from "./customerMemberSession";
import { CustomerMemberSessionStatus } from "./CustomerMemberSessionStatus";

function createMockClient(): PublicApiClient {
  return {
    baseUrl: "http://api.test",
    get: vi.fn((path: string) => {
      if (path === "/api/public/members/1") {
        return Promise.resolve({
          id: 1,
          name: "김민지",
          phoneLast4: "1001",
          email: "minji.member@example.com",
          allergyNote: "갑각류",
          anniversaryType: "BIRTHDAY",
          anniversaryDate: "05-17",
          marketingOptIn: true,
        });
      }

      return Promise.reject(new Error(`Unhandled path: ${path}`));
    }),
    post: vi.fn(),
    request: vi.fn(),
  };
}

describe("CustomerMemberSessionStatus", () => {
  beforeEach(() => {
    clearStoredCustomerMemberId();
  });

  it("shows login links when no member is logged in", async () => {
    render(
      <AppProviders apiClient={createMockClient()}>
        <CustomerMemberSessionStatus redirectTo="/reserve" variant="header" />
      </AppProviders>,
    );

    expect(await screen.findByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Freserve",
    );
    expect(screen.getByRole("link", { name: "예약 조회" })).toHaveAttribute(
      "href",
      "/reservations",
    );
  });

  it("replaces login CTA with member controls after login", async () => {
    storeCustomerMemberId(1);

    render(
      <AppProviders apiClient={createMockClient()}>
        <CustomerMemberSessionStatus redirectTo="/reserve" variant="header" />
      </AppProviders>,
    );

    expect(await screen.findByText("김민지님")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "로그인" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "내 예약" })).toHaveAttribute("href", "/reservations");
    expect(screen.getByRole("link", { name: "계정 전환" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Freserve",
    );
  });

  it("logs out and restores the login CTA", async () => {
    storeCustomerMemberId(1);

    render(
      <AppProviders apiClient={createMockClient()}>
        <CustomerMemberSessionStatus redirectTo="/reserve" variant="card" />
      </AppProviders>,
    );

    expect(await screen.findByText("김민지님으로 로그인됨")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(readStoredCustomerMemberId()).toBeNull();
    expect(await screen.findByRole("link", { name: "사용자 로그인" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Freserve",
    );
  });
});
