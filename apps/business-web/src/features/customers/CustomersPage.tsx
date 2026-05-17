import { type ColumnDef } from "@tanstack/react-table";
import { CalendarCheck, Search, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import {
  useBusinessCustomerDetailQuery,
  useBusinessCustomerReservationsQuery,
  useBusinessCustomersQuery,
} from "@/features/customers/customerQueries";
import {
  type BusinessCustomerListItemResponse,
  type BusinessCustomerReservationHistoryItemResponse,
  type BusinessCustomerSegment,
} from "@/shared/api/businessApiClient";

const segmentOptions: Array<{ label: string; value: BusinessCustomerSegment }> = [
  { label: "전체 고객", value: "ALL" },
  { label: "방문 이력 있음", value: "HAS_VISIT_HISTORY" },
  { label: "노쇼 이력 있음", value: "HAS_NO_SHOW" },
  { label: "알레르기/기념일 있음", value: "HAS_PREFERENCES" },
];

const emptyCustomers: BusinessCustomerListItemResponse[] = [];

export function CustomersPage() {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<BusinessCustomerSegment>("ALL");
  const [userSelectedCustomerId, setUserSelectedCustomerId] = useState<number | null>(null);
  const customersQuery = useBusinessCustomersQuery({
    query: query || null,
    segment,
  });
  const customers = customersQuery.data?.items ?? emptyCustomers;
  const selectedCustomerId = customers.some((customer) => customer.id === userSelectedCustomerId)
    ? userSelectedCustomerId
    : (customers[0]?.id ?? null);
  const customerDetailQuery = useBusinessCustomerDetailQuery(selectedCustomerId);
  const reservationHistoryQuery = useBusinessCustomerReservationsQuery(selectedCustomerId);
  const selectedCustomer = customerDetailQuery.data ?? null;
  const reservationHistory = reservationHistoryQuery.data?.items ?? [];

  const columns = useMemo<Array<ColumnDef<BusinessCustomerListItemResponse>>>(
    () => [
      {
        accessorKey: "name",
        header: "고객",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.phoneMasked}</p>
          </div>
        ),
      },
      {
        accessorKey: "totalReservations",
        header: "예약/방문",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.totalReservations}건</p>
            <p className="text-xs text-muted-foreground">
              방문 {row.original.completedCount} · 노쇼 {row.original.noShowCount}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "lastVisitedAt",
        header: "최근 방문",
        cell: ({ row }) => formatDateTime(row.original.lastVisitedAt),
      },
      {
        accessorKey: "nextReservationAt",
        header: "다음 예약",
        cell: ({ row }) => formatDateTime(row.original.nextReservationAt),
      },
      {
        id: "preferences",
        header: "고객 정보",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            {row.original.allergySummary ? (
              <Flag label={`알레르기 ${row.original.allergySummary}`} />
            ) : null}
            {row.original.anniversarySummary ? (
              <Flag label={`기념일 ${row.original.anniversarySummary}`} />
            ) : null}
            {row.original.noShowCount > 0 ? <Flag label="노쇼 이력" tone="danger" /> : null}
          </div>
        ),
      },
      {
        id: "detail",
        header: "상세",
        cell: ({ row }) => (
          <Button
            type="button"
            variant={row.original.id === selectedCustomerId ? "secondary" : "ghost"}
            size="sm"
            aria-label={`${row.original.name} 고객 상세 보기`}
            onClick={() => setUserSelectedCustomerId(row.original.id)}
          >
            상세
          </Button>
        ),
      },
    ],
    [selectedCustomerId],
  );

  return (
    <>
      <header className="border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">고객 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              매장 단위 고객 이력과 예약 운영에 필요한 요청사항을 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden className="size-4 text-primary" />
            목록 연락처 마스킹
          </div>
        </div>
      </header>

      <section className="grid gap-3 py-5 md:grid-cols-4" aria-label="고객 요약">
        <Metric
          label="전체 고객"
          value={`${customersQuery.data?.summary.totalCount ?? 0}명`}
          icon={UserRound}
        />
        <Metric
          label="방문 이력"
          value={`${customersQuery.data?.summary.visitedCount ?? 0}명`}
          icon={CalendarCheck}
        />
        <Metric label="노쇼 이력" value={`${customersQuery.data?.summary.noShowCount ?? 0}명`} />
        <Metric
          label="알레르기/기념일"
          value={`${customersQuery.data?.summary.preferenceCount ?? 0}명`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]" aria-label="고객 목록">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Field id="customer-search" label="고객 검색">
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="customer-search"
                  className="pl-9"
                  placeholder="고객명, 연락처, 요청사항"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </Field>
            <Field id="customer-segment" label="필터">
              <Select
                id="customer-segment"
                value={segment}
                options={segmentOptions}
                onChange={(event) => setSegment(event.target.value as BusinessCustomerSegment)}
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setSegment("ALL");
                }}
              >
                초기화
              </Button>
            </div>
          </div>

          {customersQuery.isError ? (
            <Alert variant="danger">고객 목록을 불러오지 못했습니다.</Alert>
          ) : (
            <DataTable
              columns={columns}
              data={customers}
              emptyMessage={
                customersQuery.isLoading
                  ? "고객 목록을 불러오는 중입니다."
                  : "조건에 맞는 고객이 없습니다."
              }
              getRowId={(row) => String(row.id)}
            />
          )}
        </div>

        <CustomerDetailPanel
          customer={selectedCustomer}
          reservations={reservationHistory}
          isLoading={customerDetailQuery.isLoading || reservationHistoryQuery.isLoading}
          isError={customerDetailQuery.isError || reservationHistoryQuery.isError}
        />
      </section>
    </>
  );
}

