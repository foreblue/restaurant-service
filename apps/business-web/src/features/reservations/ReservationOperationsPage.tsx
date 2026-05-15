import { type ColumnDef } from "@tanstack/react-table";
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  RotateCcw,
  Search,
  UserX,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { Alert, Button, Checkbox, DateInput, Field, Input, Select } from "@/components/ui";
import { useReservationProductsQuery } from "@/features/products/reservationProductsQueries";
import {
  useCancelBusinessReservationMutation,
  useCompleteBusinessReservationMutation,
  useCreateManualBusinessReservationMutation,
  useBusinessReservationCalendarQuery,
  useBusinessReservationDetailQuery,
  useBusinessReservationsQuery,
  useMarkBusinessReservationNoShowMutation,
  useUpdateBusinessReservationMutation,
} from "@/features/reservations/reservationOperationsQueries";
import {
  type BusinessManualReservationSource,
  type BusinessReservationCalendarDayResponse,
  type BusinessReservationDetailResponse,
  type BusinessReservationListItemResponse,
  type BusinessReservationNoShowRequest,
  type BusinessReservationStatus,
} from "@/shared/api/businessApiClient";

type CalendarMode = "week" | "month";

interface ManualReservationFormValues {
  source: BusinessManualReservationSource;
  productId: string;
  visitDate: string;
  startTime: string;
  partySize: string;
  customerName: string;
  customerPhone: string;
  customerRequest: string;
}

type ReservationActionKind = "edit" | "cancel" | "complete" | "no-show";

interface ReservationEditFormValues {
  productId: string;
  visitDate: string;
  startTime: string;
  partySize: string;
}

const emptyReservationEditFormValues: ReservationEditFormValues = {
  productId: "",
  visitDate: "",
  startTime: "",
  partySize: "",
};

const emptyManualReservationFormValues: ManualReservationFormValues = {
  source: "MANUAL_PHONE",
  productId: "",
  visitDate: "",
  startTime: "12:00",
  partySize: "2",
  customerName: "",
  customerPhone: "",
  customerRequest: "",
};

const statusFilterOptions = [
  { label: "전체 상태", value: "" },
  { label: "확인 대기", value: "PENDING" },
  { label: "확정", value: "CONFIRMED" },
  { label: "변경", value: "MODIFIED" },
  { label: "방문 완료", value: "COMPLETED" },
  { label: "고객 취소", value: "CANCELLED_BY_CUSTOMER" },
  { label: "매장 취소", value: "CANCELLED_BY_RESTAURANT" },
  { label: "노쇼", value: "NO_SHOW" },
];

const manualSourceOptions = [
  { label: "전화 예약", value: "MANUAL_PHONE" },
  { label: "현장 예약", value: "MANUAL_WALK_IN" },
];

const sourceLabels: Record<string, string> = {
  ONLINE: "온라인",
  MANUAL_PHONE: "전화",
  MANUAL_WALK_IN: "현장",
  OWNER_ADJUSTED: "운영 보정",
};

const paymentStatusLabels: Record<string, string> = {
  NOT_REQUIRED: "결제 없음",
  OFFLINE: "현장 결제",
  PENDING_PAYMENT: "결제 대기",
  PAID: "결제 완료",
  REFUND_PENDING: "환불 대기",
  CARD_GUARANTEE: "카드 보증",
};

