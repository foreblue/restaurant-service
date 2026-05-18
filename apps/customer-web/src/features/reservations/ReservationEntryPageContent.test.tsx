import { fireEvent, render, screen } from "@testing-library/react";

import { ReservationEntryPageContent } from "./ReservationEntryPageContent";

const pushMock = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");

  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
    }),
  };
});

describe("ReservationEntryPageContent", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("renders a reservation entry screen", () => {
    render(<ReservationEntryPageContent />);

    expect(screen.getByRole("heading", { name: "예약 페이지 찾기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예약 화면 열기" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "예약 조회" })).toHaveAttribute(
      "href",
      "/reservations",
    );
  });

  it("opens slug and numeric reservation pages", () => {
    render(<ReservationEntryPageContent />);

    fireEvent.change(screen.getByLabelText("예약 링크 또는 코드"), {
      target: { value: "cheongdam-main" },
    });
    fireEvent.click(screen.getByRole("button", { name: "예약 화면 열기" }));

    expect(pushMock).toHaveBeenCalledWith("/r/cheongdam-main");

    fireEvent.change(screen.getByLabelText("예약 링크 또는 코드"), {
      target: { value: "15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "예약 화면 열기" }));

    expect(pushMock).toHaveBeenCalledWith("/reserve/15");
  });

  it("requires a reservation page code", () => {
    render(<ReservationEntryPageContent />);

    fireEvent.click(screen.getByRole("button", { name: "예약 화면 열기" }));

    expect(
      screen.getByText("매장에서 공유한 예약 링크나 예약 페이지 코드를 입력해 주세요."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
