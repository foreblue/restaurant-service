import { BarChart3, CalendarDays, Clock3, Download, ReceiptText, Table2, X } from "lucide-react";
import { useState } from "react";

import { useToastStore } from "@/components/feedback/toastStore";
import { Alert, Button, DateInput, Field, Select } from "@/components/ui";
import {
  useBusinessAnalyticsProductsQuery,
  useBusinessAnalyticsSummaryQuery,
  useBusinessAnalyticsTimeSlotsQuery,
  useRequestBusinessAnalyticsExportMutation,
} from "@/features/analytics/analyticsQueries";
import { useStoreSettingsQuery } from "@/features/store/storeSettingsQueries";
import {
  type BusinessAnalyticsExportResponse,
  type BusinessAnalyticsExportType,
  type BusinessAnalyticsPeriodQuery,
  type BusinessAnalyticsProductResponse,
  type BusinessAnalyticsSummaryResponse,
  type BusinessAnalyticsTimeSlotResponse,
} from "@/shared/api/businessApiClient";

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

const analyticsExportOptions: Array<{ label: string; value: BusinessAnalyticsExportType }> = [
  { label: "예약 요약", value: "reservation_summary" },
  { label: "결제/환불 요약", value: "payment_refund_summary" },
  { label: "상품별 성과", value: "product_performance" },
  { label: "시간대별 예약률", value: "time_slot_reservation_rate" },
];

const initialPeriod = periodForPreset("LAST_30_DAYS");