export function ReservationOperationsPage() {
  const [selectedDate, setSelectedDate] = useState(todayDateString);
  const [statusFilter, setStatusFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("week");
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [manualFormValues, setManualFormValues] = useState<ManualReservationFormValues>(
    emptyManualReservationFormValues,
  );
  const [manualFormError, setManualFormError] = useState<string | null>(null);
  const [reservationAction, setReservationAction] = useState<ReservationActionKind | null>(null);
  const [actionReservation, setActionReservation] =
    useState<BusinessReservationDetailResponse | null>(null);
  const [editFormValues, setEditFormValues] = useState<ReservationEditFormValues>(
    emptyReservationEditFormValues,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [noShowReason, setNoShowReason] = useState("");
  const [noShowForce, setNoShowForce] = useState(false);
  const [actionFormError, setActionFormError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const calendarRange = useMemo(
    () => getCalendarRange(selectedDate, calendarMode),
    [selectedDate, calendarMode],
  );
  const listQuery = useMemo(
    () => ({
      date: selectedDate,
      status: normalizeStatus(statusFilter),
      productId: productFilter ? Number(productFilter) : null,
      startTime: startTime || null,
      endTime: endTime || null,
      query: searchTerm.trim() || null,
      includeCancelled,
    }),
    [selectedDate, statusFilter, productFilter, startTime, endTime, searchTerm, includeCancelled],
  );
  const calendarQuery = useMemo(
    () => ({
      from: calendarRange.from,
      to: calendarRange.to,
      status: normalizeStatus(statusFilter),
      productId: productFilter ? Number(productFilter) : null,
      startTime: startTime || null,
      endTime: endTime || null,
    }),
    [calendarRange.from, calendarRange.to, statusFilter, productFilter, startTime, endTime],
  );
  const reservationsQuery = useBusinessReservationsQuery(listQuery);
  const calendarQueryResult = useBusinessReservationCalendarQuery(calendarQuery);
  const detailQuery = useBusinessReservationDetailQuery(selectedReservationId);
  const productsQuery = useReservationProductsQuery();
  const createManualReservation = useCreateManualBusinessReservationMutation();
  const updateReservation = useUpdateBusinessReservationMutation();
  const cancelReservation = useCancelBusinessReservationMutation();
  const completeReservation = useCompleteBusinessReservationMutation();
  const markReservationNoShow = useMarkBusinessReservationNoShowMutation();
  const productOptions = useMemo(
    () => buildProductOptions(productsQuery.data ?? [], reservationsQuery.data?.items ?? []),
    [productsQuery.data, reservationsQuery.data?.items],
  );
  const manualProductOptions = useMemo(
    () => productOptions.filter((option) => option.value),
    [productOptions],
  );
  const columns = useMemo<Array<ColumnDef<BusinessReservationListItemResponse>>>(
    () => [
      {
        id: "time",
        header: "시간",
        cell: ({ row }) => (
          <div className="grid min-w-[110px] gap-1">
            <span className="font-mono font-medium">
              {formatTime(row.original.startTime)}-{formatTime(row.original.endTime)}
            </span>
            <span className="text-xs text-muted-foreground">{row.original.reservationNumber}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "상태",
        cell: ({ row }) => (
          <div className="grid gap-1">
            <StatusBadge label={row.original.statusLabel} tone={row.original.statusTone} />
            <span className="text-xs text-muted-foreground">
              {sourceLabels[row.original.source] ?? row.original.source}
            </span>
          </div>
        ),
      },
      {
        id: "customer",
        header: "고객",
        cell: ({ row }) => (
          <div className="grid min-w-[140px] gap-1">
            <span className="truncate font-medium">{row.original.customer.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.customer.phoneMasked}
            </span>
          </div>
        ),
      },
      {
        id: "product",
        header: "상품/인원",
        cell: ({ row }) => (
          <div className="grid min-w-[150px] gap-1">
            <span className="truncate">{row.original.productName}</span>
            <span className="text-xs text-muted-foreground">{row.original.partySize}명</span>
          </div>
        ),
      },
      {
        id: "flags",
        header: "운영 표시",
        cell: ({ row }) => (
          <div className="flex min-w-[180px] flex-wrap gap-1.5">
            {row.original.hasCustomerRequest ? <Flag label="요청사항" /> : null}
            {row.original.hasOwnerNote ? <Flag label="운영 메모" /> : null}
            <Flag label={paymentStatusLabel(row.original.paymentStatus)} />
            {row.original.paymentActionRequired ? <Flag label="결제 확인" tone="danger" /> : null}
          </div>
        ),
      },
      {
        id: "detail",
        header: "상세",
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label={`${row.original.customer.name} 상세 열기`}
            onClick={() => setSelectedReservationId(row.original.id)}
          >
            <Eye aria-hidden className="size-4" />
            보기
          </Button>
        ),
      },
    ],
    [],
  );
  const summary = reservationsQuery.data?.summary;
  const calendarCells = useMemo(
    () => buildCalendarCells(calendarQueryResult.data?.days ?? [], calendarRange.from),
    [calendarQueryResult.data?.days, calendarRange.from],
  );

  function moveDate(days: number) {
    setSelectedDate(addDays(selectedDate, days));
  }

  function resetFilters() {
    setStatusFilter("");
    setProductFilter("");
    setStartTime("");
    setEndTime("");
    setSearchTerm("");
    setIncludeCancelled(false);
  }

  function openManualForm() {
    const firstProductId = manualProductOptions[0]?.value ?? "";

    setManualFormValues({
      ...emptyManualReservationFormValues,
      productId: firstProductId,
      visitDate: selectedDate,
    });
    setManualFormError(null);
    createManualReservation.reset();
    setManualFormOpen(true);
  }

  function updateManualForm(patch: Partial<ManualReservationFormValues>) {
    setManualFormError(null);
    createManualReservation.reset();
    setManualFormValues((current) => ({ ...current, ...patch }));
  }

  async function handleManualSubmit() {
    const request = toManualReservationRequest(manualFormValues);

    setManualFormError(null);
    setResultMessage(null);

    if (typeof request === "string") {
      setManualFormError(request);
      return;
    }

    try {
      const reservation = await createManualReservation.mutateAsync(request);
      setSelectedDate(reservation.visitDate);
      setSelectedReservationId(reservation.id);
      setManualFormOpen(false);
      setManualFormValues(emptyManualReservationFormValues);
      setResultMessage("수동 예약이 등록되었습니다.");
    } catch {
      // Mutation state renders the API error.
    }
  }

  function resetReservationActionMutations() {
    updateReservation.reset();
    cancelReservation.reset();
    completeReservation.reset();
    markReservationNoShow.reset();
  }

  function openReservationAction(
    action: ReservationActionKind,
    reservation: BusinessReservationDetailResponse,
  ) {
    resetReservationActionMutations();
    setReservationAction(action);
    setActionReservation(reservation);
    setActionFormError(null);
    setResultMessage(null);

    if (action === "edit") {
      setEditFormValues({
        productId: String(reservation.product.id),
        visitDate: reservation.visitDate,
        startTime: formatTime(reservation.startTime),
        partySize: String(reservation.partySize),
      });
    }
    if (action === "cancel") {
      setCancelReason("");
    }
    if (action === "no-show") {
      setNoShowReason("");
      setNoShowForce(false);
    }
  }

  function closeReservationAction() {
    setReservationAction(null);
    setActionReservation(null);
    setActionFormError(null);
    resetReservationActionMutations();
  }

  function updateEditForm(patch: Partial<ReservationEditFormValues>) {
    setActionFormError(null);
    updateReservation.reset();
    setEditFormValues((current) => ({ ...current, ...patch }));
  }

  async function handleReservationActionSubmit() {
    if (!reservationAction || !actionReservation) {
      return;
    }

    setActionFormError(null);
    setResultMessage(null);

    try {
      if (reservationAction === "edit") {
        const request = toReservationUpdateRequest(editFormValues);

        if (typeof request === "string") {
          setActionFormError(request);
          return;
        }

        const reservation = await updateReservation.mutateAsync({
          reservationId: actionReservation.id,
          request,
        });
        handleReservationActionSuccess(reservation, "예약이 변경되었습니다.");
        return;
      }

      if (reservationAction === "cancel") {
        const reason = cancelReason.trim();

        if (!reason) {
          setActionFormError("취소 사유를 입력해 주세요.");
          return;
        }
        if (reason.length > 255) {
          setActionFormError("취소 사유는 255자 이하여야 합니다.");
          return;
        }

        const reservation = await cancelReservation.mutateAsync({
          reservationId: actionReservation.id,
          request: { reason },
        });
        handleReservationActionSuccess(reservation, "예약이 취소되었습니다.");
        return;
      }

      if (reservationAction === "complete") {
        const reservation = await completeReservation.mutateAsync(actionReservation.id);
        handleReservationActionSuccess(reservation, "방문 완료 처리되었습니다.");
        return;
      }

      const request: BusinessReservationNoShowRequest = {
        reason: noShowReason.trim() || null,
        force: noShowForce,
      };

      if ((request.reason?.length ?? 0) > 255) {
        setActionFormError("노쇼 사유는 255자 이하여야 합니다.");
        return;
      }

      const reservation = await markReservationNoShow.mutateAsync({
        reservationId: actionReservation.id,
        request,
      });
      handleReservationActionSuccess(reservation, "노쇼 처리되었습니다.");
    } catch {
      // Mutation state renders the API error.
    }
  }

  function handleReservationActionSuccess(
    reservation: BusinessReservationDetailResponse,
    message: string,
  ) {
    setSelectedDate(reservation.visitDate);
    setSelectedReservationId(reservation.id);
    setReservationAction(null);
    setActionReservation(null);
    setActionFormError(null);
    setResultMessage(message);
  }

  const actionApiError =
    reservationAction === "edit"
      ? updateReservation.error
      : reservationAction === "cancel"
        ? cancelReservation.error
        : reservationAction === "complete"
          ? completeReservation.error
          : reservationAction === "no-show"
            ? markReservationNoShow.error
            : null;
  const actionIsSaving =
    updateReservation.isPending ||
    cancelReservation.isPending ||
    completeReservation.isPending ||
    markReservationNoShow.isPending;

  return (
    <section className="grid gap-5">
      <header className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">예약 운영</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            일별 예약과 캘린더에서 매장 예약 상태를 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={openManualForm}>
            수동 예약 등록
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => moveDate(-1)}>
            <ChevronLeft aria-hidden className="size-4" />
            이전
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(todayDateString())}
          >
            오늘
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => moveDate(1)}>
            다음
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        </div>
      </header>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[170px_170px_180px_140px_140px_minmax(220px,1fr)]">
          <Field id="reservation-date" label="예약일">
            <DateInput
              id="reservation-date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </Field>
          <Field id="reservation-status" label="상태">
            <Select
              id="reservation-status"
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            />
          </Field>
          <Field id="reservation-product" label="상품">
            <Select
              id="reservation-product"
              options={productOptions}
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
            />
          </Field>
          <Field id="reservation-start-time" label="시작">
            <Input
              id="reservation-start-time"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </Field>
          <Field id="reservation-end-time" label="종료">
            <Input
              id="reservation-end-time"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </Field>
          <Field id="reservation-search" label="검색">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-9"
                id="reservation-search"
                placeholder="예약번호, 고객명, 연락처, 상품명"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox
            checked={includeCancelled}
            id="reservation-include-cancelled"
            label="취소 예약 포함"
            onChange={(event) => setIncludeCancelled(event.target.checked)}
          />
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw aria-hidden className="size-4" />
            필터 초기화
          </Button>
        </div>
      </section>

      {resultMessage ? <Alert variant="success">{resultMessage}</Alert> : null}

      {summary ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="예약 요약">
          <Metric label="총 예약" value={`${summary.totalReservations}건`} />
          <Metric label="방문 예정 인원" value={`${summary.totalPartySize}명`} />
          <Metric label="확정/변경" value={`${summary.confirmedCount + summary.modifiedCount}건`} />
          <Metric label="방문 완료" value={`${summary.completedCount}건`} />
          <Metric label="취소" value={`${summary.cancelledCount}건`} />
          <Metric label="노쇼" value={`${summary.noShowCount}건`} />
        </section>
      ) : null}

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="grid gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">일별 예약 리스트</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateLabel(selectedDate)} 기준 예약입니다.
              </p>
            </div>
          </div>
          {reservationsQuery.isPending ? (
            <Panel title="예약을 불러오는 중입니다." />
          ) : reservationsQuery.isError ? (
            <Alert variant="danger">{errorMessage(reservationsQuery.error)}</Alert>
          ) : (
            <DataTable
              columns={columns}
              data={reservationsQuery.data.items}
              emptyMessage="조건에 맞는 예약이 없습니다."
              getRowId={(row) => String(row.id)}
            />
          )}
        </section>

        <aside className="grid gap-5">
          <ReservationDetailPanel
            detail={detailQuery.data}
            error={detailQuery.error}
            isError={detailQuery.isError}
            isPending={detailQuery.isPending}
            reservationId={selectedReservationId}
            onClose={() => setSelectedReservationId(null)}
            onOpenAction={openReservationAction}
          />

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {calendarMode === "week" ? "주간 캘린더" : "월간 캘린더"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateLabel(calendarRange.from)} - {formatDateLabel(calendarRange.to)}
                </p>
              </div>
              <div className="inline-flex rounded-md border border-input bg-background p-1">
                <ModeButton
                  active={calendarMode === "week"}
                  label="주"
                  onClick={() => setCalendarMode("week")}
                />
                <ModeButton
                  active={calendarMode === "month"}
                  label="월"
                  onClick={() => setCalendarMode("month")}
                />
              </div>
            </div>

            {calendarQueryResult.isPending ? (
              <div className="mt-4">
                <Panel title="캘린더를 불러오는 중입니다." />
              </div>
            ) : calendarQueryResult.isError ? (
              <div className="mt-4">
                <Alert variant="danger">{errorMessage(calendarQueryResult.error)}</Alert>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {weekdayLabels.map((label) => (
                  <div
                    className="px-1 py-1 text-center text-xs font-medium text-muted-foreground"
                    key={label}
                  >
                    {label}
                  </div>
                ))}
                {calendarCells.map((cell, index) =>
                  cell ? (
                    <button
                      aria-label={`${cell.date} 예약 ${cell.reservationCount}건`}
                      className={
                        cell.date === selectedDate
                          ? "grid min-h-24 gap-1 rounded-md border border-primary bg-primary/5 p-2 text-left"
                          : "grid min-h-24 gap-1 rounded-md border border-border bg-background p-2 text-left transition hover:bg-muted"
                      }
                      key={cell.date}
                      type="button"
                      onClick={() => setSelectedDate(cell.date)}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="font-mono text-sm font-medium">
                          {dayOfMonth(cell.date)}
                        </span>
                        {cell.isOpen ? (
                          <CalendarDays aria-hidden className="size-3.5 text-muted-foreground" />
                        ) : null}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cell.reservationCount}건 · {cell.partySizeTotal}명
                      </span>
                      <span className="grid gap-0.5 text-[11px] leading-4 text-muted-foreground">
                        <span>완료 {cell.completedCount}</span>
                        <span>취소 {cell.cancelledCount}</span>
                        <span>노쇼 {cell.noShowCount}</span>
                      </span>
                    </button>
                  ) : (
                    <div
                      aria-hidden
                      className="min-h-24 rounded-md border border-transparent"
                      key={`blank-${index}`}
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </aside>
      </section>

      {manualFormOpen ? (
        <ManualReservationDialog
          apiError={createManualReservation.error}
          formError={manualFormError}
          isSaving={createManualReservation.isPending}
          productOptions={manualProductOptions}
          values={manualFormValues}
          onCancel={() => setManualFormOpen(false)}
          onChange={updateManualForm}
          onSubmit={handleManualSubmit}
        />
      ) : null}

      {reservationAction && actionReservation ? (
        <ReservationActionDialog
          action={reservationAction}
          apiError={actionApiError}
          cancelReason={cancelReason}
          editValues={editFormValues}
          formError={actionFormError}
          isSaving={actionIsSaving}
          noShowForce={noShowForce}
          noShowReason={noShowReason}
          productOptions={manualProductOptions}
          reservation={actionReservation}
          onCancel={closeReservationAction}
          onCancelReasonChange={(value) => {
            setActionFormError(null);
            cancelReservation.reset();
            setCancelReason(value);
          }}
          onEditChange={updateEditForm}
          onNoShowForceChange={(value) => {
            setActionFormError(null);
            markReservationNoShow.reset();
            setNoShowForce(value);
          }}
          onNoShowReasonChange={(value) => {
            setActionFormError(null);
            markReservationNoShow.reset();
            setNoShowReason(value);
          }}
          onSubmit={handleReservationActionSubmit}
        />
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
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

function ManualReservationDialog({
  values,
  productOptions,
  formError,
  apiError,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
}: {
  values: ManualReservationFormValues;
  productOptions: Array<{ label: string; value: string }>;
  formError: string | null;
  apiError: unknown;
  isSaving: boolean;
  onChange: (patch: Partial<ManualReservationFormValues>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const canCheckAvailability =
    Boolean(values.productId) &&
    Boolean(values.visitDate) &&
    Boolean(values.startTime) &&
    Boolean(values.partySize);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4 py-6">
      <section
        aria-modal="true"
        className="grid max-h-[90vh] w-full max-w-3xl gap-4 overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl"
        role="dialog"
        aria-labelledby="manual-reservation-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" id="manual-reservation-title">
              수동 예약 등록
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              전화 또는 현장 예약을 운영 화면에 추가합니다.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="등록 닫기"
            onClick={onCancel}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field id="manual-source" label="등록 경로">
            <Select
              id="manual-source"
              options={manualSourceOptions}
              value={values.source}
              onChange={(event) =>
                onChange({ source: event.target.value as BusinessManualReservationSource })
              }
            />
          </Field>
          <Field id="manual-product" label="예약 상품">
            <Select
              id="manual-product"
              options={productOptions}
              {...(productOptions.length === 0 ? { placeholder: "등록된 상품 없음" } : {})}
              value={values.productId}
              onChange={(event) => onChange({ productId: event.target.value })}
            />
          </Field>
          <Field id="manual-visit-date" label="방문일">
            <DateInput
              id="manual-visit-date"
              value={values.visitDate}
              onChange={(event) => onChange({ visitDate: event.target.value })}
            />
          </Field>
          <Field id="manual-start-time" label="방문 시간">
            <Input
              id="manual-start-time"
              type="time"
              value={values.startTime}
              onChange={(event) => onChange({ startTime: event.target.value })}
            />
          </Field>
          <Field id="manual-party-size" label="인원">
            <Input
              id="manual-party-size"
              inputMode="numeric"
              value={values.partySize}
              onChange={(event) => onChange({ partySize: event.target.value })}
            />
          </Field>
          <Field id="manual-customer-name" label="고객명">
            <Input
              id="manual-customer-name"
              value={values.customerName}
              onChange={(event) => onChange({ customerName: event.target.value })}
            />
          </Field>
          <Field id="manual-customer-phone" label="고객 전화번호">
            <Input
              id="manual-customer-phone"
              inputMode="tel"
              value={values.customerPhone}
              onChange={(event) => onChange({ customerPhone: event.target.value })}
            />
          </Field>
          <Field id="manual-customer-request" label="고객 요청사항" className="md:col-span-2">
            <textarea
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
              id="manual-customer-request"
              value={values.customerRequest}
              onChange={(event) => onChange({ customerRequest: event.target.value })}
            />
          </Field>
        </div>

        <Alert>
          {canCheckAvailability
            ? "등록 시 영업시간과 재고를 확인합니다."
            : "상품, 방문일, 시간, 인원을 입력하면 예약 가능 여부를 확인합니다."}
        </Alert>
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        {apiError ? <Alert variant="danger">{errorMessage(apiError)}</Alert> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="button" isLoading={isSaving} onClick={onSubmit}>
            등록
          </Button>
        </div>
      </section>
    </div>
  );
}

function ReservationActionDialog({
  action,
  reservation,
  editValues,
  productOptions,
  cancelReason,
  noShowReason,
  noShowForce,
  formError,
  apiError,
  isSaving,
  onEditChange,
  onCancelReasonChange,
  onNoShowReasonChange,
  onNoShowForceChange,
  onSubmit,
  onCancel,
}: {
  action: ReservationActionKind;
  reservation: BusinessReservationDetailResponse;
  editValues: ReservationEditFormValues;
  productOptions: Array<{ label: string; value: string }>;
  cancelReason: string;
  noShowReason: string;
  noShowForce: boolean;
  formError: string | null;
  apiError: unknown;
  isSaving: boolean;
  onEditChange: (patch: Partial<ReservationEditFormValues>) => void;
  onCancelReasonChange: (value: string) => void;
  onNoShowReasonChange: (value: string) => void;
  onNoShowForceChange: (value: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const title = reservationActionTitle(action);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4 py-6">
      <section
        aria-modal="true"
        className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl"
        role="dialog"
        aria-labelledby="reservation-action-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" id="reservation-action-title">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {reservation.reservationNumber} · {reservation.customer.name} ·{" "}
              {formatDateLabel(reservation.visitDate)} {formatTime(reservation.startTime)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${title} 닫기`}
            onClick={onCancel}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>

        {action === "edit" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="action-product" label="변경 상품">
              <Select
                id="action-product"
                options={productOptions}
                value={editValues.productId}
                onChange={(event) => onEditChange({ productId: event.target.value })}
              />
            </Field>
            <Field id="action-visit-date" label="변경 방문일">
              <DateInput
                id="action-visit-date"
                value={editValues.visitDate}
                onChange={(event) => onEditChange({ visitDate: event.target.value })}
              />
            </Field>
            <Field id="action-start-time" label="변경 방문 시간">
              <Input
                id="action-start-time"
                type="time"
                value={editValues.startTime}
                onChange={(event) => onEditChange({ startTime: event.target.value })}
              />
            </Field>
            <Field id="action-party-size" label="변경 인원">
              <Input
                id="action-party-size"
                inputMode="numeric"
                value={editValues.partySize}
                onChange={(event) => onEditChange({ partySize: event.target.value })}
              />
            </Field>
            <div className="md:col-span-2">
              <Alert>
                변경 저장 시 영업시간과 재고를 다시 확인하고 예약 상태가 변경됨으로 갱신됩니다.
              </Alert>
            </div>
          </div>
        ) : null}

        {action === "cancel" ? (
          <div className="grid gap-3">
            <Alert variant="danger">
              매장 취소는 예약을 되돌릴 수 없습니다. 결제/환불 영향 확인은 후속 결제 화면에서
              처리합니다.
            </Alert>
            <Field id="action-cancel-reason" label="취소 사유">
              <textarea
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                id="action-cancel-reason"
                value={cancelReason}
                onChange={(event) => onCancelReasonChange(event.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {action === "complete" ? (
          <Alert variant="success">
            실제 방문이 확인된 예약만 방문 완료로 처리합니다. 완료 후에는 변경/취소 액션을 실행할 수
            없습니다.
          </Alert>
        ) : null}

        {action === "no-show" ? (
          <div className="grid gap-3">
            <Alert variant="danger">
              노쇼 처리는 고객이 예약 시간에 방문하지 않은 경우에만 사용합니다. 카드 보증 청구와
              환불 처리는 후속 결제 화면에서 확인합니다.
            </Alert>
            <Field id="action-no-show-reason" label="노쇼 사유">
              <textarea
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                id="action-no-show-reason"
                value={noShowReason}
                onChange={(event) => onNoShowReasonChange(event.target.value)}
              />
            </Field>
            <Checkbox
              checked={noShowForce}
              id="action-no-show-force"
              label="예약 시작 전 처리 강제"
              onChange={(event) => onNoShowForceChange(event.target.checked)}
            />
          </div>
        ) : null}

        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        {apiError ? <Alert variant="danger">{errorMessage(apiError)}</Alert> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            닫기
          </Button>
          <Button type="button" isLoading={isSaving} onClick={onSubmit}>
            {reservationActionSubmitLabel(action)}
          </Button>
        </div>
      </section>
    </div>
  );
}

function ReservationDetailPanel({
  reservationId,
  detail,
  isPending,
  isError,
  error,
  onClose,
  onOpenAction,
}: {
  reservationId: number | null;
  detail: BusinessReservationDetailResponse | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onClose: () => void;
  onOpenAction: (
    action: ReservationActionKind,
    reservation: BusinessReservationDetailResponse,
  ) => void;
}) {
  if (reservationId === null) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">예약 상세</h2>
        <div className="mt-4">
          <Alert>예약을 선택하면 고객 정보와 요청사항이 표시됩니다.</Alert>
        </div>
      </section>
    );
  }

  if (isPending) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">예약 상세</h2>
        <div className="mt-4">
          <Panel title="예약 상세를 불러오는 중입니다." />
        </div>
      </section>
    );
  }

  if (isError || !detail) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">예약 상세</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="상세 닫기"
            onClick={onClose}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        <div className="mt-4">
          <Alert variant="danger">{errorMessage(error)}</Alert>
        </div>
      </section>
    );
  }

  const canRunActions = isActionableReservationStatus(detail.status);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">예약 상세</h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{detail.reservationNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label={detail.statusLabel} tone={detail.statusTone} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="상세 닫기"
            onClick={onClose}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">예약 정보</h3>
          <dl className="grid gap-2 text-sm">
            <DetailRow
              label="일시"
              value={`${formatDateLabel(detail.visitDate)} ${formatTime(detail.startTime)}-${formatTime(detail.endTime)}`}
            />
            <DetailRow label="상품" value={detail.product.name} />
            <DetailRow label="인원" value={`${detail.partySize}명`} />
            <DetailRow label="접수 경로" value={sourceLabels[detail.source] ?? detail.source} />
            <DetailRow label="액션 가능" value={actionAvailability(detail.status)} />
          </dl>
        </section>

        <section className="grid gap-3 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-semibold">상태 액션</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {actionAvailability(detail.status)}
            </p>
          </div>
          {canRunActions ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => onOpenAction("edit", detail)}>
                <Pencil aria-hidden className="size-4" />
                예약 변경
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenAction("cancel", detail)}
              >
                <Ban aria-hidden className="size-4" />
                매장 취소
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenAction("complete", detail)}
              >
                <CheckCircle2 aria-hidden className="size-4" />
                방문 완료
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenAction("no-show", detail)}
              >
                <UserX aria-hidden className="size-4" />
                노쇼
              </Button>
            </div>
          ) : (
            <Alert>현재 상태에서는 변경 액션을 실행할 수 없습니다.</Alert>
          )}
        </section>

        <section className="grid gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">고객 정보</h3>
          <dl className="grid gap-2 text-sm">
            <DetailRow label="이름" value={detail.customer.name} />
            <DetailRow label="전화번호" value={detail.customer.phoneNumber} />
            <DetailRow
              label="방문/노쇼"
              value={`방문 ${detail.customer.visitCount}회 · 노쇼 ${detail.customer.noShowCount}회`}
            />
          </dl>
          <Alert>VIP/주의 고객 표시는 CRM 단계에서 연결됩니다.</Alert>
        </section>

        <section className="grid gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">요청사항</h3>
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            {detail.customerRequest ?? "등록된 고객 요청사항이 없습니다."}
          </p>
        </section>

        <section className="grid gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">결제 연계</h3>
          <div className="flex flex-wrap gap-2">
            <Flag label={paymentStatusLabel(detail.paymentStatus)} />
            {detail.paymentActionRequired ? <Flag label="후속 확인 필요" tone="danger" /> : null}
          </div>
        </section>

        <section className="grid gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">운영 메모</h3>
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            {detail.ownerNote ?? "등록된 운영 메모가 없습니다."}
          </p>
        </section>

        <section className="grid gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">감사 로그</h3>
          {detail.auditLogs.length > 0 ? (
            <ul className="grid gap-2 text-sm">
              {detail.auditLogs.map((log) => (
                <li className="rounded-md bg-muted px-3 py-2" key={log.id}>
                  <span className="font-medium">{auditActionLabel(log.action)}</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              표시할 변경 이력이 없습니다.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium">{value}</dd>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const className =
    tone === "success"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
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

function Flag({ label, tone = "default" }: { label: string; tone?: "default" | "danger" }) {
  return (
    <span
      className={
        tone === "danger"
          ? "inline-flex rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"
          : "inline-flex rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={
        active
          ? "h-8 rounded px-3 text-sm font-medium text-primary"
          : "h-8 rounded px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      }
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function normalizeStatus(value: string) {
  return value ? (value as BusinessReservationStatus) : null;
}

function toManualReservationRequest(values: ManualReservationFormValues) {
  const productId = Number(values.productId);
  const partySize = Number(values.partySize);
  const customerName = values.customerName.trim();
  const customerPhone = values.customerPhone.replace(/\D/g, "");

  if (!Number.isInteger(productId) || productId < 1) {
    return "예약 상품을 선택해 주세요.";
  }
  if (!values.visitDate) {
    return "방문일을 입력해 주세요.";
  }
  if (!values.startTime) {
    return "방문 시간을 입력해 주세요.";
  }
  if (!Number.isInteger(partySize) || partySize < 1) {
    return "인원은 1명 이상이어야 합니다.";
  }
  if (!customerName) {
    return "고객명을 입력해 주세요.";
  }
  if (customerPhone.length < 8 || customerPhone.length > 20) {
    return "고객 전화번호를 확인해 주세요.";
  }

  return {
    source: values.source,
    productId,
    visitDate: values.visitDate,
    startTime: values.startTime,
    partySize,
    customerName,
    customerPhone,
    customerRequest: values.customerRequest.trim() || null,
  };
}

function toReservationUpdateRequest(values: ReservationEditFormValues) {
  const productId = Number(values.productId);
  const partySize = Number(values.partySize);

  if (!Number.isInteger(productId) || productId < 1) {
    return "예약 상품을 선택해 주세요.";
  }
  if (!values.visitDate) {
    return "방문일을 입력해 주세요.";
  }
  if (!values.startTime) {
    return "방문 시간을 입력해 주세요.";
  }
  if (!Number.isInteger(partySize) || partySize < 1) {
    return "인원은 1명 이상이어야 합니다.";
  }

  return {
    productId,
    visitDate: values.visitDate,
    startTime: values.startTime,
    partySize,
  };
}

function buildProductOptions(
  products: Array<{ id: number; name: string }>,
  reservations: BusinessReservationListItemResponse[],
) {
  const optionMap = new Map<string, string>();

  products.forEach((product) => optionMap.set(String(product.id), product.name));
  reservations.forEach((reservation) =>
    optionMap.set(String(reservation.productId), reservation.productName),
  );

  return [
    { label: "전체 상품", value: "" },
    ...Array.from(optionMap.entries()).map(([value, label]) => ({ label, value })),
  ];
}

function buildCalendarCells(days: BusinessReservationCalendarDayResponse[], from: string) {
  const firstWeekday = parseDateString(from).getDay();
  const leadingBlanks = Array.from({ length: firstWeekday }, () => null);

  return [...leadingBlanks, ...days];
}

function getCalendarRange(selectedDate: string, mode: CalendarMode) {
  const date = parseDateString(selectedDate);

  if (mode === "week") {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
      from: formatDateString(start),
      to: formatDateString(end),
    };
  }

  return {
    from: formatDateString(new Date(date.getFullYear(), date.getMonth(), 1)),
    to: formatDateString(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
}

function addDays(value: string, days: number) {
  const date = parseDateString(value);
  date.setDate(date.getDate() + days);

  return formatDateString(date);
}

function parseDateString(value: string) {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function todayDateString() {
  return formatDateString(new Date());
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(parseDateString(value));
}

function dayOfMonth(value: string) {
  return String(parseDateString(value).getDate());
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function paymentStatusLabel(value: string) {
  return paymentStatusLabels[value] ?? value;
}

function actionAvailability(status: BusinessReservationStatus) {
  if (status === "PENDING") {
    return "확정 후 변경/취소 액션 가능";
  }
  if (status === "CONFIRMED" || status === "MODIFIED") {
    return "변경, 취소, 방문 완료, 노쇼 처리 가능";
  }
  if (status === "COMPLETED") {
    return "방문 완료 처리됨";
  }
  if (status === "NO_SHOW") {
    return "노쇼 처리됨";
  }

  return "취소 처리됨";
}

function isActionableReservationStatus(status: BusinessReservationStatus) {
  return status === "CONFIRMED" || status === "MODIFIED";
}

function reservationActionTitle(action: ReservationActionKind) {
  const titles: Record<ReservationActionKind, string> = {
    edit: "예약 변경",
    cancel: "예약 취소",
    complete: "방문 완료 처리",
    "no-show": "노쇼 처리",
  };

  return titles[action];
}

function reservationActionSubmitLabel(action: ReservationActionKind) {
  const labels: Record<ReservationActionKind, string> = {
    edit: "변경 저장",
    cancel: "취소 처리",
    complete: "방문 완료 처리",
    "no-show": "노쇼 처리",
  };

  return labels[action];
}

function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    "reservation.owner_note_updated": "운영 메모 수정",
    "reservation.updated": "예약 변경",
    "reservation.cancelled_by_customer": "고객 취소",
    "reservation.cancelled_by_restaurant": "매장 취소",
    "reservation.completed": "방문 완료",
    "reservation.no_show": "노쇼",
  };

  return labels[action] ?? action;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
