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
  });

  it("renders the business shell after mock login", async () => {
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
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });
});
