import { fireEvent, render, screen } from "@testing-library/react";

import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";

import { Button } from "./Button";
import { Field, getFieldDescriptionIds } from "./Field";
import { Input } from "./Input";
import { StateBlock } from "./StateBlock";

describe("customer UI components", () => {
  it("renders accessible field errors", () => {
    render(
      <Field error="이름을 입력해 주세요." htmlFor="customer-name" label="이름" required>
        <Input
          aria-describedby={getFieldDescriptionIds("customer-name", false, true)}
          id="customer-name"
          invalid
        />
      </Field>,
    );

    expect(screen.getByLabelText("이름*")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("이름을 입력해 주세요.")).toHaveAttribute("id", "customer-name-error");
  });

  it("handles confirm dialog actions", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        confirmLabel="예약 취소"
        destructive
        open
        title="예약을 취소할까요?"
        onCancel={onCancel}
        onConfirm={onConfirm}
      >
        취소 후에는 매장 정책에 따라 환불이 처리됩니다.
      </ConfirmDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "예약 취소" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("supports state block retry actions", () => {
    const onClick = vi.fn();

    render(
      <StateBlock
        action={{ label: "다시 조회", onClick }}
        title="예약 정보를 불러오지 못했습니다."
        variant="error"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 조회" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps button type safe for forms", () => {
    render(<Button>다음</Button>);

    expect(screen.getByRole("button", { name: "다음" })).toHaveAttribute("type", "button");
  });
});
