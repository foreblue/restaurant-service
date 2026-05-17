import { render, screen } from "@testing-library/react";

import { HomePageContent } from "./HomePageContent";

describe("HomePageContent", () => {
  it("renders the customer reservation shell", () => {
    render(<HomePageContent />);

    expect(screen.getByRole("heading", { name: "식당 예약" })).toBeInTheDocument();
    expect(screen.getByText("공유받은 예약 링크로 이동해 주세요.")).toBeInTheDocument();
    expect(screen.getByText("모바일 우선")).toBeInTheDocument();
  });
});
