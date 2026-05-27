import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { type PublicApiClient } from "@/shared/api/publicApiClient";

import { clearStoredCustomerMemberId, readStoredCustomerMemberId } from "./customerMemberSession";
import { CustomerLoginPageContent } from "./CustomerLoginPageContent";

function createMockClient(): PublicApiClient {
  return {
    baseUrl: "http://api.test",
    get: vi.fn((path: string) => {
      if (path === "/api/public/members") {
        return Promise.resolve({
          members: [
            {
              id: 1,
              name: "김민지",
              phoneLast4: "1001",
              email: "minji.member@example.com",
              allergyNote: "갑각류",
              anniversaryType: "BIRTHDAY",
              anniversaryDate: "05-17",
              marketingOptIn: true,
            },
          ],
        });
      }

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

describe("CustomerLoginPageContent", () => {
  beforeEach(() => {
    clearStoredCustomerMemberId();
  });

  it("logs in with only a member id and stores the session", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <CustomerLoginPageContent redirectTo="/r/1784" />
      </AppProviders>,
    );

    fireEvent.change(screen.getByLabelText("회원 ID*"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("로그인 완료")).toBeInTheDocument();
    expect(screen.getByText(/김민지 회원으로 로그인했습니다/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "예약 계속하기" })).toHaveAttribute("href", "/r/1784");
    expect(screen.queryByRole("button", { name: "로그인" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계정 전환" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    expect(readStoredCustomerMemberId()).toBe(1);
  });

  it("supports account switching and logout after login", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <CustomerLoginPageContent />
      </AppProviders>,
    );

    fireEvent.change(screen.getByLabelText("회원 ID*"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("로그인 완료")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "계정 전환" }));

    expect(readStoredCustomerMemberId()).toBeNull();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("회원 ID*"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("로그인 완료")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(readStoredCustomerMemberId()).toBeNull();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("rejects non-numeric member ids before calling the API", async () => {
    const client = createMockClient();

    render(
      <AppProviders apiClient={client}>
        <CustomerLoginPageContent />
      </AppProviders>,
    );

    fireEvent.change(screen.getByLabelText("회원 ID*"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("회원 ID는 숫자로 입력해 주세요.")).toBeInTheDocument();
    await waitFor(() => {
      expect(client.get).not.toHaveBeenCalledWith("/api/public/members/NaN");
    });
  });
});
