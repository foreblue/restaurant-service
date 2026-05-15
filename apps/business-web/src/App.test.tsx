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

  it("saves a draft restaurant application through the onboarding wizard", async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText("이메일"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByRole("heading", { name: "운영 현황" });
    fireEvent.click(screen.getByRole("link", { name: "입점 신청" }));

    expect(await screen.findByRole("heading", { name: "입점 신청 시작" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "신청 작성 시작" }));

    expect(await screen.findByRole("heading", { name: "입점 신청" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(await screen.findByText("매장명을 입력해 주세요.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("매장명"), {
      target: { value: "청담 테스트 키친" },
    });
    fireEvent.change(screen.getByLabelText("주소"), {
      target: { value: "서울시 강남구 테스트로 1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByText("사업자 정보")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("사업자등록번호"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByLabelText("상호명"), {
      target: { value: "청담 테스트" },
    });
    fireEvent.change(screen.getByLabelText("대표자명"), {
      target: { value: "김대표" },
    });
    fireEvent.change(screen.getByLabelText("사업장 주소"), {
      target: { value: "서울시 강남구 테스트로 1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByText("담당자 연락처")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("담당자 이름"), {
      target: { value: "박매니저" },
    });
    fireEvent.change(screen.getByLabelText("담당자 연락처"), {
      target: { value: "010-1234-5678" },
    });
    fireEvent.change(screen.getByLabelText("담당자 이메일"), {
      target: { value: "manager@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("작성중 신청이 저장되었습니다.")).toBeInTheDocument();
  });
});
