import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ContactInfoFormExample } from "./ContactInfoFormExample";

describe("ContactInfoFormExample", () => {
  it("validates required customer contact fields", async () => {
    const onSubmit = vi.fn();

    render(<ContactInfoFormExample onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "예약 정보 확인" }));

    expect(await screen.findByText("이름을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByText("휴대폰 번호를 입력해 주세요.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits normalized contact values", async () => {
    const onSubmit = vi.fn();

    render(<ContactInfoFormExample onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("이름*"), { target: { value: "  홍길동  " } });
    fireEvent.change(screen.getByLabelText("휴대폰 번호*"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByLabelText("개인정보 수집에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "예약 정보 확인" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: "홍길동",
          phoneNumber: "01012345678",
          privacyConsent: true,
        }),
        expect.anything(),
      );
    });
  });
});
