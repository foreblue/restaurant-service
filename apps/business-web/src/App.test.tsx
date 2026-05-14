import { render, screen } from "@testing-library/react";

import App from "./App";

describe("App", () => {
  it("renders the business operation foundation", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "운영 현황" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "주요 메뉴" })).toBeInTheDocument();
    expect(screen.getByText("오늘 예약")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "검색" })).toBeInTheDocument();
  });
});
