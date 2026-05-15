import { type ColumnDef } from "@tanstack/react-table";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { Alert, Button, Checkbox, DateInput, Field, Input, Select } from "@/components/ui";
import { useReservationProductsQuery } from "@/features/products/reservationProductsQueries";
import {
  useBusinessReservationCalendarQuery,
  useBusinessReservationsQuery,
} from "@/features/reservations/reservationOperationsQueries";
import {
  type BusinessReservationCalendarDayResponse,
  type BusinessReservationListItemResponse,
  type BusinessReservationStatus,
} from "@/shared/api/businessApiClient";

type CalendarMode = "week" | "month";

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
  const productsQuery = useReservationProductsQuery();
  const productOptions = useMemo(
    () => buildProductOptions(productsQuery.data ?? [], reservationsQuery.data?.items ?? []),
    [productsQuery.data, reservationsQuery.data?.items],
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
                      <span className="font-mono text-sm font-medium">{dayOfMonth(cell.date)}</span>
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
      </section>
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
