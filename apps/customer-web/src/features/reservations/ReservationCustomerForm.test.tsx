import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ReservationCustomerForm } from "./ReservationCustomerForm";

describe("ReservationCustomerForm", () => {
  it("blocks submit and focuses the first invalid required field", async () => {
    const onSubmit = vi.fn();

    render(<ReservationCustomerForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "입력 정보 확인" }));

    expect(await screen.findByText("이름을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByText("휴대폰 번호를 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByText("개인정보 수집에 동의해 주세요.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/이름/)).toHaveFocus());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows optional fields to be empty", async () => {
    const onSubmit = vi.fn();

    render(<ReservationCustomerForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: "  홍길동 " } });
    fireEvent.change(screen.getByLabelText(/휴대폰 번호/), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByLabelText("개인정보 수집에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "입력 정보 확인" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: "홍길동",
          allergyNote: null,
          anniversaryDate: null,
          anniversaryType: null,
          email: null,
          marketingConsent: false,
          phoneNumber: "01012345678",
          privacyConsent: true,
          requestNotes: null,
          requestTemplateValues: [],
        }),
        expect.anything(),
      );
    });
  });

  it("submits optional crm fields when customers provide them", async () => {
    const onSubmit = vi.fn();

    render(<ReservationCustomerForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByLabelText(/휴대폰 번호/), { target: { value: "01012345678" } });
    fireEvent.change(screen.getByLabelText("알레르기"), { target: { value: "견과류" } });
    fireEvent.change(screen.getByLabelText("기념일"), { target: { value: "BIRTHDAY" } });
    fireEvent.change(screen.getByLabelText("기념일 날짜"), { target: { value: "05-17" } });
    fireEvent.click(screen.getByLabelText("조용한 좌석 선호"));
    fireEvent.click(screen.getByLabelText("기념일 방문"));
    fireEvent.click(screen.getByLabelText("마케팅 정보 수신에 동의합니다. (선택)"));
    fireEvent.click(screen.getByLabelText("개인정보 수집에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "입력 정보 확인" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          allergyNote: "견과류",
          anniversaryDate: "05-17",
          anniversaryType: "BIRTHDAY",
          marketingConsent: true,
          requestTemplateValues: ["조용한 좌석 선호", "기념일 방문"],
        }),
        expect.anything(),
      );
    });
  });

  it("validates optional email format when provided", async () => {
    render(<ReservationCustomerForm onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/이메일/), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "입력 정보 확인" }));

    expect(await screen.findByText("이메일 형식을 확인해 주세요.")).toBeInTheDocument();
  });

  it("uses mobile-friendly input attributes", () => {
    render(<ReservationCustomerForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/휴대폰 번호/)).toHaveAttribute("inputmode", "tel");
    expect(screen.getByLabelText(/이메일/)).toHaveAttribute("type", "email");
    expect(screen.getByText("민감 정보 입력 안내")).toBeInTheDocument();
    expect(screen.getByText(/예약 확인과 매장 응대를 위해/)).toBeInTheDocument();
  });
});
