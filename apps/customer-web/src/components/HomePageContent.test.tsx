import { render, screen } from "@testing-library/react";

import { HomePageContent } from "./HomePageContent";

describe("HomePageContent", () => {
  it("renders the customer reservation shell", () => {
    render(<HomePageContent />);

    expect(screen.getByRole("heading", { name: "식당 예약" })).toBeInTheDocument();
    expect(screen.getByText(/예약번호로 기존 예약을 확인/)).toBeInTheDocument();
    expect(screen.getByText("고객 예약")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "예약 신청" })).toHaveAttribute("href", "/reserve");
    expect(screen.getByRole("link", { name: "예약 조회" })).toHaveAttribute(
      "href",
      "/reservations",
    );
  });
});
