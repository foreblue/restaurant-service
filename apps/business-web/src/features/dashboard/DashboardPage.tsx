import { CircleCheck, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const metrics = [
  { label: "오늘 예약", value: "18", delta: "+4", tone: "text-teal-700" },
  { label: "방문 예정", value: "42명", delta: "12:30 피크", tone: "text-amber-700" },
  { label: "승인 대기", value: "2", delta: "서류 확인", tone: "text-rose-700" },
];

const timeline = [
  { time: "12:00", name: "라온테이블", guests: "4명", status: "확정" },
  { time: "12:30", name: "서연", guests: "2명", status: "요청 확인" },
  { time: "13:00", name: "민준", guests: "6명", status: "결제 대기" },
];

export function DashboardPage() {
  const todayLabel = new Intl.DateTimeFormat("ko-KR", { dateStyle: "full" }).format(new Date());

  return (
    <>
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-normal">운영 현황</h1>
        <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
      </header>

      <section className="grid gap-3 py-5 sm:grid-cols-3" aria-label="핵심 지표">
        {metrics.map((metric) => (
          <article
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
            key={metric.label}
          >
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <strong className="text-3xl font-semibold">{metric.value}</strong>
              <span className={cn("text-xs font-medium", metric.tone)}>{metric.delta}</span>
            </div>
          </article>
        ))}
      </section>

      <section
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
        aria-label="예약 운영"
        id="reservations"
      >
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold">점심 예약</h2>
            <button
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              type="button"
            >
              <CircleCheck aria-hidden className="size-4" />
              상태 확인
            </button>
          </div>
          <div className="divide-y divide-border">
            {timeline.map((reservation) => (
              <div
                className="grid min-h-16 grid-cols-[72px_1fr_auto] items-center gap-3 px-4 py-3"
                key={`${reservation.time}-${reservation.name}`}
              >
                <span className="font-mono text-sm text-muted-foreground">{reservation.time}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{reservation.name}</p>
                  <p className="text-sm text-muted-foreground">{reservation.guests}</p>
                </div>
                <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  {reservation.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">운영 체크</h2>
            <button
              className="flex size-9 items-center justify-center rounded-md border border-input text-muted-foreground transition hover:bg-muted hover:text-foreground"
              type="button"
              aria-label="운영 설정"
            >
              <Settings aria-hidden className="size-4" />
            </button>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">예약 페이지</dt>
              <dd className="font-medium text-teal-700">공개</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">마감 시간</dt>
              <dd className="font-medium">방문 2시간 전</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">상품 노출</dt>
              <dd className="font-medium">5개</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
