import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ReservationCustomerForm } from "./ReservationCustomerForm";
import { type PublicMember } from "./publicMemberTypes";

const members: PublicMember[] = [
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
  {
    id: 2,
    name: "박지수",
    phoneLast4: "1002",
    email: "jisoo.member@example.com",
    allergyNote: null,
    anniversaryType: null,
    anniversaryDate: null,
    marketingOptIn: false,
  },
];

describe("ReservationCustomerForm", () => {
  it("blocks submit and focuses the first invalid required field", async () => {
    const onSubmit = vi.fn();

    render(<ReservationCustomerForm members={members} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "입력 정보 확인" }));

    expect(await screen.findByText("예약할 회원을 선택해 주세요.")).toBeInTheDocument();
    expect(screen.getByText("개인정보 수집에 동의해 주세요.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/김민지/)).toHaveFocus());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows optional fields to be empty", async () => {
    const onSubmit = vi.fn();

    render(<ReservationCustomerForm members={members} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByLabelText(/김민지/));
    fireEvent.click(screen.getByLabelText("개인정보 수집에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "입력 정보 확인" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          allergyNote: null,
          anniversaryDate: null,
          anniversaryType: null,
          marketingConsent: false,
          memberId: 1,
          privacyConsent: true,
          requestNotes: null,
          requestTemplateValues: [],
        }),
        expect.anything(),
      );
    });
  });

  it("checks the default member when a logged-in member is provided", async () => {
    const onSubmit = vi.fn();

    render(
      <ReservationCustomerForm defaultMemberId={1} members={[members[0]]} onSubmit={onSubmit} />,
    );

    expect(screen.getByLabelText(/김민지/)).toBeChecked();

    fireEvent.click(screen.getByLabelText("개인정보 수집에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "입력 정보 확인" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: 1,
          privacyConsent: true,
        }),
        expect.anything(),
      );
    });
  });

  it("submits optional crm fields when customers provide them", async () => {
    const onSubmit = vi.fn();

    render(<ReservationCustomerForm members={members} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByLabelText(/박지수/));
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
          memberId: 2,
          requestTemplateValues: ["조용한 좌석 선호", "기념일 방문"],
        }),
        expect.anything(),
      );
    });
  });

  it("renders member profile details", () => {
    render(<ReservationCustomerForm members={members} onSubmit={vi.fn()} />);

    expect(screen.getByText("연락처 끝자리 1001 · minji.member@example.com")).toBeInTheDocument();
    expect(screen.getByText("알레르기 갑각류")).toBeInTheDocument();
    expect(screen.getByText("생일 05-17")).toBeInTheDocument();
  });

  it("keeps optional input guidance and privacy copy visible", () => {
    render(<ReservationCustomerForm members={members} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("기념일 날짜")).toHaveAttribute("placeholder", "05-17");
    expect(screen.getByText("민감 정보 입력 안내")).toBeInTheDocument();
    expect(screen.getByText(/회원 정보와 선택 입력 정보를 수집합니다/)).toBeInTheDocument();
  });
});