export function AnalyticsDashboardPage() {
  const storeSettings = useStoreSettingsQuery();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("LAST_30_DAYS");
  const [from, setFrom] = useState(initialPeriod.from);
  const [to, setTo] = useState(initialPeriod.to);
  const [appliedPeriod, setAppliedPeriod] = useState(initialPeriod);
  const [slotDate, setSlotDate] = useState(initialPeriod.to);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const restaurantId = storeSettings.data?.id ?? null;
  const summaryQuery = useBusinessAnalyticsSummaryQuery(restaurantId, appliedPeriod);
  const timeSlotsQuery = useBusinessAnalyticsTimeSlotsQuery(restaurantId, { date: slotDate });
  const productsQuery = useBusinessAnalyticsProductsQuery(restaurantId, appliedPeriod);
  const exportMutation = useRequestBusinessAnalyticsExportMutation();
  const pushToast = useToastStore((state) => state.pushToast);
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
    setSlotDate(to);
  }

  async function requestExport(type: BusinessAnalyticsExportType) {
    if (restaurantId === null) {
      throw new Error("매장 정보를 불러오지 못했습니다.");
    }

    try {
      const response = await exportMutation.mutateAsync({
        restaurantId,
        request: exportRequestForType(type, appliedPeriod, slotDate),
      });

      pushToast({
        title: "CSV 내보내기 요청이 완료되었습니다.",
        description: `${response.fileName} · ${response.rowCount}행`,
        variant: "success",
      });

      return response;
    } catch (error) {
      pushToast({
        title: "CSV 내보내기 요청에 실패했습니다.",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.",
        variant: "danger",
      });
      throw error;
    }
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
      <AnalyticsDetailSections
        slotDate={slotDate}
        onSlotDateChange={setSlotDate}
        timeSlots={timeSlotsQuery.data ?? null}
        products={productsQuery.data ?? null}
        isTimeSlotsLoading={timeSlotsQuery.isLoading}
        isProductsLoading={productsQuery.isLoading}
        isTimeSlotsError={timeSlotsQuery.isError}
        isProductsError={productsQuery.isError}
        onOpenExport={() => {
          exportMutation.reset();
          setExportDialogOpen(true);
        }}
      />
      {exportDialogOpen ? (
        <AnalyticsExportDialog
          period={appliedPeriod}
          slotDate={slotDate}
          isPending={exportMutation.isPending}
          onClose={() => setExportDialogOpen(false)}
          onRequest={requestExport}
        />
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

function AnalyticsDetailSections({
  slotDate,
  onSlotDateChange,
  timeSlots,
  products,
  isTimeSlotsLoading,
  isProductsLoading,
  isTimeSlotsError,
  isProductsError,
  onOpenExport,
}: {
  slotDate: string;
  onSlotDateChange: (value: string) => void;
  timeSlots: BusinessAnalyticsTimeSlotResponse | null;
  products: BusinessAnalyticsProductResponse | null;
  isTimeSlotsLoading: boolean;
  isProductsLoading: boolean;
  isTimeSlotsError: boolean;
  isProductsError: boolean;
  onOpenExport: () => void;
}) {
  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Clock3 aria-hidden className="size-4" />
              시간대별 예약률
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              방문일 기준 예약 인원을 좌석 수용량과 비교합니다.
            </p>
          </div>
          <Field id="analytics-slot-date" label="시간대 기준일">
            <DateInput
              id="analytics-slot-date"
              value={slotDate}
              onChange={(event) => onSlotDateChange(event.target.value)}
            />
          </Field>
        </div>

        {isTimeSlotsError ? (
          <div className="mt-4">
            <Alert variant="danger">시간대별 예약률을 불러오지 못했습니다.</Alert>
          </div>
        ) : null}
        {isTimeSlotsLoading && !timeSlots ? (
          <p className="mt-4 text-sm text-muted-foreground">시간대별 예약률을 불러오는 중입니다.</p>
        ) : null}
        {timeSlots ? <AnalyticsTimeSlotTable timeSlots={timeSlots} /> : null}
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Table2 aria-hidden className="size-4" />
              상품별 성과
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              예약, 방문, 취소, 노쇼와 결제/환불 지표를 상품 단위로 확인합니다.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onOpenExport}>
            <Download aria-hidden className="size-4" />
            CSV 내보내기
          </Button>
        </div>

        {products ? (
          <div className="mt-4">
            <Alert title="정산 기준 아님">{products.settlementNotice}</Alert>
          </div>
        ) : null}
        {isProductsError ? (
          <div className="mt-4">
            <Alert variant="danger">상품별 성과를 불러오지 못했습니다.</Alert>
          </div>
        ) : null}
        {isProductsLoading && !products ? (
          <p className="mt-4 text-sm text-muted-foreground">상품별 성과를 불러오는 중입니다.</p>
        ) : null}
        {products ? <AnalyticsProductTable products={products} /> : null}
      </section>
    </div>
  );
}

function AnalyticsTimeSlotTable({ timeSlots }: { timeSlots: BusinessAnalyticsTimeSlotResponse }) {
  if (timeSlots.slots.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">조회된 시간대가 없습니다.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm" aria-label="시간대별 예약률 표">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">시간대</th>
            <th className="py-2 pr-4 font-medium">예약 인원</th>
            <th className="py-2 pr-4 font-medium">수용량</th>
            <th className="py-2 font-medium">예약률</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {timeSlots.slots.map((slot) => (
            <tr key={`${slot.startTime}-${slot.endTime}`}>
              <td className="py-3 pr-4 font-medium">
                {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
              </td>
              <td className="py-3 pr-4">{slot.reserved}명</td>
              <td className="py-3 pr-4">{slot.capacity}명</td>
              <td className="py-3">
                <div className="flex min-w-48 items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(slot.reservationRate, 1) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium">
                    {formatRate(slot.reservationRate)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted-foreground">
        기준일 {formatDateLabel(timeSlots.date)} · {basisLabel(timeSlots.metricBasis)} · 최근 갱신{" "}
        {formatDateTime(timeSlots.generatedAt)}
      </p>
    </div>
  );
}

function AnalyticsProductTable({ products }: { products: BusinessAnalyticsProductResponse }) {
  if (products.items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">조회된 상품별 성과가 없습니다.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-[860px] text-left text-sm" aria-label="상품별 성과 표">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">상품</th>
            <th className="py-2 pr-4 font-medium">예약</th>
            <th className="py-2 pr-4 font-medium">방문</th>
            <th className="py-2 pr-4 font-medium">취소</th>
            <th className="py-2 pr-4 font-medium">노쇼</th>
            <th className="py-2 pr-4 font-medium">결제</th>
            <th className="py-2 pr-4 font-medium">환불</th>
            <th className="py-2 pr-4 font-medium">순액</th>
            <th className="py-2 font-medium">평균 인원</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.items.map((product) => (
            <tr key={product.reservationProductId}>
              <td className="py-3 pr-4 font-medium">{product.name}</td>
              <td className="py-3 pr-4">{product.reservations}건</td>
              <td className="py-3 pr-4">{product.completed}건</td>
              <td className="py-3 pr-4">{product.cancelled}건</td>
              <td className="py-3 pr-4">{product.noShow}건</td>
              <td className="py-3 pr-4">{formatPrice(product.paymentAmount)}</td>
              <td className="py-3 pr-4">{formatPrice(product.refundAmount)}</td>
              <td className="py-3 pr-4 font-medium">{formatPrice(product.netAmount)}</td>
              <td className="py-3">{formatPartySize(product.averagePartySize)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted-foreground">
        {formatDateLabel(products.period.from)}-{formatDateLabel(products.period.to)} · 예약{" "}
        {basisLabel(products.reservationMetricBasis)} · 결제{" "}
        {basisLabel(products.paymentMetricBasis)} · 환불 {basisLabel(products.refundMetricBasis)}
      </p>
    </div>
  );
}

function AnalyticsExportDialog({
  period,
  slotDate,
  isPending,
  onClose,
  onRequest,
}: {
  period: BusinessAnalyticsPeriodQuery;
  slotDate: string;
  isPending: boolean;
  onClose: () => void;
  onRequest: (type: BusinessAnalyticsExportType) => Promise<BusinessAnalyticsExportResponse>;
}) {
  const [exportType, setExportType] = useState<BusinessAnalyticsExportType>("reservation_summary");
  const [result, setResult] = useState<BusinessAnalyticsExportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitExport() {
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await onRequest(exportType);
      setResult(response);
    } catch {
      setErrorMessage("CSV 내보내기 요청에 실패했습니다.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        aria-labelledby="analytics-export-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          void submitExport();
        }}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="analytics-export-title" className="text-lg font-semibold">
              CSV 내보내기
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              운영 통계 원자료를 선택한 기준으로 생성합니다.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
            <X aria-hidden className="size-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <Field id="analytics-export-type" label="CSV 타입">
            <Select
              id="analytics-export-type"
              value={exportType}
              options={analyticsExportOptions}
              onChange={(event) => {
                setExportType(event.target.value as BusinessAnalyticsExportType);
                setResult(null);
                setErrorMessage(null);
              }}
            />
          </Field>

          <div className="rounded-md border border-border bg-background p-3 text-sm">
            <p className="text-xs text-muted-foreground">내보내기 범위</p>
            <p className="mt-1 font-medium">{exportScopeLabel(exportType, period, slotDate)}</p>
          </div>

          <Alert title="개인정보 마스킹 안내">
            기본 CSV에는 고객 전화번호 전체, 이메일, 상세 요청사항을 포함하지 않습니다.
          </Alert>
          <Alert title="리포트 구분">
            CSV 파일은 운영 참고용 원자료이며 정산 자동화 리포트가 아닙니다.
          </Alert>

          {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
          {result ? (
            <div className="rounded-md border border-border bg-background p-3 text-sm">
              <p className="font-medium">{result.fileName}</p>
              <p className="mt-1 text-muted-foreground">
                {result.rowCount}행 · {exportStatusLabel(result.status)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{result.privacyNotice}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" isLoading={isPending}>
            내보내기 요청
          </Button>
        </div>
      </form>
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

function exportRequestForType(
  type: BusinessAnalyticsExportType,
  period: BusinessAnalyticsPeriodQuery,
  slotDate: string,
) {
  if (type === "time_slot_reservation_rate") {
    return { type, date: slotDate };
  }

  return { type, from: period.from ?? null, to: period.to ?? null };
}

function exportScopeLabel(
  type: BusinessAnalyticsExportType,
  period: BusinessAnalyticsPeriodQuery,
  slotDate: string,
) {
  if (type === "time_slot_reservation_rate") {
    return `${formatDateLabel(slotDate)} 시간대`;
  }

  return `${formatDateLabel(period.from ?? slotDate)}-${formatDateLabel(period.to ?? slotDate)}`;
}

function exportStatusLabel(value: string) {
  const labels: Record<string, string> = {
    PROCESSING: "생성 중",
    COMPLETED: "생성 완료",
    FAILED: "생성 실패",
  };

  return labels[value] ?? value;
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

function formatTime(value: string) {
  return value.slice(0, 5);
}

function formatPartySize(value: number) {
  if (value <= 0) {
    return "-";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}명`;
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
