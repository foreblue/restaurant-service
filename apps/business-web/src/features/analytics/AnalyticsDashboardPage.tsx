import { BarChart3, CalendarDays, Clock3, ReceiptText } from "lucide-react";
import { useState } from "react";

import { Alert, Button, DateInput, Field, Select } from "@/components/ui";
import { useBusinessAnalyticsSummaryQuery } from "@/features/analytics/analyticsQueries";
import { useStoreSettingsQuery } from "@/features/store/storeSettingsQueries";
import { type BusinessAnalyticsSummaryResponse } from "@/shared/api/businessApiClient";

type PeriodPreset =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "CUSTOM";

const periodPresetOptions: Array<{ label: string; value: PeriodPreset }> = [
  { label: "오늘", value: "TODAY" },
  { label: "어제", value: "YESTERDAY" },
  { label: "최근 7일", value: "LAST_7_DAYS" },
  { label: "최근 30일", value: "LAST_30_DAYS" },
  { label: "이번 달", value: "THIS_MONTH" },
  { label: "지난 달", value: "LAST_MONTH" },
  { label: "사용자 지정", value: "CUSTOM" },
];

const initialPeriod = periodForPreset("LAST_30_DAYS");

export function AnalyticsDashboardPage() {
  const storeSettings = useStoreSettingsQuery();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("LAST_30_DAYS");
  const [from, setFrom] = useState(initialPeriod.from);
  const [to, setTo] = useState(initialPeriod.to);
  const [appliedPeriod, setAppliedPeriod] = useState(initialPeriod);
  const restaurantId = storeSettings.data?.id ?? null;
  const summaryQuery = useBusinessAnalyticsSummaryQuery(restaurantId, appliedPeriod);
  const summary = summaryQuery.data ?? null;

  function changePreset(value: PeriodPreset) {
    setPeriodPreset(value);

    if (value !== "CUSTOM") {
      const nextPeriod = periodForPreset(value);
      setFrom(nextPeriod.from);
      setTo(nextPeriod.to);
    }
  }

  function applyPeriod() {
    setAppliedPeriod({ from, to });
  }

  return (
    <>
      <header className="border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <BarChart3 aria-hidden className="size-4" />
              운영 통계
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">운영 통계</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {storeSettings.data?.name ?? "매장"} 단일 매장의 예약 성과를 기간별로 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Clock3 aria-hidden className="size-4 text-primary" />
            최근 갱신 {formatDateTime(summary?.generatedAt ?? null)}
          </div>
        </div>
      </header>

      <section
        className="grid gap-3 py-5 lg:grid-cols-[220px_180px_180px_auto]"
        aria-label="기간 필터"
      >
        <Field id="analytics-period-preset" label="기간">
          <Select
            id="analytics-period-preset"
            value={periodPreset}
            options={periodPresetOptions}
            onChange={(event) => changePreset(event.target.value as PeriodPreset)}
          />
        </Field>
        <Field id="analytics-from" label="시작일">
          <DateInput
            id="analytics-from"
            value={from}
            onChange={(event) => {
              setPeriodPreset("CUSTOM");
              setFrom(event.target.value);
            }}
          />
        </Field>
        <Field id="analytics-to" label="종료일">
          <DateInput
            id="analytics-to"
            value={to}
            onChange={(event) => {
              setPeriodPreset("CUSTOM");
              setTo(event.target.value);
            }}
          />
        </Field>
        <div className="flex items-end">
          <Button type="button" onClick={applyPeriod} isLoading={summaryQuery.isFetching}>
            조회
          </Button>
        </div>
      </section>

      {storeSettings.isError ? (
        <Alert variant="danger">매장 정보를 불러오지 못했습니다.</Alert>
      ) : null}
      {summaryQuery.isError ? (
        <Alert variant="danger">운영 통계를 불러오지 못했습니다.</Alert>
      ) : null}
      {summary ? <AnalyticsSummary summary={summary} /> : null}
      {!summary && (storeSettings.isLoading || summaryQuery.isLoading) ? (
        <Panel title="운영 통계를 불러오는 중입니다." />
      ) : null}
    </>
  );
}

