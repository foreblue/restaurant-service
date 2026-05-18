import {
  CalendarClock,
  CircleCheck,
  CreditCard,
  Package,
  Settings,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui";
import { useBusinessAnalyticsSummaryQuery } from "@/features/analytics/analyticsQueries";
import { useReservationProductsQuery } from "@/features/products/reservationProductsQueries";
import { useBusinessReservationsQuery } from "@/features/reservations/reservationOperationsQueries";
import { useStoreSettingsQuery } from "@/features/store/storeSettingsQueries";
import { cn } from "@/lib/utils";
import {
  type BusinessReservationListItemResponse,
  type BusinessReservationStatus,
  type RestaurantSettingsResponse,
} from "@/shared/api/businessApiClient";

const activeReservationStatuses = new Set<BusinessReservationStatus>([
  "PENDING",
  "CONFIRMED",
  "MODIFIED",
]);

export function DashboardPage() {
  const today = formatLocalDate(new Date());
  const todayLabel = new Intl.DateTimeFormat("ko-KR", { dateStyle: "full" }).format(new Date());
  const storeSettingsQuery = useStoreSettingsQuery();
  const productsQuery = useReservationProductsQuery();
  const reservationsQuery = useBusinessReservationsQuery({ date: today, includeCancelled: true });
  const restaurantId = storeSettingsQuery.data?.id ?? null;
  const analyticsQuery = useBusinessAnalyticsSummaryQuery(restaurantId, { from: today, to: today });
  const reservationSummary = reservationsQuery.data?.summary ?? null;
  const reservations = reservationsQuery.data?.items ?? [];
  const upcomingReservations = reservations
    .filter((reservation) => activeReservationStatuses.has(reservation.status))
    .sort(compareReservationsByVisitTime)
    .slice(0, 5);
  const activeProducts = (productsQuery.data ?? []).filter(
    (product) => product.status !== "DELETED" && product.visible,
  );
  const hasLoadError =
    storeSettingsQuery.isError ||
    productsQuery.isError ||
    reservationsQuery.isError ||
    analyticsQuery.isError;

  return (
    <>
      <header className="border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">운영 현황</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {storeSettingsQuery.data?.name ?? "매장"} · {todayLabel}
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition hover:bg-muted"
            to="/reservations"
            aria-label="예약 운영 화면으로 이동"
          >
            <CalendarClock aria-hidden className="size-4" />
            예약 운영
          </Link>
        </div>
      </header>

      {hasLoadError ? (
        <div className="pt-5">
          <Alert variant="danger">
            대시보드 데이터를 불러오지 못했습니다. API 연결과 로그인 세션을 확인해 주세요.
          </Alert>
        </div>
      ) : null}

      <section className="grid gap-3 py-5 md:grid-cols-2 xl:grid-cols-4" aria-label="핵심 지표">
        <MetricCard
          icon={CalendarClock}
          label="오늘 예약"
          value={formatCount(
            reservationSummary?.totalReservations,
            "건",
            reservationsQuery.isLoading,
          )}
          detail={`확정 ${reservationSummary?.confirmedCount ?? 0}건 · 변경 ${
            reservationSummary?.modifiedCount ?? 0
          }건`}
          tone="text-teal-700"
        />
        <MetricCard
          icon={UsersRound}
          label="방문 예정"
          value={formatCount(
            upcomingReservations.reduce((sum, item) => sum + item.partySize, 0),
            "명",
            reservationsQuery.isLoading,
          )}
          detail={
            upcomingReservations[0]
              ? `다음 ${formatTime(upcomingReservations[0].startTime)}`
              : "예정 예약 없음"
          }
          tone="text-amber-700"
        />
        <MetricCard
          icon={CircleCheck}
          label="방문 완료"
          value={formatCount(reservationSummary?.completedCount, "건", reservationsQuery.isLoading)}
          detail={`완료율 ${formatRate(analyticsQuery.data?.rates.completionRate ?? 0)}`}
          tone="text-emerald-700"
        />
        <MetricCard
          icon={CreditCard}
          label="결제 순액"
          value={
            analyticsQuery.isLoading
              ? "불러오는 중"
              : formatCurrency(analyticsQuery.data?.payments.netAmount ?? 0)
          }
          detail={`결제 ${formatCurrency(analyticsQuery.data?.payments.paymentAmount ?? 0)}`}
          tone="text-sky-700"
        />
      </section>

      <section
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
        aria-label="예약 운영"
        id="reservations"
      >
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-base font-semibold">오늘 예약</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateLabel(today)} 기준 DB 예약 목록
              </p>
            </div>
            <Link
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              to="/reservations"
            >
              <CircleCheck aria-hidden className="size-4" />
              상태 확인
            </Link>
          </div>
          <div className="divide-y divide-border">
            {reservationsQuery.isLoading ? (
              <EmptyReservationRow message="예약 데이터를 불러오는 중입니다." />
            ) : upcomingReservations.length > 0 ? (
              upcomingReservations.map((reservation) => (
                <ReservationTimelineRow key={reservation.id} reservation={reservation} />
              ))
            ) : (
              <EmptyReservationRow message="오늘 예정된 예약이 없습니다." />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">운영 체크</h2>
            <Link
              className="flex size-9 items-center justify-center rounded-md border border-input text-muted-foreground transition hover:bg-muted hover:text-foreground"
              to="/store"
              aria-label="운영 설정"
            >
              <Settings aria-hidden className="size-4" />
            </Link>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <CheckRow
              label="매장 상태"
              value={restaurantStatusLabel(storeSettingsQuery.data?.status)}
              strong={storeSettingsQuery.data?.status === "APPROVED"}
            />
            <CheckRow
              label="예약 페이지"
              value={reservationPageStatusLabel(storeSettingsQuery.data)}
              strong={storeSettingsQuery.data?.reservationPage?.status === "PUBLIC"}
            />
            <CheckRow
              label="노출 상품"
              value={
                productsQuery.isLoading
                  ? "불러오는 중"
                  : `${activeProducts.length.toLocaleString()}개`
              }
              strong={activeProducts.length > 0}
            />
            <CheckRow
              label="오늘 취소/노쇼"
              value={`${reservationSummary?.cancelledCount ?? 0}건 · ${
                reservationSummary?.noShowCount ?? 0
              }건`}
              strong={
                (reservationSummary?.cancelledCount ?? 0) +
                  (reservationSummary?.noShowCount ?? 0) ===
                0
              }
            />
          </dl>
          <Link
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition hover:bg-muted"
            to="/products"
          >
            <Package aria-hidden className="size-4" />
            예약 상품 관리
          </Link>
        </div>
      </section>
    </>
  );
}

interface MetricCardProps {
  icon: typeof CalendarClock;
  label: string;
  value: string;
  detail: string;
  tone: string;
}

function MetricCard({ icon: Icon, label, value, detail, tone }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon aria-hidden className={cn("size-4", tone)} />
      </div>
      <div className="mt-3">
        <strong className="block text-3xl font-semibold">{value}</strong>
        <span className={cn("mt-2 block text-xs font-medium", tone)}>{detail}</span>
      </div>
    </article>
  );
}

function ReservationTimelineRow({
  reservation,
}: {
  reservation: BusinessReservationListItemResponse;
}) {
  return (
    <div className="grid min-h-16 grid-cols-[72px_1fr_auto] items-center gap-3 px-4 py-3">
      <span className="font-mono text-sm text-muted-foreground">
        {formatTime(reservation.startTime)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{reservation.customer.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {reservation.productName} · {reservation.partySize}명
        </p>
      </div>
      <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
        {reservation.statusLabel}
      </span>
    </div>
  );
}

function EmptyReservationRow({ message }: { message: string }) {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{message}</div>;
}

function CheckRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-medium", strong ? "text-teal-700" : "text-foreground")}>
        {value}
      </dd>
    </div>
  );
}

function formatCount(value: number | null | undefined, suffix: string, isLoading: boolean) {
  if (isLoading) {
    return "불러오는 중";
  }

  return `${(value ?? 0).toLocaleString()}${suffix}`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseLocalDate(value));
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function formatRate(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    currency: "KRW",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function compareReservationsByVisitTime(
  left: BusinessReservationListItemResponse,
  right: BusinessReservationListItemResponse,
) {
  return `${left.visitDate}T${left.startTime}`.localeCompare(
    `${right.visitDate}T${right.startTime}`,
  );
}

function restaurantStatusLabel(status: RestaurantSettingsResponse["status"] | undefined) {
  const labels: Record<RestaurantSettingsResponse["status"], string> = {
    APPROVAL_REQUESTED: "승인 대기",
    APPROVED: "승인 완료",
    DRAFT: "작성 중",
    REJECTED: "반려",
    SUSPENDED: "정지",
  };

  return status ? labels[status] : "불러오는 중";
}

function reservationPageStatusLabel(restaurant: RestaurantSettingsResponse | undefined) {
  if (!restaurant) {
    return "불러오는 중";
  }

  if (!restaurant.reservationPage) {
    return "미설정";
  }

  return restaurant.reservationPage.status === "PUBLIC" ? "공개" : "비공개";
}
