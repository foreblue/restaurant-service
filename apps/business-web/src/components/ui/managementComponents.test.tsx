import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ColumnDef } from "@tanstack/react-table";

import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ToastViewport } from "@/components/feedback/ToastViewport";
import { useToastStore } from "@/components/feedback/toastStore";
import { DataTable } from "@/components/table/DataTable";
import { Button } from "@/components/ui";
import { ReservationPolicyForm } from "@/features/foundation/ReservationPolicyForm";

interface ProductRow {
  id: string;
  name: string;
  status: string;
}

const productColumns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "name",
    header: "상품명",
  },
  {
    accessorKey: "status",
    header: "상태",
  },
];

describe("management UI components", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders reusable buttons and data tables", () => {
    render(
      <>
        <Button type="button">저장</Button>
        <DataTable
          columns={productColumns}
          data={[{ id: "lunch", name: "점심 코스", status: "공개" }]}
          getRowId={(row) => row.id}
        />
      </>,
    );

    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
    expect(screen.getByRole("columnheader", { name: "상품명" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "점심 코스" })).toBeInTheDocument();
  });

  it("confirms destructive actions through a dialog", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open
        title="예약 취소"
        description="선택한 예약을 취소합니다."
        intent="danger"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("dialog", { name: "예약 취소" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("renders and dismisses toast messages from the store", () => {
    useToastStore.getState().pushToast({
      title: "저장 완료",
      description: "변경 사항이 반영되었습니다.",
      variant: "success",
    });

    render(<ToastViewport />);

    expect(screen.getByRole("status")).toHaveTextContent("저장 완료");
    fireEvent.click(screen.getByRole("button", { name: "알림 닫기" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("validates a React Hook Form and Zod form pattern", async () => {
    const onSubmit = vi.fn();

    render(<ReservationPolicyForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("상품명은 2자 이상 입력해 주세요.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("상품명"), {
      target: { value: "디너 코스" },
    });
    fireEvent.change(screen.getByLabelText("예약 시작일"), {
      target: { value: "2026-05-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      productName: "디너 코스",
      maxGuests: 2,
      status: "draft",
      openDate: "2026-05-20",
      depositRequired: false,
    });
  });
});