function AnalyticsSummary({ summary }: { summary: BusinessAnalyticsSummaryResponse }) {
  const metricCards = [
    {
      label: "예약 수",
      value: `${summary.reservations.total}건`,
      detail: `확정 ${summary.reservations.confirmed + summary.reservations.modified}건`,
      icon: CalendarDays,
    },
    {
      label: "방문 완료",
      value: `${summary.reservations.completed}건`,
      detail: `완료율 ${formatRate(summary.rates.completionRate)}`,
      icon: BarChart3,
    },
    {
      label: "취소 수",
      value: `${summary.reservations.cancelled}건`,
      detail: `고객 ${summary.reservations.cancelledByCustomer}건 · 매장 ${summary.reservations.cancelledByRestaurant}건`,
      icon: CalendarDays,
    },
    {
      label: "노쇼 수",
      value: `${summary.reservations.noShow}건`,
      detail: `노쇼율 ${formatRate(summary.rates.noShowRate)}`,
      icon: CalendarDays,
    },
    {
      label: "예약금 매출",
      value: formatPrice(summary.payments.depositAmount + summary.payments.prepaidAmount),
      detail: `순 예약금 ${formatPrice(summary.payments.netAmount)}`,
      icon: ReceiptText,
    },
    {
      label: "환불 금액",
      value: formatPrice(summary.payments.refundAmount),
      detail: `환불 완료 ${summary.payments.refundCount}건`,
      icon: ReceiptText,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="핵심 지표">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold">지표 기준</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <BasisItem label="예약 지표" value={basisLabel(summary.reservationMetricBasis)} />
            <BasisItem label="결제 지표" value={basisLabel(summary.paymentMetricBasis)} />
            <BasisItem label="환불 지표" value={basisLabel(summary.refundMetricBasis)} />
          </dl>
          <div className="mt-4">
            <Alert title="정산 기준 아님">{summary.settlementNotice}</Alert>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold">조회 기준일</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <BasisItem label="시작일" value={formatDateLabel(summary.period.from)} />
            <BasisItem label="종료일" value={formatDateLabel(summary.period.to)} />
            <BasisItem label="최근 갱신" value={formatDateTime(summary.generatedAt)} />
          </dl>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof BarChart3;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon aria-hidden className="size-4 text-muted-foreground" />
      </div>
      <strong className="mt-3 block text-2xl font-semibold">{value}</strong>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </article>
  );
}

function BasisItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Panel({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
    </section>
  );
}

function periodForPreset(preset: PeriodPreset) {
  const today = dateString(new Date());
  const todayDate = parseDate(today);

  if (preset === "TODAY") {
    return { from: today, to: today };
  }
  if (preset === "YESTERDAY") {
    const yesterday = addDays(todayDate, -1);
    return { from: yesterday, to: yesterday };
  }
  if (preset === "LAST_7_DAYS") {
    return { from: addDays(todayDate, -6), to: today };
  }
  if (preset === "THIS_MONTH") {
    return { from: monthStart(todayDate), to: today };
  }
  if (preset === "LAST_MONTH") {
    const firstDay = parseDate(monthStart(todayDate));
    const lastMonthLastDay = parseDate(addDays(firstDay, -1));
    return { from: monthStart(lastMonthLastDay), to: dateString(lastMonthLastDay) };
  }

  return { from: addDays(todayDate, -29), to: today };
}

function dateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00+09:00`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return dateString(next);
}

function monthStart(date: Date) {
  return dateString(new Date(date.getFullYear(), date.getMonth(), 1));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRate(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parseDate(value));
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

function basisLabel(value: string) {
  const labels: Record<string, string> = {
    VISIT_DATE: "방문일 기준",
    PAID_AT: "결제일 기준",
    SUCCEEDED_AT: "환불 완료일 기준",
  };

  return labels[value] ?? value;
}
