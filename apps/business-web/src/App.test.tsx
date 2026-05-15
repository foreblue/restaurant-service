import { fireEvent, render, screen } from "@testing-library/react";

import App from "./App";

describe("App routing", () => {
  beforeEach(() => {
    if (typeof window.localStorage?.clear === "function") {
      window.localStorage.clear();
    }

    window.history.pushState({}, "", "/");
  });

  it("redirects unauthenticated users to the login route", async () => {
    window.history.pushState({}, "", "/reservations");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "사업자 로그인" })).toBeInTheDocument();
    expect(screen.getByText("로그인이 필요하거나 세션이 만료되었습니다.")).toBeInTheDocument();
  });

  it("logs in and logs out with the mock auth adapter", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("heading", { name: "운영 현황" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "주요 메뉴" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(await screen.findByRole("heading", { name: "사업자 로그인" })).toBeInTheDocument();
  });

  it("shows a clear authentication failure message", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "invalid@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다."),
    ).toBeInTheDocument();
  });

  it("requests a password reset from the public auth route", async () => {
    window.history.pushState({}, "", "/password-reset");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "비밀번호 재설정" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "재설정 요청" }));

    expect(await screen.findByText("비밀번호 재설정 요청이 접수되었습니다.")).toBeInTheDocument();
  });
});