function CustomerDetailPanel({
  customer,
  reservations,
  isLoading,
  isError,
}: {
  customer: ReturnType<typeof useBusinessCustomerDetailQuery>["data"] | null;
  reservations: BusinessCustomerReservationHistoryItemResponse[];
  isLoading: boolean;
  isError: boolean;
}) {
  if (isError) {
    return <Alert variant="danger">고객 상세 정보를 불러오지 못했습니다.</Alert>;
  }

  if (isLoading) {
    return (
      <aside className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">고객 상세를 불러오는 중입니다.</p>
      </aside>
    );
  }

  if (!customer) {
    return (
      <aside className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <Alert>고객을 선택하면 상세 이력과 요청사항이 표시됩니다.</Alert>
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{customer.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{customer.phoneNumber}</p>
          </div>
          <Flag label="상세 개인정보" tone="warning" />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <DetailItem label="예약" value={`${customer.totalReservations}건`} />
          <DetailItem label="방문" value={`${customer.visitCount}회`} />
          <DetailItem label="노쇼" value={`${customer.noShowCount}회`} />
          <DetailItem label="취소" value={`${customer.cancelledCount}회`} />
          <DetailItem label="최근 방문" value={formatDateTime(customer.lastVisitedAt)} />
          <DetailItem label="다음 예약" value={formatDateTime(customer.nextReservationAt)} />
        </dl>

        <Alert title="개인정보 표시 기준">{customer.privacyNotice}</Alert>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">요청사항/알레르기/기념일</h3>
        <div className="mt-3 grid gap-3">
          <InfoBlock
            label="최근 요청사항"
            values={customer.recentRequests}
            emptyMessage="등록된 요청사항이 없습니다."
          />
          <InfoBlock
            label="알레르기"
            values={customer.allergies}
            emptyMessage="등록된 알레르기 정보가 없습니다."
          />
          <InfoBlock
            label="기념일"
            values={customer.anniversaries.map(
              (anniversary) => `${anniversary.label} ${anniversary.date}`,
            )}
            emptyMessage="등록된 기념일 정보가 없습니다."
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">예약 이력</h3>
        <div className="mt-3 divide-y divide-border">
          {reservations.length > 0 ? (
            reservations.map((reservation) => (
              <ReservationHistoryItem key={reservation.id} reservation={reservation} />
            ))
          ) : (
            <p className="py-3 text-sm text-muted-foreground">예약 이력이 없습니다.</p>
          )}
        </div>
      </section>
    </aside>
  );
}

function ReservationHistoryItem({
  reservation,
}: {
  reservation: BusinessCustomerReservationHistoryItemResponse;
}) {
  return (
    <article className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{reservation.productName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateLabel(reservation.visitDate)} {formatTime(reservation.startTime)} ·{" "}
            {reservation.partySize}명 · {sourceLabel(reservation.source)}
          </p>
        </div>
        <StatusBadge label={reservation.statusLabel} tone={reservation.statusTone} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {reservation.customerRequest ? <Flag label={reservation.customerRequest} /> : null}
        {reservation.allergyNote ? <Flag label={`알레르기 ${reservation.allergyNote}`} /> : null}
        {reservation.anniversaryNote ? (
          <Flag label={`기념일 ${reservation.anniversaryNote}`} />
        ) : null}
      </div>
    </article>
  );
}

function InfoBlock({
  label,
  values,
  emptyMessage,
}: {
  label: string;
  values: string[];
  emptyMessage: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {values.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <Flag key={value} label={value} />
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof UserRound;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon ? <Icon aria-hidden className="size-4 text-muted-foreground" /> : null}
      </div>
      <strong className="mt-3 block text-2xl font-semibold">{value}</strong>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Flag({ label, tone = "info" }: { label: string; tone?: "info" | "danger" | "warning" }) {
  const toneClassName = {
    info: "bg-muted text-muted-foreground",
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-accent text-accent-foreground",
  }[tone];

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-medium ${toneClassName}`}>{label}</span>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const toneClassName: Record<string, string> = {
    success: "bg-primary/10 text-primary",
    warning: "bg-accent text-accent-foreground",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-medium ${toneClassName[tone] ?? toneClassName.info}`}
    >
      {label}
    </span>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function sourceLabel(value: string) {
  const labels: Record<string, string> = {
    ONLINE: "온라인",
    MANUAL_PHONE: "전화",
    MANUAL_WALK_IN: "현장",
  };

  return labels[value] ?? value;
}
