import { type ColumnDef } from "@tanstack/react-table";
import { Armchair, Pencil, Plus, Power } from "lucide-react";
import { useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { Alert, Button, Checkbox, Field, Input, Select } from "@/components/ui";
import {
  useBusinessTablesQuery,
  useCreateBusinessTableMutation,
  useUpdateBusinessTableMutation,
} from "@/features/inventory/seatTableQueries";
import {
  type BusinessSeatType,
  type BusinessTableCombinationPolicy,
  type BusinessTableResponse,
} from "@/shared/api/businessApiClient";

interface TableFormValues {
  name: string;
  seatType: BusinessSeatType;
  minPartySize: string;
  maxPartySize: string;
  combinationPolicy: BusinessTableCombinationPolicy;
  isActive: boolean;
}

const emptyTableFormValues: TableFormValues = {
  name: "",
  seatType: "HALL",
  minPartySize: "1",
  maxPartySize: "2",
  combinationPolicy: "NONE",
  isActive: true,
};

const seatTypeOptions = [
  { label: "홀", value: "HALL" },
  { label: "룸", value: "ROOM" },
  { label: "바", value: "BAR" },
  { label: "테라스", value: "TERRACE" },
];

const combinationOptions = [
  { label: "단독 사용", value: "NONE" },
  { label: "인접 테이블 조합", value: "ADJACENT" },
  { label: "같은 좌석 유형 조합", value: "SAME_TYPE" },
];

export function SeatTablesPage() {
  const tablesQuery = useBusinessTablesQuery();
  const createTable = useCreateBusinessTableMutation();
  const updateTable = useUpdateBusinessTableMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<BusinessTableResponse | null>(null);
  const [formValues, setFormValues] = useState<TableFormValues>(emptyTableFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const columns: Array<ColumnDef<BusinessTableResponse>> = [
    {
      accessorKey: "name",
      header: "테이블",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.combinationPolicyLabel}</p>
        </div>
      ),
    },
    {
      accessorKey: "seatTypeLabel",
      header: "좌석 유형",
    },
    {
      id: "capacity",
      header: "수용 인원",
      cell: ({ row }) => `${row.original.minPartySize}-${row.original.maxPartySize}명`,
    },
    {
      accessorKey: "isActive",
      header: "운영 상태",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge
            label={row.original.isActive ? "사용" : "비활성"}
            tone={row.original.isActive ? "success" : "muted"}
          />
          {row.original.hasReservations ? <Flag label="예약 이력" /> : null}
        </div>
      ),
    },
    {
      id: "actions",
      header: "관리",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${row.original.name} 수정`}
            onClick={() => openEditForm(row.original)}
          >
            <Pencil aria-hidden className="size-4" />
            수정
          </Button>
          {row.original.isActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`${row.original.name} 비활성화`}
              onClick={() => deactivateTable(row.original)}
            >
              <Power aria-hidden className="size-4" />
              비활성화
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  function openCreateForm() {
    setEditingTable(null);
    setFormValues(emptyTableFormValues);
    setFormError(null);
    setResultMessage(null);
    createTable.reset();
    updateTable.reset();
    setFormOpen(true);
  }

  function openEditForm(table: BusinessTableResponse) {
    setEditingTable(table);
    setFormValues({
      name: table.name,
      seatType: table.seatType,
      minPartySize: String(table.minPartySize),
      maxPartySize: String(table.maxPartySize),
      combinationPolicy: table.combinationPolicy,
      isActive: table.isActive,
    });
    setFormError(null);
    setResultMessage(null);
    createTable.reset();
    updateTable.reset();
    setFormOpen(true);
  }

  function updateForm(patch: Partial<TableFormValues>) {
    setFormError(null);
    createTable.reset();
    updateTable.reset();
    setFormValues((current) => ({ ...current, ...patch }));
  }

  async function saveTable() {
    const request = toTableSaveRequest(formValues);

    setFormError(null);
    setResultMessage(null);

    if (typeof request === "string") {
      setFormError(request);
      return;
    }

    try {
      if (editingTable) {
        await updateTable.mutateAsync({ tableId: editingTable.id, request });
        setResultMessage("테이블이 수정되었습니다.");
      } else {
        await createTable.mutateAsync(request);
        setResultMessage("테이블이 생성되었습니다.");
      }
      setFormOpen(false);
      setEditingTable(null);
      setFormValues(emptyTableFormValues);
    } catch {
      // Mutation state renders the API error.
    }
  }

  async function deactivateTable(table: BusinessTableResponse) {
    setFormError(null);
    setResultMessage(null);
    updateTable.reset();

    try {
      await updateTable.mutateAsync({
        tableId: table.id,
        request: { ...table, isActive: false },
      });
      setResultMessage("테이블이 비활성화되었습니다.");
    } catch {
      // Mutation state renders the API error.
    }
  }

  const apiError = createTable.error ?? updateTable.error;
  const isSaving = createTable.isPending || updateTable.isPending;

  return (
    <section className="grid gap-5">
      <header className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Armchair aria-hidden className="size-4" />
            좌석 설정
          </p>
          <h1 className="mt-1 text-2xl font-semibold">테이블/좌석 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            예약 후보 계산에 사용할 테이블, 좌석 유형, 수용 인원 범위를 관리합니다.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus aria-hidden className="size-4" />
          테이블 추가
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="전체 테이블" value={`${tablesQuery.data?.summary.totalCount ?? 0}개`} />
        <Metric label="사용 중" value={`${tablesQuery.data?.summary.activeCount ?? 0}개`} />
        <Metric
          label="활성 수용 인원"
          value={`${tablesQuery.data?.summary.totalCapacity ?? 0}명`}
        />
        <Metric label="룸 좌석" value={`${tablesQuery.data?.summary.roomCount ?? 0}개`} />
      </section>

      {resultMessage ? <Alert variant="success">{resultMessage}</Alert> : null}

      {formOpen ? (
        <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              {editingTable ? "테이블 수정" : "테이블 등록"}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormOpen(false);
                setEditingTable(null);
                setFormError(null);
              }}
            >
              닫기
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field id="table-name" label="테이블명">
              <Input
                id="table-name"
                value={formValues.name}
                onChange={(event) => updateForm({ name: event.target.value })}
              />
            </Field>
            <Field id="table-seat-type" label="좌석 유형">
              <Select
                id="table-seat-type"
                options={seatTypeOptions}
                value={formValues.seatType}
                onChange={(event) =>
                  updateForm({ seatType: event.target.value as BusinessSeatType })
                }
              />
            </Field>
            <Field id="table-min-party-size" label="최소 수용 인원">
              <Input
                id="table-min-party-size"
                inputMode="numeric"
                value={formValues.minPartySize}
                onChange={(event) => updateForm({ minPartySize: event.target.value })}
              />
            </Field>
            <Field id="table-max-party-size" label="최대 수용 인원">
              <Input
                id="table-max-party-size"
                inputMode="numeric"
                value={formValues.maxPartySize}
                onChange={(event) => updateForm({ maxPartySize: event.target.value })}
              />
            </Field>
            <Field id="table-combination-policy" label="테이블 조합 범위">
              <Select
                id="table-combination-policy"
                options={combinationOptions}
                value={formValues.combinationPolicy}
                onChange={(event) =>
                  updateForm({
                    combinationPolicy: event.target.value as BusinessTableCombinationPolicy,
                  })
                }
              />
            </Field>
            <div className="flex items-end">
              <Checkbox
                checked={formValues.isActive}
                id="table-is-active"
                label="예약 사용"
                onChange={(event) => updateForm({ isActive: event.target.checked })}
              />
            </div>
            <div className="flex items-end xl:col-span-2">
              <Alert>
                POS 연동, 대형 단체 예약, 복잡한 자동 테이블 최적화는 이 화면에서 제공하지 않습니다.
              </Alert>
            </div>
          </div>
          {formError ? <Alert variant="danger">{formError}</Alert> : null}
          {apiError ? <Alert variant="danger">{errorMessage(apiError)}</Alert> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                setEditingTable(null);
                setFormError(null);
              }}
            >
              취소
            </Button>
            <Button type="button" isLoading={isSaving} onClick={saveTable}>
              저장
            </Button>
          </div>
        </section>
      ) : null}

      {tablesQuery.isPending ? (
        <Panel title="테이블을 불러오는 중입니다." />
      ) : tablesQuery.isError ? (
        <Alert variant="danger">{errorMessage(tablesQuery.error)}</Alert>
      ) : (
        <DataTable
          columns={columns}
          data={tablesQuery.data.items}
          emptyMessage="등록된 테이블이 없습니다."
          getRowId={(row) => String(row.id)}
        />
      )}
    </section>
  );
}

function toTableSaveRequest(values: TableFormValues) {
  const name = values.name.trim();
  const minPartySize = Number(values.minPartySize);
  const maxPartySize = Number(values.maxPartySize);

  if (!name) {
    return "테이블명을 입력해 주세요.";
  }
  if (!Number.isInteger(minPartySize) || !Number.isInteger(maxPartySize)) {
    return "수용 인원은 1명 이상 정수로 입력해 주세요.";
  }
  if (minPartySize < 1 || maxPartySize < 1) {
    return "수용 인원은 1명 이상 정수로 입력해 주세요.";
  }
  if (minPartySize > maxPartySize) {
    return "최소 수용 인원은 최대 수용 인원보다 클 수 없습니다.";
  }
  if (maxPartySize > 20) {
    return "대형 단체 예약 테이블은 현재 범위에서 제외됩니다.";
  }

  return {
    name,
    seatType: values.seatType,
    minPartySize,
    maxPartySize,
    combinationPolicy: values.combinationPolicy,
    isActive: values.isActive,
  };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
      {title}
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const className =
    tone === "success"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function Flag({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
