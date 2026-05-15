import { type ColumnDef } from "@tanstack/react-table";
import {
  Armchair,
  CalendarDays,
  Link2,
  Lock,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { Alert, Button, Checkbox, DateInput, Field, Input, Select } from "@/components/ui";
import {
  useBusinessTablesQuery,
  useBusinessTimeSlotsQuery,
  useCloseBusinessTimeSlotMutation,
  useCreateBusinessTableMutation,
  useReopenBusinessTimeSlotMutation,
  useSaveReservationProductSeatRulesMutation,
  useUpdateBusinessTableMutation,
} from "@/features/inventory/seatTableQueries";
import { useReservationProductsQuery } from "@/features/products/reservationProductsQueries";
import {
  type BusinessSeatType,
  type BusinessTableCombinationPolicy,
  type BusinessTableResponse,
  type BusinessTimeSlotResponse,
  type ReservationProductResponse,
  type ReservationProductSeatRulesRequest,
  type ReservationProductSeatRulesResponse,
} from "@/shared/api/businessApiClient";

interface TableFormValues {
  name: string;
  seatType: BusinessSeatType;
  minPartySize: string;
  maxPartySize: string;
  combinationPolicy: BusinessTableCombinationPolicy;
  isActive: boolean;
}

interface SeatRulesFormValues {
  productId: string;
  allowedSeatTypes: BusinessSeatType[];
  allowedTableIds: number[];
  defaultDurationMinutes: string;
  slotIntervalMinutes: string;
}

interface TimeSlotFilters {
  date: string;
  productId: string;
  seatType: string;
}

const emptyTableFormValues: TableFormValues = {
  name: "",
  seatType: "HALL",
  minPartySize: "1",
  maxPartySize: "2",
  combinationPolicy: "NONE",
  isActive: true,
};

const emptySeatRulesFormValues: SeatRulesFormValues = {
  productId: "",
  allowedSeatTypes: [],
  allowedTableIds: [],
  defaultDurationMinutes: "90",
  slotIntervalMinutes: "30",
};

const seatTypeOptions: Array<{ label: string; value: BusinessSeatType }> = [
  { label: "홀", value: "HALL" },
  { label: "룸", value: "ROOM" },
  { label: "바", value: "BAR" },
  { label: "테라스", value: "TERRACE" },
];

const combinationOptions: Array<{ label: string; value: BusinessTableCombinationPolicy }> = [
  { label: "단독 사용", value: "NONE" },
  { label: "인접 테이블 조합", value: "ADJACENT" },
  { label: "같은 좌석 유형 조합", value: "SAME_TYPE" },
];

const slotIntervalOptions = [
  { label: "15분", value: "15" },
  { label: "30분", value: "30" },
  { label: "60분", value: "60" },
];

const emptyTimeSlotFilters: TimeSlotFilters = {
  date: todayInputValue(),
  productId: "",
  seatType: "",
};

export function SeatTablesPage() {
  const tablesQuery = useBusinessTablesQuery();
  const productsQuery = useReservationProductsQuery();
  const createTable = useCreateBusinessTableMutation();
  const updateTable = useUpdateBusinessTableMutation();
  const saveSeatRules = useSaveReservationProductSeatRulesMutation();
  const closeTimeSlot = useCloseBusinessTimeSlotMutation();
  const reopenTimeSlot = useReopenBusinessTimeSlotMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<BusinessTableResponse | null>(null);
  const [formValues, setFormValues] = useState<TableFormValues>(emptyTableFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [timeSlotFilters, setTimeSlotFilters] = useState<TimeSlotFilters>(emptyTimeSlotFilters);
  const [timeSlotResult, setTimeSlotResult] = useState<string | null>(null);
  const [seatRulesForm, setSeatRulesForm] = useState<SeatRulesFormValues>(emptySeatRulesFormValues);
  const [seatRulesError, setSeatRulesError] = useState<string | null>(null);
  const [seatRulesResult, setSeatRulesResult] = useState<string | null>(null);
  const [savedSeatRules, setSavedSeatRules] = useState<ReservationProductSeatRulesResponse | null>(
    null,
  );
  const timeSlotsQuery = useBusinessTimeSlotsQuery({
    date: timeSlotFilters.date,
    productId: timeSlotFilters.productId ? Number(timeSlotFilters.productId) : null,
    seatType: timeSlotFilters.seatType ? (timeSlotFilters.seatType as BusinessSeatType) : null,
  });
  const products = productsQuery.data ?? [];
  const activeTables = (tablesQuery.data?.items ?? []).filter((table) => table.isActive);
  const selectedProduct =
    products.find((product) => product.id === Number(seatRulesForm.productId)) ?? null;
  const selectedTables = activeTables.filter((table) =>
    seatRulesForm.allowedTableIds.includes(table.id),
  );
  const seatRulesApiError = saveSeatRules.error;
  const seatRulesLoadError = productsQuery.error ?? tablesQuery.error;
  const timeSlotApiError = closeTimeSlot.error ?? reopenTimeSlot.error;
  const timeSlotIsSaving = closeTimeSlot.isPending || reopenTimeSlot.isPending;
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

  function updateTimeSlotFilters(patch: Partial<TimeSlotFilters>) {
    setTimeSlotResult(null);
    closeTimeSlot.reset();
    reopenTimeSlot.reset();
    setTimeSlotFilters((current) => ({ ...current, ...patch }));
  }

  async function closeTimeSlotInventory(slot: BusinessTimeSlotResponse) {
    setTimeSlotResult(null);
    reopenTimeSlot.reset();

    try {
      await closeTimeSlot.mutateAsync({
        date: slot.date,
        productId: slot.productId,
        seatType: slot.seatType,
        startTime: slot.startTime,
        reason: "OWNER_TEMP_CLOSE",
      });
      setTimeSlotResult(
        `${formatTime(slot.startTime)} ${slot.productName} 슬롯을 임시 마감했습니다.`,
      );
    } catch {
      // Mutation state renders the API error.
    }
  }

  async function reopenTimeSlotInventory(slot: BusinessTimeSlotResponse) {
    setTimeSlotResult(null);
    closeTimeSlot.reset();

    try {
      await reopenTimeSlot.mutateAsync({
        date: slot.date,
        productId: slot.productId,
        seatType: slot.seatType,
        startTime: slot.startTime,
      });
      setTimeSlotResult(
        `${formatTime(slot.startTime)} ${slot.productName} 슬롯을 다시 열었습니다.`,
      );
    } catch {
      // Mutation state renders the API error.
    }
  }

  function selectSeatRulesProduct(productId: string) {
    setSeatRulesError(null);
    setSeatRulesResult(null);
    setSavedSeatRules(null);
    saveSeatRules.reset();

    if (!productId) {
      setSeatRulesForm(emptySeatRulesFormValues);
      return;
    }

    setSeatRulesForm({
      ...emptySeatRulesFormValues,
      productId,
      allowedSeatTypes: activeSeatTypes(activeTables),
      allowedTableIds: activeTables.map((table) => table.id),
    });
  }

  function updateSeatRulesForm(patch: Partial<SeatRulesFormValues>) {
    setSeatRulesError(null);
    setSeatRulesResult(null);
    saveSeatRules.reset();
    setSeatRulesForm((current) => ({ ...current, ...patch }));
  }

  function toggleSeatType(seatType: BusinessSeatType, checked: boolean) {
    setSeatRulesError(null);
    setSeatRulesResult(null);
    saveSeatRules.reset();
    setSeatRulesForm((current) => {
      const allowedSeatTypes = checked
        ? sortSeatTypes([...current.allowedSeatTypes, seatType])
        : current.allowedSeatTypes.filter((item) => item !== seatType);
      const tableIdsForType = activeTables
        .filter((table) => table.seatType === seatType)
        .map((table) => table.id);
      const allowedTableIds = checked
        ? Array.from(new Set([...current.allowedTableIds, ...tableIdsForType]))
        : current.allowedTableIds.filter((tableId) => !tableIdsForType.includes(tableId));

      return {
        ...current,
        allowedSeatTypes,
        allowedTableIds,
      };
    });
  }

  function toggleSeatRulesTable(table: BusinessTableResponse, checked: boolean) {
    setSeatRulesError(null);
    setSeatRulesResult(null);
    saveSeatRules.reset();
    setSeatRulesForm((current) => {
      const allowedTableIds = checked
        ? Array.from(new Set([...current.allowedTableIds, table.id]))
        : current.allowedTableIds.filter((tableId) => tableId !== table.id);
      const allowedSeatTypes = checked
        ? sortSeatTypes([...current.allowedSeatTypes, table.seatType])
        : current.allowedSeatTypes;

      return {
        ...current,
        allowedSeatTypes,
        allowedTableIds,
      };
    });
  }

  function selectAllActiveTables() {
    setSeatRulesError(null);
    setSeatRulesResult(null);
    saveSeatRules.reset();
    setSeatRulesForm((current) => ({
      ...current,
      allowedSeatTypes: activeSeatTypes(activeTables),
      allowedTableIds: activeTables.map((table) => table.id),
    }));
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

  async function saveSeatRulesConfiguration() {
    const payload = toSeatRulesSavePayload(seatRulesForm, activeTables);

    setSeatRulesError(null);
    setSeatRulesResult(null);

    if (typeof payload === "string") {
      setSeatRulesError(payload);
      return;
    }

    try {
      const rules = await saveSeatRules.mutateAsync(payload);
      setSavedSeatRules(rules);
      setSeatRulesResult("좌석 연결 설정이 저장되었습니다.");
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

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays aria-hidden className="size-4" />
              타임슬롯 재고
            </p>
            <h2 className="mt-1 text-base font-semibold">시간대별 재고와 임시 마감</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              날짜, 상품, 좌석 유형별 예약 가능 수량과 마감 상태를 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden className="size-4" />
            중복 예약 방지 적용
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Field id="time-slot-date" label="조회 날짜">
            <DateInput
              id="time-slot-date"
              value={timeSlotFilters.date}
              onChange={(event) => updateTimeSlotFilters({ date: event.target.value })}
            />
          </Field>
          <Field id="time-slot-product" label="예약 상품">
            <Select
              id="time-slot-product"
              options={products.map((product) => ({
                label: product.name,
                value: String(product.id),
              }))}
              placeholder="전체 상품"
              value={timeSlotFilters.productId}
              onChange={(event) => updateTimeSlotFilters({ productId: event.target.value })}
            />
          </Field>
          <Field id="time-slot-seat-type" label="좌석 유형">
            <Select
              id="time-slot-seat-type"
              options={seatTypeOptions}
              placeholder="전체 좌석"
              value={timeSlotFilters.seatType}
              onChange={(event) => updateTimeSlotFilters({ seatType: event.target.value })}
            />
          </Field>
        </div>

        {timeSlotsQuery.isPending ? (
          <Panel title="타임슬롯 재고를 불러오는 중입니다." />
        ) : timeSlotsQuery.isError ? (
          <Alert variant="danger">{errorMessage(timeSlotsQuery.error)}</Alert>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Metric label="전체 슬롯" value={`${timeSlotsQuery.data.summary.totalCount}개`} />
              <Metric label="예약 가능" value={`${timeSlotsQuery.data.summary.availableCount}개`} />
              <Metric label="마감" value={`${timeSlotsQuery.data.summary.closedCount}개`} />
              <Metric label="임시마감" value={`${timeSlotsQuery.data.summary.tempClosedCount}개`} />
              <Metric
                label="중복 방지"
                value={`${timeSlotsQuery.data.summary.duplicateGuardedCount}개`}
              />
            </div>

            <Alert>
              임시 마감 또는 해제 결과는 고객 예약 가능 시간 후보에 반영됩니다. 이미 확정된 예약은
              이 액션으로 취소되지 않습니다.
            </Alert>

            {timeSlotApiError ? (
              <Alert variant="danger">{errorMessage(timeSlotApiError)}</Alert>
            ) : null}
            {timeSlotResult ? <Alert variant="success">{timeSlotResult}</Alert> : null}

            <div className="grid gap-2">
              {timeSlotsQuery.data.items.length === 0 ? (
                <Panel title="조회 조건에 맞는 타임슬롯이 없습니다." />
              ) : (
                timeSlotsQuery.data.items.map((slot) => (
                  <TimeSlotRow
                    key={slot.id}
                    slot={slot}
                    isSaving={timeSlotIsSaving}
                    onClose={() => closeTimeSlotInventory(slot)}
                    onReopen={() => reopenTimeSlotInventory(slot)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 aria-hidden className="size-4" />
              상품 좌석 규칙
            </p>
            <h2 className="mt-1 text-base font-semibold">상품별 좌석 연결</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              예약 상품에 허용 좌석 유형과 테이블, 기본 이용 시간을 연결합니다.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={selectAllActiveTables}
            disabled={!seatRulesForm.productId || activeTables.length === 0}
          >
            활성 테이블 전체 선택
          </Button>
        </div>

        {productsQuery.isPending || tablesQuery.isPending ? (
          <Panel title="상품과 테이블을 불러오는 중입니다." />
        ) : seatRulesLoadError ? (
          <Alert variant="danger">{errorMessage(seatRulesLoadError)}</Alert>
        ) : products.length === 0 ? (
          <Alert>예약 상품을 먼저 등록하면 상품별 좌석 연결을 설정할 수 있습니다.</Alert>
        ) : activeTables.length === 0 ? (
          <Alert>사용 중인 테이블을 먼저 등록해야 좌석 연결을 저장할 수 있습니다.</Alert>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field id="seat-rules-product" label="예약 상품">
                    <Select
                      id="seat-rules-product"
                      options={products.map((product) => ({
                        label: product.name,
                        value: String(product.id),
                      }))}
                      placeholder="상품 선택"
                      value={seatRulesForm.productId}
                      onChange={(event) => selectSeatRulesProduct(event.target.value)}
                    />
                  </Field>
                  <Field id="seat-rules-duration" label="기본 이용 시간">
                    <Input
                      id="seat-rules-duration"
                      inputMode="numeric"
                      value={seatRulesForm.defaultDurationMinutes}
                      onChange={(event) =>
                        updateSeatRulesForm({ defaultDurationMinutes: event.target.value })
                      }
                    />
                  </Field>
                  <Field id="seat-rules-slot-interval" label="슬롯 간격">
                    <Select
                      id="seat-rules-slot-interval"
                      options={slotIntervalOptions}
                      value={seatRulesForm.slotIntervalMinutes}
                      onChange={(event) =>
                        updateSeatRulesForm({ slotIntervalMinutes: event.target.value })
                      }
                    />
                  </Field>
                </div>

                {selectedProduct ? (
                  <p className="text-sm text-muted-foreground">
                    {formatProductCapacity(selectedProduct)}
                  </p>
                ) : null}

                <div className="grid gap-2">
                  <p className="text-sm font-medium">좌석 유형별 허용 여부</p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {seatTypeOptions.map((option) => {
                      const tableCount = activeTables.filter(
                        (table) => table.seatType === option.value,
                      ).length;

                      return (
                        <Checkbox
                          checked={seatRulesForm.allowedSeatTypes.includes(option.value)}
                          disabled={tableCount === 0}
                          id={`seat-type-${option.value}`}
                          key={option.value}
                          label={`${option.label} 허용 (${tableCount}개)`}
                          onChange={(event) => toggleSeatType(option.value, event.target.checked)}
                        />
                      );
                    })}
                  </div>
                </div>

                <Alert>
                  저장된 좌석 유형, 연결 테이블, 기본 이용 시간과 슬롯 간격은 고객 예약 가능 시간
                  후보 계산에 전달됩니다. 대관/대형 단체 정책은 이 화면에 포함하지 않습니다.
                </Alert>
              </div>

              <div className="grid gap-3">
                <p className="text-sm font-medium">연결 테이블</p>
                <div className="grid gap-2">
                  {activeTables.map((table) => {
                    const seatTypeAllowed = seatRulesForm.allowedSeatTypes.includes(table.seatType);

                    return (
                      <label
                        className="flex min-h-16 items-start gap-3 rounded-md border border-border px-3 py-2 text-sm"
                        htmlFor={`seat-rules-table-${table.id}`}
                        key={table.id}
                      >
                        <input
                          checked={seatRulesForm.allowedTableIds.includes(table.id)}
                          className="mt-1 size-4 rounded border-input text-primary outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!seatTypeAllowed}
                          id={`seat-rules-table-${table.id}`}
                          type="checkbox"
                          onChange={(event) => toggleSeatRulesTable(table, event.target.checked)}
                        />
                        <span>
                          <span className="block font-medium">{table.name}</span>
                          <span className="block text-muted-foreground">
                            {table.seatTypeLabel} · {table.minPartySize}-{table.maxPartySize}명 ·{" "}
                            {table.combinationPolicyLabel}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-border pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1 rounded-md bg-muted px-3 py-2">
                  <p className="text-sm font-medium">테이블 조합 가능 범위</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSeatRulesCombinationPreview(selectedTables)}
                  </p>
                </div>
                <div className="grid gap-1 rounded-md bg-muted px-3 py-2">
                  <p className="text-sm font-medium">설정 요약</p>
                  {savedSeatRules ? (
                    <div className="grid gap-1 text-sm text-muted-foreground">
                      <p>{savedSeatRules.summary}</p>
                      <p>{savedSeatRules.tableCombinationSummary}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      저장 후 상품별 좌석 연결 요약이 표시됩니다.
                    </p>
                  )}
                </div>
              </div>

              {seatRulesError ? <Alert variant="danger">{seatRulesError}</Alert> : null}
              {seatRulesApiError ? (
                <Alert variant="danger">{errorMessage(seatRulesApiError)}</Alert>
              ) : null}
              {seatRulesResult ? <Alert variant="success">{seatRulesResult}</Alert> : null}

              <div className="flex justify-end">
                <Button
                  type="button"
                  isLoading={saveSeatRules.isPending}
                  onClick={saveSeatRulesConfiguration}
                >
                  <Save aria-hidden className="size-4" />
                  좌석 연결 저장
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

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

function toSeatRulesSavePayload(
  values: SeatRulesFormValues,
  activeTables: BusinessTableResponse[],
) {
  const productId = Number(values.productId);
  const defaultDurationMinutes = Number(values.defaultDurationMinutes);
  const slotIntervalMinutes = Number(values.slotIntervalMinutes);
  const selectedTables = activeTables.filter((table) => values.allowedTableIds.includes(table.id));

  if (!Number.isInteger(productId) || productId < 1) {
    return "예약 상품을 선택해 주세요.";
  }
  if (values.allowedSeatTypes.length === 0) {
    return "허용 좌석 유형을 하나 이상 선택해 주세요.";
  }
  if (selectedTables.length === 0) {
    return "연결할 테이블을 하나 이상 선택해 주세요.";
  }
  if (
    !Number.isInteger(defaultDurationMinutes) ||
    defaultDurationMinutes < 30 ||
    defaultDurationMinutes > 360
  ) {
    return "기본 이용 시간은 30분부터 360분까지 입력해 주세요.";
  }
  if (![15, 30, 60].includes(slotIntervalMinutes)) {
    return "슬롯 간격은 15분, 30분, 60분 중 하나여야 합니다.";
  }
  if (defaultDurationMinutes % slotIntervalMinutes !== 0) {
    return "기본 이용 시간은 슬롯 간격의 배수여야 합니다.";
  }

  const missingTableSeatTypes = values.allowedSeatTypes.filter((seatType) =>
    selectedTables.every((table) => table.seatType !== seatType),
  );

  if (missingTableSeatTypes.length > 0) {
    return `${missingTableSeatTypes.map(seatTypeLabel).join(", ")} 좌석 유형에 연결할 테이블을 선택해 주세요.`;
  }
  if (selectedTables.some((table) => !values.allowedSeatTypes.includes(table.seatType))) {
    return "연결 테이블의 좌석 유형이 허용 유형에 포함되어야 합니다.";
  }

  const request: ReservationProductSeatRulesRequest = {
    allowedSeatTypes: values.allowedSeatTypes,
    allowedTableIds: selectedTables.map((table) => table.id),
    defaultDurationMinutes,
    slotIntervalMinutes,
  };

  return { productId, request };
}

function activeSeatTypes(tables: BusinessTableResponse[]) {
  return seatTypeOptions
    .filter((option) => tables.some((table) => table.seatType === option.value))
    .map((option) => option.value);
}

function sortSeatTypes(seatTypes: BusinessSeatType[]) {
  return seatTypeOptions
    .map((option) => option.value)
    .filter((seatType) => seatTypes.includes(seatType));
}

function seatTypeLabel(seatType: BusinessSeatType) {
  return seatTypeOptions.find((option) => option.value === seatType)?.label ?? seatType;
}

function formatProductCapacity(product: ReservationProductResponse) {
  const availableTime =
    product.availableStartTime && product.availableEndTime
      ? `${product.availableStartTime}-${product.availableEndTime}`
      : "영업시간 내";

  return `상품 인원 ${product.minPartySize}-${product.maxPartySize}명 · ${availableTime} · 슬롯 재고 ${product.slotCapacity}`;
}

function formatSeatRulesCombinationPreview(tables: BusinessTableResponse[]) {
  if (tables.length === 0) {
    return "연결할 테이블을 선택하면 조합 가능 범위가 표시됩니다.";
  }

  const policyLabels = Array.from(new Set(tables.map((table) => table.combinationPolicyLabel)));
  const maxSingleTableSize = tables.reduce(
    (maxPartySize, table) => Math.max(maxPartySize, table.maxPartySize),
    0,
  );
  const totalCapacity = tables.reduce((sum, table) => sum + table.maxPartySize, 0);

  return `테이블 조합 가능 범위: ${policyLabels.join(", ")} · 단일 테이블 최대 ${maxSingleTableSize}명 · 연결 수용 합계 ${totalCapacity}명`;
}

function TimeSlotRow({
  slot,
  isSaving,
  onClose,
  onReopen,
}: {
  slot: BusinessTimeSlotResponse;
  isSaving: boolean;
  onClose: () => void;
  onReopen: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-border px-3 py-3 text-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">
            {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
          </p>
          <StatusBadge label={slot.statusLabel} tone={slot.statusTone} />
          {slot.duplicateGuarded ? <Flag label="중복 방지" /> : null}
          {slot.customerAvailabilityAffected ? (
            <Flag label="고객 시간 반영" tone="warning" />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span>{slot.productName}</span>
          <span>{slot.seatTypeLabel}</span>
          <span>
            잔여 {slot.availableCount}/{slot.capacity}
          </span>
          <span>예약 {slot.reservedCount}명</span>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {slot.status === "TEMP_CLOSED" ? (
          <Button type="button" variant="outline" size="sm" isLoading={isSaving} onClick={onReopen}>
            <RotateCcw aria-hidden className="size-4" />
            마감 해제
          </Button>
        ) : (
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={isSaving}
            disabled={slot.status === "CLOSED"}
            onClick={onClose}
          >
            <Lock aria-hidden className="size-4" />
            임시 마감
          </Button>
        )}
      </div>
    </div>
  );
}

function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function formatTime(value: string) {
  return value.slice(0, 5);
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
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : tone === "info"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function Flag({ label, tone = "default" }: { label: string; tone?: "default" | "warning" }) {
  const className =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-border bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
